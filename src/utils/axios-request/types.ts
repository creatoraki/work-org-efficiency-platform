import type { AxiosRequestConfig, AxiosResponse } from "axios";
import type { DebounceConfig } from "./debounce";
import type { MonitorConfig } from "./monitor";
import type { SerializerConfig } from "./serializer";

/**
 * API 响应数据结构
 *
 * @template T - 响应数据的类型
 */
export interface ApiResponse<T> {
	/** 响应状态码，0 或 200 表示成功 */
	code: number;
	/** 响应消息 */
	msg: string;
	/** 响应数据 */
	data: T;
}

/**
 * 分页数据结构（列表接口返回的 data 部分）
 *
 * @template T - 列表项类型
 */
export interface PagedData<T> {
	/** 当前页码 */
	pageNum: number;
	/** 每页数量 */
	pageSize: number;
	/** 总记录数 */
	total: number;
	/** 总页数 */
	pages: number;
	/** 列表数据 */
	list: T[];
	/** 是否为空 */
	emptyFlag: boolean;
}

/**
 * 数组形式的接口返回数据格式
 *
 * @template T - 列表项类型
 */
export interface ApiListResponse<T> extends ApiResponse<PagedData<T>> {}

/**
 * 缓存配置
 */
export interface CacheConfig {
	/** 缓存时间（毫秒），0 表示永久缓存 */
	ttl?: number;
	/** 是否强制刷新（忽略缓存） */
	forceRefresh?: boolean;
	/** 缓存键生成函数 */
	cacheKey?: (config: AxiosRequestConfig) => string;
	/** 缓存策略 */
	strategy?: "cache-first" | "network-first" | "cache-only" | "network-only";
}

/**
 * 重试配置选项
 */
export interface RetryConfig {
	/** 最大重试次数，0 表示不重试 */
	retries?: number;
	/** 重试延迟时间（毫秒），支持固定延迟或函数返回延迟 */
	retryDelay?: number | ((retryCount: number, error: unknown) => number);
	/** 是否使用指数退避策略 */
	exponentialBackoff?: boolean;
	/** 指数退避的基础延迟时间（毫秒） */
	retryDelayBase?: number;
	/** 重试条件函数，返回 true 表示需要重试 */
	shouldRetry?: (error: unknown, retryCount: number) => boolean;
	/** 重试时的回调函数 */
	onRetry?: (retryCount: number, error: unknown) => void;
}

/**
 * 请求配置选项，扩展自 AxiosRequestConfig
 */
export interface RequestOptions extends AxiosRequestConfig {
	/** 是否显示加载提示 */
	showLoading?: boolean;
	/** 成功提示消息，true 使用默认消息，string 使用自定义消息，false 不显示 */
	successMessage?: string | boolean;
	/** 错误提示消息，true 使用默认消息，string 使用自定义消息，false 不显示 */
	errorMessage?: string | boolean;
	/** 是否返回完整响应对象 */
	withFullResponse?: boolean;
	/** 是否跳过认证 */
	skipAuth?: boolean;
	/** 重试键，用于请求去重 */
	retryKey?: string;
	/** 内部使用：是否已重试 */
	_retry?: boolean;
	/** 重试配置 */
	retry?: RetryConfig | boolean;
	/** 内部使用：当前重试次数 */
	_retryCount?: number;
	/** 是否使用请求队列 */
	useQueue?: boolean;
	/** 请求优先级，数字越大优先级越高 */
	priority?: number;
	/** 缓存配置 */
	cache?: CacheConfig | boolean;
	/** 去重/防抖/节流配置 */
	debounce?: DebounceConfig | boolean;
	/** 去重键生成函数（用于去重功能） */
	dedupeKey?: (config: AxiosRequestConfig) => string;
	/** 序列化配置 */
	serializer?: SerializerConfig | boolean;
	/** 性能监控配置 */
	monitor?: MonitorConfig | boolean;
	/** 内部使用：请求标识（用于性能监控） */
	_requestId?: string;
}

/**
 * 根据配置决定返回类型
 *
 * @template T - 响应数据类型
 * @template C - 请求配置类型
 */
export type ResponseType<T, C extends RequestOptions> = C extends { withFullResponse: true }
	? AxiosResponse<ApiResponse<T>>
	: T;

/**
 * 请求实例接口
 */
export interface RequestInstance {
	/**
	 * GET 请求
	 *
	 * @template T - 响应数据类型
	 * @param url - 请求地址
	 * @param config - 请求配置
	 * @returns 响应数据
	 */
	get: <T, C extends RequestOptions = RequestOptions>(
		url: string,
		config?: C,
	) => Promise<ResponseType<T, C>>;

	/**
	 * POST 请求
	 *
	 * @template T - 响应数据类型
	 * @template D - 请求体数据类型
	 * @param url - 请求地址
	 * @param data - 请求体数据
	 * @param config - 请求配置
	 * @returns 响应数据
	 */
	post: <T, D = unknown, C extends RequestOptions = RequestOptions>(
		url: string,
		data?: D,
		config?: C,
	) => Promise<ResponseType<T, C>>;

	/**
	 * PUT 请求
	 *
	 * @template T - 响应数据类型
	 * @template D - 请求体数据类型
	 * @param url - 请求地址
	 * @param data - 请求体数据
	 * @param config - 请求配置
	 * @returns 响应数据
	 */
	put: <T, D = unknown, C extends RequestOptions = RequestOptions>(
		url: string,
		data?: D,
		config?: C,
	) => Promise<ResponseType<T, C>>;

	/**
	 * DELETE 请求
	 *
	 * @template T - 响应数据类型
	 * @param url - 请求地址
	 * @param config - 请求配置
	 * @returns 响应数据
	 */
	delete: <T, C extends RequestOptions = RequestOptions>(
		url: string,
		config?: C,
	) => Promise<ResponseType<T, C>>;

	/**
	 * PATCH 请求
	 *
	 * @template T - 响应数据类型
	 * @template D - 请求体数据类型
	 * @param url - 请求地址
	 * @param data - 请求体数据
	 * @param config - 请求配置
	 * @returns 响应数据
	 */
	patch: <T, D = unknown, C extends RequestOptions = RequestOptions>(
		url: string,
		data?: D,
		config?: C,
	) => Promise<ResponseType<T, C>>;
}

/**
 * 扩展 Axios 类型定义
 */
declare module "axios" {
	export interface AxiosRequestConfig {
		/** 内部使用：是否已重试（用于 Token 刷新） */
		_retry?: boolean;
	}
}
