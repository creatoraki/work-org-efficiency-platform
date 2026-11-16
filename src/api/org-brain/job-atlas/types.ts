/**
 * 组织大脑 - 岗位图谱 API 类型定义
 */

/** 下拉选项 */
export interface JobAtlasOption {
	label: string;
	value: string;
}

/** 基础信息 */
export interface JobAtlasBaseInfo {
	jobTreeCount: number;
	fieldTreeCount: number;
	filterOptions: {
		groups: JobAtlasOption[];
		sequenceTypes: JobAtlasOption[];
		benchmarkJobs: JobAtlasOption[];
	};
}

/** 矩阵查询参数 */
export interface JobAtlasMatrixQueryParams {
	groupIds?: number[];
	sequenceTypeCodes?: string[];
	benchmarkPostgradePairs?: string[];
}

/** 矩阵单元格 */
export interface JobAtlasMatrixCell {
	/** 职级项ID（为空表示该职级无配置） */
	gradeItemId: number | null;
	/** 职级项名称 */
	gradeItemName: string | null;
	/** 职级ID */
	postgradeId: number;
	/** 职级名称 */
	postgradeName: string;
	/** 单元格是否可点击查看详情 */
	clickable: boolean;
}

/** 矩阵列 */
export interface JobAtlasMatrixColumnMeta {
	/** 列标题 */
	title: string;
	/** 行数据字段名 */
	dataIndex: string;
	/** 列唯一键 */
	key: string;
	/** 固定列位置 */
	fixed?: "left" | "right" | null;
}

/** 矩阵行 */
export interface JobAtlasMatrixRow {
	/** 序列编码（如 P/G） */
	sequenceTypeCode?: string;
	/** 序列名称（如 专业类(P类)） */
	sequenceTypeName?: string;
	/** 基准岗ID */
	benchmarkId?: number;
	/** 基准岗名称 */
	benchmarkName?: string;
	/** 基准岗描述 */
	benchmarkDescription?: string;
	/** 是否失效（0-有效；1-失效） */
	isDisabled?: number;
	/** 职级数量 */
	gradeCount: number;
	/** 动态字段（pg_* 等） */
	[key: string]: string | number | JobAtlasMatrixCell | undefined;
}

/** 矩阵响应 */
export interface JobAtlasMatrixData {
	columnMeta: JobAtlasMatrixColumnMeta[];
	rows: JobAtlasMatrixRow[];
}

/** 薪资带宽单元 */
export interface JobAtlasSalaryBandCell {
	rowCode: string;
	rowName: string;
	colCode: string;
	colName: string;
	postgradeId: number | null;
	text: string;
	isCurrent?: boolean;
}

/** 基准岗抽屉-任职标准项 */
export interface JobAtlasBenchmarkStandardItem {
	gradeItemId: number;
	gradeItemName: string;
	postgradeId: number;
	postgradeName: string;
	education: string;
	discipline: string;
	talentDevelopment: string;
	performanceEfficiency: string;
	employeeRelation: string;
	adminProcurement: string;
	responsibilityContribution: string;
	resultOutput: string;
	effectiveCommunication: string;
	toolsCapability: string;
	knowledgeExperience: string;
	recommendedCertificate: string;
	managementScope: string;
}

/** 基准岗详情 */
export interface JobAtlasBenchmarkDetail {
	standardList: JobAtlasBenchmarkStandardItem[];
	salaryBandList: JobAtlasSalaryBandCell[];
}

/** 职级项详情 */
export interface JobAtlasGradeItemDetail {
	gradeItemId: number;
	gradeItemName: string;
	education: string;
	discipline: string;
	talentDevelopment: string;
	performanceEfficiency: string;
	employeeRelation: string;
	adminProcurement: string;
	responsibilityContribution: string;
	resultOutput: string;
	effectiveCommunication: string;
	toolsCapability: string;
	knowledgeExperience: string;
	recommendedCertificate: string;
	managementScope: string;
	salaryBandList: JobAtlasSalaryBandCell[];
}
