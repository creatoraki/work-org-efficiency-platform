/**
 * 表单值缓存 Hook
 *
 * 负责管理标签表单值的缓存，确保即使标签被取消勾选，数据也不会丢失
 */

import type { TreeTagItem } from "#src/api/personnel-archive/archive-management";
import type { FormInstance } from "antd";
import { cloneDeep, isArray, isEmpty } from "lodash-es";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * useFormCache 参数
 */
interface UseFormCacheParams {
	/** 表单实例 */
	form: FormInstance;
	/** 选中的标签列表 */
	selectedTagsList: TreeTagItem[];
	/** 是否启用表单缓存同步 */
	enabled?: boolean;
}

/**
 * useFormCache 返回值
 */
interface UseFormCacheReturn {
	/** 表单值 */
	formValues: { tags?: Array<{ tagValue?: string }> };
	/** 设置表单值 */
	setFormValues: React.Dispatch<React.SetStateAction<{ tags?: Array<{ tagValue?: string }> }>>;
	/** 保存表单值到缓存 */
	saveFormValuesToCache: () => void;
	/** 清理表单值缓存 */
	clearFormValuesCache: () => void;
	/** 设置表单值到缓存（用于外部直接设置） */
	setFormValueToCache: (tagId: string, value: { tagValue?: string; tagFileList?: any }) => void;
}

/**
 * 表单值缓存 Hook
 */
