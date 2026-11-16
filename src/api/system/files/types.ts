/** Excel模板导出参数 */
export interface ExportExcelTemplateParams {
	/** 模板ID */
	templateId: number;
	/** 扩展对象字符串 */
	extObj?: string;
}

/** Excel数据导入参数 */
export interface ImportExcelDataParams {
	/** 模板ID */
	templateId: number;
	/** 扩展映射字符串 */
	extMapStr: string;
	/** 文件对象 */
	file: File;
}
