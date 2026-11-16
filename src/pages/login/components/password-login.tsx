import { generateCaptcha } from "#src/api/captcha";
import { fetchLogin } from "#src/api/user";

import LockIcon from "#src/assets/svg/login-lock.svg?react";
import SecureIcon from "#src/assets/svg/login-secured.svg?react";
import UserIcon from "#src/assets/svg/login-user.svg?react";

import { usePreferences } from "#src/hooks";
import { useAuthStore, useGlobalStore } from "#src/store";
import { cn } from "#src/utils";
import { useInterval, useRequest } from "ahooks";
import { Button, Checkbox, Form, Input, message, Space } from "antd";
import { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";

import { LoginContext } from "../login-context";

// 验证码自动刷新配置（毫秒）
const CAPTCHA_REFRESH_INTERVAL = 60 * 1000; // 1分钟

const FORM_INITIAL_VALUES = {
	username: "admin",
	password: "admin123",
	verificationCode: "",
};
export type PasswordLoginFormType = typeof FORM_INITIAL_VALUES;

export function PasswordLogin() {
	const [loading, setLoading] = useState(false);
	const [passwordLoginForm] = Form.useForm();
	const [messageLoadingApi, contextLoadingHolder] = message.useMessage();
	// const [searchParams] = useSearchParams();
	const location = useLocation();
	const navigate = useNavigate();
	const setToken = useAuthStore((state) => state.setToken);
	const setCurtainVisible = useGlobalStore((state) => state.setCurtainVisible);
	const { setLoginSuccess } = useContext(LoginContext);
	const { isDark } = usePreferences();
	const iconColor = isDark ? "text-[#F5F5F5]" : "text-[#323233]";
	// 判断是否为开发环境 (本地开发 或 dev模式构建)
	const isDev = import.meta.env.DEV || import.meta.env.MODE === "development";

	const [captchaMaskMessage, setCaptchaMaskMessage] = useState("加载中...");

	useEffect(() => {
		const searchParams = new URLSearchParams(window.location.search);
		const ticket = searchParams.get("ticket");
		const type = searchParams.get("type");
		const redirect = searchParams.get("redirect");
		const hasTicket = Boolean(ticket);
		if (!hasTicket || location.pathname !== "/login") {
			return;
		}

		const currentUrl = new URL(window.location.href);
		const cleanedSearchParams = new URLSearchParams(currentUrl.search);
		cleanedSearchParams.delete("ticket");
		cleanedSearchParams.delete("type");
		cleanedSearchParams.delete("redirect");
		currentUrl.search = cleanedSearchParams.toString()
			? `?${cleanedSearchParams.toString()}`
			: "";

		const hashQueryIndex = currentUrl.hash.indexOf("?");
		const existingHashQuery =
			hashQueryIndex >= 0 ? currentUrl.hash.slice(hashQueryIndex + 1) : "";
		const nextHashParams = new URLSearchParams(existingHashQuery);
		if (ticket) {
			nextHashParams.set("ticket", ticket);
		}
		if (type) {
			nextHashParams.set("type", type);
		}
		if (redirect) {
			nextHashParams.set("redirect", redirect);
		}

		const nextHashQuery = nextHashParams.toString();
		currentUrl.hash = `#/sso${nextHashQuery ? `?${nextHashQuery}` : ""}`;
		// window.location.replace(currentUrl.toString());
	}, [location.pathname]);

	// useEffect(() => {
	// 	message.success(window.location.href);
	// }, []);

	const {
		data: captchaData,
		loading: captchaLoading,
		run: loadCaptcha,
	} = useRequest(generateCaptcha, {
		manual: isDev, // 开发环境下不自动加载验证码
		onBefore: () => setCaptchaMaskMessage("加载中..."),
		onSuccess: () => setCaptchaMaskMessage(""),
		onError: (error) => {
			setCaptchaMaskMessage("点击刷新");
			message.error("验证码加载失败，请点击重试");
			console.error("Load captcha error:", error);
		},
	});

	// 自动刷新验证码（仅在非开发环境）
	useInterval(
		() => {
			if (!isDev) {
				loadCaptcha();
			}
		},
		isDev ? undefined : CAPTCHA_REFRESH_INTERVAL,
	);

	const handleFinish = async (values: PasswordLoginFormType) => {
		setLoading(true);

		// 开发环境下不传递验证码相关参数
		const loginParams = isDev ? values : { ...values, uuid: captchaData?.uuid };

		try {
			const response: any = await fetchLogin(loginParams as any);
			messageLoadingApi?.destroy();
			if (response.token) {
				// window.$message?.success("登录成功");

				// 触发窗帘闭合动画（在后台进行，因为登录页层级更高）
				setCurtainVisible(false);

				// 触发左右退出动画
				setLoginSuccess(true);
				// 等待动画完成（500ms）
				await new Promise((resolve) => setTimeout(resolve, 100));

				// 增加额外的停留时间，确保窗帘在中间停留足够长的时间 (1s)
				// 窗帘 Enter 动画约 0.8s，这里再等 1.5s，总共约 2s 后跳转
				await new Promise((resolve) => setTimeout(resolve, 100));

				/**
				 * 关键：先 navigate 再 setToken
				 *
				 * 原因：auth-guard 的 useEffect 条件是：
				 * if (!whiteRouteNames.includes(pathname) && isLogin && !isAuthorized)
				 *
				 * 如果先 setToken：
				 * 1. isLogin 变为 true，触发 useEffect
				 * 2. 但此时 pathname 还是 /login（在白名单中）
				 * 3. 条件不满足，fetchUserInfoAndRoutes 不执行
				 * 4. 没有用户信息请求，登录失败
				 *
				 * 如果先 navigate：
				 * 1. pathname 先变为 /work-bench（不在白名单）
				 * 2. 然后 setToken，isLogin 变为 true
				 * 3. useEffect 触发时，pathname 已经不是 /login
				 * 4. 条件满足，正常执行 fetchUserInfoAndRoutes
				 */

				// 先导航到首页
				// const redirect = searchParams.get("redirect");
				// if (redirect) {
				// 	navigate(redirect, { replace: true });
				// }
				// else {
				navigate(import.meta.env.VITE_BASE_HOME_PATH, { replace: true });
				// }

				// 等待导航生效
				await new Promise((resolve) => setTimeout(resolve, 50));

				// 然后更新 token（此时 pathname 已经不是 /login）
				setToken(response.token);

				// 导航后打开窗帘
				setTimeout(() => {
					setCurtainVisible(false);
				}, 300);
			} else {
				window.$message?.error(response.msg || "登录失败，请重试");
			}
		} catch (error: any) {
			messageLoadingApi?.destroy();
			// 如果验证码错误，刷新验证码（仅在非开发环境）
			if (!isDev && error.message?.includes("验证码")) {
				loadCaptcha();
			}
		} finally {
			messageLoadingApi?.destroy();
			setTimeout(() => {
				window.$message?.destroy();
				setLoading(false);
			}, 1000);
		}
	};

	// 处理验证码点击刷新
	const handleCaptchaRefresh = () => {
		if (!captchaLoading) {
			setCaptchaMaskMessage("加载中...");
			loadCaptcha();
		}
	};

	// 处理键盘事件
	const handleCaptchaKeyDown = (event: React.KeyboardEvent) => {
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			handleCaptchaRefresh();
		}
	};

	return (
		<>
			{contextLoadingHolder}
			<Space direction="vertical" className="mb-6">
				<div className="flex items-center">
					<span className="inline-block h-[24px] w-[4px] rounded-sm bg-[#0075FF]" />
					<div className="ml-3">
						<span className="text-center font-['PingFang_SC','Microsoft_YaHei','Segoe_UI','Noto_Sans_SC',sans-serif] text-[26px] font-semibold leading-[34px] text-black [font-feature-settings:'liga'_off,'clig'_off] dark:text-white">
							欢迎登录
						</span>
						<span className="ml-3 text-center font-['PingFang_SC','Microsoft_YaHei','Segoe_UI','Noto_Sans_SC',sans-serif] text-[24px] font-normal leading-[34px] text-[#323233] [font-feature-settings:'liga'_off,'clig'_off] dark:text-[#F5F5F5]">
							组织效能管理平台
						</span>
					</div>
				</div>
			</Space>

			<Form
				name="passwordLoginForm"
				form={passwordLoginForm}
				layout="vertical"
				initialValues={isDev ? FORM_INITIAL_VALUES : undefined}
				onFinish={handleFinish}
				autoComplete="on"
			>
				<Form.Item
					name="username"
					rules={[
						{
							required: true,
							message: "请输入用户名",
						},
					]}
				>
					<Input
						id="username"
						placeholder="请输入账号"
						prefix={<UserIcon className={cn("h-5 w-5", iconColor)} />}
						className="[&_.ant-input-prefix]:mr-2"
						autoComplete="username"
					/>
				</Form.Item>

				<Form.Item
					name="password"
					rules={[
						{
							required: true,
							message: "请输入密码",
						},
						// {
						// 	pattern: /^(?=.*\d)(?=.*[a-z])[\w~!@#$%^&*+.\-]{2,16}$/i,
						// 	message: "2-16 位必须包含字母和数字",
						// },
					]}
				>
					<Input.Password
						id="password"
						placeholder="请输入密码"
						prefix={<LockIcon className={cn("h-5 w-5", iconColor)} />}
						className="[&_.ant-input-prefix]:mr-2"
						autoComplete="current-password"
					/>
				</Form.Item>

				{/* 非开发环境下展示验证码 */}
				{!isDev && (
					<Form.Item
						name="code"
						rules={[
							{
								required: true,
								message: "请输入验证码",
							},
							{
								len: 4,
								message: "请输入4位验证码",
							},
						]}
					>
						<div className="flex gap-3">
							<div className="flex-1">
								<Input
									placeholder="请输入验证码"
									prefix={<SecureIcon className={cn("h-5 w-5", iconColor)} />}
									className="[&_.ant-input-prefix]:mr-2"
									maxLength={4}
								/>
							</div>
							<div
								className="group relative w-24 cursor-pointer overflow-hidden rounded border border-gray-300 dark:border-gray-600"
								onClick={handleCaptchaRefresh}
								onKeyDown={handleCaptchaKeyDown}
								tabIndex={0}
								aria-label="验证码"
							>
								{captchaData && (
									<img
										src={
											(captchaData as any).img
												? `data:image/jpeg;base64,${(captchaData as any).img}`
												: ""
										}
										alt="验证码"
										className="h-full w-full object-cover"
										style={
											captchaLoading
												? { filter: "blur(2px)", pointerEvents: "none" }
												: {}
										}
									/>
								)}
								{(captchaLoading || captchaMaskMessage) && (
									<div
										className="absolute inset-0 flex select-none items-center justify-center bg-white/80 text-[14px] font-medium text-[#bbb]"
										style={{
											zIndex: 1,
											cursor:
												captchaMaskMessage === "点击刷新"
													? "pointer"
													: "default",
										}}
										onClick={
											captchaMaskMessage === "点击刷新"
												? handleCaptchaRefresh
												: undefined
										}
										tabIndex={captchaMaskMessage === "点击刷新" ? 0 : -1}
									>
										{captchaMaskMessage || "加载中..."}
									</div>
								)}
							</div>
						</div>
					</Form.Item>
				)}

				<Form.Item name="remember" valuePropName="checked" className="mb-10 mt-6">
					<Checkbox>记住密码</Checkbox>
				</Form.Item>
				<Form.Item>
					<Button
						block
						type="primary"
						htmlType="submit"
						loading={loading}
						className="w-full max-w-[424px] shadow-none"
					>
						登录
					</Button>
				</Form.Item>
			</Form>
		</>
	);
}
