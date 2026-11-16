import { request } from "#src/utils";

// 验证码相关类型定义
export interface CaptchaResponse {
	msg: string;
	img: string;
	code: number;
	captchaEnabled: boolean;
	uuid: string;
}

/**
 * 生成验证码
 */
export function generateCaptcha() {
	return request.get("captchaImage").json<CaptchaResponse>();
}
