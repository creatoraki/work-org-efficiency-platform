import type { AppRouteRecordRaw } from "#src/router/types";

import { ContainerLayout } from "#src/layout";
import { orgBrain } from "#src/router/extra-info";

import { lazy } from "react";

const JobMatching = lazy(() => import("#src/pages/org-brain/job-matching"));
const Deployment = lazy(() => import("#src/pages/org-brain/deployment"));
const PersonnelArchive = lazy(() => import("#src/pages/org-brain/personnel-archive"));
const JobAtlas = lazy(() => import("#src/pages/org-brain/job-atlas"));

const routes: AppRouteRecordRaw[] = [
	{
		path: "/org-brain",
		Component: ContainerLayout,
		handle: {
			icon: "ThunderboltOutlined",
			title: "组织大脑",
			order: orgBrain,
		},
		children: [
			{
				path: "/org-brain/job-matching",
				Component: JobMatching,
				handle: {
					icon: "SwapOutlined",
					title: "人岗匹配",
				},
			},
			{
				path: "/org-brain/deployment",
				Component: Deployment,
				handle: {
					icon: "TeamOutlined",
					title: "排兵布阵",
				},
			},
			{
				path: "/org-brain/personnel-archive",
				Component: PersonnelArchive,
				handle: {
					icon: "UserOutlined",
					title: "人员档案",
				},
			},
			{
				path: "/org-brain/job-atlas",
				Component: JobAtlas,
				handle: {
					icon: "BlockOutlined",
					title: "岗位图谱",
				},
			},
			{
				index: true,
				handle: {
					title: "组织大脑",
				},
			},
		],
	},
];

export default routes;
