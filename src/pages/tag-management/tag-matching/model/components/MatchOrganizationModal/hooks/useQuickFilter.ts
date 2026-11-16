import { useCallback, useRef } from "react";
import { getExpandPathsForNodes } from "../utils/treeUtils";

/**
 * 快速筛选层级管理 Hook
 *
 * @param quickFilter - 当前选中的快速筛选值
 * @param setQuickFilter - 设置快速筛选值的方法
 * @param checkedKeys - 当前选中的节点 keys
 * @param setCheckedKeys - 设置选中节点 keys 的方法
 * @param setExpandedKeys - 设置展开节点 keys 的方法
 * @param setAutoExpandParent - 设置是否自动展开父节点的方法
 * @param levelNodeMap - 层级节点映射表
 * @param parentMap - 父节点映射表
 * @returns 返回快速筛选相关的方法和状态
 */
export function useQuickFilter(
	quickFilter: string[],
	setQuickFilter: (value: string[]) => void,
	checkedKeys: React.Key[],
	setCheckedKeys: (value: React.Key[]) => void,
	setExpandedKeys: (value: React.Key[]) => void,
	setAutoExpandParent: (value: boolean) => void,
	levelNodeMap: Map<string, Set<string>>,
	parentMap: Map<string, string>,
) {
	// 标志位：防止快速筛选变化触发的 checkedKeys 更新再次触发联动
	const isQuickFilterChangingRef = useRef(false);

	/**
	 * 获取层级对应的所有节点ID
	 *
	 * @param levels - 层级值数组
	 * @returns 节点ID数组
	 */
	const getNodeIdsByLevels = useCallback(
		(levels: string[]): string[] => {
			const validIds: string[] = [];
			for (const level of levels) {
				const nodeIds = levelNodeMap.get(level);
				if (nodeIds) {
					validIds.push(...Array.from(nodeIds));
				}
			}
			return validIds;
		},
		[levelNodeMap],
	);

	/**
	 * 展开选中节点的父节点
	 *
	 * @param nodeIds - 需要展开的节点ID数组
	 */
	const expandNodesPath = useCallback(
		(nodeIds: string[]) => {
			if (nodeIds.length > 0) {
				const expandKeys = getExpandPathsForNodes(parentMap, nodeIds);
				if (expandKeys.length > 0) {
					setExpandedKeys(expandKeys);
					setAutoExpandParent(true);
				}
			}
		},
		[parentMap, setExpandedKeys, setAutoExpandParent],
	);

	/**
	 * 从 SYS 切换到标准层级
	 *
	 * @param nonSysLevels - 非 SYS 的标准层级数组
	 */
	const switchFromSysToStandardLevels = useCallback(
		(nonSysLevels: string[]) => {
			const validIds = getNodeIdsByLevels(nonSysLevels);
			setQuickFilter(nonSysLevels);
			setCheckedKeys(validIds);
			expandNodesPath(validIds);
		},
		[getNodeIdsByLevels, setQuickFilter, setCheckedKeys, expandNodesPath],
	);

	/**
	 * 处理层级增量变化
	 *
	 * @param addedLevels - 新增的层级
	 * @param removedLevels - 删除的层级
	 * @param currentCheckedKeys - 当前选中的节点 keys
	 * @returns 新的选中节点 keys
	 */
	const handleLevelChanges = useCallback(
		(
			addedLevels: string[],
			removedLevels: string[],
			currentCheckedKeys: React.Key[],
		): string[] => {
			const currentCheckedSet = new Set(currentCheckedKeys.map((k) => String(k)));

			// 添加新增层级的所有节点
			for (const level of addedLevels) {
				if (level === "SYS") {
					continue;
				}
				const nodeIds = levelNodeMap.get(level);
				if (nodeIds) {
					for (const nodeId of nodeIds) {
						currentCheckedSet.add(String(nodeId));
					}
				}
			}

			// 移除删除层级的所有节点
			for (const level of removedLevels) {
				if (level === "SYS") {
					continue;
				}
				const nodeIds = levelNodeMap.get(level);
				if (nodeIds) {
					for (const nodeId of nodeIds) {
						currentCheckedSet.delete(String(nodeId));
					}
				}
			}

			return Array.from(currentCheckedSet);
		},
		[levelNodeMap],
	);

	/**
	 * 处理快速筛选变化：左侧触发联动中间
	 *
	 * 规则：
	 * 1. 选中层级 -> 勾选中间对应 level 的所有节点
	 * 2. 取消层级 -> 取消中间对应 level 的节点勾选
	 * 3. 选择自定义 SYS -> 不自动勾选节点，只更新筛选状态（右侧影响左侧时会自动勾选或取消 SYS）
	 *
	 * @param values - 选中的层级值数组（如 ["GROUP", "FIRST", "SYS"] 等）
	 */
	const handleQuickFilterChange = useCallback(
		(values: string[]) => {
			// 设置标志，避免 useEffect 重复处理
			isQuickFilterChangingRef.current = true;

			const prevValues = quickFilter;
			const prevSet = new Set(prevValues);
			const newSet = new Set(values);

			// 过滤出在组织树中存在的层级（排除 SYS）
			const nonSysLevelsInValues = values.filter(
				(level) => level !== "SYS" && levelNodeMap.has(level),
			);
			const nonSysLevelsInPrev = prevValues.filter(
				(level) => level !== "SYS" && levelNodeMap.has(level),
			);

			// 场景1：只选择了 SYS（且之前没有选择 SYS）
			if (
				values.includes("SYS") &&
				!prevValues.includes("SYS") &&
				nonSysLevelsInValues.length === 0
			) {
				setQuickFilter(values);
				return;
			}

			// 场景2：从 SYS 切换到标准层级
			if (
				prevValues.includes("SYS") &&
				nonSysLevelsInValues.length > 0 &&
				nonSysLevelsInPrev.length === 0
			) {
				if (nonSysLevelsInValues.length > 0) {
					switchFromSysToStandardLevels(nonSysLevelsInValues);
				} else {
					setCheckedKeys([]);
					setQuickFilter(values);
				}
				isQuickFilterChangingRef.current = false;
				return;
			}

			// 场景3：全部清空
			if (values.length === 0) {
				setCheckedKeys([]);
				setQuickFilter([]);
				return;
			}

			// 场景4：只选择了 SYS（通用情况）
			if (nonSysLevelsInValues.length === 0) {
				setQuickFilter(values);
				return;
			}

			// 场景5：标准层级的增量变化
			const addedLevels = values.filter((level) => !prevSet.has(level));
			const removedLevels = prevValues.filter((level) => !newSet.has(level));

			const newCheckedKeys = handleLevelChanges(addedLevels, removedLevels, checkedKeys);

			setCheckedKeys(newCheckedKeys);
			setQuickFilter(values);

			// 展开选中节点的父节点
			expandNodesPath(newCheckedKeys);
		},
		[
			quickFilter,
			checkedKeys,
			levelNodeMap,
			setQuickFilter,
			setCheckedKeys,
			switchFromSysToStandardLevels,
			handleLevelChanges,
			expandNodesPath,
		],
	);

	return {
		handleQuickFilterChange,
		isQuickFilterChangingRef,
	};
}
