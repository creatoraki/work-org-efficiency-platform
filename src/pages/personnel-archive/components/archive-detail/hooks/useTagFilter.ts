/**
 * 标签筛选逻辑 Hook
 *
 * 负责标签筛选条件的管理和重置逻辑
 */

import { useCallback, useState } from "react";

/**
 * useTagFilter 返回值
 */
interface UseTagFilterReturn {
	/** 标签名称筛选值 */
	tagNameFilter: string;
	/** 设置标签名称筛选 */
	setTagNameFilter: (value: string) => void;
	/** 状态筛选值 */
	statusFilter: string | undefined;
	/** 设置状态筛选 */
	setStatusFilter: (value: string | undefined) => void;
	/** 重置筛选条件（同时全选标签） */
	resetFilters: () => void;
}

/**
 * 标签筛选逻辑 Hook
 *
 * @param selectAllTags - 全选标签的回调函数
 * @returns 筛选相关的状态和方法
 */
export function useTagFilter(selectAllTags: () => void): UseTagFilterReturn {
	const [tagNameFilter, setTagNameFilter] = useState<string>("");
	const [statusFilter, setStatusFilter] = useState<string | undefined>();

	/**
	 * 重置筛选条件（同时全选标签）
	 */
	const resetFilters = useCallback(() => {
		setTagNameFilter("");
		setStatusFilter(undefined);
		// 重置时全选树
		selectAllTags();
	}, [selectAllTags]);

	return {
		tagNameFilter,
		setTagNameFilter,
		statusFilter,
		setStatusFilter,
		resetFilters,
	};
}
