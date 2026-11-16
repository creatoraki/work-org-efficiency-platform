import type { AxiosRequestConfig } from "axios";
import type { RequestOptions } from "./types";

/**
 * 请求去重/防抖配置
 */
export interface DebounceConfig {
	/** 是否启用防抖 */
	debounce?: boolean;
	/** 防抖延迟时间（毫秒） */
	debounceDelay?: number;
	/** 是否启用节流 */
	throttle?: boolean;
	/** 节流间隔时间（毫秒） */
	throttleInterval?: number;
	/** 是否启用请求去重（基于时间窗口） */
	dedupe?: boolean;
	/** 去重时间窗口（毫秒） */
	dedupeWindow?: number;
	/** 去重键生成函数 */
	dedupeKey?: (config: AxiosRequestConfig) => string;
}

/**
 * 请求记录项
 */
interface RequestRecord {
	/** 请求时间戳 */
	timestamp: number;
	/** 请求 Promise */
	promise: Promise<unknown>;
}

/**
 * 防抖定时器映射表
 */
const debounceTimers = new Map<string, NodeJS.Timeout>();

/**
 * 节流记录映射表
 */
const throttleRecords = new Map<string, number>();

/**
 * 去重记录映射表
 */
const dedupeRecords = new Map<string, RequestRecord>();

/**
 * 生成请求键
 *
 * @param config - 请求配置
 * @param customKey - 自定义键生成函数
 * @returns 请求键
 */
function generateRequestKey(
	config: AxiosRequestConfig,
	customKey?: (config: AxiosRequestConfig) => string,
): string {
	if (customKey) {
		return customKey(config);
	}

	const { method = "get", url = "", params, data } = config;
	const paramsStr = params ? JSON.stringify(params) : "";
	const dataStr = typeof data === "string" ? data : data ? JSON.stringify(data) : "";
	return [method.toUpperCase(), url, paramsStr, dataStr].join("&");
}

/**
 * 清理过期的去重记录
 *
 * @param window - 时间窗口（毫秒）
 */
function cleanupDedupeRecords(window: number): void {
	const now = Date.now();
	for (const [key, record] of dedupeRecords.entries()) {
		if (now - record.timestamp > window) {
			dedupeRecords.delete(key);
		}
	}
}

/**
 * 执行防抖请求
 *
 * @param key - 请求键
 * @param delay - 防抖延迟时间（毫秒）
 * @param requestFn - 请求函数
 * @returns Promise
 */
function executeDebounced<T>(key: string, delay: number, requestFn: () => Promise<T>): Promise<T> {
	return new Promise<T>((resolve, reject) => {
		// 清除之前的定时器
		const existingTimer = debounceTimers.get(key);
		if (existingTimer) {
			clearTimeout(existingTimer);
		}

		// 设置新的定时器
		const timer = setTimeout(async () => {
			debounceTimers.delete(key);
			try {
				const result = await requestFn();
				resolve(result);
			} catch (error) {
				reject(error);
			}
		}, delay);

		debounceTimers.set(key, timer);
	});
}

/**
 * 执行节流请求
 *
 * @param key - 请求键
 * @param interval - 节流间隔时间（毫秒）
 * @param requestFn - 请求函数
 * @returns Promise
 */
async function executeThrottled<T>(
	key: string,
	interval: number,
	requestFn: () => Promise<T>,
): Promise<T> {
	const now = Date.now();
	const lastTime = throttleRecords.get(key) || 0;

	if (now - lastTime < interval) {
		// 在节流间隔内，等待剩余时间
		const waitTime = interval - (now - lastTime);
		await new Promise((resolve) => {
			setTimeout(resolve, waitTime);
		});
	}

	throttleRecords.set(key, Date.now());
	return requestFn();
}

/**
 * 执行去重请求
 *
 * @param key - 请求键
 * @param window - 去重时间窗口（毫秒）
 * @param requestFn - 请求函数
 * @returns Promise
 */
async function executeDeduped<T>(
	key: string,
	window: number,
	requestFn: () => Promise<T>,
): Promise<T> {
	// 清理过期记录
	cleanupDedupeRecords(window);

	// 检查是否有相同的请求
	const existingRecord = dedupeRecords.get(key);
	if (existingRecord) {
		const elapsed = Date.now() - existingRecord.timestamp;
		if (elapsed < window) {
			// 在时间窗口内，返回已有的 Promise
			return existingRecord.promise as Promise<T>;
		}
	}

	// 创建新请求
	const promise = requestFn();
	dedupeRecords.set(key, {
		timestamp: Date.now(),
		promise,
	});

	// 请求完成后清理记录
	promise.finally(() => {
		// 延迟清理，确保时间窗口内的重复请求可以使用
		setTimeout(() => {
			dedupeRecords.delete(key);
		}, window);
	});

	return promise;
}

/**
 * 应用去重/防抖/节流处理
 *
 * @param config - 请求配置
 * @param requestFn - 请求函数
 * @returns Promise
 */
export async function applyDebounceThrottle<T>(
	config: RequestOptions,
	requestFn: () => Promise<T>,
): Promise<T> {
	const debounceConfig: DebounceConfig | undefined =
		typeof config.debounce === "boolean" ? (config.debounce ? {} : undefined) : config.debounce;

	if (!debounceConfig) {
		return requestFn();
	}

	const {
		debounce,
		debounceDelay = 300,
		throttle,
		throttleInterval = 1000,
		dedupe,
		dedupeWindow = 1000,
		dedupeKey,
	} = debounceConfig;

	const key = generateRequestKey(config, dedupeKey || config.dedupeKey);

	// 优先级：防抖 > 节流 > 去重
	if (debounce) {
		return executeDebounced(key, debounceDelay, requestFn);
	}

	if (throttle) {
		return executeThrottled(key, throttleInterval, requestFn);
	}

	if (dedupe) {
		return executeDeduped(key, dedupeWindow, requestFn);
	}

	return requestFn();
}

/**
 * 清除所有防抖定时器
 */
export function clearDebounceTimers(): void {
	for (const timer of debounceTimers.values()) {
		clearTimeout(timer);
	}
	debounceTimers.clear();
}

/**
 * 清除所有节流记录
 */
export function clearThrottleRecords(): void {
	throttleRecords.clear();
}

/**
 * 清除所有去重记录
 */
export function clearDedupeRecords(): void {
	dedupeRecords.clear();
}

/**
 * 清除所有记录
 */
export function clearAll(): void {
	clearDebounceTimers();
	clearThrottleRecords();
	clearDedupeRecords();
}
