import type { FORM_MODE } from "./constants";
import type { TagFormSubmitContext } from "./tag-form-submit";
import type { TagCenterItem, TagFormSubmitValues } from "./types";
import { resolveSingleTagSubmitResult } from "./tag-form-submit-flow";

export interface SubmitSingleTagDraftParams {
	mode: FORM_MODE;
	latestDraft: TagCenterItem;
	context: TagFormSubmitContext;
	onSubmit: (values: TagFormSubmitValues) => Promise<void>;
	onOfflineLifecycleCode?: (code: string) => Promise<void>;
}

export type SubmitSingleTagDraftResult = ReturnType<typeof resolveSingleTagSubmitResult>;

export { collectAiTagLifecycleCodesToOffline } from "./tag-form-submit-flow";

/**
 * 提交单标签草稿。
 *
 * 将单标签场景的最终出口统一收敛到这里：
 * 1. 校验并生成提交 payload
 * 2. 如有生命周期 code，先执行下线副作用
 * 3. 再 await 父层真实保存结果
 *
 * 这样 TagFormDrawer 不需要在组件内部拼装“假成功”提交流程，
 * 测试也可以直接验证最终提交出口收到的 payload 语义。
 *
 * @param params - 提交参数
 * @param params.mode - 抽屉模式
 * @param params.latestDraft - 最新单标签真相源
 * @param params.context - 校验与提交转换上下文
 * @param params.onSubmit - 父层真实保存回调
 * @param params.onOfflineLifecycleCode - 生命周期下线副作用
 * @returns 提交编排结果
 *
 * @author 王善能
 * @since 2026-06-18
 */
export async function submitSingleTagDraft(
	params: SubmitSingleTagDraftParams,
): Promise<SubmitSingleTagDraftResult> {
	const { mode, latestDraft, context, onSubmit, onOfflineLifecycleCode } = params;
	const submitResult = resolveSingleTagSubmitResult({
		mode,
		latestDraft,
		context,
	});

	if (!submitResult.ok) {
		return submitResult;
	}

	if (submitResult.lifecycleCodeToOffline) {
		await onOfflineLifecycleCode?.(submitResult.lifecycleCodeToOffline);
	}

	await onSubmit(submitResult.payload);
	return submitResult;
}
