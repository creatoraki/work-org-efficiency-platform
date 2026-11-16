import type { AppRouteRecordRaw } from "#src/router/types";
import workBenchIcon from "#src/assets/svg/work-bench.svg?react";
import { ContainerLayout, ParentLayout } from "#src/layout";
import { $t } from "#src/locales";
import { createElement, lazy } from "react";

const IndicatorLibrary = lazy(
	() => import("#src/pages/strategy/target-management/indicator-library"),
);
const TargetPlan = lazy(() => import("#src/pages/strategy/target-management/target-plan"));
const IndicatorConfig = lazy(
	() => import("#src/pages/strategy/target-decomposition/indicator-config"),
);
const TargetFilling = lazy(() => import("#src/pages/strategy/target-decomposition/target-filling"));
const SingleFillingPage = lazy(
	() => import("#src/pages/strategy/target-decomposition/single-filling-page"),
);
const TargetConfirm = lazy(() => import("#src/pages/strategy/target-decomposition/target-confirm"));
const ProcessFollow = lazy(() => import("#src/pages/strategy/target-decomposition/process-follow"));

const routes: AppRouteRecordRaw[] = [
	{
		path: "/strategy",
		Component: ContainerLayout,
		handle: {
			title: $t("common.menu.strategy") || "战略拆解",
			icon: createElement(workBenchIcon, { style: { color: "inherit" } }),
		},
		children: [
			{
				path: "/strategy/target-management",
				Component: ParentLayout,
				handle: {
					title: $t("common.menu.targetManagement") || "目标管理",
					icon: createElement(workBenchIcon, { style: { color: "inherit" } }),
				},
				children: [
					{
						path: "/strategy/target-management/indicator-library",
						Component: IndicatorLibrary,
						handle: { title: $t("common.menu.indicatorLibrary") || "指标库" },
					},
					{
						path: "/strategy/target-management/target-plan",
						Component: TargetPlan,
						handle: { title: $t("common.menu.targetPlan") || "目标计划" },
					},
				],
			},
			{
				path: "/strategy/target-decomposition",
				Component: ParentLayout,
				handle: {
					title: $t("common.menu.targetDecomposition") || "目标拆解",
					icon: createElement(workBenchIcon, { style: { color: "inherit" } }),
				},
				children: [
					{
						path: "/strategy/target-decomposition/indicator-config",
						Component: IndicatorConfig,
						handle: { title: $t("common.menu.indicatorConfig") || "指标配置" },
					},
					{
						path: "/strategy/target-decomposition/target-filling",
						Component: TargetFilling,
						handle: { title: $t("common.menu.targetFilling") || "目标填报" },
					},
					{
						path: "/strategy/target-decomposition/single-filling",
						Component: SingleFillingPage,
						handle: { title: "填报页" },
					},
					{
						path: "/strategy/target-decomposition/target-confirm",
						Component: TargetConfirm,
						handle: { title: $t("common.menu.targetConfirm") || "目标确认" },
					},
					{
						path: "/strategy/target-decomposition/process-follow",
						Component: ProcessFollow,
						handle: { title: $t("common.menu.processFollow") || "流程跟进" },
					},
				],
			},
			{
				index: true,
				handle: { title: $t("common.menu.strategy") || "战略拆解" },
			},
		],
	},
];

export default routes;
