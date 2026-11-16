import type * as Types from "./types";
import { request } from "#src/utils";

export async function fetchSubmitUserPage(
	params: Types.SubmitUserTaskListParams,
): Promise<ApiResponse<Types.SubmitUserTaskListRes>> {
	return request.post("indicator/submit/user/page", { json: params }).json();
}

// (统计)目标填报
export async function fetchSubmitUserStatistics(params?: Record<string, any>) {
	const url = "indicator/submit/user/statistics";
	try {
		const resp: any = await request
			.get(url, { searchParams: params, ignoreLoading: true })
			.json();
		if (!resp) return { exists: false };
		return resp.data ?? resp;
	} catch (e) {
		console.error("checkPlanName failed", e);
		return { exists: false };
	}
}

// (列表)目标填报>变动提醒
export async function noticeChange(subUserId: number) {
	const url = `indicator/submit/notice/change/${subUserId}`;
	const resp: Types.NoticeChangeRes = await request.get(url, { ignoreLoading: true }).json();
	return resp;
}

// (统计)目标填报>变动提醒
export async function noticeChangeCount(subUserId: number) {
	const url = `indicator/submit/notice/change/count/${subUserId}`;
	const resp: Types.NoticeChangeCountRes = await request.get(url, { ignoreLoading: true }).json();
	return resp;
}

// (变更)目标填报>变动提醒
export async function noticeChangeUp(subUserId: number) {
	const url = `indicator/submit/notice/change/${subUserId}`;
	const resp: Types.NoticeChangeUpRes = await request.put(url, { ignoreLoading: true }).json();
	return resp;
}

// (左边树)目标填报>填报
export async function fetchSubmitUserIndicatorTree(effTaskIndicatorSubmitUserId: number | string) {
	const url = `indicator/submit/user/indicator/tree/${effTaskIndicatorSubmitUserId}`;
	try {
		const resp: ApiResponse<Types.UserIndicatorTreeRes[]> = await request
			.get(url, { ignoreLoading: true })
			.json();
		if (!resp) return [];
		return resp.data ?? resp;
	} catch (e) {
		console.error("fetchSubmitUserIndicatorTree failed", e);
		return [];
	}
}

// (右边树)目标填报>全部指标>总
export async function fetchSubmitUserIndicatorDetail(
	effTaskIndicatorSubmitUserId: number | string,
	params?: Record<string, any>,
) {
	const url = `indicator/submit/user/indicator/detail/${effTaskIndicatorSubmitUserId}`;
	try {
		const resp: ApiResponse<Types.ListOverviewTreeMData> = await request
			.get(url, { searchParams: params, ignoreLoading: true })
			.json();
		return resp;
	} catch (e) {
		console.error("fetchSubmitUserIndicatorDetail failed", e);
		return { data: [], total: 0 };
	}
}

// (树)目标填报>拆解子目标>获取指定节点下树结构
export async function fetchSubmitUserIndicatorDisassembleSubTree(params: {
	effTaskIndicatorSubmitUserId: number | string;
	targetOrgCode: string;
}) {
	const url = "indicator/submit/user/indicator/detail/disassembleSub/tree";
	const resp: ApiResponse<Types.UserIndicatorDetailDisassembleSubTreeItem> = await request
		.get(url, { searchParams: params, ignoreLoading: true })
		.json();
	return resp;
}

// (新增)目标填报>全部指标>总>拆解子目标
export async function submitSubmitUserIndicatorDisassembleSub(data: {
	effTaskIndicatorSubmitUserId: number | string;
	targetOrgConfig: Record<string, { targetOrgName: string; fullRoadStrength: string }>;
}) {
	const url = "indicator/submit/user/indicator/detail/disassembleSub";
	try {
		const resp: any = await request
			.post(url, {
				json: data,
				ignoreLoading: true,
			})
			.json();
		return resp;
	} catch (e) {
		console.error("submitSubmitUserIndicatorDisassembleSub failed", e);
		return { success: false };
	}
}

// (分页)目标填报>填报>子
export async function fetchSubmitUserIndicatorPageChild(
	payload?: Types.UserIndicatorDetailDisassembleChildParams,
) {
	const url = "indicator/submit/user/indicator/page/child";
	try {
		const resp: ApiResponse<Types.UserIndicatorDetailDisassembleChildRes> = await request
			.post(url, { json: payload, ignoreLoading: true })
			.json();
		return resp;
	} catch (e) {
		console.error("fetchSubmitUserIndicatorPageChild failed", e);
		return { data: [], total: 0 };
	}
}

