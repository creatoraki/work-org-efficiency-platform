import {
	about,
	access,
	home,
	outside,
	personalCenter,
	personnelArchive,
	routeNest,
	tagManagement,
} from "#/src/router/extra-info";
import { defineFakeRoute } from "vite-plugin-fake-server/client";
import { ADMIN_TOKEN } from "./constants";
import { resultSuccess } from "./utils";

/**
 * roles：页面级别权限，这里模拟二种 "admin"、"common"
 * admin：管理员角色
 * common：普通角色
 */

const homeRouter = {
	path: "/home",
	component: "/home/index.tsx",
	handle: {
		icon: "HomeOutlined",
		title: "common.menu.home",
		order: home,
	},
};

// 管理工作台
const workbenchRouter = {
	path: "/work-bench",
	component: "/work-bench/index.tsx",
	handle: {
		icon: "HomeOutlined",
		title: "common.menu.workBench",
	},
};

// 战略拆解
const strategyRouter = {
	path: "/strategy",
	handle: {
		icon: "OutsidePageIcon",
		title: "common.menu.strategy",
		order: home,
	},
	children: [
		{
			path: "/strategy/target-management",
			handle: {
				icon: "SisternodeOutlined",
				title: "common.menu.targetManagement",
			},
			children: [
				{
					path: "/strategy/target-management/indicator-library",
					component: "/strategy/target-management/indicator-library.tsx",
					handle: { title: "common.menu.indicatorLibrary" },
				},
				{
					path: "/strategy/target-management/target-plan",
					component: "/strategy/target-management/target-plan.tsx",
					handle: { title: "common.menu.targetPlan" },
				},
			],
		},
		{
			path: "/strategy/target-decomposition",
			handle: {
				icon: "SisternodeOutlined",
				title: "common.menu.targetDecomposition",
			},
			children: [
				{
					path: "/strategy/target-decomposition/indicator-config",
					component: "/strategy/target-decomposition/indicator-config.tsx",
					handle: { title: "common.menu.indicatorConfig" },
				},
				{
					path: "/strategy/target-decomposition/target-filling",
					component: "/strategy/target-decomposition/target-filling.tsx",
					handle: { title: "common.menu.targetFilling" },
				},
				{
					path: "/strategy/target-decomposition/single-filling",
					component: "/strategy/target-decomposition/single-filling-page.tsx",
					handle: { title: "填报", hideInMenu: true },
				},
				{
					path: "/strategy/target-decomposition/target-confirm",
					component: "/strategy/target-decomposition/target-confirm.tsx",
					handle: { title: "common.menu.targetConfirm" },
				},
				{
					path: "/strategy/target-decomposition/process-follow",
					component: "/strategy/target-decomposition/process-follow.tsx",
					handle: { title: "common.menu.processFollow" },
				},
			],
		},
	],
};

// 系统配置
const systemManagementRouter = {
	path: "/system",
	handle: {
		icon: "SettingOutlined",
		title: "common.menu.system",
		order: home,
	},
	children: [
		{
			path: "/system/user",
			handle: {
				icon: "UserOutlined",
				title: "common.menu.user",
			},
		},
		{
			path: "/system/role",
			handle: {
				icon: "TeamOutlined",
				title: "common.menu.role",
			},
		},
	],
};

// 人效管控
const efficiencyControlRouter = {
	path: "/efficiency-control",
	handle: {
		icon: "SolutionOutlined",
		title: "common.menu.efficiencyControl",
		order: home,
	},
	children: [
		{
			path: "/efficiency-control/control-dimension",
			component: "/efficiency-control/control-dimension/index.tsx",
			handle: {
				icon: "PieChartOutlined",
				title: "common.menu.controlDimension",
			},
		},
		{
			path: "/efficiency-control/warning-center",
			component: "/efficiency-control/warning-center/index.tsx",
			handle: {
				icon: "BellOutlined",
				title: "common.menu.warningCenter",
			},
		},
		{
			path: "/efficiency-control/efficiency-analysis",
			component: "/efficiency-control/efficiency-analysis/index.tsx",
			handle: {
				icon: "BarChartOutlined",
				title: "common.menu.efficiencyAnalysis",
			},
		},
	],
};

