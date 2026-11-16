import type { AxiosRequestConfig, AxiosResponse } from "axios";
import type { RequestOptions } from "./types";

/**
 * 日志级别
 */
export enum LogLevel {
	/** 不记录日志 */
	NONE = 0,
	/** 仅记录错误 */
	ERROR = 1,
	/** 记录错误和警告 */
	WARN = 2,
	/** 记录所有信息 */
	INFO = 3,
	/** 记录详细信息（包括请求/响应数据） */
	DEBUG = 4,
}

/**
 * 日志配置
 */
export interface LoggerConfig {
	/** 日志级别 */
	level?: LogLevel;
	/** 是否在开发环境启用日志 */
	enableInDev?: boolean;
	/** 是否在生产环境启用日志 */
	enableInProd?: boolean;
	/** 自定义日志函数 */
	customLogger?: (message: string, data?: unknown) => void;
}

/**
 * 默认日志配置
 */
const DEFAULT_CONFIG: Required<Omit<LoggerConfig, "customLogger">> = {
	level: LogLevel.ERROR,
	enableInDev: true,
	enableInProd: false,
};

/**
 * 当前日志配置
 */
let currentConfig: LoggerConfig = { ...DEFAULT_CONFIG };

/**
 * 判断是否应该记录日志
 *
 * @param level - 日志级别
 * @returns 是否应该记录
 */
function shouldLog(level: LogLevel): boolean {
	if (level > currentConfig.level!) {
		return false;
	}

	const isDev = import.meta.env.DEV;
	if (isDev && !currentConfig.enableInDev) {
		return false;
	}
	if (!isDev && !currentConfig.enableInProd) {
		return false;
	}

	return true;
}

/**
 * 拼接日志展示 URL。
 * 仅用于日志展示，兼容 baseURL 与 url 首尾斜杠不一致的场景，避免误报实际请求路径。
 *
 * @param baseURL - Axios 基础路径
 * @param url - 请求路径
 * @returns 日志展示路径
 */
function formatLogUrl(baseURL: string | undefined, url: string | undefined): string | undefined {
	if (!baseURL) {
		return url;
	}
	if (!url) {
		return baseURL;
	}

	return `${baseURL.replace(/\/+$/, "")}/${url.replace(/^\/+/, "")}`;
}

/**
 * 格式化请求日志
 *
 * @param config - 请求配置
 * @returns 格式化的日志信息
 */
function formatRequestLog(config: AxiosRequestConfig): string {
	const { method = "get", url, baseURL, params, data, headers } = config;
	const fullUrl = formatLogUrl(baseURL, url);
	const logParts = [`[Request] ${method.toUpperCase()} ${fullUrl}`];

	if (params) {
		logParts.push(`Params: ${JSON.stringify(params)}`);
	}

	if (data && typeof data === "object") {
		logParts.push(`Data: ${JSON.stringify(data)}`);
	}

	if (headers && Object.keys(headers).length > 0) {
		logParts.push(`Headers: ${JSON.stringify(headers)}`);
	}

	return logParts.join(" | ");
}

/**
 * 格式化响应日志
 *
 * @param response - 响应对象
 * @returns 格式化的日志信息
 */
function formatResponseLog(response: AxiosResponse): string {
	const { status, statusText, config, data } = response;
	const { method = "get", url, baseURL } = config;
	const fullUrl = formatLogUrl(baseURL, url);
	const logParts = [`[Response] ${method.toUpperCase()} ${fullUrl} ${status} ${statusText}`];

	if (currentConfig.level! >= LogLevel.DEBUG && data) {
		logParts.push(`Data: ${JSON.stringify(data)}`);
	}

	return logParts.join(" | ");
}

/**
 * 格式化错误日志
 *
 * @param error - 错误对象
 * @returns 格式化的日志信息
 */
function formatErrorLog(error: unknown): string {
	if (error instanceof Error) {
		const logParts = [`[Error] ${error.name}: ${error.message}`];

		if ("response" in error) {
			const axiosError = error as { response?: AxiosResponse };
			if (axiosError.response) {
				const { status, statusText, config } = axiosError.response;
				const { method = "get", url, baseURL } = config;
				const fullUrl = formatLogUrl(baseURL, url);
				logParts.push(`${method.toUpperCase()} ${fullUrl} ${status} ${statusText}`);
			}
		}

		if (currentConfig.level! >= LogLevel.DEBUG && "stack" in error) {
			logParts.push(`Stack: ${error.stack}`);
		}

		return logParts.join(" | ");
	}

	return `[Error] ${String(error)}`;
}

/**
 * 记录日志
 *
 * @param level - 日志级别
 * @param message - 日志消息
 * @param data - 附加数据
 */
function log(level: LogLevel, message: string, data?: unknown): void {
	if (!shouldLog(level)) {
		return;
	}

	if (currentConfig.customLogger) {
		currentConfig.customLogger(message, data);
		return;
	}

	// 使用 console 记录日志
	switch (level) {
		case LogLevel.ERROR:
			console.error(message, data || "");
			break;
		case LogLevel.WARN:
			console.warn(message, data || "");
			break;
		case LogLevel.INFO:
		case LogLevel.DEBUG:
			// 开发环境使用 console.warn 替代 console.log（lint 规则限制）
			if (import.meta.env.DEV) {
				console.warn(`[${level}]`, message, data || "");
			}
			break;
		default:
			break;
	}
}

/**
 * 记录请求日志
 *
 * @param config - 请求配置
 */
export function logRequest(config: RequestOptions): void {
	if (shouldLog(LogLevel.INFO)) {
		const message = formatRequestLog(config);
		log(LogLevel.INFO, message);
	}
}

/**
 * 记录响应日志
 *
 * @param response - 响应对象
 */
export function logResponse(response: AxiosResponse): void {
	if (shouldLog(LogLevel.INFO)) {
		const message = formatResponseLog(response);
		log(LogLevel.INFO, message);
	}
}

/**
 * 记录错误日志
 *
 * @param error - 错误对象
 */
export function logError(error: unknown): void {
	if (shouldLog(LogLevel.ERROR)) {
		const message = formatErrorLog(error);
		log(LogLevel.ERROR, message, error);
	}
}

/**
 * 配置日志
 *
 * @param config - 日志配置
 */
export function configureLogger(config: LoggerConfig): void {
	currentConfig = { ...DEFAULT_CONFIG, ...currentConfig, ...config };
}

/**
 * 获取当前日志配置
 *
 * @returns 当前日志配置
 */
export function getLoggerConfig(): LoggerConfig {
	return { ...currentConfig };
}