// (提交)指标配置>提交
export async function submitIndicatorConfSubmit(effTaskIndicatorConfId: number | string) {
	const url = `indicator/conf/submit/${effTaskIndicatorConfId}`;
	try {
		const resp: any = await request
			.put(url, { ignoreLoading: true, successMessage: true, errorMessage: true })
			.json();
		return resp;
	} catch (e) {
		console.error("submitIndicatorConfSubmit failed", e);
		return { success: false };
	}
}

// (额外详情)目标填报>填报>子(维护表头信息)
export async function fetchSubmitUserIndicatorPageChildTable(id: number | string) {
	const url = `indicator/submit/user/indicator/page/child/table/${id}`;
	try {
		const resp: any = await request.get(url, { ignoreLoading: true }).json();
		return resp;
	} catch (e) {
		console.error("fetchSubmitUserIndicatorPageChildTable failed", e);
		return {};
	}
}

export async function fetchSubmitUserIndicatorDetailUpperRight(id: number | string) {
	const url = `indicator/submit/user/indicator/child/upperRight/${id}`;
	try {
		const resp: ApiResponse<Types.IndicatorDetailUpperRight> = await request
			.get(url, { ignoreLoading: true })
			.json();
		return resp;
	} catch (e) {
		console.error("fetchSubmitUserIndicatorDetailUpperRight failed", e);
		return {};
	}
}

export async function submitSubmitUserIndicatorChild(data: {
	id: number | string;
	responsiblePersonId?: number | string;
	responsiblePersonCode?: string;
	remarks?: string;
	parentSummaryWeight?: number;
}) {
	const url = "indicator/submit/user/indicator/child";
	try {
		const resp: any = await request
			.put(url, {
				json: data,
				ignoreLoading: true,
				errorMessage: true,
			})
			.json();
		return resp;
	} catch (e) {
		console.error("submitSubmitUserIndicatorChild failed", e);
		return { success: false };
	}
}

export async function submitSubmitUserIndicatorBasic(data: { id: number | string; value: number }) {
	const url = "indicator/submit/user/indicator/basic";
	try {
		const resp: any = await request
			.put(url, {
				json: data,
				ignoreLoading: true,
			})
			.json();
		return resp;
	} catch (e) {
		console.error("submitSubmitUserIndicatorBasic failed", e);
		return { success: false };
	}
}

export async function submitSubmitUserIndicatorAnnualTargetValue(data: {
	id: number | string;
	value: number | null;
	childFlag?: boolean;
}) {
	const url = "indicator/submit/user/indicator/annualTargetValue";
	const resp: ApiResponse<Types.SubmitUserIndicatorAnnualTargetValueRes> = await request
		.put(url, {
			json: data,
			ignoreLoading: true,
		})
		.json();
	return resp;
}

// (修改)目标填报>填报>周期值
export async function submitSubmitUserIndicatorPeriod(data: {
	id: number | string;
	value: number | null;
}) {
	const url = "indicator/submit/user/indicator/period";
	try {
		const resp: any = await request
			.put(url, {
				json: data,
				ignoreLoading: true,
			})
			.json();
		return resp;
	} catch (e) {
		console.error("submitSubmitUserIndicatorPeriod failed", e);
		return { success: false };
	}
}

// (修改)目标填报>填报>基础指标
export async function submitSubmitUserIndicatorBasicChange(data: {
	id: number | string;
	value: number;
}) {
	const url = "indicator/submit/user/indicator/basic";
	try {
		const resp: any = await request
			.put(url, {
				json: data,
				ignoreLoading: true,
			})
			.json();
		return resp;
	} catch (e) {
		console.error("submitSubmitUserIndicatorBasic failed", e);
		return { success: false };
	}
}

export async function fetchSubmitIndicators(params?: Record<string, any>) {
	const url = `indicator/submit/user/indicator/tree/submitIndicators/${params?.effTaskIndicatorSubmitUserId}`;
	try {
		const resp: ApiResponse<Types.UserIndicatorTreeSubmitIndicatorsItem> = await request
			.get(url, { ignoreLoading: true })
			.json();
		if (!resp) return [];
		return resp.data ?? resp;
	} catch (e) {
		console.error("fetchSubmitIndicators failed", e);
		return [];
	}
}

