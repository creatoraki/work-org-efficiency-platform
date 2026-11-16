import type { ThemeConfig } from "antd";
import type { FormComponentMapType } from "./form-mode-context";
import loginBgDark from "#src/assets/login-bg-dark.png";
import loginBgDark2x from "#src/assets/login-bg-dark@2x.png";
import loginBgDark3x from "#src/assets/login-bg-dark@3x.png";
import loginBgLight from "#src/assets/login-bg-light.png";
import loginBgLight2x from "#src/assets/login-bg-light@2x.png";
import loginBgLight3x from "#src/assets/login-bg-light@3x.png";
import darkLogoS from "#src/assets/svg/dark-lc-s-logo.svg";
import darkLogoT from "#src/assets/svg/dark-lc-t-logo.svg";
import lightLogoS from "#src/assets/svg/light-lc-s-logo.svg";
import lightLogoT from "#src/assets/svg/light-lc-t-logo.svg";
import { usePreferences } from "#src/hooks";
import { useAuthStore } from "#src/store";
import { cn } from "#src/utils";
// import { RiMoonIcon, RiSunIcon } from "#src/icons";

import { parseSSOParams, performSSOLogin } from "#src/utils/sso";
import { ConfigProvider, Grid, message, Spin } from "antd";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { FORM_COMPONENT_MAP, FormModeContext } from "./form-mode-context";
import { LoginContext } from "./login-context";

