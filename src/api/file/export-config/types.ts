/**
 * Excel 配置管理相关类型定义
 */

import type { PageParams } from "../types";

/**
 * Excel配置查询参数
 */
export type FetchExcelConfigListParams = PageParams;

/**
 * Excel配置查询结构
 */
export interface QueryStructure {
	pageNumMap?: Record<string, any>;
	pageSizeMap?: Record<string, any>;
	countMap?: Record<string, any>;
}

/**
 * Excel配置返回结构
 */
export interface ResultStructure {
	totalNumPath?: Record<string, any>[];
	dataPath?: Record<string, any>[];
}

/**
 * Excel配置项
 */
export interface ExcelConfigItem {
	id: number;
	excelId: number;
	fileName: string;
	module: string;
	dataReqUrl: string;
	reqCondition?: Record<string, any>;
	queryStructure: QueryStructure;
	resultStructure: ResultStructure;
	exportTableHead: Record<string, any>[];
	topHeaders: Record<string, any>[];
	createTime: Date | string;
}

/**
 * 修改/新增Excel配置参数
 */
export interface UpdateExcelConfigParams {
	id?: number;
	excelId?: number;
	fileName: string;
	module: string;
	dataReqUrl: string;
	reqCondition?: Record<string, any>;
	queryStructure?: QueryStructure;
	resultStructure?: ResultStructure;
	exportTableHead?: Record<string, any>[];
	topHeaders?: Record<string, any>[];
	delFlag?: string;
	createBy?: string;
	createByName?: string;
	updateBy?: string;
	updateByName?: string;
	createTime?: Date | string;
	updateTime?: Date | string;
}
