/**
 * 导出模板配置页面类型定义
 */

import type {
	ExcelConfigItem,
	QueryStructure,
	ResultStructure,
	UpdateExcelConfigParams,
} from "#src/api/file/export-config";

// 直接复用 API 类型
export type { ExcelConfigItem, QueryStructure, ResultStructure, UpdateExcelConfigParams };

/**
 * 搜索表单值
 */
export interface SearchFormValues {
	/** 文件名 */
	fileName?: string;
	/** 所属模块 */
	module?: string;
}

/**
 * Drawer 状态
 */
export interface DrawerState {
	/** 是否显示 */
	visible: boolean;
	/** 模式: 新增或编辑 */
	mode: "create" | "edit";
	/** 编辑时的记录数据 */
	record?: ExcelConfigItem;
}

/**
 * JSON 字段编辑器的通用项
 */
export interface JsonFieldItem {
	key: string;
	value: any;
}