export function useFormCache({
	form,
	selectedTagsList,
	enabled = true,
}: UseFormCacheParams): UseFormCacheReturn {
	const [formValues, setFormValues] = useState<{ tags?: Array<{ tagValue?: string }> }>({});

	/**
	 * 全局表单值缓存
	 *
	 * key: tagId (string)
	 * value: { tagValue?: string, tagFileList?: any }
	 *
	 * 用于保存所有标签的表单值，即使标签被取消勾选，也要保留数据
	 * 重新勾选时，从缓存中恢复表单值
	 */
	const formValuesCacheRef = useRef<Map<string, { tagValue?: string; tagFileList?: any }>>(
		new Map(),
	);

	/**
	 * 保存上一次的 selectedTagsList，用于正确匹配表单值
	 *
	 * 当标签列表变化时，需要根据 tagId 匹配，而不是索引
	 */
	const prevSelectedTagsListRef = useRef<TreeTagItem[]>([]);

	/**
	 * 保存当前选中的标签表单值到缓存
	 *
	 * 当标签被取消勾选时，需要将表单值保存到缓存中
	 */
	const saveFormValuesToCache = useCallback(() => {
		const currentTags = form.getFieldsValue().tags ?? [];
		const prevSelectedTagsList = prevSelectedTagsListRef.current;

		// 遍历上一次选中的标签列表，将表单值保存到缓存
		for (const [index, prevTag] of prevSelectedTagsList.entries()) {
			const prevTagId = (prevTag as any).tagId;
			if (prevTagId != null && currentTags[index] != null) {
				const tagIdStr = String(prevTagId);
				const formValue = currentTags[index];
				// 只有当表单值存在时才保存到缓存
				if (formValue.tagValue !== undefined || formValue.tagFileList !== undefined) {
					formValuesCacheRef.current.set(tagIdStr, {
						tagValue: formValue.tagValue,
						tagFileList: formValue.tagFileList,
					});
				}
			}
		}
	}, [form]);

	/**
	 * 初始化表单值
	 *
	 * 仅更新新增的标签，保留用户已编辑的内容
	 * 修复：使用 tagId 匹配，而不是索引，避免标签切换时的数据错位
	 * 修复：使用全局缓存，即使标签被取消勾选，也要保留数据
	 */
	useEffect(() => {
		if (!enabled) {
			return;
		}

		// 当 selectedTagsList 变化时，先保存上一次的表单值到缓存
		if (prevSelectedTagsListRef.current.length > 0) {
			saveFormValuesToCache();
		}

		if (!selectedTagsList || selectedTagsList.length === 0) {
			form.setFieldsValue({ tags: [] });
			prevSelectedTagsListRef.current = [];
			return;
		}

		// 获取当前表单值，保留用户已编辑的内容
		const currentTags = form.getFieldsValue().tags ?? [];
		const prevSelectedTagsList = prevSelectedTagsListRef.current;

		// 根据 tagId 建立映射，而不是根据索引
		// 这样可以避免标签顺序变化或标签列表变化时的数据错位
		const currentFormMap = new Map<string, { tagValue?: string; tagFileList?: any }>();
		if (prevSelectedTagsList.length > 0 && currentTags.length > 0) {
			// 遍历上一次的标签列表，根据 tagId 建立映射
			for (const [index, prevTag] of prevSelectedTagsList.entries()) {
				const prevTagId = (prevTag as any).tagId;
				if (prevTagId != null && currentTags[index] != null) {
					currentFormMap.set(String(prevTagId), currentTags[index]);
				}
			}
		}

		// 处理文件列表：使用 lodash 工具函数确保正确转换为数组格式
		const initialValues: { tags: Array<{ tagValue: string; tagFileList?: any }> } = {
			tags: selectedTagsList.map((tag) => {
				const tagId = (tag as any).tagId;
				const tagIdStr = tagId != null ? String(tagId) : null;

				// 处理 tagFileList：使用 lodash 工具函数确保正确转换为数组格式
				let initialFileList: any[] = [];
				if (tag.tagFileList) {
					if (isArray(tag.tagFileList)) {
						initialFileList = cloneDeep(tag.tagFileList);
					} else if (typeof tag.tagFileList === "object" && tag.tagFileList !== null) {
						initialFileList = [cloneDeep(tag.tagFileList)];
					}
				}

				// 获取接口返回的初始值
				const initialTagValue = tag.tagValue ?? "";
				const initialTagFileList = !isEmpty(initialFileList) ? initialFileList : undefined;

				// 优先从当前表单值中获取（如果标签还在选中列表中）
				let existingValue = tagIdStr ? currentFormMap.get(tagIdStr) : null;

				// 如果当前表单值中没有，从全局缓存中获取
				if (!existingValue && tagIdStr) {
					existingValue = formValuesCacheRef.current.get(tagIdStr);
				}

				// 如果有缓存值，使用缓存值，但空字符串时回退到接口数据
				if (existingValue) {
					// tagValue: 如果缓存值是空字符串且接口有值，使用接口值
					const cachedTagValue = existingValue.tagValue;
					const finalTagValue =
						cachedTagValue === "" && initialTagValue !== ""
							? initialTagValue
							: (cachedTagValue ?? initialTagValue);

					return {
						tagValue: finalTagValue,
						tagFileList: existingValue.tagFileList ?? initialTagFileList,
					};
				}

				// 使用标签的初始值
				return {
					tagValue: initialTagValue,
					tagFileList: initialTagFileList,
				};
			}),
		};
		form.setFieldsValue(initialValues);

		// 更新上一次的标签列表引用
		prevSelectedTagsListRef.current = selectedTagsList;
	}, [enabled, selectedTagsList, form, saveFormValuesToCache]);

	/**
	 * 清理表单值缓存
	 */
	const clearFormValuesCache = useCallback(() => {
		formValuesCacheRef.current.clear();
		prevSelectedTagsListRef.current = [];
		setFormValues({});
	}, []);

	/**
	 * 设置表单值到缓存（用于外部直接设置）
	 */
	const setFormValueToCache = useCallback(
		(tagId: string, value: { tagValue?: string; tagFileList?: any }) => {
			formValuesCacheRef.current.set(tagId, value);
		},
		[],
	);

	return {
		formValues,
		setFormValues,
		saveFormValuesToCache,
		clearFormValuesCache,
		setFormValueToCache,
	};
}
