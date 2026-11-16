import type { TAG_RULE_TYPE_DICT, TAG_TYPE } from "#src/pages/tag-management/config";
import type { FormInstance } from "antd";
import type { AddSingleTagDraft, TagCenterItem } from "./types";
import { useCallback, useState } from "react";
import { buildDefaultTagDraft, normalizeTagDraftValues } from "./utils";

interface UseAddSingleTagDraftFormParams {
	form: FormInstance;
	tagLibraryType: TAG_RULE_TYPE_DICT;
	initialTagType: string;
}

/**
 * 新增入口单标签草稿状态管理。
 *
 * 该 hook 只服务 add + single 场景，允许以默认模板为起点持续补齐创建字段，
 * 不承接编辑态的详情镜像语义。
 *
 * @param params - hook 参数
 * @param params.form - 当前抽屉 Form 实例
 * @param params.tagLibraryType - 标签库类型
 * @param params.initialTagType - 抽屉初始化标签类型
 * @returns 新增入口单标签草稿状态与操作方法
 *
 * @author 王善能
 * @since 2026-06-18
 */
export function useAddSingleTagDraftForm({
	form,
	tagLibraryType,
	initialTagType,
}: UseAddSingleTagDraftFormParams) {
	const [singleDraft, setSingleDraft] = useState<AddSingleTagDraft | null>(null);

	const getCurrentTagType = useCallback(() => {
		return (form.getFieldValue("tagType") || initialTagType) as TAG_TYPE;
	}, [form, initialTagType]);

	const applySingleDraft = useCallback(
		(draft: AddSingleTagDraft) => {
			const normalizedDraft = normalizeTagDraftValues(draft);
			setSingleDraft(normalizedDraft);
			form.setFieldsValue(normalizedDraft);
			return normalizedDraft;
		},
		[form],
	);

	const syncSingleDraftFromForm = useCallback(
		(baseDraft?: Partial<TagCenterItem>) => {
			const currentTagType = getCurrentTagType();
			const nextDraft = normalizeTagDraftValues({
				...buildDefaultTagDraft(tagLibraryType, currentTagType),
				...singleDraft,
				...baseDraft,
				...form.getFieldsValue(true),
				tagType: currentTagType,
			});
			setSingleDraft(nextDraft);
			return nextDraft;
		},
		[form, getCurrentTagType, singleDraft, tagLibraryType],
	);

	const mergeSingleDraft = useCallback(
		(patch: Partial<TagCenterItem>) => {
			setSingleDraft((prevDraft) =>
				normalizeTagDraftValues({
					...buildDefaultTagDraft(tagLibraryType, getCurrentTagType()),
					...prevDraft,
					...patch,
				}),
			);
		},
		[getCurrentTagType, tagLibraryType],
	);

	const resetSingleDraft = useCallback(() => {
		setSingleDraft(null);
	}, []);

	return {
		singleDraft,
		applySingleDraft,
		syncSingleDraftFromForm,
		mergeSingleDraft,
		resetSingleDraft,
	};
}
