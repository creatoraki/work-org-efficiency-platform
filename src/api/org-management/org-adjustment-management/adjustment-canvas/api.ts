/**
 * 组织调整画布 API
 */

import type * as Types from "./types";
import { request } from "#src/utils";

/**
 * 组织调整任务详情接口
 */
export async function fetchOrgAdjustmentTaskDetail(id: number) {
	const url = `orgadjustment/orgadjustment/${id}`;
	const resp: Types.OrgAdjustmentTaskDetailResponse = await request
		.get(url, {
			ignoreLoading: true,
			errorMessage: true,
		})
		.json();
	return resp;
}

/**
 * 获取组织调整版本详情
 */
export async function fetchOrgAdjustmentTaskVersionDetail(id: number) {
	const url = `orgadjustment/ver/${id}`;
	const resp: Types.OrgAdjustmentTaskVersionDetailResponse = await request
		.get(url, {
			ignoreLoading: true,
			errorMessage: true,
		})
		.json();
	return resp;
}

/**
 * 组织调整任务调整结果校验接口
 */
export async function checkOrgAdjustmentTask(params: Types.CheckOrgAdjustmentTaskParams) {
	const url = "orgadjustment/ver/check";
	const resp: Types.CheckOrgAdjustmentTaskResponse = await request
		.post(url, {
			json: params,
			ignoreLoading: true,
			errorMessage: true,
		})
		.json();
	return resp;
}

/**
 * 组织调整任务存档列表查询条件接口
 */
export async function getSearchOptions_6(taskId: number) {
	const url = `orgadjustment/ver/search-options/${taskId}`;
	const resp: Types.OrgAdjustmentTaskArchiveSearchOptionsResponse = await request
		.get(url, {
			ignoreLoading: true,
			errorMessage: true,
		})
		.json();
	return resp;
}

/**
 * 组织调整任务存档列表查询接口
 */
export async function fetchOrgAdjustmentTaskArchiveList(
	params: Types.OrgAdjustmentTaskArchiveListParams,
) {
	const url = "orgadjustment/ver/list";
	const resp: Types.OrgAdjustmentTaskArchiveListResponse = await request
		.post(url, {
			json: params,
			ignoreLoading: true,
			errorMessage: true,
		})
		.json();
	return resp;
}

/**
 * 组织调整任务调整结果保存接口
 */
export async function saveOrgAdjustmentTaskResult(params: Types.SaveOrgAdjustmentTaskParams) {
	const url = "orgadjustment/ver";
	const resp: Types.SaveOrgAdjustmentTaskResponse = await request
		.post(url, {
			json: params,
			ignoreLoading: true,
			errorMessage: true,
		})
		.json();
	return resp;
}

/**
 * 组织调整任务调整结果暂存接口
 */
export async function saveTempOrgAdjustmentTaskResult(params: Types.SaveOrgAdjustmentTaskParams) {
	const url = "orgadjustment/ver";
	const resp: Types.SaveOrgAdjustmentTaskResponse = await request
		.put(url, {
			json: params,
			ignoreLoading: true,
			errorMessage: true,
		})
		.json();
	return resp;
}

/**
 * 组织调整任务调整设置保存接口
 */
export async function saveSettings(
	taskId: number,
	params: Types.SaveSettingsParams,
): Promise<Types.SaveSettingsResponse> {
	const url = `orgadjustment/orgadjustment/settings/${taskId}`;
	const resp: Types.SaveSettingsResponse = await request
		.put(url, {
			json: params,
			ignoreLoading: true,
			errorMessage: true,
		})
		.json();
	return resp;
}

/**
 * 修改组织调整结果
 */
export async function updateOrgAdjustmentResult(params: Types.UpdateOrgAdjustmentResultParams) {
	const url = "orgadjustment/result";
	const resp: Types.UpdateOrgAdjustmentResultResponse = await request
		.put(url, {
			json: params,
			ignoreLoading: true,
			errorMessage: true,
		})
		.json();
	return resp;
}

/**
 * 新增组织调整结果
 */
export async function createOrgAdjustmentResult(params: Types.CreateOrgAdjustmentResultParams) {
	const url = "orgadjustment/result";
	const resp: Types.CreateOrgAdjustmentResultResponse = await request
		.post(url, {
			json: params,
			ignoreLoading: true,
			errorMessage: true,
		})
		.json();
	return resp;
}

/**
 * (分页)指标库 for 目标计划
 */
export async function pageForTargetPlan(
	params: Types.PageForTargetPlanParams,
): Promise<Types.PageForTargetPlanResponse> {
	const url = "indicator/pageForTargetPlan";
	const resp: Types.PageForTargetPlanResponse = await request
		.post(url, {
			json: params,
			ignoreLoading: true,
			errorMessage: true,
		})
		.json();
	return resp;
}

/**
 * (分页)目标计划
 */
export async function fetchTargetPlanPage(
	params: Types.TargetPlanPageParams,
): Promise<Types.TargetPlanPageResponse> {
	const url = "target/plan/page";
	const resp: Types.TargetPlanPageResponse = await request
		.post(url, {
			json: params,
			ignoreLoading: true,
			errorMessage: true,
		})
		.json();
	return resp;
}

/**
 * 影响范围测算列表
 */
export async function getComparisonOrgCalculationOfInfluenceScopeList(
	params: Types.GetComparisonOrgCalculationOfInfluenceScopeListParams,
): Promise<Types.GetComparisonOrgCalculationOfInfluenceScopeListResponse> {
	const url = "orgadjustment/result/getComparsionOrgCalculationOfInfluenceScopeList";
	const resp: Types.GetComparisonOrgCalculationOfInfluenceScopeListResponse = await request
		.post(url, {
			json: params,
			ignoreLoading: true,
			errorMessage: true,
		})
		.json();
	return resp;
}

/**
 * (list)调整设置 - 目标营收、目标利润超额值列表
 */
export async function fetchTargetPlanListOverVal(
	params: Types.TargetPlanListOverValParams,
): Promise<Types.TargetPlanListOverValResponse> {
	const url = "indicator/conf/targetPlan/listOverVal";
	const resp: Types.TargetPlanListOverValResponse = await request
		.post(url, {
			json: params,
			ignoreLoading: true,
			errorMessage: true,
		})
		.json();
	return resp;
}

/**
 * 获取组织调整结果详情（无权限）
 */
export async function fetchOrgAdjustmentResultDetail(
	taskId: number,
): Promise<Types.OrgAdjustmentResultDetailResponse> {
	const url = `orgadjustment/result/detail/${taskId}`;
	const resp: Types.OrgAdjustmentResultDetailResponse = await request
		.get(url, {
			ignoreLoading: true,
			errorMessage: true,
		})
		.json();
	return resp;
}
