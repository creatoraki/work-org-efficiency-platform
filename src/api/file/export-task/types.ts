/**
 * 导出任务管理相关类型定义
 */

import type { PageParams } from "../types";

/**
 * 通用导出参数
 */
export interface CommonExportParams {
	excelId: number;
	reqCondition?: Record<string, any>;
	exportTableHead?: Record<string, any>[];
}

/**
 * 文件导出信息查询参数
 */
export interface FetchFileInfoListParams extends PageParams {
	name?: string;
	module?: string;
	status?: number;
	startDate?: Date | string;
	endDate?: Date | string;
}

/**
 * 文件导出信息项
 */
export interface FileInfoItem {
	id: number;
	name: string;
	module: string;
	fileSize: number;
	fileSizeStr?: string;
	status: number;
	statusStr: string;
	progress: string;
	remark: string;
	bucketName: string;
	updateTime: string;
	createTime: string;
	errorMessage?: string;
}

export enum PdfBizType {
	ORG_BRAIN_DEPLOYMENT = "ORG_BRAIN_DEPLOYMENT",
	EFFICIENCY_CONTROL_ANALYSIS = "EFFICIENCY_CONTROL_ANALYSIS",
	EFFICIENCY_CONTROL_WARNING_CENTER = "EFFICIENCY_CONTROL_WARNING_CENTER",
}

export interface PdfTaskPayload {
	bizType: PdfBizType;
	title: string;
	snapshot: Record<string, any>;
}

export interface PdfTaskCreateResult {
	taskId: number;
	status: number;
	taskName: string;
}
