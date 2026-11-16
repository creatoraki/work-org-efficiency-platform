import { PageError } from "#src/components";
import { usePreferences } from "#src/hooks";
import { AuthGuard } from "#src/router/guard";
import { NProgress, toggleHtmlClass } from "#src/utils";

import { useEffect } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Outlet, useLocation } from "react-router";

const APP_DOCUMENT_TITLE = "组织效能平台";

/**
 * @zh 根布局组件
 * @en Root layout component
 */
export default function LayoutRoot() {
	const location = useLocation();
	const { isDark } = usePreferences();

	/* document title */
	useEffect(() => {
		document.title = APP_DOCUMENT_TITLE;
	}, [location.pathname]);

	/* tailwind theme */
	useEffect(() => {
		if (isDark) {
			toggleHtmlClass("dark").add();
		} else {
			toggleHtmlClass("dark").remove();
		}
	}, [isDark]);

	/**
	 * @zh 关闭页面加载进度条，配合 ROOT_ROUTE_ID 路由的 loader 和 shouldRevalidate 使用
	 * @en Close the page loading progress bar, used with the loader and shouldRevalidate of the ROOT_ROUTE_ID route
	 */
	useEffect(() => {
		NProgress.done();
	}, [location.pathname]);

	return (
		<ErrorBoundary FallbackComponent={PageError}>
			<AuthGuard>
				<Outlet />
			</AuthGuard>
		</ErrorBoundary>
	);
}
