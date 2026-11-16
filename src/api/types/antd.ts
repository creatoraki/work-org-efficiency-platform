/**
 * Ant Design 经典数据结构类型定义
 * 供所有 API 子文件夹使用
 */

import type { DefaultOptionType as CascaderOption } from "antd/es/cascader";
import type { DefaultOptionType } from "antd/es/select";

/**
 * 严格的选项类型（label 必须是 string）
 * 用于 Select、AutoComplete 等组件
 */
export interface StrictOptionType {
	label: string;
	value: string;
	disabled?: boolean;
}

/**
 * 树节点类型
 * 用于 Tree 组件
 */
export interface TreeNodeType {
	title: string;
	key: string;
	children?: TreeNodeType[];
	disabled?: boolean;
	selectable?: boolean;
	checkable?: boolean;
}

/**
 * 表格列配置类型
 * 用于 Table 组件
 */
export interface TableColumnType {
	title: string;
	dataIndex: string;
	key: string;
	width?: number;
	fixed?: "left" | "right";
	align?: "left" | "center" | "right";
	sorter?: boolean | ((a: any, b: any) => number);
	filters?: Array<{ text: string; value: string }>;
	onFilter?: (value: string, record: any) => boolean;
	render?: (value: any, record: any, index: number) => React.ReactNode;
}

/**
 * 表单字段类型
 * 用于 Form 组件
 */
export interface FormFieldType {
	name: string;
	label: string;
	type: "input" | "select" | "cascader" | "tree" | "date" | "dateRange" | "number" | "textarea";
	required?: boolean;
	placeholder?: string;
	options?: StrictOptionType[] | CascaderOption[] | TreeNodeType[];
	rules?: Array<{ required?: boolean; message?: string; pattern?: RegExp }>;
}

/**
 * 分页参数类型
 */
export interface PaginationParams {
	pageNum: number;
	pageSize: number;
	total?: number;
}

/**
 * 搜索参数类型
 */
export interface SearchParams {
	q?: string;
	pageNum?: number;
	pageSize?: number;
}

/**
 * 级联选择器选项类型（严格版本）
 */
export interface StrictCascaderOption {
	label: string;
	value: string;
	children?: StrictCascaderOption[];
	disabled?: boolean;
}

/**
 * 选择器选项类型（兼容 Ant Design 原生类型）
 */
export type SelectOptionType = DefaultOptionType;

/**
 * 级联选择器选项类型（兼容 Ant Design 原生类型）
 */
export type CascaderOptionType = CascaderOption;

/**
 * 树选择器选项类型（兼容 Ant Design 原生类型）
 */
export type TreeOptionType = TreeNodeType;