export async function fetchDataDimOepOrg(params?: Record<string, any>) {
	const url = `dataDimOepOrg/list/${params?.quickFilterId}`;
	try {
		const resp: any = await request.post(url, { json: params, ignoreLoading: true }).json();
		if (!resp) return [];
		return resp.data ?? resp;
	} catch (e) {
		console.error("fetchReferenceTargetOrg failed", e);
		return [];
	}
}

export async function fetchTargetDisassembleConfirmList(payload?: Record<string, any>) {
	const url = "targetdisassemble/confirm/list";
	try {
		const resp: any = await request.post(url, { json: payload, ignoreLoading: true }).json();
		if (!resp) return { data: [], total: 0 };
		if (Array.isArray(resp.data))
			return { data: resp.data, total: resp.total ?? resp.data.length ?? 0 };
		if (resp.data && Array.isArray(resp.data.list))
			return { data: resp.data.list, total: resp.data.total ?? 0 };
		return { data: [], total: 0 };
	} catch (e) {
		console.error("fetchTargetDisassembleConfirmList failed", e);
		return { data: [], total: 0 };
	}
}

export async function submitUserIndicatorChildCheck(
	effTaskIndicatorSubmitIndicatorListId: number | string,
	gapReason?: any,
) {
	const url = "indicator/submit/user/indicator/child/check";
	try {
		const resp: any = await request
			.post(url, {
				json: {
					indicatorSubmitIndicatorListId: effTaskIndicatorSubmitIndicatorListId,
					gapReason,
				},
				ignoreLoading: true,
				successMessage: "校验成功",
				errorMessage: true,
			})
			.json();
		if (!resp) return {};
		return resp.data ?? resp;
	} catch (e) {
		console.error("fetchSubmitUserIndicatorChildCheck failed", e);
		return {};
	}
}

// (分页)目标填报>填报>提交>数据量>未提交记录
export async function fetchSubmitUserIndicatorPageChildNotSubmitted(payload?: Record<string, any>) {
	const url = "indicator/submit/user/indicator/list/child/notSubmitted";
	try {
		const resp: any = await request.post(url, { json: payload, ignoreLoading: true }).json();
		return resp;
	} catch (e) {
		console.error("fetchSubmitUserIndicatorPageChildNotSubmitted failed", e);
		return { data: [], total: 0 };
	}
}

// (列表)目标填报>填报>子(前置双算记录)
export async function fetchSubmitUserIndicatorListChildDoubleCounting(
	params: Types.UserIndicatorListChildDoubleCountingParams,
) {
	const url = "indicator/submit/user/indicator/list/child/doubleCounting";
	try {
		const resp: ApiResponse<Types.UserIndicatorListChildDoubleCountingRes> = await request
			.post(url, { json: { ...params, pageSize: 100, pageNum: 1 }, ignoreLoading: true })
			.json();
		return resp;
	} catch (e) {
		console.error("fetchSubmitUserIndicatorListChildDoubleCounting failed", e);
		return { data: [] };
	}
}

export async function fetchConfirmSubmitVersion(effTaskIndicatorSubmitUserId: number | string) {
	const url = `confirm/submitVersion/${effTaskIndicatorSubmitUserId}`;
	try {
		const resp: any = await request.get(url, { ignoreLoading: true }).json();
		if (!resp) return {};
		return resp;
	} catch (e) {
		console.error("fetchConfirmSubmitVersion failed", e);
		return {};
	}
}

// (列表)目标填报>填报>提交>确认周期
export async function fetchConfirmConfirmationCycle(payload?: Record<string, any>) {
	const url = "confirm/confirmationCycle";
	try {
		const resp: any = await request.post(url, { json: payload, ignoreLoading: true }).json();
		return resp;
	} catch (e) {
		console.error("fetchConfirmConfirmationCycle failed", e);
		return { data: [], total: 0 };
	}
}

// (流程)目标填报>填报>提交>确认流程
export async function fetchSubmitConfirmUserIds(payload?: Record<string, any>) {
	const url = "confirm/confirmUserIds";
	try {
		const resp: any = await request
			.post(url, {
				json: payload,
				ignoreLoading: true,
			})
			.json();
		return resp;
	} catch (e) {
		console.error("submitConfirmUserIds failed", e);
		return { success: false };
	}
}

