import type * as Types from "./types";
import { request } from "#src/utils";

// ==================== 目标确认相关 ====================

/**
 * (提交)目标确认 > 分页 > 任务名称 > 确认
 * @route POST confirm/audit/submit
 */
export async function confirmTask(data: Types.ConfirmTaskParams) {
	const url = "confirm/audit/submit";
	const resp: ApiResponse<boolean> = await request
		.post(url, {
			json: data,
			ignoreLoading: true,
			errorMessage: true,
			successMessage: true,
		})
		.json();
	return resp;
}

/**
 * (统计)目标确认
 * @route GET confirm/statistics
 */
export async function fetchTargetConfirmStatistics() {
	const url = "confirm/statistics";
	const resp: ApiResponse<Types.TargetConfirmStatisticsRes> = await request
		.get(url, {
			ignoreLoading: true,
			errorMessage: true,
		})
		.json();
	return resp;
}

/**
 * 分页查询目标确认列表
 * @route POST confirm/page
 */
export async function fetchConfirmPage(payload?: Types.ConfirmPageParams) {
	const url = "confirm/page";
	const resp: ApiListResponse<Types.ConfirmPageItem> = await request
		.post(url, {
			json: payload,
			ignoreLoading: true,
		})
		.json();
	return resp;
}

/**
 * (确认说明)目标确认 > 分页 > 任务名称
 * @route POST confirm/other/name/{effTaskSubmissionId}
 */
export async function fetchConfirmationInstructions(effTaskSubmissionId: number) {
	const url = `confirm/other/name/${effTaskSubmissionId}`;
	const resp: ApiResponse<string> = await request
		.post(url, {
			ignoreLoading: true,
		})
		.json();
	return resp;
}

// ==================== 流程跟进相关 ====================

/**
 * (统计)流程跟进
 * @route GET oaProcess/statistics
 */
export async function fetchOaProcessStatistics() {
	const url = "oaProcess/statistics";
	const resp: ApiResponse<Types.OaProcessStatisticsRes> = await request
		.post(url, {
			ignoreLoading: true,
			errorMessage: true,
		})
		.json();
	return resp;
}

/**
 * 分页获取流程跟进页面列表数据
 * @route POST oaProcess/page
 */
export async function fetchProcessList(payload?: Record<string, any>) {
	const url = "oaProcess/page";
	const resp: ApiListResponse<Types.ProcessListItem> = await request
		.post(url, {
			json: payload,
			ignoreLoading: true,
		})
		.json();
	return resp;
}

// /**
//  * (分页)流程跟进
//  * @route POST oaProcess/page
//  */
// export function page_5(params: Types.Page_5Params) {
// 	const url = "oaProcess/page";
// 	const resp: ApiListResponse<Types.OAProcessListItem> = request.post(url, { json: params }).json();
// 	return resp
// }

/**
 * (OA)目标填报 > 目标跟进 > 发起流程
 * @route POST confirm/initiate/process
 */
export async function initiateOaProcess(data: Types.InitiateOaProcessParams) {
	const url = "confirm/initiate/process";
	const resp: ApiResponse<boolean> = await request
		.post(url, {
			json: data,
			ignoreLoading: true,
			errorMessage: true,
			successMessage: "流程发起成功",
		})
		.json();
	return resp;
}

// ==================== 操作日志相关 ====================

/**
 * 获取操作日志列表
 * @route GET log/list
 */
export async function fetchOperationLogList(params: Record<string, any>) {
	const url = "log/list";
	const resp: Types.OperationLogItem[] = await request
		.get(url, {
			searchParams: params,
			ignoreLoading: true,
			errorMessage: false,
		})
		.json();
	return resp;
}

// ==================== 调整历史详情相关 ====================

/**
 * (详情 All)目标填报 > 目标跟进 > 确认流程 > 流程 > 各组织负责人目标值确认 > 数量 > 调整(下发人)
 * @route GET confirm/confirmUserIds/indicatorCount/his/adjust/all/{effTaskSubmissionId}
 */
export async function confirmUserIdsIndicatorCountHisAdjustAll(effTaskSubmissionId: number) {
	const url = `confirm/confirmUserIds/indicatorCount/his/adjust/all/${effTaskSubmissionId}`;
	const resp: Types.ConfirmUserIdsIndicatorCountHisAdjustAllRes = await request
		.get(url, {
			ignoreLoading: true,
			errorMessage: true,
		})
		.json();
	return resp;
}

/**
 * (表头)目标填报 > 目标跟进 > 确认流程 > 流程 > 各组织负责人目标值确认 > 调整 > 子周期集
 * @route POST confirm/confirmUserIds/indicatorCount/his/head/adjust
 */
export async function confirmUserIdsIndicatorCountHisHeadV1(
	params: Types.ConfirmUserIdsIndicatorCountHisHeadV1Params,
) {
	const url = "confirm/confirmUserIds/indicatorCount/his/head/adjust";
	const resp: ApiResponse<Types.ConfirmUserIdsIndicatorCountHisHeadV1Item[]> = await request
		.post(url, {
			json: params,
			ignoreLoading: true,
			errorMessage: true,
		})
		.json();
	return resp;
}