export default function Login() {
	// const { token } = theme.useToken();
	// const { t } = useTranslation();
	const screens = Grid.useBreakpoint();
	const navigate = useNavigate();
	const location = useLocation();
	const [formMode, setFormMode] = useState<FormComponentMapType>("login");
	const [isLoginSuccess, setLoginSuccess] = useState(false);
	const [messageApi, contextHolder] = message.useMessage();
	const [isHandlingSSO, setIsHandlingSSO] = useState(() =>
		Boolean(
			parseSSOParams(window.location.search, window.location.hash, window.location.href)
				.ticket,
		),
	);
	// const { pageLayout, layoutButtonTrigger } = useLayoutMenu();
	const prefs = usePreferences();
	const logout = useAuthStore((state) => state.logout);
	const reset = useAuthStore((state) => state.reset);
	const setToken = useAuthStore((state) => state.setToken);
	const setRedirectPath = useAuthStore((state) => state.setRedirectPath);
	const hasHandledCurrentSSORef = useRef(false);
	const getActiveToken = useAuthStore.getState;
	const { isDark } = prefs;
	// console.warn(layoutButtonTrigger);

	const providedValue = useMemo(() => ({ formMode, setFormMode }), [formMode, setFormMode]);
	const loginContextValue = useMemo(
		() => ({ isLoginSuccess, setLoginSuccess }),
		[isLoginSuccess, setLoginSuccess],
	);

	const antdThemeConfig: ThemeConfig = useMemo(() => {
		return {
			token: {
				colorBorder: isDark ? "#999" : "#909399",
				borderRadius: 4,
				controlHeight: 42,
				colorBgContainer: "rgba(255, 255, 255, 0.20)",
			},
		};
	}, [isDark]);

	/**
	 * 生成支持多倍图的背景图片 CSS 值
	 * 使用 CSS image-set() 函数，浏览器会根据设备像素比自动选择最合适的图片
	 *
	 * @returns 包含 image-set() 的 CSS backgroundImage 值，默认使用 2x 图片
	 */
	const backgroundImageStyle = useMemo(() => {
		const isDarkMode = isDark;

		// 默认使用 2x 图片
		const baseImage = isDarkMode ? loginBgDark : loginBgLight;
		const image2x = isDarkMode ? loginBgDark2x : loginBgLight2x;
		const image3x = isDarkMode ? loginBgDark3x : loginBgLight3x;

		// 使用 CSS image-set() 函数，浏览器会自动根据设备像素比选择最合适的图片
		// 降级方案：不支持 image-set 的浏览器会使用 2x 图片
		const imageSetValue = `image-set(
			url(${baseImage}) 1x,
			url(${image2x}) 2x,
			url(${image3x}) 3x
		)`;

		return {
			backgroundImage: `url(${image2x}), ${imageSetValue}`,
		};
	}, [isDark]);

	useEffect(() => {
		const { ticket, type, redirect } = parseSSOParams(
			location.search,
			window.location.hash,
			window.location.href,
		);

		if (!ticket) {
			hasHandledCurrentSSORef.current = false;
			setIsHandlingSSO(false);
			return;
		}

		if (hasHandledCurrentSSORef.current) {
			return;
		}

		hasHandledCurrentSSORef.current = true;
		setIsHandlingSSO(true);

		const currentTicket = ticket;

		async function handleSSOLogin() {
			const result = await performSSOLogin({
				ticket: currentTicket,
				type,
				redirect,
				hasActiveToken: () => getActiveToken().token,
				navigateBeforeSetToken: true,
				logout,
				reset,
				setToken,
				setRedirectPath,
				navigate,
			});

			if (!result.success) {
				messageApi.error(result.errorMessage || "SSO登录失败");
				hasHandledCurrentSSORef.current = false;
				setIsHandlingSSO(false);
			}
		}

		void handleSSOLogin();
	}, [
		location.hash,
		location.pathname,
		location.search,
		logout,
		messageApi,
		navigate,
		reset,
		setRedirectPath,
		setToken,
	]);

	// 主题切换函数
	// function toggleTheme() {
	// 	changeSiteTheme(isDark ? "light" : "dark");
	// }

	return (
		<LoginContext.Provider value={loginContextValue}>
			{contextHolder}
			<div
				className="relative h-screen w-full overflow-hidden"
				style={{ backgroundColor: isDark ? "#141414" : "#e6f4ff" }}
			>
				{/* 左侧背景层 - 包含 Logo */}
				<motion.div
					key={isDark ? "dark-left" : "light-left"}
					initial={{ opacity: 0, x: 0 }}
					animate={{ opacity: 1, x: isLoginSuccess ? "-100%" : 0 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.5, ease: "easeInOut" }}
					className="fixed inset-0 bg-cover bg-fixed bg-center bg-no-repeat max-md:bg-scroll max-md:bg-top md:bg-fixed"
					style={{
						...backgroundImageStyle,
						backgroundColor: isDark ? "#2D2C2D" : "#C9D7E0",
						width: "100%",
						height: "100vh",
						clipPath: screens.md ? "inset(0 640px 0 0)" : "inset(0 100% 0 0)",
					}}
				>
					{/* Logo - 放在左侧背景层中，随之移动 */}
					<header className="absolute left-3 right-3 top-3 flex items-center">
						<div className="ml-12 mt-8 flex flex-1 items-center gap-[60px] text-colorText">
							<img alt="绿城服务 - LOGO" src={isDark ? darkLogoS : lightLogoS} />
							<img alt="绿城科技 - LOGO" src={isDark ? darkLogoT : lightLogoT} />
						</div>
					</header>
				</motion.div>

				{/* 右侧背景层 - 仅背景图 */}
				<motion.div
					key={isDark ? "dark-right" : "light-right"}
					initial={{ opacity: 0, x: 0 }}
					animate={{ opacity: 1, x: isLoginSuccess ? "100%" : 0 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.5, ease: "easeInOut" }}
					className="fixed inset-0 bg-cover bg-fixed bg-center bg-no-repeat max-md:bg-scroll max-md:bg-top md:bg-fixed"
					style={{
						...backgroundImageStyle,
						backgroundColor: isDark ? "#2D2C2D" : "#C9D7E0",
						width: "100%",
						height: "100vh",
						clipPath: screens.md ? "inset(0 0 0 calc(100% - 640px))" : "inset(0 0 0 0)",
					}}
				/>

				{/* 登录表单容器 - 响应式布局 */}
				<div className="relative flex h-full items-center justify-end">
					<motion.div
						key={isDark ? "dark-glass" : "light-glass"}
						initial={{ opacity: 0, x: 0 }}
						animate={{ opacity: 1, x: isLoginSuccess ? "100%" : 0 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.5, ease: "easeInOut" }}
						className={cn(
							"flex h-full w-[640px] max-w-full items-center justify-center border-l transition-colors duration-300",
							isDark ? "border-[#505152]" : "border-[#E4E7ED]",
						)}
						style={{
							background: "rgba(255, 255, 255, 0.10)",
							backdropFilter: "blur(12.2px)",
							WebkitBackdropFilter: "blur(12.2px)",
						}}
					>
						<div className="relative h-full w-full">
							{/* 登录表单内容 - 居中显示 */}
							<div className="flex h-full items-center justify-center">
								{isHandlingSSO ? (
									<div className="flex h-full w-full flex-col items-center justify-center gap-4 text-[#323233] dark:text-[#F5F5F5]">
										<Spin size="large" />
										<div className="text-base">正在处理单点登录...</div>
									</div>
								) : (
									<ConfigProvider theme={antdThemeConfig}>
										<FormModeContext.Provider value={providedValue}>
											<AnimatePresence mode="wait" initial={false}>
												<motion.div
													key={formMode}
													initial={{ x: 30, opacity: 0 }}
													animate={{ x: 0, opacity: 1 }}
													exit={{ x: 0, opacity: 0 }}
													transition={{ duration: 0.3 }}
												>
													{FORM_COMPONENT_MAP[formMode]}
												</motion.div>
											</AnimatePresence>
										</FormModeContext.Provider>
									</ConfigProvider>
								)}
							</div>
						</div>
					</motion.div>
					{/* 主题切换按钮 - 固定在640px容器底部居中 */}
					{/* <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
							<div
								className="relative w-[120px] flex p-1 items-center gap-1 rounded bg-white/20 dark:bg-black/20 backdrop-blur-sm cursor-pointer hover:bg-white/30 dark:hover:bg-black/30 transition-all duration-300 border border-white/30 dark:border-white/10"
								onClick={toggleTheme}
							> */}
					{/* 滑块指示器 */}
					{/* <motion.div
									className="absolute top-1 bottom-1 rounded bg-white/90 dark:bg-white/80 shadow-lg"
									style={{ width: "calc(50% - 8px)" }}
									animate={{ left: isDark ? "calc(50% + 4px)" : "4px" }}
									transition={{ type: "spring", stiffness: 400, damping: 30 }}
								/> */}
					{/* <div
									className={cn(
										"relative z-10 flex items-center justify-center rounded flex-1 h-6 transition-all duration-300",
										isDark ? "text-gray-400 hover:text-gray-300" : "text-[#FFC200]",
									)}
								>
									<RiSunIcon className="text-lg transition-all duration-300" />
								</div>

								<div
									className={cn(
										"relative z-10 flex items-center justify-center flex-1 h-6 rounded transition-all duration-300",
										isDark ? "text-[#FFC200]" : "text-gray-400 hover:text-gray-300",
									)}
								>
									<RiMoonIcon className="text-lg transition-all duration-300" />
								</div>
							</div>
						</div> */}
				</div>
			</div>
		</LoginContext.Provider>
	);
}
