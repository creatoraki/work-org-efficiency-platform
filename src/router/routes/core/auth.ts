import type { AppRouteRecordRaw } from "#src/router/types";

import { $t } from "#src/locales";
import { loginPath, ssoPath } from "#src/router/extra-info";

import { lazy } from "react";

const Login = lazy(() => import("#src/pages/login"));
const SSO = lazy(() => import("#src/pages/sso"));

const routes: AppRouteRecordRaw[] = [
	{
		path: loginPath,
		Component: Login,
		handle: {
			hideInMenu: true,
			title: $t("authority.login"),
		},
	},
	{
		path: ssoPath,
		Component: SSO,
		handle: {
			hideInMenu: true,
			title: "SSO登录",
		},
	},
];

export default routes;
