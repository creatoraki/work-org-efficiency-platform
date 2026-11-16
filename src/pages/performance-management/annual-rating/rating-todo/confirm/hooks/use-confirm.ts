import type {
	AppealFilingDetail,
	AppealFilingPayload,
	ConfirmData,
	ConfirmSubmitPayload,
	ConfirmSubmitResult,
} from "#src/api/performance-management/confirm";

import {
	fetchAppealFilingDetail,
	fetchConfirmDetail,
	submitAppealFiling,
	submitConfirm,
} from "#src/api/performance-management/confirm";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/**
 * 确认详情查询 key
 *
 * 稳定可读，带上关键参数 todoId，接口就绪后无需改动。
 */
export function confirmKeys(todoId: string) {
	return ["performance-management", "confirm", todoId] as const;
}

/**
 * 查询确认详情
 *
 * @param todoId - 待办标识
 * @param enabled - 是否启用查询
 * @returns 确认详情查询结果
 */
export function useConfirmDetail(todoId: string, enabled = true) {
	return useQuery<ConfirmData>({
		queryKey: confirmKeys(todoId),
		queryFn: () => fetchConfirmDetail({ todoId }),
		enabled: enabled && Boolean(todoId),
	});
}

/**
 * 提交确认
 *
 * @returns 确认 mutation
 */
export function useSubmitConfirm() {
	const queryClient = useQueryClient();

	return useMutation<ConfirmSubmitResult, Error, ConfirmSubmitPayload>({
		mutationFn: submitConfirm,
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({ queryKey: confirmKeys(variables.todoId) });
		},
	});
}

/**
 * 发起申诉
 *
 * @returns 申诉 mutation
 */
export function useSubmitAppealFiling() {
	const queryClient = useQueryClient();

	return useMutation<ConfirmSubmitResult, Error, AppealFilingPayload>({
		mutationFn: submitAppealFiling,
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({ queryKey: confirmKeys(variables.todoId) });
		},
	});
}

/**
 * 申诉详情查询 key
 */
export function appealFilingDetailKeys(todoId: string, appealNo: string) {
	return ["performance-management", "appeal-filing-detail", todoId, appealNo] as const;
}

/**
 * 查询申诉详情（点击申诉编号查看）
 *
 * @param todoId - 待办标识
 * @param appealNo - 申诉流程编号
 * @param enabled - 是否启用查询
 * @returns 申诉详情查询结果
 */
export function useAppealFilingDetail(todoId: string, appealNo: string, enabled = true) {
	return useQuery<AppealFilingDetail>({
		queryKey: appealFilingDetailKeys(todoId, appealNo),
		queryFn: () => fetchAppealFilingDetail({ todoId, appealNo }),
		enabled: enabled && Boolean(todoId) && Boolean(appealNo),
	});
}
