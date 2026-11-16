import { Navigate, Outlet, useLocation } from "react-router";

/**
 * 文件中心主页面
 * 作为父路由容器，通过 Outlet 渲染子路由
 * - /file-center/import - 导入中心
 * - /file-center/export - 导出中心
 */
export default function FileCenter() {
	const location = useLocation();

	// 如果直接访问 /file-center，重定向到 /file-center/export (向后兼容)
	if (location.pathname === "/file-center") {
		return <Navigate to="/file-center/export" replace />;
	}

	return <Outlet />;
}
