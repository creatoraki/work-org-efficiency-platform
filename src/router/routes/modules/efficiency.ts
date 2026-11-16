import type { AppRouteRecordRaw } from "#src/router/types";
import { ContainerLayout } from "#src/layout";
import { system } from "#src/router/extra-info";

import { lazy } from "react";

const Dimension = lazy(() => import("#src/pages/efficiency-control/control-dimension"));
const Center = lazy(() => import("#src/pages/efficiency-control/warning-center"));
const Analysis = lazy(() => import("#src/pages/efficiency-control/efficiency-analysis"));

const routes: AppRouteRecordRaw[] = [
	{
		path: "/efficiency-control",
		Component: ContainerLayout,
		handle: {
			icon: "SettingOutlined",
			title: "common.menu.efficiencyControl",
			order: system,
			roles: ["admin"],
		},
		children: [
			{
				path: "/efficiency-control/control-dimension",
				Component: Dimension,
				handle: {
					title: "common.menu.controlDimension",
					roles: ["admin"],
					permissions: [
						"permission:button:add",
						"permission:button:update",
						"permission:button:delete",
					],
				},
			},
			{
				path: "/efficiency-control/warning-center",
				Component: Center,
				handle: {
					title: "common.menu.warningCenter",
					roles: ["admin"],
					permissions: [
						"permission:button:add",
						"permission:button:update",
						"permission:button:delete",
					],
				},
			},
			{
				path: "/efficiency-control/efficiency-analysis",
				Component: Analysis,
				handle: {
					icon: "MenuOutlined",
					title: "common.menu.efficiencyAnalysis",
					roles: ["admin"],
					permissions: [
						"permission:button:add",
						"permission:button:update",
						"permission:button:delete",
					],
				},
			},
		],
	},
];

export default routes;
