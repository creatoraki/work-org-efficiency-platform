import { defineConfig } from "vitepress";
import { search as zhSearch } from "./zh";

export const shared = defineConfig({
	title: "组织效能管控平台",
	description:
		"基于 React 18、TypeScript 5.8、Vite 6 和 Ant Design 5 构建的现代化企业级中后台管理系统。提供人员档案管理、智能标签体系、策略管理、系统管理等核心功能，内置权限校验、动态菜单、多主题配置、路由缓存等开箱即用功能",

	lang: "zh-Hans",

	base: "/org-efficiency-platform/docs/",

	// rewrites: {
	// 	"zh/:rest*": ":rest*",
	// },

	lastUpdated: true,
	cleanUrls: true,
	metaChunk: true,

	markdown: {
		// math: true,
		codeTransformers: [
			// We use `[!!code` in demo to prevent transformation, here we revert it back.
			{
				postprocess(code) {
					return code.replace(/\[!!code/g, "[!code");
				},
			},
		],
	},

	/* prettier-ignore */
	head: [
		["link", { rel: "icon", type: "image/svg+xml", href: "/logo.svg" }],
		["link", { rel: "icon", type: "image/png", href: "/logo.png" }],
		["meta", { name: "theme-color", content: "#5f67ee" }],
		["meta", { property: "og:type", content: "website" }],
		["meta", { property: "og:locale", content: "zh_CN" }],
		["meta", { property: "og:title", content: "组织效能管控平台 | 企业级中后台管理系统" }],
		["meta", { property: "og:site_name", content: "组织效能管控平台" }],
		["meta", { property: "og:image", content: "/logo.png" }],
		["meta", { property: "og:url", content: "http://git.greentown-tech.com/caizhipeng/org-efficiency-platform" }],
	],

	themeConfig: {
		outline: "deep",
		logo: { src: "/logo.svg", width: 24, height: 24 },

		search: {
			provider: "local",
			options: {
				locales: {
					...zhSearch,
				},
			},
		},
	},
});
