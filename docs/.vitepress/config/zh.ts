import type { DefaultTheme } from "vitepress";
import { defineConfig } from "vitepress";

export const zh = defineConfig({
	lang: "zh-Hans",
	description:
		"基于 React 18、TypeScript 5.8、Vite 6 和 Ant Design 5 构建的现代化企业级中后台管理系统。提供人员档案管理、智能标签体系、策略管理、系统管理等核心功能，内置权限校验、动态菜单、多主题配置、路由缓存等开箱即用功能",

	themeConfig: {
		nav: nav(),

		sidebar: {
			"/zh/guide/": { base: "/zh/guide/", items: sidebarGuide() },
			"/zh/api/": { base: "/zh/api/", items: sidebarApi() },
		},

		editLink: {
			pattern:
				"http://git.greentown-tech.com/caizhipeng/org-efficiency-platform/edit/main/docs/:path",
			text: "在 GitLab 上编辑此页面",
		},

		footer: {
			message: "基于 UNLICENSED 许可发布",
			copyright: `版权所有 © 2023-${new Date().getFullYear()} greentown-tech`,
		},

		docFooter: {
			prev: "上一页",
			next: "下一页",
		},

		outline: {
			label: "页面导航",
		},

		lastUpdated: {
			text: "最后更新于",
			formatOptions: {
				dateStyle: "short",
				timeStyle: "medium",
			},
		},

		returnToTopLabel: "回到顶部",
		sidebarMenuLabel: "菜单",
		darkModeSwitchLabel: "主题",
		lightModeSwitchTitle: "切换到浅色模式",
		darkModeSwitchTitle: "切换到深色模式",
	},
});

function nav(): DefaultTheme.NavItem[] {
	return [
		{
			text: "在线预览",
			link: "http://10.0.20.189:10013/org-efficiency-platform/",
		},
		{
			text: "指南",
			link: "/zh/guide/introduction/",
			activeMatch: "/zh/guide/",
		},
		{
			text: "API 文档",
			link: "/zh/api/",
			activeMatch: "/zh/api/",
		},
	];
}

function sidebarGuide(): DefaultTheme.SidebarItem[] {
	return [
		{
			text: "简介",
			items: [
				{ text: "介绍", link: "introduction" },
				{ text: "快速开始", link: "introduction/quick-start" },
			],
		},
		{
			text: "功能模块",
			items: [
				{ text: "功能概述", link: "features/index" },
				{ text: "人员档案管理", link: "features/personnel-archive" },
				{ text: "智能标签体系", link: "features/tag-management" },
				{ text: "策略管理", link: "features/strategy" },
				{ text: "系统管理", link: "features/system" },
				{ text: "组织大脑", link: "features/org-brain" },
				{ text: "文件中心", link: "features/file-center" },
			],
		},
		{
			text: "基础",
			items: [
				{ text: "目录结构", link: "fundamentals/directory-structure" },
				{ text: "路由和菜单", link: "fundamentals/routing" },
				{ text: "标签页", link: "fundamentals/tab" },
				{ text: "图标", link: "fundamentals/icon" },
				{ text: "样式", link: "fundamentals/style" },
				{ text: "数据请求", link: "fundamentals/request" },
				{ text: "数据 Mock", link: "fundamentals/mock" },
				{ text: "构建和部署", link: "fundamentals/build" },
				{ text: "配置", link: "fundamentals/settings" },
			],
		},
		{
			text: "进阶",
			items: [
				{ text: "权限", link: "advanced/access" },
				{ text: "主题", link: "advanced/theme" },
				{ text: "应用 Loading", link: "advanced/loading" },
				{ text: "监控网站更新", link: "advanced/monitoring-updates" },
				{ text: "项目升级", link: "advanced/upgrading" },
			],
		},
	];
}

function sidebarApi(): DefaultTheme.SidebarItem[] {
	return [
		{
			text: "API 文档",
			items: [
				{ text: "简介", link: "index" },
				{ text: "业务模块", link: "业务模块" },
				{ text: "系统模块", link: "系统模块" },
				{ text: "工具模块", link: "工具模块" },
			],
		},
	];
}

export const search: DefaultTheme.AlgoliaSearchOptions["locales"] = {
	zh: {
		placeholder: "搜索文档",
		translations: {
			button: {
				buttonText: "搜索文档",
				buttonAriaLabel: "搜索文档",
			},
			modal: {
				searchBox: {
					resetButtonTitle: "清除查询条件",
					resetButtonAriaLabel: "清除查询条件",
					cancelButtonText: "取消",
					cancelButtonAriaLabel: "取消",
				},
				startScreen: {
					recentSearchesTitle: "搜索历史",
					noRecentSearchesText: "没有搜索历史",
					saveRecentSearchButtonTitle: "保存至搜索历史",
					removeRecentSearchButtonTitle: "从搜索历史中移除",
					favoriteSearchesTitle: "收藏",
					removeFavoriteSearchButtonTitle: "从收藏中移除",
				},
				errorScreen: {
					titleText: "无法获取结果",
					helpText: "你可能需要检查你的网络连接",
				},
				footer: {
					selectText: "选择",
					navigateText: "切换",
					closeText: "关闭",
					searchByText: "搜索提供者",
				},
				noResultsScreen: {
					noResultsText: "无法找到相关结果",
					suggestedQueryText: "你可以尝试查询",
					reportMissingResultsText: "你认为该查询应该有结果？",
					reportMissingResultsLinkText: "点击反馈",
				},
			},
		},
	},
};
