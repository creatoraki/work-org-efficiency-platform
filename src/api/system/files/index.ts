import type { ExportExcelTemplateParams, ImportExcelDataParams } from "./types";
import { request } from "#src/utils";

/**
 * Excel模板导出
 * @param params 导出参数
 * @param params.templateId 模板ID
 * @returns 导出的Excel文件（Blob）
 */
export async function strategyExcelTemplateExport(
	params: ExportExcelTemplateParams,
): Promise<Blob> {
	return request
		.post("excel/template/export", {
			json: params,
			errorMessage: true,
		})
		.blob();
}

/**
 * Excel数据导入(战略拆解)
 * @param params 导入参数
 * @param params.templateId 模板ID
 * @param params.extMapStr 扩展映射字符串
 * @param params.file 文件对象
 * @returns 导入结果
 */
export async function strategyExcelDataImport(params: ImportExcelDataParams): Promise<boolean> {
	const { templateId, extMapStr, file } = params;

	const formData = new FormData();
	formData.append("templateId", String(templateId));
	formData.append("extMapStr", extMapStr);
	formData.append("file", file);

	const resp = await request
		.post("excel/import/data", {
			body: formData,
			errorMessage: true,
			successMessage: "导入成功",
		})
		.json();

	return resp;
}