// (提交)目标填报>填报
export async function submitConfirmSubmit(payload: Types.ConfirmSubmitParams) {
	const url = "confirm/submit";
	try {
		const resp: ApiResponse<boolean> = await request
			.post(url, {
				json: payload,
				ignoreLoading: true,
			})
			.json();
		return resp;
	} catch (e) {
		console.error("submitConfirmSubmit failed", e);
		return { code: -1, msg: "提交失败", data: false } as ApiResponse<boolean>;
	}
}

// (中止)目标填报>提交任务
export async function abortSubmission(submissionId: number | string) {
	const url = `submission/${submissionId}/abort`;
	const resp: ApiResponse<boolean> = await request
		.post(url, {
			ignoreLoading: true,
			errorMessage: true,
			successMessage: true,
		})
		.json();
	return resp;
}

export async function fetchConfirmUserIdsPage(payload?: Record<string, any>) {
	const url = "confirm/confirmUserIds/page";
	try {
		const resp: any = await request.post(url, { json: payload, ignoreLoading: true }).json();
		return resp;
	} catch (e) {
		console.error("fetchConfirmUserIdsPage failed", e);
		return { data: [], total: 0 };
	}
}

export async function fetchConfirmTargetFollowUpVersion(
	effTaskIndicatorSubmitUserId: number | string,
) {
	const url = `confirm/targetFollowUp/version/${effTaskIndicatorSubmitUserId}`;
	const resp: ApiResponse<Record<string, unknown>[]> = await request
		.get(url, { ignoreLoading: true })
		.json();
	return resp;
}

// (详情)目标填报>目标跟进
export async function fetchConfirmTargetFollowUp(params: {
	effTaskIndicatorSubmitUserId: number | string;
	submitVersion: string;
}) {
	const url = "confirm/targetFollowUp";
	try {
		const resp: ApiResponse<Types.TargetFollowUpRes> = await request
			.get(url, { searchParams: params, ignoreLoading: true })
			.json();
		if (!resp) return {};
		return resp;
	} catch (e) {
		console.error("fetchConfirmTargetFollowUp failed", e);
		return {};
	}
}

// (分页)目标填报>目标跟进>各负责人目标值确认
export async function fetchConfirmTargetFollowUpConfirmed(
	payload?: Types.TargetFollowUpConfirmedParams,
) {
	const url = "confirm/targetFollowUp/confirmed";
	try {
		const resp: ApiListResponse<Types.TargetFollowUpConfirmedResponseItem> = await request
			.post(url, { json: payload, ignoreLoading: true })
			.json();
		return resp;
	} catch (e) {
		console.error("fetchConfirmTargetFollowUpConfirmed failed", e);
		return { data: [], total: 0 };
	}
}

export async function submitTargetDisassembleConfirmConfirm(payload?: Record<string, any>) {
	const url = `targetdisassemble/confirm/confirm/${payload?.taskId}`;
	try {
		const resp: any = await request
			.post(url, {
				json: payload,
				ignoreLoading: true,
			})
			.json();
		return resp;
	} catch (e) {
		console.error("submitTargetDisassembleConfirmConfirm failed", e);
		return { success: false };
	}
}

export async function fetchConfirmPageName(payload?: Record<string, any>) {
	const url = "confirm/page/name";
	const resp: ApiResponse<Types.HisPageRes> = await request
		.post(url, { json: payload, ignoreLoading: true })
		.json();
	return resp;
}

// (表头)目标确认>分页>任务名称
export async function fetchConfirmPageNameHead(effStepConfirmationRecordId: number | string) {
	const url = `confirm/page/name/head/${effStepConfirmationRecordId}`;
	const resp: ApiResponse<
		{
			/* id */
			id: number;
			/* 名称 */
			name: string;
		}[]
	> = await request
		.post(url, {
			ignoreLoading: true,
		})
		.json();
	return resp;
}

// (删除)目标填报>填报>总
export async function deleteChildIndicator(data: {
	targetOrgCodes: string[];
	effTaskIndicatorSubmitUserId: number;
}) {
	const url = "indicator/submit/user/indicator/child/del";
	const resp: ApiResponse<boolean> = await request
		.put(url, {
			json: data,
			ignoreLoading: true,
			successMessage: "删除成功",
			errorMessage: true,
		})
		.json();
	return resp;
}

