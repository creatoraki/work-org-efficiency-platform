/** Excel导出参数 */
export interface ExportExcelParams {
	/** 导出的数据 */
	data: Record<string, any>[];
	/** 文件名（不含扩展名） */
	fileName: string;
	/** Sheet 名称 */
	sheetName?: string;
}

/** 文件导入参数 */
export interface ImportFileParams {
	/** 要导入的文件对象 */
	file: File;
	/** 导入类型：excel、csv等 */
	fileType?: "excel" | "csv";
	/** 模板ID（可选） */
	templateId?: number;
	/** 扩展映射字符串（可选） */
	extMapStr?: string;
}

/** 文件导入结果 */
export interface ImportFileResult {
	/** 是否导入成功 */
	success: boolean;
	/** 导入的记录数 */
	count?: number;
	/** 错误信息 */
	errorMessage?: string;
	/** 导入详情 */
	details?: Record<string, any>;
}

/** 文件下载参数 */
export interface DownloadFileParams {
	/** 文件URL */
	url: string;
	/** 下载的文件名 */
	fileName?: string;
	/** 是否在新窗口打开 */
	openInNewWindow?: boolean;
}

/** 文件下载结果 */
export interface DownloadFileResult {
	/** 是否下载成功 */
	success: boolean;
	/** 下载的blob数据（可选） */
	blob?: Blob;
	/** 错误信息 */
	errorMessage?: string;
}

/**
 * 分页参数通用接口
 */
export interface PageParams {
	pageNum: number;
	pageSize: number;
	searchCount?: boolean;
	sortItemList?: {
		isAsc: boolean;
		column: string;
	}[];
}
