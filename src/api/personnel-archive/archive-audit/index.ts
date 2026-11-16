/**
 * 档案审核相关API接口
 */

import type { PagedData } from "#src/utils/axios-request";
import type {
	ArchiveAuditDetailResponse,
	ArchiveAuditItem,
	ArchiveAuditListParams,
	ArchiveAuditStats,
	GetSearchOptionsData,
	PassParams,
	RefuseParams,
} from "./types";
import { request } from "#src/utils/axios-request";

// 导出类型，方便外部使用
export type {
	ArchiveAuditDetailResponse,
	ArchiveAuditItem,
	ArchiveAuditListParams,
	ArchiveAuditStats,
	GetSearchOptionsData,
	PassParams,
	RefuseParams,
} from "./types";

/**
 * 获取档案审核列表
 */
export async function fetchArchiveAuditList(
	params: ArchiveAuditListParams = {},
): Promise<PagedData<ArchiveAuditItem>> {
	const { pageNum = 1, pageSize = 20, ...restParams } = params;

	return request.post<PagedData<ArchiveAuditItem>>(
		"usertag/approval/list",
		{
			pageNum,
			pageSize,
			...restParams,
		},
		{
			showLoading: false,
		},
	);
}

/**
 * 获取档案审核详情（用于审核）
 *
 * @param userId - 用户id
 * @param approver - 审核人id，管理员时为必选；非管理员时默认为当前登陆用户，参数失效
 */
export async function fetchArchiveAuditDetail(
	userId: number,
	approver?: number,
): Promise<ArchiveAuditDetailResponse> {
	const params = approver ? { approver: String(approver) } : undefined;
	return request.get<ArchiveAuditDetailResponse>(`usertag/approval/detail/${userId}`, {
		params,
	});
}

/**
 * 审核驳回
 */
export async function refuseArchiveAudit(params: RefuseParams): Promise<string> {
	return request.post<string>("usertag/approval/refuse", params);
}

/**
 * 审核通过
 */
export async function passArchiveAudit(params: PassParams): Promise<string> {
	return request.post<string>("usertag/approval/pass", params.ids);
}

/**
 * 获取审核统计
 */
export async function fetchArchiveAuditStats(): Promise<ArchiveAuditStats> {
	return request.get<ArchiveAuditStats>("usertag/approval/count", {
		showLoading: false,
	});
}

/**
 * 获取首页下拉框查询条件
 *
 * @returns 搜索选项数据
 */
export async function getArchiveAuditSearchOptions(): Promise<GetSearchOptionsData> {
	return request.get<GetSearchOptionsData>("usertag/approval/search-options", {
		showLoading: false,
	});
}
