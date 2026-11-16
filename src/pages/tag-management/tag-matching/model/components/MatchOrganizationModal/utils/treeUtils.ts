import type React from "react";
import type { DictOption, OrganizationNode } from "../types";

/**
 * 在树中查找指定ID的节点
 *
 * 时间复杂度：O(1)
 *
 * @param nodeIdMap - 节点ID映射表
 * @param targetId - 目标节点ID
 * @returns 找到的节点，如果不存在则返回 null
 */
export function findNodeById(
	nodeIdMap: Map<string, OrganizationNode>,
	targetId: string | number,
): OrganizationNode | null {
	const nodeId = String(targetId);
	return nodeIdMap.get(nodeId) || null;
}

/**
 * 展开到指定节点的路径
 *
 * 时间复杂度：O(h)，h 为树的高度
 *
 * @param parentMap - 父节点映射表（子节点 id -> 父节点 id）
 * @param targetId - 目标节点ID
 * @returns 展开路径数组（从根节点到目标节点的所有父节点，不包括目标节点本身）
 */
export function expandPath(parentMap: Map<string, string>, targetId: string | number): React.Key[] {
	const path: React.Key[] = [];
	const targetIdStr = String(targetId);
	let currentId: string | undefined = parentMap.get(targetIdStr);

	while (currentId) {
		path.unshift(currentId);
		currentId = parentMap.get(currentId);
	}

	return path;
}

/**
 * 获取节点的所有父节点路径（用于展开树）
 *
 * 时间复杂度：O(n * h)，n 为节点数量，h 为树的高度
 *
 * @param parentMap - 父节点映射表（子节点 id -> 父节点 id）
 * @param nodeIds - 目标节点ID数组
 * @returns 所有需要展开的父节点路径（去重）
 */
export function getExpandPathsForNodes(
	parentMap: Map<string, string>,
	nodeIds: string[],
): React.Key[] {
	const expandKeys = new Set<React.Key>();

	for (const nodeId of nodeIds) {
		const nodeIdStr = String(nodeId);
		let currentId: string | undefined = parentMap.get(nodeIdStr);

		while (currentId) {
			expandKeys.add(currentId);
			currentId = parentMap.get(currentId);
		}
	}

	return Array.from(expandKeys);
}

/**
 * 从树数据中查找节点
 *
 * 时间复杂度：O(n)，n 为 keys 数量
 *
 * @param nodeIdMap - 节点ID映射表
 * @param keys - 要查找的节点 key 数组
 * @returns 找到的节点数组
 */
export function findNodesByKeys(
	nodeIdMap: Map<string, OrganizationNode>,
	keys: React.Key[],
): OrganizationNode[] {
	const result: OrganizationNode[] = [];
	const stringKeys = new Set(keys.map((k) => String(k)));

	for (const key of stringKeys) {
		const node = nodeIdMap.get(key);
		if (node) {
			result.push(node);
		}
	}

	return result;
}

/**
 * 检测当前选中的节点是否完全匹配某个层级或多个层级，或部分匹配（返回 SYS）
 *
 * 匹配规则：
 * 1. 完全匹配单个层级：选中节点 = 该层级所有节点 → 返回该层级
 * 2. 完全匹配多个层级：选中节点 = 层级A所有节点 + 层级B所有节点 → 返回层级A和层级B
 * 3. 跨节点（部分匹配）：选中节点涉及多个层级，但不完全匹配任一层级 → 返回 ["SYS"]
 * 4. 单个层级部分匹配：选中节点只涉及一个层级，但不完全匹配 → 返回 ["SYS"]
 *
 * 时间复杂度：O(m * n)，m 为层级数量，n 为每个层级的节点数量
 *
 * @param currentCheckedKeys - 当前选中的节点ID数组
 * @param filterOptions - 筛选选项数组
 * @param levelNodeMap - 层级节点映射表（key 为 level 值，如 "GROUP"、"FIRST"、"AREA"、"PGROUP"、"PROG"、"SYS" 等）
 * @returns 匹配的层级值数组，如果部分匹配则返回 ["SYS"]
 */
