import type * as Types from "../types";
import { request } from "#src/utils";

// /// indicator/conf/reference/page post
export async function fetchIndicatorConfReferencePage(payload?: Record<string, any>) {
	const url = "indicator/conf/reference/page";
	try {
		const resp: any = await request.post(url, { json: payload, ignoreLoading: true }).json();
		if (!resp) return { data: [], total: 0 };
		if (Array.isArray(resp.data))
			return { data: resp.data, total: resp.total ?? resp.data.length ?? 0 };
		if (resp.data && Array.isArray(resp.data.list))
			return { data: resp.data.list, total: resp.data.total ?? 0 };
		return { data: [], total: 0 };
	} catch (e) {
		console.error("fetchIndicatorConfReferencePage failed", e);
		return { data: [], total: 0 };
	}
}

// (分页)指标配置>指标配置>参考设置(同期值)>手动导入
export async function fetchSamePeriodValueImportPage(
	payload: Types.ReferenceSamePeriodValueImportPageParams,
) {
	const url = "indicator/conf/reference/samePeriodValue/import/page";
	const resp: Types.ReferenceSamePeriodValueImportPageRes = await request
		.post(url, { json: payload, ignoreLoading: true })
		.json();
	return resp;
}

// indicator/conf/page/referenceTargetOrg post
export async function fetchReferenceTargetOrg(params: {
	effTaskIndicatorConfDetailsReferenceId: string | number;
	pageNum?: number;
	pageSize?: number;
	name?: string;
}) {
	const url = "indicator/conf/page/referenceTargetOrg";
	try {
		const resp: ApiListResponse<Types.ReferenceTargetOrgItem> = await request
			.post(url, { json: params, ignoreLoading: true })
			.json();
		if (!resp) return null;
		return resp.data ?? resp;
	} catch (e) {
		console.error("fetchReferenceTargetOrg failed", e);
		return null;
	}
}

// conf/reference/samePeriodValue/import post
export async function importSamePeriodValue(payload: Record<string, any>) {
	const url = "indicator/conf/reference/samePeriodValue/import";
	try {
		const resp: any = await request.post(url, { json: payload, ignoreLoading: true }).json();
		return resp;
	} catch (e) {
		console.error("importSamePeriodValue failed", e);
		return null;
	}
}

export async function deleteImportedSamePeriodValue(id: string | number) {
	const url = `indicator/conf/reference/samePeriodValue/import/${id}`;
	try {
		const resp: any = await request.delete(url, { ignoreLoading: true }).json();
		return resp;
	} catch (e) {
		console.error("deleteImportedSamePeriodValue failed", e);
		return null;
	}
}

export async function updateImportedSamePeriodValue(
	payload: Types.EditReferenceSamePeriodValueImportParams,
) {
	const url = "indicator/conf/reference/samePeriodValue/import";
	return await request
		.put(url, { json: payload, ignoreLoading: true, errorMessage: true })
		.json();
}

export async function submitImportedSamePeriodValue(payload: Record<string, any>) {
	const url = "indicator/conf/reference/samePeriodValue/import/submit";
	try {
		const resp: any = await request.put(url, { json: payload, ignoreLoading: true }).json();
		return resp;
	} catch (e) {
		console.error("submitImportedSamePeriodValue failed", e);
		return null;
	}
}

// indicator/conf/reference/{referenceId} delete
export async function deleteIndicatorConfReference(referenceId: string | number) {
	const url = `indicator/conf/reference/${referenceId}`;
	try {
		const resp: any = await request.delete(url, { ignoreLoading: true }).json();
		return resp;
	} catch (e) {
		console.error("deleteIndicatorConfReference failed", e);
		return null;
	}
}

// indicator/conf/reference/basic/{id} get
export async function fetchIndicatorConfReferenceBasic(id: string | number) {
	const url = `indicator/conf/reference/basic/${id}`;
	const resp: ApiResponse<Types.ReferenceBasicDetailRes> = await request
		.get(url, { ignoreLoading: true })
		.json();
	return resp.data;
}

// indicator/conf/reference/basic/indicator/list/{effTaskIndicatorConfDetailsReferenceId} get
export async function fetchIndicatorConfReferenceBasicIndicatorList(
	effTaskIndicatorConfDetailsReferenceId: string | number,
) {
	const url = `indicator/conf/reference/basic/indicator/list/${effTaskIndicatorConfDetailsReferenceId}`;
	try {
		const resp: any = await request.get(url, { ignoreLoading: true }).json();
		if (!resp) return { data: [] };
		const data = resp.data || {};
		return data;
	} catch (e) {
		console.error("fetchIndicatorConfReferenceBasicIndicatorList failed", e);
		return { data: [] };
	}
}

// indicator/conf/reference/basic/indicator/list post
export async function addReferenceIndicator(payload?: Record<string, any>) {
	const url = "indicator/conf/reference/basic/indicator/list";
	try {
		const resp: any = await request.post(url, { json: payload, ignoreLoading: true }).json();
		return resp;
	} catch (e) {
		console.error("addReferenceIndicator failed", e);
		return null;
	}
}

