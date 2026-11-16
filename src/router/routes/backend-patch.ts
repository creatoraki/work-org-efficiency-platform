import ShareCenterIcon from "#src/assets/svg/share-center-light.svg?react";
import { ServerErrorIcon } from "#src/icons/local-icons.js";
import { $t } from "#src/locales/t.js";
import { useUserStore } from "#src/store/user.js";
import { createElement } from "react";
import { exception403Path, exception404Path, exception500Path } from "../extra-info/route-path";
/**
 * 注入到后端路由的补丁数据
 * 用于在开发或特定场景下，向后端返回的路由数据中注入额外的路由节点
 */
const patchRoutes = [
	{
		id: 2001,
		parentId: 0,
		weight: 5,
		name: "工作台",
		path: "/work-bench",
		component: "/work-bench/index.tsx",
		handle: {
			icon: "HomeOutlined",
			title: "工作台",
			hideInMenu: false,
		},
	},
	{
		id: 10001,
		parentId: 0,
		weight: 5,
		name: "文件中心",
		path: "/file-center",
		children: [
			{
				id: 10002,
				parentId: 10001,
				weight: 1,
				name: "导入中心",
				path: "/file-center/import",
				component: "/file-center/import-center/index.tsx",
				handle: {
					icon: "ImportOutlined",
					title: "导入中心",
					hideInMenu: false,
				},
			},
			{
				id: 10003,
				parentId: 10001,
				weight: 2,
				name: "导出中心",
				path: "/file-center/export",
				component: "/file-center/export-center/index.tsx",
				handle: {
					icon: "ExportOutlined",
					title: "导出中心",
					hideInMenu: false,
				},
			},
			{
				id: 10004,
				parentId: 10001,
				weight: 3,
				name: "模板配置",
				path: "/file-center/template-config",
				component: "/file-center/template-config/index.tsx",
				handle: {
					icon: "SettingOutlined",
					title: "模板配置",
					hideInMenu: false,
				},
			},
		],
		handle: {
			icon: createElement(ShareCenterIcon),
			title: "文件中心",
			hideInMenu: false,
		},
	},
	{
		id: 2055,
		parentId: 2003,
		weight: 3,
		name: "填报",
		path: "/strategy/target-decomposition/single-filling",
		component: "/strategy/target-decomposition/single-filling-page/index.tsx",
		handle: {
			icon: "",
			title: "填报",
			hideInMenu: true,
		},
	},
	{
		id: 12088,
		parentId: 2087,
		weight: 3,
		name: "调整",
		path: "/org-management/org-adjustment-management/adjustment-canvas",
		component: "/org-management/org-adjustment-management/adjustment-canvas/index.tsx",
		handle: {
			icon: "",
			title: "调整",
			hideInMenu: true,
		},
	},
	{
		parentId: 0,
		id: 500,
		path: exception500Path,
		component: "/exception/500/index.tsx",
		handle: {
			title: $t("common.menu.exception_500"),
			icon: createElement(ServerErrorIcon),
			hideInMenu: true,
		},
	},
	{
		parentId: 0,
		id: 404,
		path: exception404Path,
		component: "/exception/404/index.tsx",
		handle: {
			title: $t("common.menu.exception_404"),
			icon: createElement(ServerErrorIcon),
			hideInMenu: true,
		},
	},
	{
		parentId: 0,
		id: 403,
		path: exception403Path,
		component: "/exception/403/index.tsx",
		handle: {
			title: $t("common.menu.exception_403"),
			icon: createElement(ServerErrorIcon),
			hideInMenu: true,
		},
	},
];

/**
 * 将补丁路由注入到后端返回的路由数据中
 * @param routes 后端返回的原始路由数据（树形结构）
 */
export function injectBackendRoutes(routes: any[]) {
	// 获取用户信息，判断是否为管理员
	const isAdmin = useUserStore.getState().admin;

	patchRoutes.forEach((patch) => {
		// 模板配置菜单 (id: 10004) 仅管理员可见
		if (patch.id === 10004 && !isAdmin) {
			return; // 跳过该路由
		}

		// 如果是文件中心父路由 (id: 10001)，需要过滤其 children
		if (patch.id === 10001 && patch.children) {
			const filteredChildren = patch.children.filter((child: any) => {
				// 过滤掉非管理员的模板配置
				if (child.id === 10004 && !isAdmin) {
					return false;
				}
				return true;
			});
			patch = { ...patch, children: filteredChildren };
		}

		const inserted = findAndInsert(routes, patch);
		if (!inserted) {
			// 如果未找到父节点，则作为顶层路由插入
			// 特殊处理：工作台 (id: 2001) 插入到最前面，其他插入到最后面
			if (patch.id === 2001) {
				routes.unshift(patch);
			} else {
				routes.push(patch);
			}
		}
	});
	return routes;
}

/**
 * 递归查找父节点并插入子节点
 */
function findAndInsert(routes: any[], patch: any): boolean {
	for (const route of routes) {
		if (route.id === patch.parentId) {
			if (!route.children) {
				route.children = [];
			}
			// 避免重复插入
			const exists = route.children.some(
				(child: any) => child.id === patch.id || child.path === patch.path,
			);
			if (!exists) {
				route.children.push(patch);
			}
			return true;
		}
		if (route.children && route.children.length > 0) {
			if (findAndInsert(route.children, patch)) {
				return true;
			}
		}
	}
	return false;
}