// (详情)目标填报>填报>子>(汇总)目标填报>填报>子
export async function fetchChildIndicatorSummary(id: number | string) {
	const url = `indicator/submit/user/indicator/child/summary/${id}`;
	const resp: ApiResponse<Types.ChildIndicatorSummary> = await request
		.get(url, {
			ignoreLoading: true,
			errorMessage: true,
		})
		.json();
	return resp;
}

// (列表)目标填报>查看数据
export async function fetchIndicatorSubmitUserViewData(data: {
	effTaskIndicatorSubmitUserId: number | string;
	targetOrgCode: string;
	effTaskIndicatorSubmitIndicatorListId: number | string;
	responsibleUserName?: string;
}) {
	const url = "indicator/submit/submitUser/viewData";
	const resp: ApiListResponse<Types.IndicatorSubmitUserViewDataResponse> = await request
		.post(url, {
			json: data,
			ignoreLoading: true,
			errorMessage: true,
		})
		.json();
	return resp;
}

// (表头)目标填报>查看数据>表头
export async function fetchIndicatorSubmitUserViewDataHead(data: {
	effTaskIndicatorSubmitUserId: number | string;
	targetOrgCode: string;
	effTaskIndicatorSubmitIndicatorListId: number | string;
	responsibleUserName?: string;
}) {
	const url = "indicator/submit/submitUser/viewData/head";
	const resp: ApiResponse<Types.IndicatorSubmitUserViewDataHeadResponse> = await request
		.post(url, {
			json: data,
			ignoreLoading: true,
			errorMessage: false,
		})
		.json();
	return resp;
}

// (列表)目标填报>查看数据>指标名称
export async function fetchIndicatorSubmitUserViewDataIndicatorName(data: {
	effTaskIndicatorSubmitUserId: number | string;
}) {
	const url = `indicator/submit/submitUser/viewData/indicatorName/${data.effTaskIndicatorSubmitUserId}`;
	const resp: ApiResponse<Record<string, string>> = await request
		.post(url, {
			json: data,
			ignoreLoading: true,
		})
		.json();
	return resp;
}

/**
 * (统计)目标填报>目标跟进>各负责人目标值确认
 * @param {object} params (统计)目标填报>目标跟进>各负责人目标值确认--query
 * @param {number} params.effTaskSubmissionId 提交任务id
 * @param {number} params.step 步骤
 * @returns 结果
 */
export async function targetFollowUpConfirmedStatistics(
	params: Types.TargetFollowUpConfirmedStatisticsParams,
) {
	const url = "confirm/targetFollowUp/confirmed/statistics";
	const resp: ApiResponse<Types.TargetFollowUpConfirmedStatisticsRes> = await request
		.post(url, {
			json: params,
			ignoreLoading: true,
		})
		.json();

	return resp;
}

/**
 * (分页)目标填报>填报>提交>确认流程>流程>各组织负责人目标值确认>数量>确认指标数
 * @param {object} params 目标填报>填报>提交>确认流程>流程(各组织负责人目标值确认)-query
 * @param {number} params.pageNum 页码(不能为空)
 * @param {number} params.pageSize 每页数量(不能为空)
 * @param {boolean} params.searchCount 是否查询总条数
 * @param {Array} params.sortItemList 排序字段集合
 * @param {Array} params.indicatorListOverviewIds 填报任务ids
 * @param {Array} params.subperiods 子周期codes
 * @returns 结果
 */
export function confirmUserIdsIndicatorCountPage(
	params: Types.ConfirmUserIdsIndicatorCountPageParams,
) {
	const url = "confirm/confirmUserIds/indicatorCount/page";
	const resp: Promise<PagedData<Types.ConfirmUserIdsIndicatorCount>> = request
		.post(url, {
			json: params,
			ignoreLoading: true,
		})
		.json();

	return resp;
}

/**
 * (分页)目标填报>目标跟进>确认流程>流程>各组织负责人目标值确认>数量>确认指标数
 * @param {object} params (列表)目标填报>目标跟进>确认流程>流程>各组织负责人目标值确认>数量>确认指标数-query
 * @param {number} params.effTaskSubmissionId 提交任务id
 * @param {string} params.targetOrgCode 拆解对象code
 * @param {number} params.responsiblePersonId 确认人id
 * @returns 结果
 */
