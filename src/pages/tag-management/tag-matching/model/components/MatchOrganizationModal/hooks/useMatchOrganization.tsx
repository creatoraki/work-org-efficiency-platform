import { useDict } from "#src/hooks";
import { TAG_DICT_KEYS } from "#src/pages/tag-management/config";
import React from "react";
import { useInitialization } from "./useInitialization";
import { useModalState } from "./useModalState";
import { useQuickFilter } from "./useQuickFilter";
import { useTreeData } from "./useTreeData";
import { useTreeInteraction } from "./useTreeInteraction";
import { useTreeSelection } from "./useTreeSelection";

/**
 * 匹配组织弹窗核心业务逻辑 Hook
 *
 * 该 Hook 组合了多个子 Hook，实现了以下功能：
 * 1. 弹窗状态管理（useModalState）
 * 2. 树数据处理（useTreeData）
 * 3. 初始化逻辑（useInitialization）
 * 4. 快速筛选管理（useQuickFilter）
 * 5. 树节点选择管理（useTreeSelection）
 * 6. 树交互管理（useTreeInteraction）
 *
 * @param open - 弹窗是否打开
 * @param externalTreeData - 外部传入的树数据
 * @param initialSelectedOrgId - 初始选中的组织ID（用于回显）
 * @param initialSelectedOrgLevel - 初始选中的组织层级（用于回显）
 * @returns 返回状态、数据和处理方法
 */
export function useMatchOrganization(
	open: boolean,
	externalTreeData: any,
	initialSelectedOrgId?: string | number | null,
	initialSelectedOrgLevel?: string | null,
) {
	// 1. 弹窗状态管理
	const state = useModalState(open);

	// 2. 树数据处理
	const { treeData, nodeIdMap, levelNodeMap, parentMap } = useTreeData(externalTreeData);

	// 3. 获取字典选项
	const { options: filterOptions = [] } = useDict(TAG_DICT_KEYS.ORG_LEVEL_FOR_MATCH_MODEL);

	// 4. 初始化标志
	const isInitializedRef = React.useRef(false);

	// 5. 初始化逻辑
	useInitialization(
		open,
		isInitializedRef,
		externalTreeData,
		treeData,
		initialSelectedOrgId,
		initialSelectedOrgLevel,
		nodeIdMap,
		levelNodeMap,
		parentMap,
		state.setCheckedKeys,
		state.setExpandedKeys,
		state.setAutoExpandParent,
		state.setQuickFilter,
	);

	// 6. 快速筛选管理
	const { handleQuickFilterChange, isQuickFilterChangingRef } = useQuickFilter(
		state.quickFilter,
		state.setQuickFilter,
		state.checkedKeys,
		state.setCheckedKeys,
		state.setExpandedKeys,
		state.setAutoExpandParent,
		levelNodeMap,
		parentMap,
	);

	// 7. 树交互管理（需要先计算 displayTreeData）
	const { displayTreeData, handleSearch, handleExpand, titleRender } = useTreeInteraction(
		state.searchValue,
		state.setSearchValue,
		state.setExpandedKeys,
		state.setAutoExpandParent,
		state.checkedKeys,
		treeData,
		nodeIdMap,
		parentMap,
	);

	// 8. 树节点选择管理
	const { handleTreeCheck, handleRemove } = useTreeSelection(
		open,
		isInitializedRef,
		isQuickFilterChangingRef,
		state.checkedKeys,
		state.setCheckedKeys,
		state.checkedNodes,
		state.setCheckedNodes,
		state.quickFilter,
		state.setQuickFilter,
		state.searchValue,
		displayTreeData,
		nodeIdMap,
		levelNodeMap,
		filterOptions,
	);

	return {
		...state,
		treeData,
		displayTreeData,
		quickFilterOptions: filterOptions,
		handleQuickFilterChange,
		handleTreeCheck,
		handleRemove,
		handleSearch,
		handleExpand,
		titleRender,
	};
}