// (修改)指标配置>指标配置>参考设置>目标配置
export async function updateIndicatorConfReferenceBasic(payload?: Record<string, any>) {
	const url = "indicator/conf/reference/basic";
	try {
		const resp: any = await request.put(url, { json: payload, ignoreLoading: true }).json();
		return resp;
	} catch (e) {
		console.error("updateIndicatorConfReferenceBasic failed", e);
		return null;
	}
}

// 更新指标配置-参考指标-基础指标列表-调整范围
export async function updateIndicatorConfReferenceBasicIndicatorListAdjustmentRange(payload: {
	id: number;
	adjustmentRangeBoundaryRule: number;
	adjustmentRangeMin: number;
	adjustmentRangeMax: number;
}) {
	const url = "indicator/conf/reference/basic/indicator/list/adjustmentRange";
	try {
		const resp: any = await request.put(url, { json: payload }).json();
		return resp;
	} catch (e) {
		console.error("updateIndicatorConfReferenceBasicIndicatorListAdjustmentRange failed", e);
		return { code: 500, msg: "更新失败" };
	}
}

// (修改)指标配置>指标配置>参数设置>目标配置>基础指标>(其他)是否支持调整
export async function updateIndicatorConfReferenceBasicIndicatorListOther(
	payload: Record<string, any>,
) {
	const url = "indicator/conf/reference/basic/indicator/list/other";
	try {
		const resp: any = await request.put(url, { json: payload }).json();
		return resp;
	} catch (e) {
		console.error("updateIndicatorConfReferenceBasicIndicatorListOther failed", e);
		return { code: 500, msg: "更新失败" };
	}
}

// (修改)指标配置>指标配置>参数设置>目标配置>基础指标>数据来源>手工导入
export async function updateIndicatorConfReferenceBasicIndicatorListImport(
	payload: Record<string, any>,
) {
	const url = "indicator/conf/reference/basic/indicator/list/import";
	try {
		const resp: any = await request.put(url, { json: payload }).json();
		return resp;
	} catch (e) {
		console.error("updateIndicatorConfReferenceBasicIndicatorListImport failed", e);
		return { code: 500, msg: "更新失败" };
	}
}

// (分页)指标配置>指标配置>参考设置>目标配置>指标基础>手工导入
export async function fetchBasicIndicatorImportPage(
	payload: Types.ReferenceIndicatorSamePeriodValueImportPageParams,
) {
	const url = "indicator/conf/reference/indicator/samePeriodValue/import/page";
	const resp: ApiListResponse<Types.ReferenceIndicatorSamePeriodValueImportPageResItem> =
		await request.post(url, { json: payload, ignoreLoading: true }).json();
	return resp;
}

// (悬空新增)指标配置>指标配置>参考设置>目标配置>指标基础>手工导入
export async function addBasicIndicatorImport(payload: Record<string, any>) {
	const url = "indicator/conf/reference/indicator/samePeriodValue/import";
	try {
		const resp: any = await request.post(url, { json: payload, ignoreLoading: true }).json();
		return resp;
	} catch (e) {
		console.error("addBasicIndicatorImport failed", e);
		return null;
	}
}

// (悬空删除)指标配置>指标配置>参考设置>目标配置>指标基础>手工导入
export async function deleteBasicIndicatorImport(id: string | number) {
	const url = `indicator/conf/reference/basic/indicator/list/${id}`;
	try {
		const resp: any = await request.delete(url, { ignoreLoading: true }).json();
		return resp;
	} catch (e) {
		console.error("deleteBasicIndicatorImport failed", e);
		return null;
	}
}

/**
 * (悬空删除)指标配置>指标配置>参考设置>目标配置>指标基础>手工导入(硬删除)
 * @param {number} id
 * @returns
 */
export function deleteReferenceIndicatorSamePeriodValueImport(id: number | string) {
	const url = `indicator/conf/reference/indicator/samePeriodValue/import/${id}`;
	return request.delete(url, { ignoreLoading: true }).json();
}

// (悬空修改)指标配置>指标配置>参考设置>目标配置>指标基础>手工导入
export async function updateBasicIndicatorImport(payload: Record<string, any>) {
	const url = "indicator/conf/reference/indicator/samePeriodValue/import";
	try {
		const resp: any = await request.put(url, { json: payload, ignoreLoading: true }).json();
		return resp;
	} catch (e) {
		console.error("updateBasicIndicatorImport failed", e);
		return null;
	}
}

// (提交)指标配置>指标配置>参考设置>目标配置>指标基础>手工导入
export async function submitBasicIndicatorImport(payload: Record<string, any>) {
	const url = "indicator/conf/reference/indicator/samePeriodValue/import/submit";
	try {
		const resp: any = await request
			.put(url, { json: payload, ignoreLoading: true, errorMessage: true })
			.json();
		return resp;
	} catch (e) {
		console.error("submitBasicIndicatorImport failed", e);
		return null;
	}
}

// indicator/conf/reference/bias put
export async function updateIndicatorConfReferenceBias(payload: Record<string, any>) {
	const url = "indicator/conf/reference/bias";
	try {
		const resp: any = await request.put(url, { json: payload, ignoreLoading: true }).json();
		if (!resp) return null;
		return resp;
	} catch (e) {
		console.error("updateIndicatorConfReferenceBias failed", e);
		return null;
	}
}