export function confirmUserIdsIndicatorCountHisPage(
	params: Types.ConfirmUserIdsIndicatorCountHisPageParams,
) {
	const url = "confirm/confirmUserIds/indicatorCount/his/list";
	const resp: Promise<ApiListResponse<Types.ConfirmUserIdsIndicatorCountHisPageItem>> = request
		.post(url, {
			json: params,
			ignoreLoading: true,
		})
		.json();
	return resp;
}

// (表头)目标填报>目标跟进>确认流程>流程>各组织负责人目标值确认>数量>确认指标数(周期)
export async function fetchConfirmUserIdsIndicatorCountHisHead(
	effTaskSubmissionId: number | string,
) {
	const url = `confirm/confirmUserIds/indicatorCount/his/head/${effTaskSubmissionId}`;
	const resp: ApiResponse<Types.ConfirmUserIdsIndicatorCountHisHeadItem[]> = await request
		.post(url, { ignoreLoading: true })
		.json();
	return resp;
}

/**
 * (调整)目标填报>目标跟进>确认流程>流程>各组织负责人目标值确认>数量>确认指标数
 * @param {object} params (调整)目标填报>目标跟进>确认流程>流程>各组织负责人目标值确认>数量>确认指标数-query
 * @param {number} params.effTaskSubmissionId 提交任务id
 * @param {string} params.targetOrgCode 拆解对象code
 * @param {number} params.responsiblePersonId 确认人id
 * @returns 结果
 */
export function confirmUserIdsIndicatorCountHisAdjust(
	params: Types.ConfirmUserIdsIndicatorCountHisAdjustParams,
) {
	const url = "confirm/confirmUserIds/indicatorCount/his/adjust";
	const resp: Promise<ApiResponse<Types.ConfirmUserIdsIndicatorCountHisAdjustRes>> = request
		.post(url, {
			json: params,
			ignoreLoading: true,
		})
		.json();
	return resp;
}

// (保存)目标填报>目标跟进>确认流程>流程>各组织负责人目标值确认>数量>确认指标数(调整)
export async function submitConfirmUserIdsIndicatorCountHisAdjustPut(
	data: Types.ConfirmUserIdsIndicatorCountHisAdjustPutParams,
) {
	const url = "confirm/confirmUserIds/indicatorCount/his/adjust";
	const resp: Types.ConfirmUserIdsIndicatorCountHisAdjustPutRes = await request
		.put(url, {
			json: data,
			ignoreLoading: true,
			successMessage: "保存成功",
			errorMessage: true,
		})
		.json();
	return resp;
}

// (详情)目标填报>填报>基础指标
export async function fetchSubmitUserIndicatorBasicDetails(
	effTaskIndicatorSubmitIndicatorListOverviewId: number | string,
) {
	const url = `indicator/submit/user/indicator/basic/details/${effTaskIndicatorSubmitIndicatorListOverviewId}`;
	const resp: ApiResponse<Types.UserIndicatorBasicDetailsResData> = await request
		.get(url, { ignoreLoading: true, errorMessage: true })
		.json();
	return resp;
}

// (计算)目标填报>填报>基础指标(特殊) 浮动指标
export async function submitUserIndicatorSpecialCal(params: Types.UserIndicatorSpecialCalParams) {
	const url = "indicator/submit/user/indicator/special/cal";
	const resp: ApiResponse<number> = await request
		.post(url, {
			json: params,
			ignoreLoading: true,
		})
		.json();
	return resp;
}

// (计算)目标填报>填报>基础指标
export async function submitUserIndicatorBasicCal(data: Types.UserIndicatorBasicCalParams[]) {
	const url = "indicator/submit/user/indicator/basic/cal";
	const resp: ApiResponse<number> = await request
		.post(url, {
			json: data,
			ignoreLoading: true,
		})
		.json();
	return resp;
}

// (计算)目标填报>填报>参考值
export async function userIndicatorCal(params: Types.UserIndicatorCalParams) {
	const url = "indicator/submit/user/indicator/cal";
	const resp: ApiResponse<number> = await request
		.post(url, {
			json: params,
			ignoreLoading: true,
		})
		.json();
	return resp;
}

