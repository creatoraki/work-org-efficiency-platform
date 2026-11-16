/**
 * 岗位描述审核相关API接口
 */

import type {
	JobDescAuditBatchParams,
	JobDescAuditItem,
	JobDescAuditListParams,
	JobDescAuditSearchOptions,
	JobDescAuditStatistics,
} from "#src/pages/tag-management/job-desc/audit/types";
import { request } from "#src/utils/axios-request";

/**
 * 获取岗位描述审核列表（分页查询）
 */
export async function fetchJobDescAuditList(
	params?: JobDescAuditListParams,
): Promise<PagedData<JobDescAuditItem>> {
	const { pageNum = 1, pageSize = 10, ...rest } = params || {};

	return request.get<PagedData<JobDescAuditItem>>("jobaudit", {
		params: {
			pageNum,
			pageSize,
			...rest,
		},
		showLoading: false,
	});
}

/**
 * 批量审核岗位描述
 */
export async function batchAuditJobDescAudit(data: JobDescAuditBatchParams): Promise<boolean> {
	return request.post<boolean>("jobaudit/batch/audit", data);
}

/**
 * 获取岗位描述审核统计数据
 */
export async function fetchJobDescAuditStatistics(): Promise<JobDescAuditStatistics> {
	return request.get<JobDescAuditStatistics>("jobaudit/statistics", {
		showLoading: false,
	});
}

/**
 * 获取岗位描述审核搜索下拉选项
 *
 * 获取首页下拉框查询条件：岗位名称、组织、职位、职级、提交人、审核部门、审核状态、审核人
 *
 * @returns 搜索下拉选项数据
 */
export async function fetchJobDescAuditSearchOptions(): Promise<JobDescAuditSearchOptions> {
	return request.get<JobDescAuditSearchOptions>("jobaudit/search-options", {
		showLoading: false,
	});
}
