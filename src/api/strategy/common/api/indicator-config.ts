import type * as Types from "../types";
import { request } from "#src/utils";

// (总统计)指标配置
export async function fetchIndicatorConfStatistics() {
	const url = "indicator/conf/page/statistics";
	try {
		const resp: any = await request.get(url).json();
		if (!resp) {
			return {
				targetPlanTotal: 0,
				targetPlanTotalNoSubmit: 0,
				targetPlanTotalSubmit: 0,
				primaryPlanTotal: 0,
				primaryPlanNoSubmit: 0,
				primaryPlanSubmit: 0,
				collaborationPlanTotal: 0,
				collaborationPlanNoSubmit: 0,
				collaborationPlanSubmit: 0,
			};
		}
		const data = resp.data ?? resp ?? {};
		return {
			targetPlanTotal: data.targetPlanTotal ?? 0,
			targetPlanTotalNoSubmit: data?.targetPlanTotalNoSubmit ?? 0,
			targetPlanTotalSubmit: data?.targetPlanTotalSubmit ?? 0,
			primaryPlanTotal: data?.primaryPlanTotal ?? 0,
			primaryPlanNoSubmit: data?.primaryPlanNoSubmit ?? 0,
			primaryPlanSubmit: data?.primaryPlanSubmit ?? 0,
			collaborationPlanTotal: data?.collaborationPlanTotal ?? 0,
			collaborationPlanNoSubmit: data?.collaborationPlanNoSubmit ?? 0,
			collaborationPlanSubmit: data?.collaborationPlanSubmit ?? 0,
		};
	} catch (e) {
		console.error("fetchIndicatorConfStatistics failed", e);
		return {
			targetPlanTotal: 0,
			targetPlanTotalNoSubmit: 0,
			targetPlanTotalSubmit: 0,
			primaryPlanTotal: 0,
			primaryPlanNoSubmit: 0,
			primaryPlanSubmit: 0,
			collaborationPlanTotal: 0,
			collaborationPlanNoSubmit: 0,
			collaborationPlanSubmit: 0,
		};
	}
}

// indicator/conf/page post请求
// (分页)指标配置
export async function fetchIndicatorConfPage(
	payload: Types.IndicatorConfPageParams,
): Promise<Types.IndicatorConfPageListRes>;
export async function fetchIndicatorConfPage(): Promise<Types.IndicatorConfPageListRes>;
export async function fetchIndicatorConfPage(
	payload?: Types.IndicatorConfPageParams,
): Promise<Types.IndicatorConfPageListRes> {
	const url = "indicator/conf/page";
	try {
		const resp:
			| Types.IndicatorConfPageRes
			| { data?: Types.IndicatorConfPageItem[]; total?: number }
			| null = await request.post(url, { json: payload, ignoreLoading: true }).json();
		if (!resp) return { data: [], total: 0 };
		const flatResp = resp as { data?: Types.IndicatorConfPageItem[]; total?: number };
		if (Array.isArray(flatResp.data))
			return { data: flatResp.data, total: flatResp.total ?? flatResp.data.length ?? 0 };
		const nestedResp = resp as Types.IndicatorConfPageRes;
		if (nestedResp.data && Array.isArray(nestedResp.data.list))
			return { data: nestedResp.data.list, total: nestedResp.data.total ?? 0 };
		return { data: [], total: 0 };
	} catch (e) {
		console.error("fetchIndicatorConfPage failed", e);
		return { data: [], total: 0 };
	}
}

export async function fetchIndicatorPageRetrieve(
	params: Types.PageRetrieveParams,
): Promise<Types.PageRetrieveRes> {
	const url = "indicator/page/retrieve";
	const resp: Types.PageRetrieveRes = await request
		.post(url, { json: params, ignoreLoading: true })
		.json();
	return resp;
}

