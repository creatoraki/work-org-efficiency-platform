import type { Options as KyOptions } from "ky";
import { refreshTokenPath } from "#src/api/user";
import { loginPath } from "#src/router/extra-info";

import { useAuthStore, usePreferencesStore } from "#src/store";
import { message } from "#src/utils/static-antd";
import ky from "ky";

import { AUTH_HEADER, LANG_HEADER } from "./constants";
import { handleErrorResponse } from "./error-response";
import { globalProgress } from "./global-progress";
import { goLogin } from "./go-login";
import { refreshTokenAndRetry } from "./refresh";

export interface Options extends KyOptions {
	retry?: KyOptions["retry"] & {
		limit?: number;
	};
	ignoreLoading?: boolean;
	successMessage?: string | boolean;
	errorMessage?: string | boolean;
}

// 请求白名单, 请求白名单内的接口不需要携带 token
const requestWhiteList = [loginPath];

// 请求超时时间
const API_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT) || 60000;

const defaultConfig: Options = {
	prefixUrl: import.meta.env.VITE_API_BASE_URL,
	timeout: API_TIMEOUT,
	retry: {
		// 当请求失败时，最多重试次数
		limit: 3,
	},
	hooks: {
		beforeRequest: [
			(request, options: Options) => {
				const ignoreLoading = options.ignoreLoading;
				if (!ignoreLoading) {
					globalProgress.start();
				}
				// 不需要携带 token 的请求
				const isWhiteRequest = requestWhiteList.some((url) => request.url.endsWith(url));
				if (!isWhiteRequest) {
					const { token } = useAuthStore.getState();
					request.headers.set(AUTH_HEADER, `Bearer ${token}`);
				}
				// 语言等所有的接口都需要携带
				request.headers.set(LANG_HEADER, usePreferencesStore.getState().language);
			},
		],
		afterResponse: [
			async (request, options: Options, response) => {
				const ignoreLoading = options.ignoreLoading;
				if (!ignoreLoading) {
					globalProgress.done();
				}

				// 如果请求被取消，直接返回，不处理错误
				if (options.signal?.aborted) {
					return response;
				}

				// request error
				if (!response.ok) {
					if (response.status === 401) {
						// 防止刷新 refresh-token 继续接收到的 401 错误，出现死循环
						if ([`/${refreshTokenPath}`].some((url) => request.url.endsWith(url))) {
							goLogin();
							return response;
						}
						const { refreshToken } = useAuthStore.getState();
						if (!refreshToken) {
							// 如果页面的路由已经重定向到登录页，则不用跳转直接返回结果
							if (location.pathname === loginPath) {
								return response;
							} else {
								goLogin();
								return response;
							}
						}

						return refreshTokenAndRetry(request, options, refreshToken);
					} else {
						return handleErrorResponse(response);
					}
				}
				try {
					const maybeJson = await response.clone().json();
					const isLogin = location.href.includes(loginPath);
					if (maybeJson && !isLogin) {
						if (maybeJson.code === 401 || maybeJson.code === "401") {
							// 发起登录跳转
							goLogin();
							return response;
						}
						// 统一处理业务错误
						if (
							maybeJson.code !== 200 &&
							maybeJson.code !== 0 &&
							options.errorMessage !== false
						) {
							let msg = maybeJson.msg || "请求失败";
							if (typeof options.errorMessage === "string") {
								msg = options.errorMessage;
							}
							message.error(msg);
							throw new Error(msg);
						}
						if (options.successMessage) {
							const msg =
								typeof options.successMessage === "string"
									? options.successMessage
									: maybeJson.msg || "操作成功";
							message.success(msg);
						}
					}
				} catch (e) {
					console.error(e);
				}
				return response;
			},
		],
	},
};

const kyInstance = ky.create(defaultConfig);

const pendingRequests = new Map<string, boolean>();

function getPendingKey(method: string, url: string, options?: Options) {
	const data = options?.json
		? JSON.stringify(options.json)
		: typeof options?.body === "string"
			? options.body
			: "";
	let params = "";
	if (options?.searchParams) {
		if (options.searchParams instanceof URLSearchParams) {
			params = options.searchParams.toString();
		} else {
			params = JSON.stringify(options.searchParams);
		}
	}
	return [method, url, params, data].join("&");
}

type ResponsePromise<T> = Omit<ReturnType<typeof kyInstance.get>, "json"> & {
	json: <R = T>() => Promise<R>;
};

interface RequestInstance {
	get: <T = any>(url: string | URL | Request, options?: Options) => ResponsePromise<T>;
	post: <T = any>(url: string | URL | Request, options?: Options) => ResponsePromise<T>;
	put: <T = any>(url: string | URL | Request, options?: Options) => ResponsePromise<T>;
	delete: <T = any>(url: string | URL | Request, options?: Options) => ResponsePromise<T>;
	patch: <T = any>(url: string | URL | Request, options?: Options) => ResponsePromise<T>;
	head: <T = any>(url: string | URL | Request, options?: Options) => ResponsePromise<T>;
	extend: (options: Options) => RequestInstance;
}

function wrapRequestMethods(instance: typeof kyInstance): RequestInstance {
	const methods = ["get", "post", "put", "delete", "patch", "head"] as const;
	return new Proxy(instance, {
		get(target, prop, receiver) {
			const value = Reflect.get(target, prop, receiver);
			if (prop === "extend") {
				return (options: Options) => {
					const newInstance = value.apply(target, [options]);
					return wrapRequestMethods(newInstance);
				};
			}
			if (typeof prop === "string" && methods.includes(prop as any)) {
				return (url: string, options?: Options) => {
					const key = getPendingKey(prop.toUpperCase(), url, options);
					if (pendingRequests.has(key)) {
						throw new Error("重复请求");
					}
					pendingRequests.set(key, true);
					const promise = value.apply(target, [url, options]);
					promise.finally(() => {
						pendingRequests.delete(key);
					});
					return promise;
				};
			}
			return value;
		},
	}) as unknown as RequestInstance;
}

export const request = wrapRequestMethods(kyInstance);

export { abortControllerManager, AbortControllerManager, useAbortController } from "./abort";

export interface ApiResponse<T = any> {
	code: number;
	msg: string;
	data: T;
}
