import type * as Types from "./types";
import { request } from "#src/utils";

// 检查计划名称是否存在
export async function fetchIndicatorTargetDecompositionDetail(params?: { id?: string | number }) {
	const url = "indicator/plan/check-name";
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

// 新增可分解对象
export async function submitIndicatorTargetDecompositionObjects(
	data: Types.SubmitIndicatorTargetDecompositionObjectsParams,
) {
	const url = "indicator/submit/submitUser/disassembleObjects";
	try {
		const resp: any = await request
			.post(url, {
				json: data,
				ignoreLoading: true,
				errorMessage: true,
			})
			.json();
		if (!resp) return { success: false };
		return resp.data ?? resp;
	} catch (e) {
		console.error("submitIndicatorTargetDecompositionObjects failed", e);
		return { success: false };
	}
}

// 设置主责人
export async function submitIndicatorTargetDecompositionMainResponsible(
	data: Types.SubmitIndicatorTargetDecompositionMainResponsibleParams,
) {
	const url = "indicator/submit/submitUser/mainResponsible";
	try {
		const resp: any = await request
			.put(url, {
				json: data,
				ignoreLoading: true,
				errorMessage: true,
			})
			.json();
		if (!resp) return { success: false };
		return resp;
	} catch (e) {
		console.error("submitIndicatorTargetDecompositionMainResponsible failed", e);
		return { success: false };
	}
}

// 获取拆解指标列表（分页）
export async function fetchIndicatorTargetDecompositionMainResponsibleDecomposingIndicatorsPage(
	data: Types.IndicatorConfDetailsCorrelationMetricsIndicatorPageParams,
) {
	const url = "indicator/submit/submitUser/disassemblingIndicators/page";
	const resp: ApiListResponse<Types.IndicatorConfDetailsCorrelationMetricsIndicatorItem> =
		await request
			.post(url, {
				json: data,
				ignoreLoading: true,
				errorMessage: true,
			})
			.json();
	return resp;
}

// 获取指标下达配置指标列表（已选）
export async function indicatorConfDetailsCorrelationMetricsIndicatorList(
	data: Types.IndicatorConfDetailsCorrelationMetricsIndicatorListParams,
) {
	const url = "indicator/submit/submitUser/disassemblingIndicators/list";
	const resp: ApiResponse<Types.IndicatorConfDetailsCorrelationMetricsIndicatorListRes["data"]> =
		await request
			.post(url, {
				json: data,
				ignoreLoading: true,
				errorMessage: true,
			})
			.json();
	return resp;
}

// 设置拆解指标
export async function submitIndicatorTargetDecompositionMainResponsibleDecomposingIndicators(
	data: Types.SubmitIndicatorTargetDecompositionMainResponsibleDecomposingIndicatorsParams,
): Promise<ApiResponse<number>> {
	const url = "indicator/submit/submitUser/disassemblingIndicators";
	const resp: ApiResponse<number> = await request
		.put(url, {
			json: data,
			ignoreLoading: true,
			errorMessage: true,
		})
		.json();
	return resp;
}

// 删除主责人
export async function deleteIndicatorTargetDecompositionMainResponsible(id: number | string) {
	const url = `indicator/submit/submitUser/${id}`;
	try {
		const resp: any = await request.delete(url, { errorMessage: true }).json();
		if (!resp) return { success: false };
		return resp;
	} catch (e) {
		console.error("deleteIndicatorTargetDecompositionMainResponsible failed", e);
		return { success: false };
	}
}

// 提交主责人
export async function submitIndicatorTargetDecompositionMainResponsibleSubmit(
	data: Types.SubmitIndicatorTargetDecompositionMainResponsibleSubmitParams,
) {
	const url = "indicator/submit/submitUser";
	try {
		const resp: any = await request
			.put(url, {
				json: data,
				ignoreLoading: true,
				errorMessage: true,
				successMessage: true,
			})
			.json();
		if (!resp) return { success: false };
		return resp;
	} catch (e) {
		console.error("submitIndicatorTargetDecompositionMainResponsibleSubmit failed", e);
		return { success: false };
	}
}

// 编辑可分解对象
export async function submitIndicatorTargetDecompositionObjectsEdit(
	data: Types.SubmitIndicatorTargetDecompositionObjectsEditParams,
) {
	const url = "indicator/submit/submitUser/disassembleObjects";
	try {
		const resp: any = await request
			.put(url, {
				json: data,
				ignoreLoading: true,
				errorMessage: true,
			})
			.json();
		if (!resp) return { success: false };
		return resp;
	} catch (e) {
		console.error("submitIndicatorTargetDecompositionObjectsEdit failed", e);
		return { success: false };
	}
}

// 获取填报用户统计信息
export async function fetchSubmitUserStatistics() {
	const url = "indicator/submit/submitUser/statistics";
	try {
		const resp: any = await request.get(url, { ignoreLoading: true }).json();
		if (!resp) return { data: {} };
		return resp.data ?? resp;
	} catch (e) {
		console.error("fetchSubmitUserStatistics failed", e);
		return { data: {} };
	}
}

// 获取拆解指标列表（已选）
export async function fetchIndicatorTargetDecompositionMainResponsibleDecomposingIndicatorsList(
	data: Types.FetchIndicatorTargetDecompositionMainResponsibleDecomposingIndicatorsListParams,
) {
	const url = "indicator/submit/submitUser/disassemblingIndicators/list";
	try {
		const searchParams: Record<string, any> = {
			effTaskIndicatorSubmitUserId: data.effTaskIndicatorSubmitUserId,
			sourceNewB: data.sourceNewB,
			suspendedVersion: data.suspendedVersion,
			suspendedEditId: data.suspendedEditId,
		};
		const resp: any = await request
			.get(url, { searchParams, ignoreLoading: true, errorMessage: true })
			.json();
		if (!resp) return { exists: false };
		return resp;
	} catch (e) {
		console.error("checkPlanName failed", e);
		return { exists: false };
	}
}

// 查询指标名称
export async function fetchIndicatorName(data: Types.FetchIndicatorNameParams) {
	const url = `indicator/submit/submitUser/viewData/indicatorName/${data.effTaskIndicatorSubmitUserId}`;
	const resp: ApiResponse<Record<string, string>> = await request
		.post(url, {
			json: data,
			ignoreLoading: true,
		})
		.json();
	return resp;
}

// (列表)根据目标拆解子任务id获取拆解指标集
export async function submitUserViewDataV1IndicatorName(effTaskIndicatorSubmitUserId: number) {
	const url = `indicator/submit/submitUser/viewData/indicatorName/v1/${effTaskIndicatorSubmitUserId}`;
	const resp: Types.SubmitUserViewDataV1IndicatorNameRes = await request
		.post(url, {
			json: { effTaskIndicatorSubmitUserId },
			ignoreLoading: true,
		})
		.json();
	return resp;
}

// 获取拆解对象树
export async function fetchIndicatorTargetDecompositionObjectsTree(
	data: Types.FetchIndicatorTargetDecompositionObjectsTreeParams,
) {
	const url = "indicator/submit/submitUser/disassembleObjects/tree";
	const resp: ApiResponse<Types.IndicatorTargetDecompositionObjectsTree[]> = await request
		.post(url, {
			json: data,
			ignoreLoading: true,
		})
		.json();
	return resp;
}

// 撤销发布流程
export async function undoPublishFlow(id: number | string) {
	const url = `indicator/submit/submitUser/unpublish/${id}`;
	const resp: ApiResponse<boolean> = await request
		.post(url, {
			ignoreLoading: true,
			errorMessage: true,
		})
		.json();
	return resp;
}

// 获取目标计划详情
export async function fetchTargetPlanDetail(params?: Types.FetchTargetPlanDetailParams) {
	const url = `target/plan/${params?.id ?? ""}`;
	const resp: ApiResponse<Types.TargetPlan> = await request
		.get(url, {
			ignoreLoading: true,
			errorMessage: true,
		})
		.json();
	return resp;
}

// 获取查看数据表头（周期）
export async function fetchTargetPlanViewDataHead(data: Types.ViewDataHeadParams) {
	const url = "target/plan/viewData/head";
	const resp: ApiResponse<Types.ViewDataHeadRes[]> = await request
		.post(url, {
			json: data,
			ignoreLoading: true,
		})
		.json();
	return resp;
}

// 获取指标名称选项
export async function fetchTargetPlanViewDataHeadSelectIndicatorId(
	effTargetPlanId: number | string,
) {
	const url = `target/plan/viewData/head/select/indicatorId/${effTargetPlanId}`;
	const resp: ApiResponse<{ id: string; name: string }[]> = await request
		.get(url, {
			ignoreLoading: true,
		})
		.json();
	return resp;
}

// 获取查看数据列表
export async function fetchTargetPlanViewData(data: Types.FetchTargetPlanViewDataParams) {
	const url = "target/plan/viewData";
	const resp: ApiResponse<Types.ViewDataRes[]> = await request
		.post(url, {
			json: data,
			ignoreLoading: true,
		})
		.json();
	return resp;
}

// (分页)指标库 for 目标计划
export async function pageForTargetPlan(
	params: Types.PageForTargetPlanParams,
): Promise<Types.PageForTargetPlanRes> {
	const url = "indicator/pageForTargetPlan";
	const resp: Types.PageForTargetPlanRes = await request
		.post(url, {
			json: params,
			ignoreLoading: true,
			errorMessage: true,
		})
		.json();
	return resp;
}
