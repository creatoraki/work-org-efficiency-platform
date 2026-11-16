import type { AppRouteRecordRaw } from "#src/router/types";
import { ContainerLayout, ParentLayout } from "#src/layout";
import { tagManagement } from "#src/router/extra-info";

import { lazy } from "react";

// 组织标签管理
const OrgTagRuleLibrary = lazy(() => import("#src/pages/tag-management/org-tag/rule-library"));
const OrgTagCenter = lazy(() => import("#src/pages/tag-management/org-tag/tag-center"));
const OrgTagAudit = lazy(() => import("#src/pages/tag-management/org-tag/tag-audit"));

// 人才标签管理
const TalentTagRuleLibrary = lazy(
	() => import("#src/pages/tag-management/talent-tag/rule-library"),
);
const TalentTagCenter = lazy(() => import("#src/pages/tag-management/talent-tag/tag-center"));
const TalentTagAudit = lazy(() => import("#src/pages/tag-management/talent-tag/tag-audit"));

// 岗位描述管理
const JobDescManagement = lazy(() => import("#src/pages/tag-management/job-desc/management"));
const JobDescAudit = lazy(() => import("#src/pages/tag-management/job-desc/audit"));

// 标签匹配管理
const TagMatchingModel = lazy(() => import("#src/pages/tag-management/tag-matching/model"));

const routes: AppRouteRecordRaw[] = [
	{
		path: "/tag-management",
		Component: ContainerLayout,
		handle: {
			icon: "TagsOutlined",
			title: "标签管理",
			order: tagManagement,
		},
		children: [
			{
				path: "/tag-management/org-tag",
				Component: ParentLayout,
				handle: {
					icon: "ApartmentOutlined",
					title: "组织标签管理",
				},
				children: [
					{
						path: "/tag-management/org-tag/rule-library",
						Component: OrgTagRuleLibrary,
						handle: {
							icon: "DatabaseOutlined",
							title: "标签规则库",
							roles: ["admin"],
							permissions: [
								"permission:button:add",
								"permission:button:update",
								"permission:button:delete",
							],
						},
					},
					{
						path: "/tag-management/org-tag/tag-center",
						Component: OrgTagCenter,
						handle: {
							icon: "AppstoreOutlined",
							title: "标签中心",
							roles: ["admin"],
						},
					},
					{
						path: "/tag-management/org-tag/tag-audit",
						Component: OrgTagAudit,
						handle: {
							icon: "AuditOutlined",
							title: "标签审核",
							roles: ["admin"],
						},
					},
				],
			},
			{
				path: "/tag-management/talent-tag",
				Component: ParentLayout,
				handle: {
					icon: "UserOutlined",
					title: "人才标签管理",
				},
				children: [
					{
						path: "/tag-management/talent-tag/rule-library",
						Component: TalentTagRuleLibrary,
						handle: {
							icon: "DatabaseOutlined",
							title: "标签规则库",
							roles: ["admin"],
						},
					},
					{
						path: "/tag-management/talent-tag/tag-center",
						Component: TalentTagCenter,
						handle: {
							icon: "AppstoreOutlined",
							title: "标签中心",
							roles: ["admin"],
						},
					},
					{
						path: "/tag-management/talent-tag/tag-audit",
						Component: TalentTagAudit,
						handle: {
							icon: "AuditOutlined",
							title: "标签审核",
							roles: ["admin"],
						},
					},
				],
			},
			{
				path: "/tag-management/job-desc",
				Component: ParentLayout,
				handle: {
					icon: "FileTextOutlined",
					title: "岗位描述管理",
				},
				children: [
					{
						path: "/tag-management/job-desc/management",
						Component: JobDescManagement,
						handle: {
							icon: "EditOutlined",
							title: "岗位描述管理",
							roles: ["admin"],
						},
					},
					{
						path: "/tag-management/job-desc/audit",
						Component: JobDescAudit,
						handle: {
							icon: "AuditOutlined",
							title: "岗位描述审核",
							roles: ["admin"],
						},
					},
				],
			},
			{
				path: "/tag-management/tag-matching",
				Component: ParentLayout,
				handle: {
					icon: "NodeIndexOutlined",
					title: "标签匹配管理",
				},
				children: [
					{
						path: "/tag-management/tag-matching/model",
						Component: TagMatchingModel,
						handle: {
							icon: "FunctionOutlined",
							title: "匹配模型",
							roles: ["admin"],
						},
					},
				],
			},
			{
				index: true,
				handle: {
					title: "标签管理",
				},
			},
		],
	},
];

export default routes;
