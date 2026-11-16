import type { AppRouteRecordRaw } from "#src/router/types";
import workBenchIcon from "#src/assets/svg/work-bench.svg?react";

import { ContainerLayout } from "#src/layout";
import { $t } from "#src/locales";
import { home } from "#src/router/extra-info";
import { createElement, lazy } from "react";

const WorkBench = lazy(() => import("#src/pages/work-bench"));

const routes: AppRouteRecordRaw[] = [
	{
		path: "/work-bench",
		Component: ContainerLayout,
		handle: {
			order: home,
			title: $t("common.menu.workBench"),
			icon: createElement(workBenchIcon, { style: { color: "inherit" } }),
		},
		children: [
			{
				index: true,
				Component: WorkBench,
				handle: {
					title: $t("common.menu.workBench"),
					icon: createElement(workBenchIcon, { style: { color: "inherit" } }),
				},
			},
		],
	},
];

export default routes;