// (右边树)目标填报>全部指标>总>修改负责人信息
export async function upResponsiblePersonMsg(params: Types.UpResponsiblePersonMsgParams) {
	const url = "indicator/submit/user/indicator/detail/upResponsiblePersonMsg";
	const resp: ApiResponse<boolean> = await request
		.put(url, {
			json: params,
			ignoreLoading: true,
		})
		.json();
	return resp;
}

// (提交)目标填报>填报>基础指标
export async function submitUserIndicatorBasicUp(data: Types.UserIndicatorBasicUpParams) {
	const url = "indicator/submit/user/indicator/basic/cal";
	const resp: ApiResponse<boolean> = await request
		.put(url, {
			json: data,
			ignoreLoading: true,
			errorMessage: true,
		})
		.json();
	return resp;
}

// (列表)目标填报>填报>双算
export async function fetchDoubleCountingList(params: Types.DoubleCountingListParams) {
	const url = "indicator/submit/doubleCounting";
	const resp: ApiResponse<Types.DoubleCountingListItem[]> = await request
		.post(url, {
			json: params,
			ignoreLoading: true,
		})
		.json();
	return resp;
}

// (提交)目标填报>填报>双算
export async function submitDoubleCounting(params: Types.DoubleCountingSubmitParams) {
	const url = "indicator/submit/doubleCounting/submit";
	const resp: ApiResponse<boolean> = await request
		.put(url, {
			json: params,
			ignoreLoading: true,
		})
		.json();
	return resp;
}

// (锁)目标拆解>目标填报>填报>编辑锁定
export async function submitEditLock(effTaskIndicatorSubmitIndicatorListId: number | string) {
	const url = `indicator/submit/editLock/${effTaskIndicatorSubmitIndicatorListId}`;
	const resp: ApiResponse<boolean> = await request
		.get(url, { ignoreLoading: true, errorMessage: true, successMessage: true })
		.json();
	return resp;
}

// (解锁)目标拆解>目标填报>填报>编辑锁定
export async function submitEditUnLock(effTaskIndicatorSubmitIndicatorListId: number | string) {
	const url = `indicator/submit/editUnLock/${effTaskIndicatorSubmitIndicatorListId}`;
	const resp: ApiResponse<boolean> = await request
		.get(url, { ignoreLoading: true, errorMessage: true, successMessage: true })
		.json();
	return resp;
}

// (详情)目标填报>填报>子
export async function fetchSubmitUserIndicatorDetailById(
	id: number | string,
	params?: Record<string, any>,
) {
	const url = `indicator/submit/user/indicator/child/${id}`;
	const resp: ApiResponse<Types.SubmitUserIndicatorDetailByIdRes> = await request
		.get(url, { searchParams: params, ignoreLoading: true })
		.json();
	return resp;
}

/**
 * (详情All)目标填报>目标跟进>确认流程>流程>各组织负责人目标值确认>数量>调整(下发人)
 * @param {number|string} effTaskSubmissionId 提交任务id
 * @returns 结果
 */
export async function confirmUserIdsIndicatorCountHisAdjustAll(
	effTaskSubmissionId: number | string,
) {
	const url = `confirm/confirmUserIds/indicatorCount/his/adjust/all/${effTaskSubmissionId}`;
	const resp: ApiResponse<Types.ConfirmUserIdsIndicatorCountHisAdjustAllRes> = await request
		.get(url, {
			ignoreLoading: true,
		})
		.json();
	return resp;
}

/**
 * (调整计算)目标填报>目标跟进>确认流程>流程>各组织负责人目标值确认>数量>调整(下发人)>年度目标值调整
 * @param {object} params (调整计算)调整(下发人)>年度目标值调整--form
 * @param {number} params.id id
 * @param {number} params.value 值
 * @returns 结果
 */
export async function confirmUserIdsIndicatorCountHisAdjustAllCal(
	params: Types.ConfirmUserIdsIndicatorCountHisAdjustAllCalParams,
) {
	const url = "confirm/confirmUserIds/indicatorCount/his/adjust/all/cal";
	const resp: ApiResponse<Types.ConfirmUserIdsIndicatorCountHisAdjustAllCalData> = await request
		.post(url, {
			json: params,
			ignoreLoading: true,
		})
		.json();
	return resp;
}

