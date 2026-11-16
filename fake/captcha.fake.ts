import { faker } from "@faker-js/faker/locale/zh_CN";
import * as svgCaptcha from "svg-captcha";
import { defineFakeRoute } from "vite-plugin-fake-server/client";
import { resultSuccess } from "./utils";

// 验证码类型定义
interface CaptchaResponse {
	code: string; // 验证码文本
	svg: string; // SVG图片数据
	token: string; // 验证码token，用于验证
}

// 存储验证码的临时存储（实际项目中应该使用Redis等）
const captchaStore = new Map<string, { code: string; timestamp: number }>();

// 清理过期的验证码（5分钟过期）
const CLEANUP_INTERVAL = 5 * 60 * 1000;
setInterval(() => {
	const now = Date.now();
	for (const [token, data] of captchaStore.entries()) {
		if (now - data.timestamp > CLEANUP_INTERVAL) {
			captchaStore.delete(token);
		}
	}
}, CLEANUP_INTERVAL);

export default defineFakeRoute([
	{
		url: "/verificationCode/generate2",
		method: "get",
		response: () => {
			// 生成验证码
			const captcha = svgCaptcha.create({
				size: 4, // 验证码长度
				ignoreChars: "0o1il", // 忽略容易混淆的字符
				noise: 2, // 噪声线条数量
				color: true, // 彩色
				background: "#f0f0f0", // 背景色
				width: 120, // 宽度
				height: 40, // 高度
				fontSize: 50, // 字体大小
				charPreset: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz123456789", // 字符集
			});

			// 生成唯一token
			const token = faker.string.uuid();

			// 存储验证码
			captchaStore.set(token, {
				code: captcha.text.toLowerCase(), // 统一转换为小写
				timestamp: Date.now(),
			});

			const response: CaptchaResponse = {
				code: captcha.text,
				svg: captcha.data,
				token,
			};

			return resultSuccess(response);
		},
	},
]);
