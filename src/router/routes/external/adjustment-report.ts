import type { AppRouteRecordRaw } from "#src/router/types";

import { lazy } from "react";
import { Outlet } from "react-router";

const AdjustmentReport = lazy(() => import("#src/pages/adjustment-report"));

const routes: AppRouteRecordRaw[] = [
	{
		path: "/adjustment-report",
		Component: Outlet,
		handle: {
			hideInMenu: true,
			title: "组织调整报告",
		},
		children: [
			{
				index: true,
				Component: AdjustmentReport,
				handle: {
					title: "组织调整报告",
				},
			},
		],
	},
];

export default routes;
