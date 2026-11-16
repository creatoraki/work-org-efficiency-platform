import type { ApiResponse } from "./types";

/**
 * 业务错误类
 *
 * @template T - 错误响应的数据类型
 */
export class BizError<T> extends Error {
	/** 错误代码 */
	code?: number | string;
	/** 错误响应数据 */
	response?: ApiResponse<T>;

	/**
	 * 创建业务错误实例
	 *
	 * @param message - 错误消息
	 * @param code - 错误代码
	 * @param response - 错误响应数据
	 */
	constructor(message: string, code?: number | string, response?: ApiResponse<T>) {
		super(message);
		this.name = "BizError";
		this.code = code;
		this.response = response;
	}
}

/**
 * 类型守卫：判断是否为业务错误
 *
 * @param error - 待检查的错误对象
 * @returns 是否为 BizError 实例
 */
export function isBizError<T>(error: unknown): error is BizError<T> {
	return error instanceof BizError;
}
