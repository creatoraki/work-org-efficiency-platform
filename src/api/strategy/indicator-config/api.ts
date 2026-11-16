import type * as Types from "./types";
import { request } from "#src/utils";

// 锁定指标
export async function lockIndicator(indicatorSubmitDetailsId: string) {
	const url = `indicator/conf/editLock/${indicatorSubmitDetailsId}`;
	const resp: ApiResponse<boolean> = await request
		.get(url, {
			ignoreLoading: true,
			errorMessage: true,
		})
		.json();
	return resp;
}

// 解锁指标
export async function unlockIndicator(indicatorSubmitDetailsId: string) {
	const url = `indicator/conf/editUnLock/${indicatorSubmitDetailsId}`;
	const resp: ApiResponse<boolean> = await request
		.get(url, {
			ignoreLoading: true,
			errorMessage: true,
		})
		.json();
	return resp;
}

// 预览的表头 indicator/conf/details/preview/head post
export async function previewIndicatorConfigHead(data: {
	effTaskIndicatorConfDetailsId: string;
	targetOrgCode: number;
}) {
	const url = "indicator/conf/details/preview/head";
	const resp: ApiResponse<Types.PreviewIndicatorHead> = await request
		.post(url, {
			json: { ...data, pageSize: 100, pageNum: 1 },
			ignoreLoading: true,
			errorMessage: true,
		})
		.json();
	return resp;
}

// 预览的列表数据 indicator/conf/details/preview post
export async function previewIndicatorConfigList(data: {
	effTaskIndicatorConfDetailsId: string;
	targetOrgCode: number;
	pageSize: number;
	pageNum: number;
}) {
	const url = "indicator/conf/details/preview";
	const resp: ApiListResponse<Types.PreviewIndicatorRow> = await request
		.post(url, {
			json: data,
			ignoreLoading: true,
			errorMessage: true,
		})
		.json();
	return resp;
}

// (列表)指标配置>指标配置>参考设置>目标配置>配置指标
export async function referenceConfDetailIndicatorList(referenceId: number) {
	const url = `indicator/conf/reference/confDetail/indicator/list/${referenceId}`;
	const resp: ApiResponse<Types.ReferenceConfDetailIndicatorListItem[]> = await request
		.get(url, {
			ignoreLoading: true,
			errorMessage: true,
		})
		.json();
	return resp;
}

// (新增)指标配置>指标配置>参考设置>目标配置>配置指标
export async function addReferenceConfDetailIndicator(
	params: Types.AddReferenceConfDetailIndicatorParams,
) {
	const url = "indicator/conf/reference/confDetail/indicator";
	const resp: ApiResponse<boolean> = await request
		.post(url, {
			json: params,
			ignoreLoading: true,
			errorMessage: true,
		})
		.json();
	return resp;
}

// (删除)指标配置>指标配置>参考设置>目标配置>配置指标
export async function delReferenceConfDetailIndicator(referenceConfDetailIndicatorId: number) {
	const url = `indicator/conf/reference/confDetail/indicator/${referenceConfDetailIndicatorId}`;
	const resp: ApiResponse<boolean> = await request
		.delete(url, {
			ignoreLoading: true,
			errorMessage: true,
		})
		.json();
	return resp;
}

// (悬空修改)指标范围
// user/perm/user/indicatorListId/suspended put
export async function suspendIndicatorConfigIndicatorList(
	data: Types.SuspendIndicatorConfigIndicatorListParams,
) {
	const url = "user/perm/user/indicatorListId/suspended";
	const resp: ApiResponse<boolean> = await request
		.put(url, {
			json: data,
			ignoreLoading: true,
			errorMessage: true,
		})
		.json();
	return resp;
}

// (排序提交)指标配置>指标名称(点击)>指标树(左边树)
export async function detailSort(data: Types.DetailSortParams) {
	const url = "indicator/conf/details/sort";
	const resp: ApiResponse<boolean> = await request
		.put(url, {
			json: data,
			ignoreLoading: true,
			errorMessage: true,
		})
		.json();
	return resp;
}

// (分页)指标配置>指标配置>新增指标
export async function pageRetrieveConfDetailsSelected(
	params: Types.PageRetrieveConfDetailsSelectedParams,
) {
	const url = "indicator/conf/page/retrieve/confDetailsIndicator/selected";
	const resp: Types.PageRetrieveConfDetailsSelectedRes = await request
		.post(url, {
			json: params,
			ignoreLoading: true,
			errorMessage: true,
		})
		.json();
	return resp;
}

// (分页)指标配置>指标配置>参考设置>目标配置>基础指标>新增
export async function pageRetrieveBasicIndicatorSelected(
	params: Types.PageRetrieveBasicIndicatorSelectedParams,
) {
	const url = "indicator/conf/page/retrieve/basicIndicator/selected";
	const resp: ApiListResponse<Types.PageRetrieveBasicIndicatorSelectedResItem> = await request
		.post(url, {
			json: params,
			ignoreLoading: true,
			errorMessage: true,
		})
		.json();
	return resp;
}