export async function indicatorConfDetailsAdd(payload?: {
	effTaskIndicatorConfId?: string | number;
	indicatorIds?: any[];
}) {
	const url = "indicator/conf/details/add";
	try {
		const resp: any = await request.post(url, { json: payload, ignoreLoading: true }).json();
		if (!resp) return null;
		return resp.data ?? resp;
	} catch (e) {
		console.error("indicatorConfDetailsAdd failed", e);
		return null;
	}
}

// (列表)指标配置>指标名称(点击)>指标树(左边树)
export async function fetchIndicatorConfDetails(
	taskIndicatorConfId: string | number,
): Promise<Types.DetailTreeGroup[]> {
	const url = `indicator/conf/details/${taskIndicatorConfId}`;
	const resp: ApiResponse<Types.DetailTreeGroup[]> = await request
		.get(url, { ignoreLoading: true })
		.json();
	if (!resp) return [];
	return resp.data ?? (resp as any) ?? [];
}

export async function fetchOverallTargetAudience(indicatorSubmitDetailsId: string | number) {
	const url = `indicator/conf/details/overallTargetAudience/${indicatorSubmitDetailsId}`;
	try {
		const resp: any = await request.get(url, { ignoreLoading: true }).json();
		if (!resp) return { data: [] };
		return resp.data ?? resp;
	} catch (e) {
		console.error("fetchOverallTargetAudience failed", e);
		return { data: [] };
	}
}

export async function saveOverallTargetAudience(payload?: {
	id?: string | number;
	totalTargetExist?: number;
	totalTargetCode?: string;
	totalTargetName?: string;
	totalTargetAmount?: number;
}) {
	const url = "indicator/conf/details/overallTargetAudience";
	try {
		const resp: any = await request.put(url, { json: payload, ignoreLoading: true }).json();
		if (!resp) return null;
		return resp.data ?? resp;
	} catch (e) {
		console.error("saveOverallTargetAudience failed", e);
		return null;
	}
}

// 3.1.2.3.4、(删除)目标拆解>指标配置>指标配置>新增指标 — /details/del/{id} DELETE
export async function deleteIndicatorConfDetails(id: string | number) {
	const url = `indicator/conf/details/del/${id}`;
	try {
		const resp: any = await request.delete(url, { ignoreLoading: true }).json();
		return resp;
	} catch (e) {
		console.error("deleteIndicatorConfDetails failed", e);
		return null;
	}
}

// (详情)指标配置>指标配置>目标计划
// indicator/conf/targetPlan/details get
export async function fetchIndicatorConfTargetPlanDetails(payload: any, options?: any) {
	const url = "indicator/conf/targetPlan/details";
	try {
		const resp: any = await request
			.post(url, { json: payload, ignoreLoading: true, ...options })
			.json();
		return resp;
	} catch (e) {
		console.error("addBasicIndicatorImport failed", e);
		return null;
	}
}

// indicator/conf/targetPlan put
// (修改)指标配置>指标配置>目标计划
export async function updateIndicatorConfTargetPlan(payload: Record<string, any>) {
	const url = "indicator/conf/targetPlan/submit";
	try {
		const resp: any = await request.put(url, { json: payload, ignoreLoading: true }).json();
		if (!resp) return null;
		return resp ?? resp;
	} catch (e) {
		console.error("addIndicatorConfTargetPlan failed", e);
		return null;
	}
}

// indicator/conf/targetPlan POST
// (新增)指标配置>指标配置>目标计划
export async function addIndicatorConfTargetPlan(payload: Record<string, any>) {
	const url = "indicator/conf/targetPlan/submit";
	try {
		const resp: any = await request.put(url, { json: payload, ignoreLoading: true }).json();
		if (!resp) return null;
		return resp ?? resp;
	} catch (e) {
		console.error("addIndicatorConfTargetPlan failed", e);
		return null;
	}
}

// (分页)指标库>应用计划
export async function fetchApplicationPlanList(payload?: Types.ApplicationPlanListPayload) {
	const url = "target/plan/applicationPlanList";
	const resp: ApiListResponse<Types.ApplicationPlanListItem> = await request
		.post(url, { json: payload, ignoreLoading: true })
		.json();
	return resp;
}
