import type { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import type { ApiResponse, RequestInstance, RequestOptions, ResponseType } from "./types";

import { loginPath } from "#src/router/extra-info";
import { useAuthStore, usePreferencesStore } from "#src/store";
import { AUTH_HEADER, LANG_HEADER } from "#src/utils/request/constants";
import { globalProgress } from "#src/utils/request/global-progress";
import { goLogin } from "#src/utils/request/go-login";
import { message } from "antd";
import axios from "axios";
import { refreshToken } from "./auth";
import { executeCachedRequest } from "./cache";
import { addPending, removePending } from "./cancel";
import { applyDebounceThrottle } from "./debounce";
import { BizError } from "./error";
import { logError, logRequest, logResponse } from "./logger";
import { recordRequestEnd, recordRequestStart } from "./monitor";
import { defaultQueue } from "./queue";
import { retryRequest } from "./retry";
import { applySerializer } from "./serializer";

const DEFAULT_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT) || 120000;
const BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * 判断响应码是否表示成功
 *
 * @param code - 响应码
 * @returns 是否为成功码
 */
function isSuccessCode(code: number | string | undefined): code is 0 | 200 {
	return code === 0 || code === 200;
}

/**
 * 创建 Axios 实例
 *
 * @param config - Axios 配置选项
 * @returns Axios 实例
 */
function createAxiosInstance(config?: AxiosRequestConfig): AxiosInstance {
	const instance = axios.create({
		baseURL: BASE_URL,
		timeout: DEFAULT_TIMEOUT,
		...config,
	});
	return instance;
}

/**
 * 附加请求和响应拦截器
 *
 * @param instance - Axios 实例
 * @returns 配置后的 Axios 实例
 */
