import type {
	CollaboratorRow,
	FillerPickerData,
	SubmitDetailData,
	SubmitPayload,
} from "#src/api/performance-management/submit";

import {
	fetchCollaboratorRows,
	fetchFillerPickerData,
	fetchSubmitDetail,
	saveCollaboratorRows,
	saveSubmitDraft,
	submitRating,
} from "#src/api/performance-management/submit";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/**
 * 提报查询 key
 *
 * 稳定可读，带上关键参数 todoId，接口就绪后无需改动。
 */
export function submitKeys(todoId: string) {
	return ["performance-management", "submit", todoId] as const;
}

/**
 * 查询提报详情
 *
 * @param todoId - 待办标识
 * @param enabled - 是否启用查询
 * @returns 提报详情查询结果
 */
export function useSubmitDetail(todoId: string, enabled = true) {
	return useQuery<SubmitDetailData>({
		queryKey: submitKeys(todoId),
		queryFn: () => fetchSubmitDetail({ todoId }),
		enabled: enabled && Boolean(todoId),
	});
}

/**
 * 暂存提报
 *
 * @returns 暂存 mutation
 */
export function useSaveSubmitDraft() {
	return useMutation<boolean, Error, SubmitPayload>({
		mutationFn: saveSubmitDraft,
	});
}

/**
 * 提交提报
 *
 * @returns 提交 mutation
 */
export function useSubmitRating() {
	const queryClient = useQueryClient();

	return useMutation<boolean, Error, SubmitPayload>({
		mutationFn: submitRating,
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({ queryKey: submitKeys(variables.todoId) });
		},
	});
}

/**
 * 协作人配置查询 key
 */
export function collaboratorKeys() {
	return ["performance-management", "submit", "collaborators"] as const;
}

/**
 * 查询协作人配置
 *
 * @param enabled - 是否启用查询
 * @returns 协作人配置查询结果
 */
export function useCollaboratorRows(enabled = true) {
	return useQuery<CollaboratorRow[]>({
		queryKey: collaboratorKeys(),
		queryFn: fetchCollaboratorRows,
		enabled,
	});
}

/**
 * 保存协作人配置
 *
 * @returns 保存 mutation
 */
export function useSaveCollaboratorRows() {
	const queryClient = useQueryClient();
	return useMutation<boolean, Error, CollaboratorRow[]>({
		mutationFn: saveCollaboratorRows,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: collaboratorKeys() });
		},
	});
}

/**
 * 填报人选择数据查询 key
 */
export function fillerPickerKeys() {
	return ["performance-management", "submit", "fillers"] as const;
}

/**
 * 查询填报人选择数据
 *
 * @param enabled - 是否启用查询
 * @returns 组织树、候选成员与已选成员
 */
export function useFillerPickerData(enabled = true) {
	return useQuery<FillerPickerData>({
		queryKey: fillerPickerKeys(),
		queryFn: fetchFillerPickerData,
		enabled,
	});
}
