import type { DictOption, OrganizationNode } from "../types";
import { useCallback, useEffect } from "react";
import { detectMatchedLevels, findNodesByKeys } from "../utils/treeUtils";

/**
 * 比较两个数组是否相等（元素顺序无关）
 *
 * @param a - 数组A
 * @param b - 数组B
 * @returns 是否相等
 */
function arraysEqual(a: string[], b: string[]): boolean {
	if (a.length !== b.length) {
		return false;
	}
	const aSet = new Set(a);
	const bSet = new Set(b);
	if (aSet.size !== bSet.size) {
		return false;
	}
	for (const item of aSet) {
		if (!bSet.has(item)) {
			return false;
		}
	}
	return true;
}

/**
 * 树节点选择管理 Hook
 *
 * 处理树节点的勾选、取消勾选，以及与快速筛选的联动
 *
 * @param open - 弹窗是否打开
 * @param isInitializedRef - 初始化标志 ref
 * @param isQuickFilterChangingRef - 快速筛选变化标志 ref
 * @param checkedKeys - 当前选中的节点 keys
 * @param setCheckedKeys - 设置选中节点 keys 的方法
 * @param checkedNodes - 当前选中的节点列表
 * @param setCheckedNodes - 设置选中节点列表的方法
 * @param quickFilter - 当前选中的快速筛选值
 * @param setQuickFilter - 设置快速筛选值的方法
 * @param searchValue - 搜索关键词
 * @param displayTreeData - 显示的树数据（搜索过滤后）
 * @param nodeIdMap - 节点ID映射表
 * @param levelNodeMap - 层级节点映射表
 * @param filterOptions - 筛选选项数组
 * @returns 返回树节点选择相关的方法
 */
export function useTreeSelection(
	open: boolean,
	isInitializedRef: React.MutableRefObject<boolean>,
	isQuickFilterChangingRef: React.MutableRefObject<boolean>,
	checkedKeys: React.Key[],
	setCheckedKeys: (value: React.Key[]) => void,
	checkedNodes: OrganizationNode[],
	setCheckedNodes: (value: OrganizationNode[]) => void,
	quickFilter: string[],
	setQuickFilter: (value: string[]) => void,
	searchValue: string,
	displayTreeData: OrganizationNode[],
	nodeIdMap: Map<string, OrganizationNode>,
	levelNodeMap: Map<string, Set<string>>,
	filterOptions: DictOption[],
) {
	/**
	 * 中间触发联动左侧：当 checkedKeys 变化时，自动更新 quickFilter
	 */
	useEffect(() => {
		if (!open) {
			return;
		}

		// 等待初始化完成
		if (!isInitializedRef.current) {
			return;
		}

		// 如果是由左侧 quickFilter 变化引起的 checkedKeys 变化，则不处理（避免循环）
		if (isQuickFilterChangingRef.current) {
			isQuickFilterChangingRef.current = false;
			return;
		}

		// 如果所有节点都取消勾选，清空快速筛选
		if (checkedKeys.length === 0) {
			if (quickFilter.length === 0) {
				return;
			}
			setQuickFilter([]);
			return;
		}

		// 检测当前选中的节点匹配哪些层级
		const checkedKeysStr = checkedKeys.map((k) => String(k));
		const matchedLevels = detectMatchedLevels(checkedKeysStr, filterOptions, levelNodeMap);

		// detectMatchedLevels 已经处理了所有情况：
		// - 完全匹配：返回匹配的层级数组
		// - 部分匹配：返回 ["SYS"]
		// - 没有匹配：返回空数组（异常情况）

		const currentQuickFilter = quickFilter;
		const shouldUpdate =
			matchedLevels.length > 0
				? !arraysEqual(matchedLevels, currentQuickFilter)
				: !arraysEqual(["SYS"], currentQuickFilter);

		if (shouldUpdate) {
			if (matchedLevels.length > 0) {
				setQuickFilter(matchedLevels);
			} else {
				// 异常情况：有选中的节点但没有匹配到任何层级，设置为 SYS
				setQuickFilter(["SYS"]);
			}
		}
	}, [
		open,
		checkedKeys,
		quickFilter,
		filterOptions,
		levelNodeMap,
		isInitializedRef,
		isQuickFilterChangingRef,
		setQuickFilter,
	]);

	/**
	 * 更新选中节点列表
	 */
	useEffect(() => {
		if (checkedKeys.length === 0) {
			setCheckedNodes([]);
			return;
		}

		const nodes = findNodesByKeys(nodeIdMap, checkedKeys);
		setCheckedNodes(nodes);
	}, [checkedKeys, nodeIdMap, setCheckedNodes]);

	/**
	 * 处理树节点勾选：中间触发联动左侧
	 *
	 * 联动逻辑由 useEffect 处理，这里只更新 checkedKeys
	 *
	 * @param checked - 勾选状态对象或数组
	 */
	const handleTreeCheck = useCallback(
		(checked: any) => {
			const rawCheckedKeys = checked.checked || checked;
			const newCheckedKeys: string[] = Array.isArray(rawCheckedKeys)
				? rawCheckedKeys.map((k: React.Key) => String(k))
				: [];

			let finalKeys: string[] = [];

			// 如果有搜索，需要保留隐藏节点的选中状态
			if (searchValue) {
				const visibleKeys = new Set<string>();
				const collectVisibleKeys = (nodes: OrganizationNode[]) => {
					for (const node of nodes) {
						visibleKeys.add(String(node.id));
						if (node.children && node.children.length > 0) {
							collectVisibleKeys(node.children);
						}
					}
				};
				collectVisibleKeys(displayTreeData);

				// 保留隐藏节点的选中状态
				const hiddenCheckedKeys = checkedKeys
					.map((k) => String(k))
					.filter((k) => !visibleKeys.has(k));

				finalKeys = [...hiddenCheckedKeys, ...newCheckedKeys];
			} else {
				finalKeys = newCheckedKeys;
			}

			// 只更新 checkedKeys，quickFilter 的更新由 useEffect 处理
			setCheckedKeys(finalKeys);
		},
		[checkedKeys, searchValue, displayTreeData, setCheckedKeys],
	);

	/**
	 * 处理节点移除
	 *
	 * @param key - 要移除的节点 key
	 */
	const handleRemove = useCallback(
		(key: React.Key) => {
			const keyStr = String(key);
			const newKeys = checkedKeys.filter((k) => String(k) !== keyStr);
			setCheckedKeys(newKeys);
		},
		[checkedKeys, setCheckedKeys],
	);

	return {
		handleTreeCheck,
		handleRemove,
	};
}
