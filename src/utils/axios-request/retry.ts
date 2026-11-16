import type { AxiosError, AxiosRequestConfig } from "axios";

import type { RequestOptions, RetryConfig } from "./types";

/**
 * 默认重试配置
 */
const DEFAULT_RETRY_CONFIG: Required<Omit<RetryConfig, "shouldRetry" | "onRetry">> = {
	retries: 3,
	retryDelay: 1000,
	exponentialBackoff: true,
	retryDelayBase: 1000,
};

/**
 * 默认重试条件：网络错误或 5xx 错误需要重试
 *
 * @param error - 错误对象
 * @returns 是否需要重试
 */
function defaultShouldRetry(error: unknown): boolean {
	if (!error) {
		return false;
	}

	// 网络错误
	if (typeof error === "object" && "code" in error) {
		const code = (error as { code?: string }).code;
		if (
			code === "ECONNABORTED" ||
			code === "ETIMEDOUT" ||
			code === "ENOTFOUND" ||
			code === "ECONNRESET"
		) {
			return true;
		}
	}

	// Axios 错误
	if (error instanceof Error && "isAxiosError" in error) {
		const axiosError = error as AxiosError;
		const status = axiosError.response?.status;

		// 5xx 服务器错误需要重试
		if (status && status >= 500 && status < 600) {
			return true;
		}

		// 网络错误
		if (!axiosError.response && axiosError.request) {
			return true;
		}
	}

	return false;
}

/**
 * 计算重试延迟时间
 *
 * @param retryCount - 当前重试次数（从 0 开始）
 * @param config - 重试配置
 * @param error - 错误对象
 * @returns 延迟时间（毫秒）
 */
function calculateRetryDelay(retryCount: number, config: RetryConfig, error: unknown): number {
	const { retryDelay, exponentialBackoff, retryDelayBase } = {
		...DEFAULT_RETRY_CONFIG,
		...config,
	};

	// 如果 retryDelay 是函数，直接调用
	if (typeof retryDelay === "function") {
		return retryDelay(retryCount, error);
	}

	// 如果使用指数退避
	if (exponentialBackoff) {
		const base = retryDelayBase ?? retryDelay;
		return base * 2 ** retryCount;
	}

	// 固定延迟
	return retryDelay;
}

/**
 * 延迟指定时间
 *
 * @param ms - 延迟时间（毫秒）
 * @returns Promise
 */
function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

/**
 * 执行请求重试
 *
 * @param config - 请求配置
 * @param error - 错误对象
 * @param retryFn - 重试函数
 * @returns 重试后的响应
 */
export async function retryRequest<T>(
	config: RequestOptions,
	error: unknown,
	retryFn: (config: AxiosRequestConfig) => Promise<T>,
): Promise<T> {
	// 获取重试配置
	const retryConfig: RetryConfig | undefined =
		typeof config.retry === "boolean" ? (config.retry ? {} : undefined) : config.retry;

	// 如果没有配置重试，直接抛出错误
	if (!retryConfig) {
		throw error;
	}

	// 合并默认配置
	const finalConfig: Required<Omit<RetryConfig, "shouldRetry" | "onRetry">> & {
		shouldRetry?: RetryConfig["shouldRetry"];
		onRetry?: RetryConfig["onRetry"];
	} = {
		...DEFAULT_RETRY_CONFIG,
		...retryConfig,
	};

	// 获取当前重试次数
	const currentRetryCount = config._retryCount ?? 0;

	// 检查是否超过最大重试次数
	if (currentRetryCount >= finalConfig.retries) {
		throw error;
	}

	// 检查是否需要重试
	const shouldRetry = finalConfig.shouldRetry ?? defaultShouldRetry;
	if (!shouldRetry(error, currentRetryCount)) {
		throw error;
	}

	// 计算延迟时间
	const delay = calculateRetryDelay(currentRetryCount, finalConfig, error);

	// 调用重试回调
	if (finalConfig.onRetry) {
		finalConfig.onRetry(currentRetryCount + 1, error);
	}

	// 等待延迟时间
	await sleep(delay);

	// 更新重试次数
	const newConfig: RequestOptions = {
		...config,
		_retryCount: currentRetryCount + 1,
	};

	// 执行重试
	return retryFn(newConfig);
}
