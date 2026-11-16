/**
 * 变更记录管理 Hook
 *
 * 管理人员档案的标签变更记录，包括：
 * 1. 初始变更记录（接口返回的历史变更）
 * 2. 实时变更记录（用户编辑表单产生的变更）
 * 3. 合并变更记录（用于展示，实时变更置顶）
 */

import type { TreeTagItem } from "#src/api/personnel-archive/archive-management";
import type { ChangeRecord } from "../sections";
import { useMemo } from "react";

/**
 * 变更记录 Hook 参数
 */
interface UseChangeRecordsParams {
	/** 初始变更记录（接口返回） */
	initialChangeRecords: ChangeRecord[];
	/** 选中的标签列表 */
	selectedTagsList: TreeTagItem[];
	/** 初始标签数据映射 */
	initLeafNodeTags: Map<string, TreeTagItem>;
	/** 表单值 */
	formValues: { tags?: Array<{ tagValue?: string }> };
	/** 是否为查看模式 */
	isViewMode: boolean;
}

/**
 * 变更记录 Hook 返回值
 */
interface UseChangeRecordsReturn {
	/** 实时变更记录（用户编辑产生） */
	realtimeChangeRecords: ChangeRecord[];
	/** 合并后的变更记录（用于展示） */
	changeRecords: ChangeRecord[];
}

/**
 * 判断值是否为空
 */
function isEmptyValue(value: string | null | undefined): boolean {
	if (!value || value === null) {
		return true;
	}
	const trimmed = String(value).trim();
	return trimmed === "" || trimmed === "空" || trimmed === "-";
}

/**
 * 变更记录管理 Hook
 */
export function useChangeRecords({
	initialChangeRecords,
	selectedTagsList,
	initLeafNodeTags,
	formValues,
	isViewMode,
}: UseChangeRecordsParams): UseChangeRecordsReturn {
	/**
	 * 选中的标签 ID 集合（用于筛选）
	 *
	 * 时间复杂度: O(n)，单次遍历
	 */
	const selectedTagIdSet = useMemo(() => {
		const set = new Set<string>();
		if (!selectedTagsList?.length) {
			return set;
		}
		for (const tag of selectedTagsList) {
			const tagId = (tag as any).tagId;
			if (tagId != null) {
				set.add(String(tagId));
			}
		}
		return set;
	}, [selectedTagsList]);

	/**
	 * 实时变更记录（仅编辑模式，用户修改的标签）
	 *
	 * 时间复杂度: O(n)，n = selectedTagsList.length
	 */
	const realtimeChangeRecords = useMemo(() => {
		// 查看模式不计算实时变更
		if (isViewMode || !selectedTagsList?.length || !formValues.tags?.length) {
			return [];
		}

		const records: ChangeRecord[] = [];
		const formTags = formValues.tags;

		for (let i = 0; i < selectedTagsList.length; i++) {
			const tag = selectedTagsList[i];
			const tagId = (tag as any).tagId;

			if (tagId == null) {
				continue;
			}

			const formTagValue = formTags[i]?.tagValue;

			// 用户未修改此字段，跳过
			if (formTagValue === undefined) {
				continue;
			}

			const tagIdStr = String(tagId);
			const initTag = initLeafNodeTags.get(tagIdStr);
			const oldValue = initTag?.tagValue ?? (initTag as any)?.oldTagValue ?? "";
			const newValue = formTagValue ?? tag.tagValue ?? "";

			// 过滤：两者都为空 或 值相同
			if (isEmptyValue(oldValue) && isEmptyValue(newValue)) {
				continue;
			}
			if (oldValue.trim() === newValue.trim()) {
				continue;
			}

			records.push({
				id: tagIdStr,
				tagName: tag.tagName,
				oldValue,
				newValue,
				tempSave: false,
			});
		}

		return records;
	}, [isViewMode, selectedTagsList, initLeafNodeTags, formValues]);

	/**
	 * 合并后的变更记录
	 *
	 * 逻辑：
	 * 1. 实时变更记录置顶
	 * 2. 未被实时修改的初始变更记录在下方
	 * 3. 支持按选中标签筛选
	 *
	 * 时间复杂度: O(r + i)，r = 实时变更数, i = 初始变更数
	 */
	const changeRecords = useMemo(() => {
		const hasFilter = selectedTagIdSet.size > 0;

		// 筛选函数：检查记录是否在选中范围内
		const isInScope = (record: ChangeRecord): boolean => {
			return !hasFilter || selectedTagIdSet.has(record.id);
		};

		// 查看模式：只显示初始变更记录
		if (isViewMode) {
			return hasFilter ? initialChangeRecords.filter(isInScope) : [...initialChangeRecords];
		}

		// 编辑模式：实时变更置顶
		const realtimeIdSet = new Set(realtimeChangeRecords.map((r) => r.id));
		const result: ChangeRecord[] = [];

		// 1. 添加实时变更记录（置顶）
		for (const record of realtimeChangeRecords) {
			if (isInScope(record)) {
				result.push(record);
			}
		}

		// 2. 添加未被实时修改的初始变更记录
		for (const record of initialChangeRecords) {
			if (!realtimeIdSet.has(record.id) && isInScope(record)) {
				result.push(record);
			}
		}

		return result;
	}, [selectedTagIdSet, initialChangeRecords, realtimeChangeRecords, isViewMode]);

	return {
		realtimeChangeRecords,
		changeRecords,
	};
}
