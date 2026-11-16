import type { FORM_MODE } from "./constants";
import type { TagFormValidationResult } from "./tag-form-schema";
import type { TagFormSubmitContext } from "./tag-form-submit";
import type { AiTagTabState, TagCenterItem } from "./types";
import { validateCreateSingleTagValues, validateUpdateTagValues } from "./tag-form-schema";
import { toEditTagSubmitPayload, toSingleTagSubmitPayload } from "./tag-form-submit";

export interface ResolveSingleTagSubmitResultParams {
	mode: FORM_MODE;
	latestDraft: TagCenterItem;
	context: TagFormSubmitContext;
}

export interface SingleTagSubmitFailureResult {
	ok: false;
	validation: TagFormValidationResult & { valid: false };
}

export interface SingleTagSubmitSuccessResult {
	ok: true;
	payload: Record<string, unknown> | Record<string, unknown>[];
	latestDraft: TagCenterItem;
	lifecycleCodeToOffline?: string;
}

export type SingleTagSubmitResult = SingleTagSubmitFailureResult | SingleTagSubmitSuccessResult;

/**
 * 解析单标签智能标签的生命周期下线 code。
 *
 * 编辑态以后端详情稳定回显的 `aliTagCode` 为第一真相源，`tagId` 仅作兜底。
 *
 * @param draft - 单标签真相源草稿
 * @returns 生命周期下线 code
 *
 * @author 王善能
 * @since 2026-06-18
 */
export function resolveSingleAiTagLifecycleCodeToOffline(draft: TagCenterItem): string | undefined {
	return typeof draft.aliTagCode === "string"
		? draft.aliTagCode
		: typeof draft.tagId === "string"
			? draft.tagId
			: undefined;
}

/**
 * 解析批量 AI 标签页签的生命周期下线 code。
 *
 * batch 场景也统一按 `aliTagCode -> tagId` 的优先级解析，
 * 保持和 single flow 相同的生命周期语义。
 *
 * @param tab - AI 标签页签状态
 * @returns 生命周期下线 code
 *
 * @author 王善能
 * @since 2026-06-18
 */
export function resolveAiTagTabLifecycleCodeToOffline(tab: AiTagTabState): string | undefined {
	return typeof tab.values.aliTagCode === "string"
		? tab.values.aliTagCode
		: typeof tab.tagId === "string"
			? tab.tagId
			: undefined;
}

/**
 * 汇总批量 AI 标签待下线的生命周期 code。
 *
 * @param tabs - AI 标签页签状态列表
 * @returns 去重后的生命周期 code 列表
 *
 * @author 王善能
 * @since 2026-06-18
 */
export function collectAiTagLifecycleCodesToOffline(tabs: AiTagTabState[]): string[] {
	return Array.from(
		new Set(
			tabs
				.map((tab) => resolveAiTagTabLifecycleCodeToOffline(tab))
				.filter((code): code is string => Boolean(code)),
		),
	);
}

/**
 * 解析单标签场景的最终提交结果。
 *
 * 该函数只负责编排单标签真相源的校验与 payload 转换：
 * - add 模式输出创建数组 body
 * - edit 模式输出更新单对象 body
 * - 同时返回需要下线的生命周期 code，供容器层统一处理副作用
 *
 * @param params - 解析参数
 * @param params.mode - 抽屉模式
 * @param params.latestDraft - 最新单标签真相源
 * @param params.context - 校验与提交转换上下文
 * @returns 单标签提交编排结果
 *
 * @author 王善能
 * @since 2026-06-18
 */
export function resolveSingleTagSubmitResult(
	params: ResolveSingleTagSubmitResultParams,
): SingleTagSubmitResult {
	const { mode, latestDraft, context } = params;
	const validation =
		mode === "edit"
			? validateUpdateTagValues(latestDraft, context)
			: validateCreateSingleTagValues(latestDraft, context);

	if (!validation.valid) {
		return {
			ok: false,
			validation,
		};
	}

	const isIntelligentTag = latestDraft.tagType === "3";
	const rawLifecycleCode = isIntelligentTag
		? resolveSingleAiTagLifecycleCodeToOffline(latestDraft)
		: typeof latestDraft.aliTagCode === "string"
			? latestDraft.aliTagCode
			: undefined;

	const singlePayload =
		mode === "edit"
			? toEditTagSubmitPayload(latestDraft, context)
			: toSingleTagSubmitPayload(latestDraft, context);

	return {
		ok: true,
		payload: mode === "edit" ? singlePayload : [singlePayload],
		latestDraft,
		lifecycleCodeToOffline: rawLifecycleCode || undefined,
	};
}
