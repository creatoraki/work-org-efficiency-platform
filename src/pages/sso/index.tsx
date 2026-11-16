import { useAuthStore } from "#src/store";
import { parseSSOParams, performSSOLogin } from "#src/utils/sso";
import { message, Spin } from "antd";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";

// 检测是否为移动设备
function isMobileDevice(): boolean {
	const userAgent = navigator.userAgent.toLowerCase();
	const mobileKeywords = [
		"android",
		"iphone",
		"ipad",
		"ipod",
		"blackberry",
		"windows phone",
		"mobile",
		"webos",
		"opera mini",
	];
	return (
		mobileKeywords.some((keyword) => userAgent.includes(keyword)) ||
		/Mobi|Android/i.test(navigator.userAgent) ||
		window.innerWidth <= 768
	); // 屏幕宽度小于768px也认为是移动设备
}

// 移动端不支持页面组件
function MobileNotSupported() {
	return (
		<div className="to-indigo-100 flex h-screen w-full items-center justify-center bg-gradient-to-br from-blue-50 p-4">
			<div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-lg">
				<div className="mb-6">
					<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
						<svg
							className="h-8 w-8 text-orange-500"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
							/>
						</svg>
					</div>
					<h1 className="mb-2 text-xl font-semibold text-gray-800">暂不支持移动端访问</h1>
					<p className="mb-6 text-sm leading-relaxed text-gray-600">
						为了给您提供更好的使用体验，本系统暂时不支持在手机或平板设备上使用。
					</p>
				</div>

				<div className="space-y-3">
					<div className="flex items-center text-sm text-gray-600">
						<svg
							className="mr-2 h-4 w-4 text-blue-500"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
							/>
						</svg>
						请使用电脑浏览器访问
					</div>
					<div className="flex items-center text-sm text-gray-600">
						<svg
							className="mr-2 h-4 w-4 text-green-500"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M5 13l4 4L19 7"
							/>
						</svg>
						推荐使用 Chrome、Edge、Firefox 浏览器
					</div>
				</div>

				<div className="mt-8 border-t border-gray-200 pt-6">
					<p className="text-xs text-gray-500">如有疑问，请联系系统管理员</p>
				</div>
			</div>
		</div>
	);
}

export default function SSO() {
	const navigate = useNavigate();
	const location = useLocation();
	const logout = useAuthStore((state) => state.logout);
	const reset = useAuthStore((state) => state.reset);
	const setToken = useAuthStore((state) => state.setToken);
	const setRedirectPath = useAuthStore((state) => state.setRedirectPath);
	const [loading, setLoading] = useState(true);
	const [isMobile] = useState(isMobileDevice());
	const hasHandledCurrentSSORef = useRef(false);
	const getActiveToken = useAuthStore.getState;

	useEffect(() => {
		// 如果是移动设备，不执行SSO登录逻辑
		if (isMobile) {
			setLoading(false);
			return;
		}

		async function handleSSOLogin() {
			try {
				const { ticket, type, redirect } = parseSSOParams(
					window.location.search,
					window.location.hash,
					window.location.href,
				);

				if (!ticket) {
					message.error("缺少ticket参数");
					return;
				}

				if (hasHandledCurrentSSORef.current === true) {
					return;
				}
				hasHandledCurrentSSORef.current = true;

				const result = await performSSOLogin({
					ticket,
					type,
					redirect,
					hasActiveToken: () => getActiveToken().token,
					logout,
					reset,
					setToken,
					setRedirectPath,
					navigate,
				});

				if (!result.success) {
					message.error(result.errorMessage || "SSO登录失败");
					navigate("/login", { replace: true });
				}
			} catch (error) {
				console.error("SSO登录处理失败:", error);
				message.error("SSO登录线路出错，请重试");
				navigate("/login", { replace: true });
			} finally {
				setLoading(false);
			}
		}

		handleSSOLogin();
	}, [
		isMobile,
		location.hash,
		location.pathname,
		location.search,
		logout,
		navigate,
		reset,
		setRedirectPath,
		setToken,
	]);

	// 如果是移动设备，显示不支持页面
	if (isMobile) {
		return <MobileNotSupported />;
	}

	// 如果处理完成，不显示任何内容（会重定向）
	if (!loading) {
		return null;
	}

	// 显示加载状态
	return (
		<div className="flex h-screen w-full items-center justify-center bg-gray-50">
			<div className="text-center">
				<Spin size="large" />
				<div className="mt-4 text-gray-600">正在处理SSO登录...</div>
			</div>
		</div>
	);
}
