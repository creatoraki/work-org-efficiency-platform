import type * as Types from "./types";
import { request } from "#src/utils";

export * from "./types";

/**
 * 查询导入任务列表
 * @param params 查询参数
 */
export async function fetchImportTableData(params: Types.ImportTaskListParams) {
	const url = "support/import/list";
	const resp: ApiListResponse<Types.ImportTaskListItem> = await request
		.post(url, {
			json: params,
			ignoreLoading: true,
		})
		.json();
	return resp;
}

/**
 * 下载导入任务结果
 * @param filename 导入任务结果文件名
 */
export function download(filename: string): Promise<Types.DownloadRes> {
	const url = `support/import/result/download?filename=${filename}`;
	return request.post(url).blob();
}

/**
 * 取消导入任务
 * @param id 导入任务ID
 */
export async function cancel(id: number) {
	const url = `support/import/${id}`;
	const resp: ApiResponse<number> = await request
		.put(url, {
			ignoreLoading: true,
		})
		.json();
	return resp;
}

/**
 * 获取导入任务详情
 * @param id 导入任务ID
 */
export async function getInfo(id: number) {
	const url = `support/import/${id}`;
	const resp: ApiResponse<Types.ImportTaskDetail> = await request
		.get(url, {
			ignoreLoading: true,
		})
		.json();
	return resp;
}

/**
 * 新增导入任务
 * @param templateId 模板id
 * @param extMapStr 额外信息
 * @param file 文件
 */
export async function importData(
	templateId: number,
	extMapStr: string,
	file: File,
): Promise<Types.ImportDataRes> {
	const url = "support/import";
	const formData = new FormData();
	formData.append("templateId", String(templateId));
	formData.append("extMapStr", extMapStr);
	formData.append("file", file);

	const resp: Types.ImportDataRes = await request
		.put(url, {
			body: formData,
			ignoreLoading: true,
		})
		.json();
	return resp;
}
