import type {
	SelfEvalData,
	SelfEvalSubmitPayload,
	SelfEvalSubmitResult,
} from "#src/api/performance-management/self-eval";

import {
	fetchSelfEvalDetail,
	saveSelfEvalDraft,
	submitSelfEval,
} from "#src/api/performance-management/self-eval";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/**
 * 自评详情查询 key
 *
 * 稳定可读，带上关键参数 todoId，接口就绪后无需改动。
 */
export function selfEvalKeys(todoId: string) {
	return ["performance-management", "self-eval", todoId] as const;
}

/**
 * 查询自评填报详情
 *
 * @param todoId - 待办标识
 * @param enabled - 是否启用查询
 * @returns 自评填报数据查询结果
 */
export function useSelfEvalDetail(todoId: string, enabled = true) {
	return useQuery<SelfEvalData>({
		queryKey: selfEvalKeys(todoId),
		queryFn: () => fetchSelfEvalDetail({ todoId }),
		enabled: enabled && Boolean(todoId),
	});
}

/**
 * 提交自评
 *
 * @returns 提交 mutation
 */
export function useSubmitSelfEval() {
	const queryClient = useQueryClient();

	return useMutation<SelfEvalSubmitResult, Error, SelfEvalSubmitPayload>({
		mutationFn: submitSelfEval,
		onSuccess: (_data, variables) => {
			// 提交后使当前待办详情查询失效；列表由页面提交成功回调刷新
			queryClient.invalidateQueries({ queryKey: selfEvalKeys(variables.todoId) });
		},
	});
}

/**
 * 暂存自评
 *
 * @returns 暂存 mutation
 */
export function useSaveSelfEvalDraft() {
	const queryClient = useQueryClient();

	return useMutation<SelfEvalSubmitResult, Error, SelfEvalSubmitPayload>({
		mutationFn: saveSelfEvalDraft,
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({ queryKey: selfEvalKeys(variables.todoId) });
		},
	});
}
