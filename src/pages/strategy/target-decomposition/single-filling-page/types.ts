/**
 * 树节点数据结构
 */
export interface DataNode {
	key: string | number;
	title: React.ReactNode;
	children?: DataNode[];
	fillInLabels?: string;
	unitName?: string;
	selectable?: boolean;
	[key: string]: unknown;
}

/**
 * 表格行数据结构
 */
export interface Row {
	id: string | number;
	key?: string | number;
	targetOrgName?: string;
	targetOrgCode?: string;
	responsiblePersonName?: string;
	responsiblePersonId?: string | number;
	samePeriodValue?: number;
	referenceValue?: number;
	annualTargetValue?: number;
	annualTargetValueChange?: number;
	deviationValue?: number;
	parentSummaryWeight?: number;
	remarks?: string;
	treeElement?: number;
	updateByName?: string;
	updateTime?: string;
	statusStr?: string;
	children?: Row[];
	isSummary?: boolean;
	isRoot?: boolean;
	orgCodeStatus?: string;
	orgCodeStatusStr?: string;
	deviationFormulaFlag?: number;
	basicIndicator?: Record<number, BasicIndicatorValue>;
	periodicReporting?: Record<string, PeriodicReportingValue>;
}

/**
 * 基础指标值
 */
export interface BasicIndicatorValue {
	id?: string | number;
	value?: number;
	adjustmentValue?: number;
	supportAdjustment?: number;
}

/**
 * 周期上报值
 */
export interface PeriodicReportingValue {
	id?: string | number;
	periodCode?: number;
	resultValue?: number;
	supportModify?: number;
}

/**
 * 指标配置
 */
export interface IndicatorConfig {
	id: number;
	name: string;
}

/**
 * 周期配置
 */
export interface PeriodConfig {
	id: number;
	name: string;
}

/**
 * 字段统计信息
 */
export interface FieldStats {
	obj: string;
	subLeft: string;
	indicator: string;
	target: string;
	gap: string;
	gapDesc: string;
}

/**
 * 锁定状态信息
 */
export interface LockInfo {
	lockStatus: number;
	curEditor?: string | number;
	curEditorName?: string;
}

/**
 * 汇总行数据
 */
export interface SummaryRowData extends Row {
	id: "SUMMARY_ROW";
	isSummary: true;
}

/**
 * 拆解对象选择节点
 */
export interface DisassembleTreeNode {
	title: string;
	key: string;
	children?: DisassembleTreeNode[];
	disabled?: boolean;
	name?: string;
	id?: string | number;
	code?: string;
	canChoose?: boolean;
	fullRoadStrength?: string;
}

/**
 * 拆解提交配置
 */
export interface DisassembleSubmitConfig {
	targetOrgName: string;
	fullRoadStrength: string;
}

/**
 * 分页参数
 */
export interface PaginationParams {
	pageNum: number;
	pageSize: number;
}

/**
 * 编辑单元格组件属性
 */
export interface EditableCellProps {
	value: number | null | undefined;
	id: string | number;
	onSave: (id: string | number, val: number | null) => void;
}

/**
 * 动态列配置
 */
export interface DynamicColumnConfig {
	title: string;
	children?: Array<{
		title: string;
		key: string;
		width: number;
		render: (text: unknown, record: Row) => React.ReactNode;
	}>;
}