function attachInterceptors(instance: AxiosInstance): AxiosInstance {
	instance.interceptors.request.use(
		(config) => {
			// 类型断言：AxiosRequestConfig 在运行时包含 RequestOptions 的扩展属性
			const cfg = config as RequestOptions;

			// 应用序列化配置
			const serializedConfig = applySerializer(cfg);
			// 将序列化后的配置合并回原配置
			Object.assign(config, serializedConfig);

			// 记录请求开始（性能监控）
			if (cfg.monitor !== false) {
				const monitorConfig = typeof cfg.monitor === "boolean" ? {} : cfg.monitor;
				if (monitorConfig?.enable !== false) {
					cfg._requestId = recordRequestStart(config);
				}
			}

			logRequest(cfg);
			if (cfg.showLoading) {
				globalProgress.start();
			}
			if (!cfg.skipAuth) {
				const { token } = useAuthStore.getState();
				if (token) {
					config.headers = config.headers || {};
					config.headers[AUTH_HEADER] = `Bearer ${token}`;
				}
			}
			config.headers = config.headers || {};
			config.headers[LANG_HEADER] = usePreferencesStore.getState().language;
			addPending(cfg);
			return config;
		},
		async (error: AxiosError) => {
			logError(error);
			return Promise.reject(error);
		},
	);

	instance.interceptors.response.use(
		<T>(response: AxiosResponse<ApiResponse<T>>) => {
			const cfg = response.config as RequestOptions;

			// 记录请求结束（性能监控）
			if (cfg._requestId && cfg.monitor !== false) {
				const monitorConfig = typeof cfg.monitor === "boolean" ? {} : cfg.monitor;
				if (monitorConfig?.enable !== false) {
					recordRequestEnd(
						cfg._requestId,
						response.config,
						response,
						undefined,
						monitorConfig,
					);
				}
			}

			logResponse(response);
			removePending(cfg);
			if (cfg.showLoading) {
				globalProgress.done();
			}

			const payload = response.data;

			// 特殊处理：blob 响应直接返回，不进行 ApiResponse 格式检查
			if (response.config.responseType === "blob" && payload instanceof Blob) {
				if (cfg.withFullResponse) {
					return response as unknown as AxiosResponse<Blob>;
				}
				return payload as T;
			}

			// 类型守卫：确保 payload 是 ApiResponse 格式
			if (!payload || typeof payload !== "object" || !("code" in payload)) {
				const errMsg =
					typeof cfg.errorMessage === "string" ? cfg.errorMessage : "响应数据格式错误";
				if (cfg.errorMessage !== false) {
					message.error(errMsg);
				}
				throw new BizError(errMsg, -1, undefined);
			}

			// 如果需要返回完整响应对象
			if (cfg.withFullResponse) {
				// 类型断言：修改 data 字段后需要重新断言类型
				return {
					...response,
					data: payload,
				} as AxiosResponse<ApiResponse<T>>;
			}

			// 检查业务状态码
			if (!isSuccessCode(payload.code)) {
				const errMsg =
					typeof cfg.errorMessage === "string"
						? cfg.errorMessage
						: payload.msg || "请求失败";
				if (cfg.errorMessage !== false) {
					message.error(errMsg);
				}
				throw new BizError(errMsg, payload.code, payload);
			}

			// 显示成功消息
			if (cfg.successMessage) {
				const msgText =
					typeof cfg.successMessage === "string"
						? cfg.successMessage
						: payload.msg || "操作成功";
				message.success(msgText);
			}

			// 类型断言：拦截器返回类型需要从 ApiResponse<T> 转换为 T
			// 这是必要的，因为 Axios 拦截器的返回类型限制
			return payload.data as ResponseType<T, RequestOptions>;
		},
		async (error: AxiosError<ApiResponse<never>>) => {
			// 类型断言：error.config 可能为 undefined，但我们需要访问扩展属性
			const cfg = (error.config ?? {}) as RequestOptions;

			// 记录请求结束（性能监控）
			if (cfg._requestId && cfg.monitor !== false) {
				const monitorConfig = typeof cfg.monitor === "boolean" ? {} : cfg.monitor;
				if (monitorConfig?.enable !== false) {
					recordRequestEnd(
						cfg._requestId,
						error.config || {},
						undefined,
						error,
						monitorConfig,
					);
				}
			}

			logError(error);
			removePending(cfg);
			if (cfg.showLoading) {
				globalProgress.done();
			}

			const status = error.response?.status;

			// 处理 401 未授权错误
			if (status === 401 && !cfg.skipAuth) {
				if (cfg.url?.endsWith(loginPath)) {
					goLogin();
					return Promise.reject(error);
				}
				if (cfg._retry) {
					goLogin();
					return Promise.reject(error);
				}
				cfg._retry = true;
				try {
					const newToken = await refreshToken();
					cfg.headers = { ...(cfg.headers || {}), [AUTH_HEADER]: `Bearer ${newToken}` };
					return instance.request(cfg);
				} catch (e) {
					goLogin();
					return Promise.reject(e);
				}
			}

			// 处理取消请求
			if (axios.isCancel(error)) {
				return Promise.reject(error);
			}

			// 尝试重试请求（401 错误和取消的请求不重试）
			if (cfg.retry !== false && status !== 401) {
				try {
					return await retryRequest(cfg, error, (retryConfig) => {
						return instance.request(retryConfig);
					});
				} catch (retryError) {
					// 重试失败，继续处理错误
					error = retryError as AxiosError<ApiResponse<never>>;
				}
			}

			// 处理其他错误
			const respData = error.response?.data;
			const errMsg =
				typeof cfg.errorMessage === "string"
					? cfg.errorMessage
					: respData?.msg || error.message || "请求失败";
			if (cfg.errorMessage !== false) {
				message.error(errMsg);
			}
			return Promise.reject(error);
		},
	);

	return instance;
}

/**
 * 执行请求（支持队列、缓存和防抖/节流/去重）
 *
 * @param instance - Axios 实例
 * @param config - 请求配置
 * @param requestFn - 请求函数
 * @returns Promise
 */
