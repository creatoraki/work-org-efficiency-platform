import type { RequestOptions } from "./types";

/** 待处理的请求映射表 */
const pendingMap = new Map<string, AbortController>();

/**
 * 构建请求的唯一键
 *
 * @param config - 请求配置
 * @returns 请求的唯一键
 */
function buildPendingKey(config: RequestOptions): string {
	const { method = "get", url = "", params, data, retryKey } = config;
	if (retryKey) {
		return String(retryKey);
	}
	const paramsStr = params ? JSON.stringify(params) : "";
	const dataStr = typeof data === "string" ? data : data ? JSON.stringify(data) : "";
	return [method.toUpperCase(), url, paramsStr, dataStr].join("&");
}

/**
 * 添加待处理的请求，如果已存在相同请求则取消之前的请求
 *
 * @param config - 请求配置
 */
export function addPending(config: RequestOptions): void {
	const key = buildPendingKey(config);
	const existingController = pendingMap.get(key);
	if (existingController) {
		existingController.abort();
		pendingMap.delete(key);
	}
	const controller = new AbortController();
	if (config.signal) {
		if (config.signal.aborted) {
			controller.abort();
		} else if (typeof config.signal.addEventListener === "function") {
			config.signal.addEventListener("abort", () => controller.abort(), {
				once: true,
			});
		}
	}
	config.signal = controller.signal;
	pendingMap.set(key, controller);
}

/**
 * 移除待处理的请求
 *
 * @param config - 请求配置
 */
export function removePending(config: RequestOptions): void {
	const key = buildPendingKey(config);
	pendingMap.delete(key);
}
