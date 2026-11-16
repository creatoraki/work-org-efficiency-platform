import type { AppRouteRecordRaw } from "#src/router/types";
import { ContainerLayout } from "#src/layout";
import { personnelArchive } from "#src/router/extra-info";

import { lazy } from "react";

const ArchiveManagement = lazy(() => import("#src/pages/personnel-archive/archive-management"));
const ArchiveAudit = lazy(() => import("#src/pages/personnel-archive/archive-audit"));
const InterviewManagement = lazy(() => import("#src/pages/personnel-archive/interview-management"));

const routes: AppRouteRecordRaw[] = [
	{
		path: "/personnel-archive",
		Component: ContainerLayout,
		handle: {
			icon: "FolderOutlined",
			title: "人员档案",
			order: personnelArchive,
		},
		children: [
			{
				path: "/personnel-archive/archive-management",
				Component: ArchiveManagement,
				handle: {
					icon: "FileOutlined",
					title: "档案管理",
				},
			},
			{
				path: "/personnel-archive/archive-audit",
				Component: ArchiveAudit,
				handle: {
					icon: "AuditOutlined",
					title: "档案审核",
				},
			},
			{
				path: "/personnel-archive/interview-management",
				Component: InterviewManagement,
				handle: {
					icon: "MessageOutlined",
					title: "面谈管理",
				},
			},
			{
				index: true,
				handle: {
					title: "人员档案",
				},
			},
		],
	},
];

export default routes;
