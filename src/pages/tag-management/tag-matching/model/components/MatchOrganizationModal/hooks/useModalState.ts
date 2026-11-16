import type { OrganizationNode } from "../types";
import React from "react";

/**
 * 弹窗状态管理 Hook
 *
 * 管理匹配组织弹窗的所有内部状态，包括：
 * - 选中的节点 keys 和节点对象列表
 * - 树的展开状态
 * - 搜索关键词
 * - 快速筛选层级
 *
 * 当弹窗关闭时，自动重置所有状态
 *
 * @param open - 弹窗是否打开
 * @returns 返回所有状态和设置方法
 */
export function useModalState(open: boolean) {
	/** 选中的节点 keys */
	const [checkedKeys, setCheckedKeys] = React.useState<React.Key[]>([]);

	/** 选中的节点对象列表 */
	const [checkedNodes, setCheckedNodes] = React.useState<OrganizationNode[]>([]);

	/** 搜索关键词 */
	const [searchValue, setSearchValue] = React.useState("");

	/** 展开的节点 keys */
	const [expandedKeys, setExpandedKeys] = React.useState<React.Key[]>([]);

	/** 是否自动展开父节点 */
	const [autoExpandParent, setAutoExpandParent] = React.useState(true);

	/** 快速筛选的层级值数组 */
	const [quickFilter, setQuickFilter] = React.useState<string[]>([]);

	/**
	 * 重置所有状态
	 */
	const reset = React.useCallback(() => {
		setCheckedKeys([]);
		setCheckedNodes([]);
		setSearchValue("");
		setExpandedKeys([]);
		setAutoExpandParent(true);
		setQuickFilter([]);
	}, []);

	/**
	 * 弹窗关闭时重置状态
	 */
	React.useEffect(() => {
		if (!open) {
			reset();
		}
	}, [open, reset]);

	return {
		checkedKeys,
		setCheckedKeys,
		checkedNodes,
		setCheckedNodes,
		searchValue,
		setSearchValue,
		expandedKeys,
		setExpandedKeys,
		autoExpandParent,
		setAutoExpandParent,
		quickFilter,
		setQuickFilter,
		reset,
	};
}