const aboutRouter = {
	path: "/about",
	component: "/about/index.tsx",
	handle: {
		icon: "CopyrightOutlined",
		title: "common.menu.about",
		order: about,
	},
};

const outsideRouter = {
	path: "/outside",
	handle: {
		icon: "OutsidePageIcon",
		title: "common.menu.outside",
		order: outside,
	},
	children: [
		{
			path: "/outside/embedded",
			handle: {
				icon: "EmbeddedIcon",
				title: "common.menu.embedded",
			},
			children: [
				{
					path: "/outside/embedded/ant-design",
					handle: {
						icon: "AntDesignOutlined",
						title: "common.menu.antd",
						iframeLink: "https://ant.design/",
					},
				},
				{
					path: "/outside/embedded/project-docs",
					handle: {
						icon: "ContainerOutlined",
						title: "common.menu.projectDocs",
						iframeLink: "https://condorheroblog.github.io/react-antd-admin/docs/",
					},
				},
			],
		},
		{
			path: "/outside/external-link",
			handle: {
				icon: "ExternalIcon",
				title: "common.menu.externalLink",
			},
			children: [
				{
					path: "/outside/external-link/react-docs",
					handle: {
						icon: "RiReactjsLine",
						title: "common.menu.reactDocs",
						externalLink: "https://react.dev/",
					},
				},
			],
		},
	],
};

const personalCenterRouter = {
	path: "/personal-center",
	handle: {
		order: personalCenter,
		title: "common.menu.personalCenter",
		icon: "RiAccountCircleLine",
	},
	children: [
		{
			path: "/personal-center/my-profile",
			handle: {
				title: "common.menu.profile",
				icon: "ProfileCardIcon",
			},
		},
		{
			path: "/personal-center/settings",
			handle: {
				title: "common.menu.settings",
				icon: "RiUserSettingsLine",
			},
		},
	],
};

const routeNestRouter = {
	path: "/route-nest",
	handle: {
		order: routeNest,
		title: "common.menu.nestMenus",
		icon: "NodeExpandOutlined",
	},
	children: [
		{
			path: "/route-nest/menu1",
			handle: {
				title: "common.menu.menu1",
				icon: "SisternodeOutlined",
			},
			children: [
				{
					path: "/route-nest/menu1/menu1-1",
					handle: {
						title: "common.menu.menu1-1",
						icon: "SubnodeOutlined",
					},
				},
				{
					path: "/route-nest/menu1/menu1-2",
					handle: {
						title: "common.menu.menu1-2",
						icon: "SubnodeOutlined",
					},
				},
			],
		},
		{
			path: "/route-nest/menu2",
			handle: {
				title: "common.menu.menu2",
				icon: "SubnodeOutlined",
			},
		},
	],
};

// 标签管理路由配置
const tagManagementRouter = {
	path: "/tag-management",
	handle: {
		icon: "TagsOutlined",
		title: "标签管理",
		order: tagManagement,
	},
	children: [
		{
			path: "/tag-management/org-tag",
			handle: {
				icon: "ApartmentOutlined",
				title: "组织标签管理",
			},
			children: [
				{
					path: "/tag-management/org-tag/rule-library",
					component: "/tag-management/org-tag/rule-library/index.tsx",
					handle: {
						icon: "DatabaseOutlined",
						title: "标签规则库",
						permissions: [
							"permission:button:add",
							"permission:button:update",
							"permission:button:delete",
						],
					},
				},
				{
					path: "/tag-management/org-tag/tag-center",
					component: "/tag-management/org-tag/tag-center/index.tsx",
					handle: {
						icon: "AppstoreOutlined",
						title: "标签中心",
					},
				},
				{
					path: "/tag-management/org-tag/tag-audit",
					component: "/tag-management/org-tag/tag-audit/index.tsx",
					handle: {
						icon: "AuditOutlined",
						title: "标签审核",
					},
				},
			],
		},
		{
			path: "/tag-management/talent-tag",
			handle: {
				icon: "UserOutlined",
				title: "人才标签管理",
			},
			children: [
				{
					path: "/tag-management/talent-tag/rule-library",
					component: "/tag-management/talent-tag/rule-library/index.tsx",
					handle: {
						icon: "DatabaseOutlined",
						title: "标签规则库",
					},
				},
				{
					path: "/tag-management/talent-tag/tag-center",
					component: "/tag-management/talent-tag/tag-center/index.tsx",
					handle: {
						icon: "AppstoreOutlined",
						title: "标签中心",
					},
				},
				{
					path: "/tag-management/talent-tag/tag-audit",
					component: "/tag-management/talent-tag/tag-audit/index.tsx",
					handle: {
						icon: "AuditOutlined",
						title: "标签审核",
					},
				},
			],
		},
		{
			path: "/tag-management/job-desc",
			handle: {
				icon: "FileTextOutlined",
				title: "岗位描述管理",
			},
			children: [
				{
					path: "/tag-management/job-desc/management",
					component: "/tag-management/job-desc/management/index.tsx",
					handle: {
						icon: "EditOutlined",
						title: "岗位描述管理",
					},
				},
				{
					path: "/tag-management/job-desc/audit",
					component: "/tag-management/job-desc/audit/index.tsx",
					handle: {
						icon: "AuditOutlined",
						title: "岗位描述审核",
					},
				},
			],
		},
		{
			path: "/tag-management/tag-matching",
			handle: {
				icon: "NodeIndexOutlined",
				title: "标签匹配管理",
			},
			children: [
				{
					path: "/tag-management/tag-matching/model",
					component: "/tag-management/tag-matching/model/index.tsx",
					handle: {
						icon: "FunctionOutlined",
						title: "匹配模型",
					},
				},
			],
		},
	],
};

