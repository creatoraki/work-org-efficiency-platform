import type * as Types from "./types";
import { request } from "#src/utils";
import { request as axiosRequest } from "#src/utils/axios-request";

export * from "./types";

/**
 * 通用导出接口(使用当前系统的token)
 * @param params 导出参数
 */
export async function commonExport(params: Types.CommonExportParams) {
	const url = "excel/common/export";
	const resp: ApiResponse<boolean> = await request
		.post(url, {
			json: params,
			ignoreLoading: true,
			successMessage: "导出任务已提交",
		})
		.json();
	return resp;
}

/**
 * 创建 PDF 导出任务（统一导出中心入口）
 */
export async function createPdfExportTask(payload: Types.PdfTaskPayload) {
	const url = "file/pdf/task";
	const resp = await axiosRequest.post<Types.PdfTaskCreateResult, Types.PdfTaskPayload>(
		url,
		payload,
		{
			showLoading: false,
			errorMessage: false,
		},
	);
	return resp;
}

/**
 * 分页获取文件导出信息列表
 * @param params 查询参数
 */
export async function fetchFileInfoList(params: Types.FetchFileInfoListParams) {
	const url = "file/info";
	const resp: ApiListResponse<Types.FileInfoItem> = await request
		.post(url, {
			json: params,
			ignoreLoading: true,
		})
		.json();
	return resp;
}

/**
 * 取消导出任务
 * @param id 导出任务ID
 */
export async function cancelExportById(id: number) {
	const url = `file/info/cancel/${id}`;
	const resp: ApiResponse<boolean> = await request
		.put(url, {
			ignoreLoading: true,
			successMessage: "取消导出成功",
		})
		.json();
	return resp;
}
