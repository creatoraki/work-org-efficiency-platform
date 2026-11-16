import type { AxiosRequestConfig } from "axios";
import type { CacheConfig, RequestOptions } from "./types";

/**
 * 缓存项
 */
interface CacheItem<T> {
	/** 缓存数据 */
	data: T;
	/** 过期时间戳 */
	expiresAt: number;
	/** 创建时间戳 */
	createdAt: number;
}

/**
 * 生成缓存键
 *
 * @param config - 请求配置
 * @param customKey - 自定义键生成函数
 * @returns 缓存键
 */
function generateCacheKey(
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
 * 内存缓存管理器
 */
class MemoryCache {
	/** 缓存存储 */
	private cache: Map<string, CacheItem<unknown>>;
	/** 最大缓存数量 */
	private maxSize: number;

	/**
	 * 创建内存缓存管理器
	 *
	 * @param maxSize - 最大缓存数量，默认为 100
	 */
	constructor(maxSize = 100) {
		this.cache = new Map();
		this.maxSize = maxSize;
	}

	/**
	 * 获取缓存
	 *
	 * @param key - 缓存键
	 * @returns 缓存数据，如果不存在或已过期则返回 undefined
	 */
	get<T>(key: string): T | undefined {
		const item = this.cache.get(key);
		if (!item) {
			return undefined;
		}

		// 检查是否过期
		if (item.expiresAt > 0 && Date.now() > item.expiresAt) {
			this.cache.delete(key);
			return undefined;
		}

		return item.data as T;
	}

	/**
	 * 设置缓存
	 *
	 * @param key - 缓存键
	 * @param data - 缓存数据
	 * @param ttl - 缓存时间（毫秒），0 表示永久缓存
	 */
	set<T>(key: string, data: T, ttl = 0): void {
		// 如果超过最大缓存数量，删除最旧的缓存
		if (this.cache.size >= this.maxSize) {
			const firstKey = this.cache.keys().next().value;
			if (firstKey) {
				this.cache.delete(firstKey);
			}
		}

		const now = Date.now();
		const expiresAt = ttl > 0 ? now + ttl : 0;

		this.cache.set(key, {
			data,
			expiresAt,
			createdAt: now,
		});
	}

	/**
	 * 删除缓存
	 *
	 * @param key - 缓存键
	 */
	delete(key: string): void {
		this.cache.delete(key);
	}

	/**
	 * 清空所有缓存
	 */
	clear(): void {
		this.cache.clear();
	}

	/**
	 * 获取缓存统计信息
	 *
	 * @returns 缓存统计信息
	 */
	getStats(): { size: number; maxSize: number } {
		return {
			size: this.cache.size,
			maxSize: this.maxSize,
		};
	}
}

/**
 * 默认缓存实例
 */
export const defaultCache = new MemoryCache();

/**
 * 创建自定义缓存实例
 *
 * @param maxSize - 最大缓存数量
 * @returns 缓存实例
 */
export function createCache(maxSize?: number): MemoryCache {
	return new MemoryCache(maxSize);
}

/**
 * 执行带缓存的请求
 *
 * @param config - 请求配置
 * @param requestFn - 请求函数
 * @returns Promise
 */
export async function executeCachedRequest<T>(
	config: RequestOptions,
	requestFn: (config: AxiosRequestConfig) => Promise<T>,
): Promise<T> {
	// 获取缓存配置
	const cacheConfig: CacheConfig | undefined =
		typeof config.cache === "boolean" ? (config.cache ? {} : undefined) : config.cache;

	// 如果没有配置缓存，直接执行请求
	if (!cacheConfig) {
		return requestFn(config);
	}

	const { ttl = 0, forceRefresh = false, cacheKey, strategy = "cache-first" } = cacheConfig;

	// 生成缓存键
	const key = generateCacheKey(config, cacheConfig.cacheKey || cacheKey);

	// 如果强制刷新，直接执行请求并更新缓存
	if (forceRefresh || strategy === "network-only") {
		const data = await requestFn(config);
		if (ttl >= 0) {
			defaultCache.set(key, data, ttl);
		}
		return data;
	}

	// 如果只使用缓存
	if (strategy === "cache-only") {
		const cached = defaultCache.get<T>(key);
		if (cached !== undefined) {
			return cached;
		}
		throw new Error("Cache miss");
	}

	// 缓存优先策略
	if (strategy === "cache-first") {
		const cached = defaultCache.get<T>(key);
		if (cached !== undefined) {
			return cached;
		}

		// 缓存未命中，执行请求
		const data = await requestFn(config);
		if (ttl >= 0) {
			defaultCache.set(key, data, ttl);
		}
		return data;
	}

	// 网络优先策略
	if (strategy === "network-first") {
		try {
			const data = await requestFn(config);
			if (ttl >= 0) {
				defaultCache.set(key, data, ttl);
			}
			return data;
		} catch (error) {
			// 网络请求失败，尝试使用缓存
			const cached = defaultCache.get<T>(key);
			if (cached !== undefined) {
				return cached;
			}
			throw error;
		}
	}

	// 默认直接执行请求
	return requestFn(config);
}
