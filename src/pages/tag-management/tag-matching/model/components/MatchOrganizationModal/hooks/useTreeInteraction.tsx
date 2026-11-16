import type { OrganizationNode } from "../types";
import { useCallback, useMemo } from "react";
import { filterTreeData, getExpandPathsForNodes } from "../utils/treeUtils";

/**
 * 树交互管理 Hook
 *
 * 处理树的搜索、展开等交互逻辑
 *
 * @param searchValue - 搜索关键词
 * @param setSearchValue - 设置搜索关键词的方法
 * @param setExpandedKeys - 设置展开节点 keys 的方法
 * @param setAutoExpandParent - 设置是否自动展开父节点的方法
 * @param checkedKeys - 当前选中的节点 keys
 * @param treeData - 原始树数据
 * @param nodeIdMap - 节点ID映射表
 * @param parentMap - 父节点映射表
 * @returns 返回树交互相关的方法和数据
 */
export function useTreeInteraction(
	searchValue: string,
	setSearchValue: (value: string) => void,
	setExpandedKeys: (value: React.Key[]) => void,
	setAutoExpandParent: (value: boolean) => void,
	checkedKeys: React.Key[],
	treeData: OrganizationNode[],
	nodeIdMap: Map<string, OrganizationNode>,
	parentMap: Map<string, string>,
) {
	/**
	 * 过滤后的树数据（用于搜索）
	 */
	const displayTreeData = useMemo(() => {
		return filterTreeData(nodeIdMap, parentMap, treeData, searchValue);
	}, [searchValue, treeData, nodeIdMap, parentMap]);

	/**
	 * 处理搜索
	 *
	 * 功能说明：
	 * 1. 搜索时：展开所有匹配节点的父节点
	 * 2. 清空搜索时：恢复展开状态，展开选中节点的父节点
	 *
	 * @param e - 输入框变化事件
	 */
	const handleSearch = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const { value } = e.target;
			setSearchValue(value);

			// 清空搜索：恢复展开状态，展开选中节点的父节点
			if (!value) {
				if (checkedKeys.length > 0) {
					const checkedKeysStr = checkedKeys.map((k) => String(k));
					const expandKeys = getExpandPathsForNodes(parentMap, checkedKeysStr);
					if (expandKeys.length > 0) {
						setExpandedKeys(expandKeys);
						setAutoExpandParent(true);
					}
				} else {
					// 没有选中节点时，展开第一个节点
					if (treeData.length > 0) {
						setExpandedKeys([treeData[0].id]);
						setAutoExpandParent(true);
					}
				}
				return;
			}

			// 搜索时：展开所有匹配节点的父节点
			const searchLower = value.toLowerCase();
			const expandKeys = new Set<React.Key>();

			for (const [nodeId, node] of nodeIdMap.entries()) {
				const nodeName = String(node.name || "").toLowerCase();
				if (nodeName.includes(searchLower)) {
					// 展开匹配节点的所有父节点
					let parentId: string | undefined = parentMap.get(nodeId);
					while (parentId) {
						expandKeys.add(parentId);
						parentId = parentMap.get(parentId);
					}
				}
			}

			setExpandedKeys(Array.from(expandKeys));
			setAutoExpandParent(true);
		},
		[
			nodeIdMap,
			parentMap,
			checkedKeys,
			treeData,
			setSearchValue,
			setExpandedKeys,
			setAutoExpandParent,
		],
	);

	/**
	 * 处理树节点展开/收起
	 *
	 * @param keys - 展开的节点 keys 数组
	 */
	const handleExpand = useCallback(
		(keys: React.Key[]) => {
			const stringKeys = keys.map((k) => String(k));
			setExpandedKeys(stringKeys);
			setAutoExpandParent(false);
		},
		[setExpandedKeys, setAutoExpandParent],
	);

	/**
	 * 渲染树节点标题（搜索高亮）
	 *
	 * @param node - 树节点对象
	 * @returns 渲染后的标题节点
	 */
	const titleRender = useCallback(
		(node: OrganizationNode) => {
			const title = node.name || "";
			if (!searchValue) {
				return title;
			}

			const index = title.indexOf(searchValue);
			if (index > -1) {
				const before = title.substring(0, index);
				const after = title.substring(index + searchValue.length);
				return (
					<span>
						{before}
						<span className="site-tree-search-value">{searchValue}</span>
						{after}
					</span>
				);
			}
			return title;
		},
		[searchValue],
	);

	return {
		displayTreeData,
		handleSearch,
		handleExpand,
		titleRender,
	};
}
