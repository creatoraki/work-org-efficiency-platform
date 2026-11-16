/**
 * 组织审批 API
 */

import type * as Types from "./types";
import { request } from "#src/utils";

/**
 * 获取组织审批分页列表
 */
export async function fetchOrgApprovalList(
	params: Types.OrgApprovalListParams,
): Promise<Types.OrgApprovalListResponse> {
	const url = "approval/list";
	const resp: Types.OrgApprovalListResponse = await request
		.post(url, {
			json: params,
			ignoreLoading: true,
			errorMessage: true,
		})
		.json();
	return resp;
}

/**
 * 获取组织审批状态统计
 */
export async function fetchOrgApprovalStatistics(
	params: Types.OrgApprovalStatisticsParams,
): Promise<Types.OrgApprovalStatisticsResponse> {
	const url = "approval/statistics";
	const resp: Types.OrgApprovalStatisticsResponse = await request
		.post(url, {
			json: params,
			ignoreLoading: true,
			errorMessage: true,
		})
		.json();
	return resp;
}