// 人员档案路由配置
const personnelArchiveRouter = {
	path: "/personnel-archive",
	handle: {
		icon: "FolderOutlined",
		title: "人员档案",
		order: personnelArchive,
	},
	children: [
		{
			path: "/personnel-archive/archive-management",
			component: "/personnel-archive/archive-management/index.tsx",
			handle: {
				icon: "FileOutlined",
				title: "档案管理",
			},
		},
		{
			path: "/personnel-archive/archive-audit",
			component: "/personnel-archive/archive-audit/index.tsx",
			handle: {
				icon: "AuditOutlined",
				title: "档案审核",
			},
		},
		{
			path: "/personnel-archive/interview-management",
			component: "/personnel-archive/interview-management/index.tsx",
			handle: {
				icon: "MessageOutlined",
				title: "面谈管理",
			},
		},
	],
};

export default defineFakeRoute([
	{
		url: "/user/getRouters2",
		timeout: 1000,
		method: "get",
		response: ({ headers }) => {
			const userToken = headers.authorization?.split(" ")?.[1];
			const isAdmin = userToken === ADMIN_TOKEN;
			const accessRouter = {
				path: "/access",
				handle: {
					icon: "SafetyOutlined",
					title: "common.menu.access",
					order: access,
				},
				children: [
					/**
					 * @zh 通过接口获取路由时可见
					 * @en Visible only when getting routes through the interface
					 */
					{
						path: "/access/access-mode",
						handle: {
							icon: "CloudOutlined",
							title: "common.menu.accessMode",
						},
					},
					{
						path: "/access/page-control",
						handle: {
							icon: "FileTextOutlined",
							title: "common.menu.pageControl",
						},
					},
					{
						path: "/access/button-control",
						handle: {
							icon: "LockOutlined",
							title: "common.menu.buttonControl",
							permissions: isAdmin
								? [
										"permission:button:get",
										"permission:button:update",
										"permission:button:delete",
										"permission:button:add",
									]
								: ["permission:button:get"],
						},
					},
					isAdmin
						? {
								path: "/access/admin-visible",
								handle: {
									icon: "EyeOutlined",
									title: "common.menu.adminVisible",
								},
							}
						: {
								path: "/access/common-visible",
								handle: {
									icon: "EyeOutlined",
									title: "common.menu.commonVisible",
								},
							},
				],
			};
			console.warn(
				homeRouter,
				accessRouter,
				aboutRouter,
				personnelArchiveRouter,
				systemManagementRouter,
				outsideRouter,
				routeNestRouter,
			);
			return resultSuccess([
				// homeRouter,
				workbenchRouter,
				strategyRouter,
				// accessRouter,
				// aboutRouter,
				tagManagementRouter,
				personnelArchiveRouter,
				systemManagementRouter,
				// outsideRouter,
				personalCenterRouter,
				efficiencyControlRouter,
				// routeNestRouter,
			]);
		},
	},
]);
