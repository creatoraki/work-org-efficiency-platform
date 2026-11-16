import type { FormInstance } from "antd";
import type { EditTagDraft, TagCenterItem } from "./types";
import { useCallback, useRef, useState } from "react";
import { normalizeTagDraftValues } from "./utils";

const EDITABLE_EDIT_DRAFT_FIELD_NAMES = [
	"ruleSelectionType",
	"tagRulesId",
	"tagName",
	"tagValue",
	"tagDescription",
	"aiTagDescription",
	"businessCategory",
	"isRequired",
	"sensitivityLevel",
	"existenceCycle",
	"updateFrequency",
	"auditor",
	"maintainer",
	"maintainerName",
	"maintainerType",
	"isAuditTagging",
	"auditProcessTagging",
	"isAttProofTagging",
	"attProofReqsTagging",
	"isFtfInterview",
	"ftfInterviewUpdFreq",
	"ftfInterviewer",
	"useScope",
	"tagPositionList",
	"isDisplayInOrgBrain",
	"tagVisibility",
	"tagDistributionModule",
] as const;

interface UseEditTagDraftFormParams {
	form: FormInstance;
}

/**
 * 提取编辑态允许被表单回写的字段。
 *
 * 编辑态真相源始终是 editDraft，表单只负责回传用户可编辑字段；
 * aliTagCode、aiSessionId、isExisting 等生命周期字段必须继续保留在 editDraft 中，
 * 不能被 Form store 的瞬时状态覆盖掉。
 *
 * @param source - 待提取字段的来源对象
 * @returns 仅包含可编辑字段的 patch
 *
 * @author 王善能
 * @since 2026-06-18
 */
function pickEditableEditDraftPatch(source?: Partial<TagCenterItem>) {
	if (!source) {
		return {} as Partial<TagCenterItem>;
	}

	const patch = EDITABLE_EDIT_DRAFT_FIELD_NAMES.reduce<Partial<TagCenterItem>>(
		(result, fieldName) => {
			if (Object.prototype.hasOwnProperty.call(source, fieldName)) {
				const fieldValue = source[fieldName];
				// 未挂载字段可能回传 undefined，不应覆盖 editDraft 中已有值
				if (fieldValue !== undefined) {
					(result as Record<string, unknown>)[fieldName] = fieldValue;
				}
			}
			return result;
		},
		{},
	);

	return normalizeTagDraftValues(patch);
}

/**
 * 编辑入口单标签草稿状态管理。
 *
 * 编辑态草稿必须保持为“后端详情镜像 + 用户变更 patch”，
 * 不再从新增默认模板重新起步，避免创建语义污染编辑语义。
 *
 * 智能标签生命周期字段（aliTagCode、aiSessionId）继续保留在 editDraft 真相源中；
 * hidden FormItem 只承担展示层和 Form store 同步辅助职责，不能反向主导编辑态真实值。
 *
 * @param params - hook 参数
 * @param params.form - 当前抽屉 Form 实例
 * @returns 编辑入口草稿状态与操作方法
 *
 * @author 王善能
 * @since 2026-06-18
 */
export function useEditTagDraftForm({ form }: UseEditTagDraftFormParams) {
	const [editDraft, setEditDraft] = useState<EditTagDraft | null>(null);
	const editDraftRef = useRef<EditTagDraft | null>(null);

	const applyEditDraft = useCallback(
		(draft: EditTagDraft) => {
			const normalizedDraft = normalizeTagDraftValues(draft);
			editDraftRef.current = normalizedDraft;
			setEditDraft(normalizedDraft);
			form.setFieldsValue(normalizedDraft);
			return normalizedDraft;
		},
		[form],
	);

	const syncEditDraftFromForm = useCallback(
		(baseDraft?: Partial<TagCenterItem>) => {
			const editableFormValues = pickEditableEditDraftPatch(
				form.getFieldsValue(EDITABLE_EDIT_DRAFT_FIELD_NAMES as unknown as string[]),
			);
			const editableBaseDraft = pickEditableEditDraftPatch(baseDraft);
			const nextDraft = normalizeTagDraftValues({
				...(editDraftRef.current || {}),
				...editableBaseDraft,
				...editableFormValues,
			});

			editDraftRef.current = nextDraft;
			setEditDraft(nextDraft);
			return nextDraft;
		},
		[form],
	);

	const mergeEditDraft = useCallback((patch: Partial<TagCenterItem>) => {
		setEditDraft((prevDraft) => {
			const nextDraft = normalizeTagDraftValues({
				...(prevDraft || {}),
				...patch,
			});
			editDraftRef.current = nextDraft;
			return nextDraft;
		});
	}, []);

	const resetEditDraft = useCallback(() => {
		editDraftRef.current = null;
		setEditDraft(null);
	}, []);

	return {
		editDraft,
		applyEditDraft,
		syncEditDraftFromForm,
		mergeEditDraft,
		resetEditDraft,
	};
}
