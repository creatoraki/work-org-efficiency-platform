/**
 * 转派弹窗工具函数
 */

import type { OrganizationTreeNode } from "#src/api/common";

/**
 * 扁平化组织树数据
 *
 * @param nodes - 组织树节点列表
 * @returns 扁平化的节点列表
 */
export function flattenTreeData(nodes: OrganizationTreeNode[]): OrganizationTreeNode[] {
	return nodes.reduce<OrganizationTreeNode[]>((acc, node) => {
		acc.push(node);
		if (node.children) {
			acc.push(...flattenTreeData(node.children));
		}
		return acc;
	}, []);
}

/**
 * 构建部门路径字符串
 *
 * @param deptId - 部门ID
 * @param nodes - 组织树节点列表
 * @returns 部门路径字符串，格式如："集团 > 子公司 > 部门"
 */
export function buildDeptPath(deptId: number, nodes: OrganizationTreeNode[]): string {
	const findPath = (
		id: number,
		nodeList: OrganizationTreeNode[],
		path: string[],
	): string[] | null => {
		for (const node of nodeList) {
			const currentPath = [...path, node.name];
			if (Number(node.id) === id) {
				return currentPath;
			}
			if (node.children) {
				const result = findPath(id, node.children, currentPath);
				if (result) {
					return result;
				}
			}
		}
		return null;
	};

	const path = findPath(deptId, nodes, []);
	return path ? path.join(">") : "";
}

/**
 * 获取任务的 Symbol 标识符
 *
 * @param tasks - 任务列表
 * @param taskIndex - 任务索引
 * @returns 任务的 Symbol 标识符，如果不存在则返回 undefined
 */
export function getTaskSymbol(tasks: any[], taskIndex: number): symbol | undefined {
	const task = tasks[taskIndex];
	const taskId = task?.id as symbol | string | undefined;
	return typeof taskId === "symbol" ? taskId : undefined;
}

/**
 * 获取节点的父节点 key
 *
 * @param key - 节点 key
 * @param tree - 树数据
 * @returns 父节点 key，如果不存在则返回 undefined
 */
export function getParentKey(key: string, tree: OrganizationTreeNode[]): string | undefined {
	let parentKey: string | undefined;
	for (let i = 0; i < tree.length; i++) {
		const node = tree[i];
		if (node.children) {
			if (node.children.some((item) => item.code === key)) {
				parentKey = node.code;
			} else if (getParentKey(key, node.children)) {
				parentKey = getParentKey(key, node.children);
			}
		}
	}
	return parentKey;
}
