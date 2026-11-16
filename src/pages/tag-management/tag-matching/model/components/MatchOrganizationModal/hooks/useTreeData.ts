import type { OrganizationNode } from "../types";
import { flatMap } from "lodash-es";
import React from "react";

/**
 * 树数据处理 Hook
 *
 * 将外部传入的树数据进行规范化处理，并生成多个映射表以提高查询性能：
 * - nodeIdMap：节点ID到节点对象的映射（O(1) 查询）
 * - levelNodeMap：层级到节点ID集合的映射（O(1) 查询）
 * - parentMap：子节点ID到父节点ID的映射（O(1) 查询）
 *
 * @param externalTreeData - 外部传入的树数据（支持单个对象或数组）
 * @returns 处理后的树数据和扁平化映射表
 */
export function useTreeData(externalTreeData: any): {
	/** 处理后的树数据（统一为数组格式） */
	treeData: OrganizationNode[];
	/** 节点ID映射表（key: nodeId, value: node） */
	nodeIdMap: Map<string, OrganizationNode>;
	/** 层级节点映射表（key: level, value: Set<nodeId>） */
	levelNodeMap: Map<string, Set<string>>;
	/** 父节点映射表（key: childId, value: parentId） */
	parentMap: Map<string, string>;
} {
	/**
	 * 处理后的树数据（统一为数组格式，ID统一为字符串）
	 */
	const treeData = React.useMemo(() => {
		if (!externalTreeData) {
			return [];
		}

		/**
		 * 递归处理节点，统一ID格式
		 *
		 * @param nodes - 待处理的节点数组
		 * @returns 处理后的节点数组
		 */
		const processNodes = (nodes: any[]): OrganizationNode[] => {
			return nodes.map((node) => ({
				...node,
				id: String(node.id),
				children:
					node.children && node.children.length > 0
						? processNodes(node.children)
						: undefined,
			}));
		};

		// 统一处理不同格式的输入数据
		let data: any[] = [];
		if (Array.isArray(externalTreeData)) {
			// 情况1：输入已经是数组
			data = externalTreeData;
		} else if (externalTreeData && typeof externalTreeData === "object") {
			// 情况2：输入是单个对象
			if (Array.isArray(externalTreeData.children)) {
				// 如果对象有 children 属性
				if (
					externalTreeData.name ||
					externalTreeData.title ||
					externalTreeData.label ||
					externalTreeData.id ||
					externalTreeData.key
				) {
					// 对象本身是一个有效的节点，将其作为根节点
					data = [externalTreeData];
				} else {
					// 对象只是一个容器，直接使用其 children
					data = externalTreeData.children;
				}
			} else if (Object.keys(externalTreeData).length > 0) {
				// 对象没有 children，将其作为单个节点
				data = [externalTreeData];
			}
		}

		const result = processNodes(data);
		return result;
	}, [externalTreeData]);

	/**
	 * 生成节点映射表、层级映射表和父节点映射表
	 */
	const { nodeIdMap, levelNodeMap, parentMap } = React.useMemo(() => {
		const idMap = new Map<string, OrganizationNode>();
		const levelMap = new Map<string, Set<string>>();
		const parentIdMap = new Map<string, string>();

		/**
		 * 递归扁平化树结构，并记录父子关系
		 *
		 * @param nodes - 待扁平化的节点数组
		 * @param parentId - 父节点ID（可选）
		 * @returns 扁平化后的节点数组
		 */
		const flattenTree = (nodes: OrganizationNode[], parentId?: string): OrganizationNode[] => {
			return flatMap(nodes, (node) => {
				const nodeId = String(node.id);

				// 记录父子关系
				if (parentId) {
					parentIdMap.set(nodeId, parentId);
				}

				// 递归处理子节点
				const children =
					node.children && node.children.length > 0
						? flattenTree(node.children, nodeId)
						: [];

				return [node, ...children];
			});
		};

		// 扁平化树数据
		const flatNodes = flattenTree(treeData);

		// 构建节点ID映射和层级映射
		for (const node of flatNodes) {
			const nodeId = String(node.id);

			// 添加到节点ID映射表
			idMap.set(nodeId, node);

			// 添加到层级映射表（排除禁用勾选框的节点）
			const level = node.level || "";
			if (level) {
				if (!levelMap.has(level)) {
					levelMap.set(level, new Set<string>());
				}
				// 只有可勾选的节点才加入层级映射
				if (!node.disableCheckbox) {
					levelMap.get(level)!.add(nodeId);
				}
			}
		}

		return {
			nodeIdMap: idMap,
			levelNodeMap: levelMap,
			parentMap: parentIdMap,
		};
	}, [treeData]);

	return {
		treeData,
		nodeIdMap,
		levelNodeMap,
		parentMap,
	};
}