export function detectMatchedLevels(
	currentCheckedKeys: string[],
	filterOptions: DictOption[],
	levelNodeMap: Map<string, Set<string>>,
): string[] {
	// 边界情况：没有选中节点或没有层级映射
	if (currentCheckedKeys.length === 0 || levelNodeMap.size === 0) {
		return [];
	}

	const checkedSet = new Set(currentCheckedKeys);
	const matchedLevels: string[] = [];
	const sysOption = filterOptions.find((opt) => opt.value === "SYS");

	// 步骤1：检测完全匹配的层级
	for (const option of filterOptions) {
		// 跳过 SYS 选项，它不参与完全匹配检测
		if (option.value === "SYS") {
			continue;
		}

		const levelNodeIds = levelNodeMap.get(option.value);

		if (!levelNodeIds || levelNodeIds.size === 0) {
			continue;
		}

		// 检查该层级的所有节点是否都被选中
		let allMatched = true;
		for (const nodeId of levelNodeIds) {
			if (!checkedSet.has(String(nodeId))) {
				allMatched = false;
				break;
			}
		}

		if (allMatched) {
			matchedLevels.push(option.value);
		}
	}

	// 步骤2：如果找到完全匹配的层级，检查是否所有选中的节点都属于这些层级
	if (matchedLevels.length > 0) {
		// 计算所有匹配层级的节点总数
		let totalMatchedNodeCount = 0;
		for (const levelValue of matchedLevels) {
			const levelNodeIds = levelNodeMap.get(levelValue);
			if (levelNodeIds) {
				totalMatchedNodeCount += levelNodeIds.size;
			}
		}

		// 如果选中的节点数量等于所有匹配层级的节点数量之和，说明完全匹配
		if (checkedSet.size === totalMatchedNodeCount) {
			return matchedLevels;
		}
	}

	// 步骤3：部分匹配 - 检测选中的节点涉及哪些层级
	const involvedLevels = new Set<string>();
	for (const checkedKey of checkedSet) {
		// 查找该节点属于哪个层级
		for (const [level, nodeIds] of levelNodeMap.entries()) {
			if (nodeIds.has(String(checkedKey))) {
				involvedLevels.add(level);
				break;
			}
		}
	}

	// 如果涉及多个层级，或者只涉及一个层级但不完全匹配，返回 SYS
	if (involvedLevels.size > 0 && sysOption) {
		return ["SYS"];
	}

	// 如果没有匹配到任何层级，返回空数组（异常情况）
	return [];
}

/**
 * 根据搜索关键词过滤树数据
 *
 * 时间复杂度：O(n * h)，n 为节点总数，h 为树的高度
 *
 * @param nodeIdMap - 节点ID映射表
 * @param parentMap - 父节点映射表
 * @param treeData - 原始树数据（用于构建树结构）
 * @param searchValue - 搜索关键词
 * @returns 过滤后的树数据
 */
export function filterTreeData(
	nodeIdMap: Map<string, OrganizationNode>,
	parentMap: Map<string, string>,
	treeData: OrganizationNode[],
	searchValue: string,
): OrganizationNode[] {
	// 无搜索关键词时直接返回原树数据
	if (!searchValue) {
		return treeData;
	}

	const searchLower = searchValue.toLowerCase();
	const matchedNodeIds = new Set<string>();

	// 步骤1：查找所有匹配的节点及其父节点路径
	for (const [nodeId, node] of nodeIdMap.entries()) {
		const nodeName = String(node.name || "").toLowerCase();
		if (nodeName.includes(searchLower)) {
			// 将匹配的节点及其所有父节点都加入集合
			matchedNodeIds.add(nodeId);
			let parentId: string | undefined = parentMap.get(nodeId);
			while (parentId) {
				matchedNodeIds.add(parentId);
				parentId = parentMap.get(parentId);
			}
		}
	}

	/**
	 * 递归构建过滤后的树结构
	 *
	 * @param nodes - 待过滤的节点列表
	 * @returns 过滤后的节点列表
	 */
	const buildFilteredTree = (nodes: OrganizationNode[]): OrganizationNode[] => {
		const result: OrganizationNode[] = [];
		for (const node of nodes) {
			const nodeId = String(node.id);
			// 只保留匹配的节点
			if (matchedNodeIds.has(nodeId)) {
				const filteredNode: OrganizationNode = { ...node };
				// 递归处理子节点
				if (node.children && node.children.length > 0) {
					const filteredChildren = buildFilteredTree(node.children);
					if (filteredChildren.length > 0) {
						filteredNode.children = filteredChildren;
					}
				}
				result.push(filteredNode);
			}
		}
		return result;
	};

	return buildFilteredTree(treeData);
}
