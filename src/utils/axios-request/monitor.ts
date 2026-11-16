import type { AxiosRequestConfig, AxiosResponse } from "axios";

/**
 * 性能监控配置
 */
export interface MonitorConfig {
	/** 是否启用性能监控 */
	enable?: boolean;
	/** 慢请求阈值（毫秒），超过此时间会触发告警 */
	slowRequestThreshold?: number;
	/** 慢请求告警回调 */
	onSlowRequest?: (info: RequestPerformanceInfo) => void;
	/** 请求完成回调 */
	onRequestComplete?: (info: RequestPerformanceInfo) => void;
}

/**
 * 请求性能信息
 */
export interface RequestPerformanceInfo {
	/** 请求 URL */
	url: string;
	/** 请求方法 */
	method: string;
	/** 请求耗时（毫秒） */
	duration: number;
	/** 请求开始时间 */
	startTime: number;
	/** 请求结束时间 */
	endTime: number;
	/** 请求状态 */
	status?: number;
	/** 是否成功 */
	success: boolean;
	/** 请求配置 */
	config: AxiosRequestConfig;
}

/**
 * 请求统计信息
 */
export interface RequestStats {
	/** 总请求数 */
	total: number;
	/** 成功请求数 */
	success: number;
	/** 失败请求数 */
	failed: number;
	/** 慢请求数 */
	slow: number;
	/** 平均耗时（毫秒） */
	averageDuration: number;
	/** 最长耗时（毫秒） */
	maxDuration: number;
	/** 最短耗时（毫秒） */
	minDuration: number;
	/** 请求耗时列表 */
	durations: number[];
}

/**
 * 请求开始时间记录
 */
const requestStartTimes = new Map<string, number>();

/**
 * 请求统计信息
 */
let requestStats: RequestStats = {
	total: 0,
	success: 0,
	failed: 0,
	slow: 0,
	averageDuration: 0,
	maxDuration: 0,
	minDuration: Infinity,
	durations: [],
};

/**
 * 生成请求唯一标识
 *
 * @param config - 请求配置
 * @returns 请求标识
 */
function generateRequestId(config: AxiosRequestConfig): string {
	const { method = "get", url = "" } = config;
	const timestamp = Date.now();
	const random = Math.random().toString(36).substring(7);
	return `${method}-${url}-${timestamp}-${random}`;
}

/**
 * 记录请求开始
 *
 * @param config - 请求配置
 * @returns 请求标识
 */
export function recordRequestStart(config: AxiosRequestConfig): string {
	const requestId = generateRequestId(config);
	requestStartTimes.set(requestId, Date.now());
	return requestId;
}

/**
 * 记录请求结束
 *
 * @param requestId - 请求标识
 * @param config - 请求配置
 * @param response - 响应对象（如果成功）
 * @param error - 错误对象（如果失败）
 * @param monitorConfig - 监控配置
 * @returns 性能信息
 */
export function recordRequestEnd(
	requestId: string,
	config: AxiosRequestConfig,
	response?: AxiosResponse,
	error?: unknown,
	monitorConfig?: MonitorConfig,
): RequestPerformanceInfo | null {
	const startTime = requestStartTimes.get(requestId);
	if (!startTime) {
		return null;
	}

	requestStartTimes.delete(requestId);

	const endTime = Date.now();
	const duration = endTime - startTime;
	const success = !!response && !error;

	const info: RequestPerformanceInfo = {
		url: config.url || "",
		method: (config.method || "get").toUpperCase(),
		duration,
		startTime,
		endTime,
		status: response?.status,
		success,
		config,
	};

	// 更新统计信息
	updateStats(info, monitorConfig);

	// 触发慢请求告警
	if (monitorConfig?.slowRequestThreshold && duration > monitorConfig.slowRequestThreshold) {
		monitorConfig.onSlowRequest?.(info);
	}

	// 触发请求完成回调
	monitorConfig?.onRequestComplete?.(info);

	return info;
}

/**
 * 更新统计信息
 *
 * @param info - 性能信息
 * @param monitorConfig - 监控配置
 */
function updateStats(info: RequestPerformanceInfo, monitorConfig?: MonitorConfig): void {
	requestStats.total++;
	if (info.success) {
		requestStats.success++;
	} else {
		requestStats.failed++;
	}

	if (monitorConfig?.slowRequestThreshold && info.duration > monitorConfig.slowRequestThreshold) {
		requestStats.slow++;
	}

	requestStats.durations.push(info.duration);

	// 计算平均耗时
	const sum = requestStats.durations.reduce((acc, d) => acc + d, 0);
	requestStats.averageDuration = sum / requestStats.durations.length;

	// 更新最大和最小耗时
	requestStats.maxDuration = Math.max(requestStats.maxDuration, info.duration);
	requestStats.minDuration = Math.min(requestStats.minDuration, info.duration);

	// 限制 durations 数组大小，避免内存泄漏
	if (requestStats.durations.length > 1000) {
		requestStats.durations = requestStats.durations.slice(-500);
	}
}

/**
 * 获取请求统计信息
 *
 * @returns 统计信息
 */
export function getRequestStats(): RequestStats {
	return { ...requestStats };
}

/**
 * 重置统计信息
 */
export function resetRequestStats(): void {
	requestStats = {
		total: 0,
		success: 0,
		failed: 0,
		slow: 0,
		averageDuration: 0,
		maxDuration: 0,
		minDuration: Infinity,
		durations: [],
	};
}

/**
 * 获取慢请求列表
 *
 * @param threshold - 慢请求阈值（毫秒）
 * @returns 慢请求信息列表
 */
export function getSlowRequests(threshold: number): RequestPerformanceInfo[] {
	return requestStats.durations
		.map((duration, index) => ({
			duration,
			index,
		}))
		.filter((item) => item.duration > threshold)
		.map((item) => {
			// 这里只能返回基本信息，因为完整的性能信息没有保存
			return {
				duration: item.duration,
				url: "",
				method: "",
				startTime: 0,
				endTime: 0,
				success: true,
				config: {} as AxiosRequestConfig,
			};
		});
}
