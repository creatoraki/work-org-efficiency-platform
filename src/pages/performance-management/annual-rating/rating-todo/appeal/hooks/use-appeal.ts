import type { AppealDetailData, AppealHandleData } from "#src/api/performance-management/appeal";

import { fetchAppealDetail, fetchAppealHandleDetail } from "#src/api/performance-management/appeal";
import { useQuery } from "@tanstack/react-query";

/**
 * 申诉处理查询 key
 *
 * 稳定可读，带上关键参数 todoId，接口就绪后无需改动。
 */
export function appealKeys(todoId: string) {
	return ["performance-management", "appeal", todoId] as const;
}

/**
 * 查询申诉处理详情
 *
 * @param todoId - 待办标识
 * @param enabled - 是否启用查询
 * @returns 申诉处理数据查询结果
 */
export function useAppealHandleDetail(todoId: string, enabled = true) {
	return useQuery<AppealHandleData>({
		queryKey: appealKeys(todoId),
		queryFn: () => fetchAppealHandleDetail({ todoId }),
		enabled: enabled && Boolean(todoId),
	});
}

/**
 * 查询考评详情
 *
 * @param todoId - 待办标识
 * @param enabled - 是否启用查询
 * @returns 考评详情数据查询结果
 */
export function useAppealDetail(todoId: string, enabled = true) {
	return useQuery<AppealDetailData>({
		queryKey: [...appealKeys(todoId), "detail"],
		queryFn: () => fetchAppealDetail({ todoId }),
		enabled: enabled && Boolean(todoId),
	});
}