function executeRequest<T>(
	instance: AxiosInstance,
	config: RequestOptions,
	requestFn: (config: AxiosRequestConfig) => Promise<T>,
): Promise<T> {
	// 包装请求函数，应用防抖/节流/去重
	const wrappedRequestFn = () => {
		// 如果启用缓存，使用缓存执行
		if (config.cache) {
			return executeCachedRequest(config, (cfg) => {
				// 如果同时启用队列，在缓存内部使用队列
				if (config.useQueue) {
					return defaultQueue.add(cfg, requestFn) as Promise<T>;
				}
				return requestFn(cfg);
			});
		}

		// 如果启用队列，使用队列执行
		if (config.useQueue) {
			return defaultQueue.add(config, requestFn) as Promise<T>;
		}

		// 否则直接执行
		return requestFn(config);
	};

	// 应用防抖/节流/去重
	if (config.debounce) {
		return applyDebounceThrottle(config, wrappedRequestFn);
	}

	return wrappedRequestFn();
}

/**
 * 包装 Axios 实例方法，提供类型安全的请求接口
 *
 * @param instance - Axios 实例
 * @returns 包装后的请求实例
 */
function wrapMethods(instance: AxiosInstance): RequestInstance {
	return {
		get: <T, C extends RequestOptions = RequestOptions>(
			url: string,
			config?: C,
		): Promise<ResponseType<T, C>> => {
			const finalConfig = { ...config } as C;
			return executeRequest(
				instance,
				finalConfig,
				(cfg) =>
					instance.get<ApiResponse<T>, AxiosResponse<ApiResponse<T>>>(
						url,
						cfg,
					) as Promise<ResponseType<T, C>>,
			);
		},
		post: <T, D = unknown, C extends RequestOptions = RequestOptions>(
			url: string,
			data?: D,
			config?: C,
		): Promise<ResponseType<T, C>> => {
			const finalConfig = { ...config } as C;
			return executeRequest(
				instance,
				finalConfig,
				(cfg) =>
					instance.post<ApiResponse<T>, AxiosResponse<ApiResponse<T>>, D>(
						url,
						data,
						cfg,
					) as Promise<ResponseType<T, C>>,
			);
		},
		put: <T, D = unknown, C extends RequestOptions = RequestOptions>(
			url: string,
			data?: D,
			config?: C,
		): Promise<ResponseType<T, C>> => {
			const finalConfig = { ...config } as C;
			return executeRequest(
				instance,
				finalConfig,
				(cfg) =>
					instance.put<ApiResponse<T>, AxiosResponse<ApiResponse<T>>, D>(
						url,
						data,
						cfg,
					) as Promise<ResponseType<T, C>>,
			);
		},
		delete: <T, C extends RequestOptions = RequestOptions>(
			url: string,
			config?: C,
		): Promise<ResponseType<T, C>> => {
			const finalConfig = { ...config } as C;
			return executeRequest(
				instance,
				finalConfig,
				(cfg) =>
					instance.delete<ApiResponse<T>, AxiosResponse<ApiResponse<T>>>(
						url,
						cfg,
					) as Promise<ResponseType<T, C>>,
			);
		},
		patch: <T, D = unknown, C extends RequestOptions = RequestOptions>(
			url: string,
			data?: D,
			config?: C,
		): Promise<ResponseType<T, C>> => {
			const finalConfig = { ...config } as C;
			return executeRequest(
				instance,
				finalConfig,
				(cfg) =>
					instance.patch<ApiResponse<T>, AxiosResponse<ApiResponse<T>>, D>(
						url,
						data,
						cfg,
					) as Promise<ResponseType<T, C>>,
			);
		},
	};
}

/**
 * 创建请求实例
 *
 * @param config - Axios 配置选项
 * @returns 请求实例
 */
export function createRequest(config?: AxiosRequestConfig): RequestInstance {
	const instance = createAxiosInstance(config);
	attachInterceptors(instance);
	return wrapMethods(instance);
}

/**
 * 默认请求实例
 */
export const request = createRequest();

/**
 * 公共请求实例（不携带认证信息）
 */
export const publicRequest = createRequest({ headers: {}, withCredentials: false });
