import type * as Types from "./types";
import { request } from "#src/utils";

export * from "./types";

/**
 * 分页获取Excel配置列表
 * @param params 查询参数
 */
export async function fetchExcelConfigList(params: Types.FetchExcelConfigListParams) {
	const url = "common/export/config";
	const resp: ApiListResponse<Types.ExcelConfigItem> = await request
		.post(url, {
			json: params,
			ignoreLoading: true,
		})
		.json();
	return resp;
}

/**
 * 新增Excel配置
 * @param params 配置参数
 */
export async function createExcelConfig(params: Types.UpdateExcelConfigParams) {
	const url = "common/export/config/add";
	const resp: ApiResponse<boolean> = await request
		.post(url, {
			json: params,
			ignoreLoading: true,
			successMessage: "新增导出配置成功",
		})
		.json();
	return resp;
}

/**
 * 修改Excel配置
 * @param params 配置参数
 */
export async function updateExcelConfig(params: Types.UpdateExcelConfigParams) {
	const url = "common/export/config";
	const resp: ApiResponse<boolean> = await request
		.put(url, {
			json: params,
			ignoreLoading: true,
			successMessage: "修改导出配置成功",
		})
		.json();
	return resp;
}

/**
 * 删除Excel配置
 * @param id 配置ID
 */
export async function deleteExcelConfig(id: number) {
	const url = `common/export/config/${id}`;
	const resp: ApiResponse<boolean> = await request
		.delete(url, {
			ignoreLoading: true,
			successMessage: "删除导出配置成功",
		})
		.json();
	return resp;
}
