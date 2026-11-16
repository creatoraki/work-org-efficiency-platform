import { useAccessStore, useAuthStore } from "#src/store";
import { useEffect } from "react";
import { useNavigate } from "react-router";

export default function Exception404() {
	const navigate = useNavigate();
	const isLogin = useAuthStore((state) => Boolean(state.token));
	const isAccessChecked = useAccessStore((state) => state.isAccessChecked);

	useEffect(() => {
		/**
		 * 如果用户已登录但路由还在加载中，不要重定向
		 * 等待路由加载完成后，由路由守卫处理正确的导航
		 * 避免形成 首页 → 404 → 首页 的循环
		 */
		if (isLogin && !isAccessChecked) {
			return;
		}

		// 其他情况：自动重定向到首页
		navigate(import.meta.env.VITE_BASE_HOME_PATH, { replace: true });
	}, [navigate, isLogin, isAccessChecked]);

	// 返回空白页面
	return null;
}
