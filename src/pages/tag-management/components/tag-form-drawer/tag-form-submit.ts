import type { JobPositionTreeNode } from "#src/api/tag-management/rule-library";
import type { TAG_RULE_TYPE_DICT } from "#src/pages/tag-management/config";
import type { AiTagTabState, TagCenterItem, TagFormInteractionMode } from "./types";
import { TAG_TYPE } from "#src/pages/tag-management/config";
import { toAiTagSubmitPayload } from "./ai-tag-form-schema";
import { buildCreateTagPayload, buildUpdateTagPayload } from "./tag-form-payload";

export interface TagFormSubmitContext {
	tagLibraryType: TAG_RULE_TYPE_DICT;
	jobPositionNodeMap: Map<string, JobPositionTreeNode>;
}

/**
 * 单标签草稿转创建 payload。
 *
 * @param draft - 单标签模式真相源草稿
 * @param context - 提交转换上下文
 * @returns 单个创建 payload
 *
 * @author 王善能
 * @since 2026-06-17
 */
export function toSingleTagSubmitPayload(
	draft: TagCenterItem,
	context: TagFormSubmitContext,
): Record<string, unknown> {
	return buildCreateTagPayload(draft, context, {
		tagType:
			draft.tagType === TAG_TYPE.INTELLIGENT
				? TAG_TYPE.INTELLIGENT
				: (draft.tagType ?? TAG_TYPE.MANUAL),
	});
}

/**
 * 编辑入口单标签草稿转更新 payload。
 *
 * @param draft - 编辑态真相源草稿
 * @param context - 提交转换上下文
 * @returns 单个更新 payload
 *
 * @author 王善能
 * @since 2026-06-18
 */
export function toEditTagSubmitPayload(
	draft: TagCenterItem,
	context: TagFormSubmitContext,
): Record<string, unknown> {
	return buildUpdateTagPayload(draft, context, {
		tagType:
			draft.tagType === TAG_TYPE.INTELLIGENT
				? TAG_TYPE.INTELLIGENT
				: (draft.tagType ?? TAG_TYPE.MANUAL),
	});
}

/**
 * 新增创建场景统一生成数组 body。
 *
 * @param params - 聚合参数
 * @param params.formMode - 当前交互模式
 * @param params.singleDraft - 单标签真相源
 * @param params.batchTabs - 批量标签真相源
 * @param params.context - 提交转换上下文
 * @returns 创建接口数组 body
 *
 * @author 王善能
 * @since 2026-06-17
 */
export function toCreateTagSubmitPayloads(params: {
	formMode: TagFormInteractionMode;
	singleDraft?: TagCenterItem | null;
	batchTabs: AiTagTabState[];
	context: TagFormSubmitContext;
}): Record<string, unknown>[] {
	const { formMode, singleDraft, batchTabs, context } = params;

	if (formMode === "batch") {
		return batchTabs.map((tab) => toAiTagSubmitPayload(tab, context));
	}

	if (!singleDraft) {
		return [];
	}

	return [toSingleTagSubmitPayload(singleDraft, context)];
}