/**
 * (提交)目标填报>目标跟进>确认流程>流程>各组织负责人目标值确认>数量>调整(下发人)
 * @param {object} params (提交)目标填报>目标跟进>确认流程>流程>各组织负责人目标值确认>数量>调整>提交-form
 * @param {number} params.effTaskSubmissionId 提交任务id
 * @param {Array} params.adjustFormList 修改表单
 * @returns 结果
 */
export async function confirmUserIdsIndicatorCountHisAdjustAllSubmit(
	params: Types.ConfirmUserIdsIndicatorCountHisAdjustAllSubmitParams,
) {
	const url = "confirm/confirmUserIds/indicatorCount/his/adjust/all";
	const resp: ApiResponse<Types.ConfirmUserIdsIndicatorCountHisAdjustAllSubmitRes> = await request
		.put(url, {
			json: params,
			ignoreLoading: true,
			successMessage: "提交成功",
			errorMessage: true,
		})
		.json();
	return resp;
}

/**
 * (校验)目标填报>填报>提交>下一步
 * @param {object} params (校验)目标填报>填报>提交>下一步(校验所选指标是否包含全联动指标)--query
 * @param {Array} params.indicatorListIds 拆解指标ids
 * @param {Array} params.indicatorListOverviewIds 待提交审核的填报记录
 * @returns
 */
export async function userIndicatorListCheckConfDetailGroup(
	params: Types.UserIndicatorListCheckConfDetailGroupParams,
) {
	const url = "indicator/submit/user/indicator/list/check/confDetailGroup";
	const resp: ApiResponse<boolean> = await request
		.post(url, {
			json: params,
			ignoreLoading: true,
		})
		.json();
	return resp;
}

/**
 * (详情)目标填报>目标跟进>确认流程>流程>各组织负责人目标值确认>数量>调整(下发人)>参考值相关
 * @param {number|string} listOverviewHisId 目标跟进版本填报记录id
 * @returns 结果
 */
export async function confirmUserIdsIndicatorCountHisAdjustReferenceValue(
	listOverviewHisId: number | string,
) {
	const url = `confirm/confirmUserIds/indicatorCount/his/adjust/referenceValue/${listOverviewHisId}`;
	const resp: ApiResponse<Types.ConfirmUserIdsIndicatorCountHisAdjustReferenceValue> =
		await request
			.get(url, {
				ignoreLoading: true,
			})
			.json();
	return resp;
}

/**
 * (计算)目标填报>目标跟进>确认流程>流程>各组织负责人目标值确认>数量>调整(下发人)>参考值相关>计算
 * @param {object} params 目标填报>目标调整>计算--form
 * @param {number} params.listOverviewHisId 填报版本记录id
 * @param {object} params.map k:基础指标id v:值
 * @returns
 */
export async function confirmUserIdsIndicatorCountHisAdjustReferenceValueCal(
	params: Types.ConfirmUserIdsIndicatorCountHisAdjustReferenceValueCalParams,
) {
	const url = "confirm/confirmUserIds/indicatorCount/his/adjust/referenceValue/cal";
	const resp: ApiResponse<number> = await request
		.post(url, {
			json: params,
			ignoreLoading: true,
		})
		.json();
	return resp;
}

/**
 * (确认)目标填报>目标跟进>确认流程>流程>各组织负责人目标值确认>数量>调整(下发人)>参考值相关>计算>联动变更数据
 * @param {object} params 版本记录联动变更--form
 * @param {number} params.listOverviewHisId 填报版本记录id
 * @param {object} params.map k:基础指标id v:值
 * @param {object} params.basicIndicatorMap 当前拆解对象关联的所有基础指标 k:基础指标id v:值
 * @param {object} params.calLinkageInnerMap 当前拆解对象下所有同拆解对象数据k:id
 * @returns
 */
export async function confirmUserIdsIndicatorCountHisAdjustReferenceValueCalLinkage(
	params: Types.ConfirmUserIdsIndicatorCountHisAdjustReferenceValueCalLinkageParams,
) {
	const url = "confirm/confirmUserIds/indicatorCount/his/adjust/referenceValue/cal/linkage";
	const resp: ApiResponse<Types.ConfirmUserIdsIndicatorCountHisAdjustReferenceValueCalLinkageRes> =
		await request
			.post(url, {
				json: params,
				ignoreLoading: true,
				successMessage: false,
			})
			.json();
	return resp;
}
