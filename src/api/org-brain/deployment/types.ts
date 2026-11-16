/**
 * 组织大脑 - 排兵布阵 API 类型定义
 * 字段命名与后端 BO/VO 保持一致；仅 rowKey / options 为前端 UI 扩展字段。
 */

import type { SelectProps } from "antd";

type SelectOptionItem = NonNullable<SelectProps["options"]>[number];

export enum DeploymentDeliveryStatusEnum {
	PENDING = "0",
	DELIVERED = "1",
	RESERVE_EXIT = "2",
	MANAGED_EXIT = "3",
}

export enum DeploymentStatusEnum {
	DEPLOYED = "1",
	PENDING = "2",
	OFFLINE_DEPLOYED = "3",
	DEPLOYING = "4",
}

export type ProjectTypeCode = "1" | "2";

/**
 * 排兵布阵项目列表项。
 *
 * 用于承接列表页单个项目的基础信息、交付状态与排布状态，
 * 供列表展示、详情跳转与导出标题组装等场景复用。
 *
 * @author 王善能
 * @since 2026-06-12
 */
export interface DeploymentItem {
	id: string;
	projectCode: string;
	projectName: string;
	projectGroupCode?: string;
	projectGroupName?: string;
	areaRegionCode?: string;
	areaRegionName?: string;
	areaCode?: string;
	areaName?: string;
	planDeliveryDate: string;
	deliveryArea: number;
	projectTypeCode: ProjectTypeCode;
	projectTypeName?: string;
	propertyTypeCode?: string;
	propertyTypeName?: string;
	deliveryStateCode: DeploymentDeliveryStatusEnum;
	deliveryStateName?: string;
	deployStatusCode: DeploymentStatusEnum;
	deployStatusName?: string;
	deployerCode: string;
	deployerName: string;
	lastDeployTime?: string;
	matchScore?: number;
}

export interface DeploymentListParams {
	pageNum?: number;
	pageSize?: number;
	projectName?: string;
	projectGroupCodes?: string[];
	areaRegionCodes?: string[];
	areaCodes?: string[];
	planDeliveryStart?: string;
	planDeliveryEnd?: string;
	projectTypeCodes?: ProjectTypeCode[];
	propertyTypeCodes?: string[];
	deliveryStateCodes?: DeploymentDeliveryStatusEnum[];
	deployStatusCodes?: DeploymentStatusEnum[];
	deployerCodes?: string[];
}

export interface DeploymentSearchOptions {
	projectOptions: Array<{ id: string; name: string }>;
	projectGroupOptions: Array<{ id: string; name: string }>;
	areaRegionOptions: Array<{ id: string; name: string }>;
	areaOptions: Array<{ id: string; name: string }>;
	propertyTypeOptions: Array<{ id: string; name: string }>;
	deployerOptions: Array<{ id: string; name: string }>;
}

export interface ProjectBasicInfo {
	projectGroupName?: string;
	province?: string;
	city?: string;
	area?: string;
	planDeliveryDate?: string;
	deliveryDate?: string;
	houseNumLiveRate?: number;
	deliveryArea?: number;
	projectTypeCode?: ProjectTypeCode;
	projectTypeName?: string;
	propertyTypeCode?: string;
	propertyTypeName?: string;
	projectGradeCode?: string;
	projectGradeName?: string;
	propertyFeeUnitPrice?: number;
	deliveryStandardCode?: string;
	deliveryStandardName?: string;
	projectCycleCode?: string;
	projectCycleName?: string;
	operationPlan?: string;
	specialProvisions?: string;
	totalHouseholds?: number;
	deliveryHouseholds?: number;
	gateCount?: number;
	greenArea?: number;
	cleaningArea?: number;
	matchScore?: number;
}

export interface BenchmarkProjectInfo extends ProjectBasicInfo {
	benchmarkProjectId: string;
	benchmarkProjectName: string;
}

/**
 * 排兵布阵预览工作经历项。
 *
 * 对应后端 workExperience 拆分后的单条记录结构，
 * 供预览表格与 PDF 导出快照复用。
 *
 * @author 王善能
 * @since 2026-06-12
 */
export interface DeploymentWorkExperienceItem {
	period?: string;
	orgName?: string;
	postName?: string;
	empName?: string;
	effectDate?: string;
	endEffectDate?: string;
	firstDeptcode?: string;
	firstDeptname?: string;
	depid?: string;
	deptname?: string;
	deptfullname?: string;
	postname?: string;
}

/**
 * 排兵布阵 PDF 导出矩阵行。
 *
 * 岗位矩阵配置与实际矩阵及差异在 snapshot 中统一使用组合岗位文案传输，
 * 导出模板直接渲染 `jobPositionLabel`。
 *
 * @author 王善能
 * @since 2026-06-12
 */
export interface DeploymentPdfMatrixRow {
	departmentLine?: string;
	authorizedJobName?: string;
	jobPositionLabel?: string;
	tagMatchModelName?: string;
	requiredCount?: number;
	_diff?: number;
}

/**
 * 排兵布阵预览方案人员行。
 *
 * 对应预览抽屉“最终方案选择”表格行，
 * 也是 PDF 导出快照中的人员明细结构。
 *
 * @author 王善能
 * @since 2026-06-12
 */
export interface DeploymentPreviewSchemePersonnelRow {
	departmentLine?: string;
	authorizedJobName?: string;
	jobPositionLabel?: string;
	staffCount?: number;
	empName?: string;
	cyear?: string;
	age?: number;
	graduationSchool?: string;
	education?: string;
	workExperience?: DeploymentWorkExperienceItem[];
}

/**
 * 岗位矩阵行内下拉选项。
 *
 * 该类型仅服务于前端编辑态表格，用于承接条线、编制岗位、岗位名称、
 * 职位名称与职级等列的可选项数据，不参与后端接口传输。
 *
 * @author 王善能
 * @since 2026-06-12
 */
export interface DeployPositionMatrixRowOptions {
	departmentLineOptions?: SelectOptionItem[];
	authorizedJobOptions?: SelectOptionItem[];
	jobOptions?: SelectOptionItem[];
	positionOptions?: SelectOptionItem[];
	positionLevelOptions?: SelectOptionItem[];
}

/**
 * 岗位矩阵展示行。
 *
 * 用于统一承接排兵布阵步骤一中的矩阵数据，并补充前端表格渲染需要的
 * `rowKey` 与 `options` 字段，供编辑、预览与导出链路复用。
 *
 * @author 王善能
 * @since 2026-06-12
 */
export interface DeployPositionMatrixRow {
	rowKey?: string;
	departmentLine?: string;
	authorizedJobId?: string;
	authorizedJobName?: string;
	jobCode?: string;
	jobName?: string;
	positionCode?: string;
	positionName?: string;
	positionLevel?: string;
	tagMatchModelId?: number | string;
	tagMatchModelName?: string;
	isManager?: boolean;
	budgetCount?: number;
	requiredCount?: number;
	options?: DeployPositionMatrixRowOptions;
}

/**
 * 岗位矩阵元数据。
 *
 * 用于承接岗位矩阵配置时的候选元信息，
 * 主要服务于行内联动选择与数据校验场景。
 *
 * @author 王善能
 * @since 2026-06-12
 */
export interface PositionMatrixMetaItem {
	jobTypeName: string;
	authorizedJobId?: string;
	authorizedJobName?: string;
	jobCode?: string;
	jobName?: string;
	postCode?: string;
	postName?: string;
	positionLevel?: string;
}

export interface ProjectStatistics {
	gateCount?: number;
	greenArea?: number;
	cleaningArea?: number;
	elevatorCount?: number;
	laborCostRatio?: number;
	profitRate?: number;
	collectionRate?: number;
}

/**
 * 排兵方案矩阵行。
 *
 * 用于描述单个方案下某一岗位的配置结果，
 * 包含岗位基础信息、人数以及已选人员明细，供方案切换与预览复用。
 *
 * @author 王善能
 * @since 2026-06-12
 */
export interface DeploySolutionMatrixRow {
	departmentLine: string;
	authorizedJobId?: string;
	authorizedJobName?: string;
	jobCode?: string;
	jobName: string;
	positionCode?: string;
	positionName: string;
	positionLevel: string;
	staffCount: number;
	staffConfigList: DeploymentPlanStaffConfigItem[];
}

/**
 * 排兵方案数据。
 *
 * 用于承接 AI 生成后的单个候选方案，
 * 包含方案编号、匹配分、人工成本、是否选中以及对应的岗位矩阵结果。
 *
 * @author 王善能
 * @since 2026-06-12
 */
export interface DeploySolution {
	solutionNo: number;
	matchScore: number;
	staffCost: number;
	choice: boolean;
	staffMatrixList: DeploySolutionMatrixRow[];
}

/**
 * 排兵布阵面板详情数据。
 *
 * 用于聚合步骤一矩阵详情、标杆信息、统计信息以及运行时方案数据，
 * 是步骤流转、预览抽屉和导出任务共享的核心上下文对象。
 *
 * @author 王善能
 * @since 2026-06-12
 */
export interface DeploymentDetail {
	id: string;
	projectCode?: string;
	projectName?: string;
	serverCode?: string;
	projectGroupCode?: string;
	projectGroupName?: string;
	deliveryStateName?: string;
	deployStatusName?: string;
	deployerCode?: string;
	deployerName?: string;
	lastDeployTime?: string;
	dataSource?: string;
	requestId?: string;
	projectInfo: ProjectBasicInfo;
	projectStatistics?: ProjectStatistics;
	benchmarkInfo?: BenchmarkProjectInfo;
	benchmarkStatistics?: ProjectStatistics;
	// 查看模式接口返回的最终方案质量分。
	matchScore?: number;
	// 标杆项目质量分，用于展示与导出质量对比结果。
	benchmarkQualityScore?: number;
	benchmarkPositionMatrixList?: DeployPositionMatrixRow[];
	projectPositionMatrixList: DeployPositionMatrixRow[];
	originProjectPositionMatrixList?: DeployPositionMatrixRow[];
	staffList?: DeploymentPlanStaffPreviewDetailResponse[];
	solutions?: DeploySolution[];
}

/**
 * 岗位矩阵详情接口响应。
 *
 * 用于承接步骤一初始化时返回的项目基础信息、标杆信息与岗位矩阵数据，
 * 作为前端归一化转换前的原始接口结构。
 *
 * @author 王善能
 * @since 2026-06-12
 */
export interface PositionMatrixDetailResponse {
	id?: number;
	projectCode?: string;
	projectName?: string;
	serverCode?: string;
	projectGroupCode?: string;
	projectGroupName?: string;
	province?: string;
	city?: string;
	area?: string;
	deliveryArea?: number;
	projectTypeName?: string;
	propertyTypeName?: string;
	projectGradeName?: string;
	propertyFeeUnitPrice?: number;
	deliveryStandardName?: string;
	projectCycleName?: string;
	operationPlan?: string;
	specialProvisions?: string;
	totalHouseholds?: number;
	deliveryHouseholds?: number;
	gateCount?: number;
	elevatorCount?: number;
	greenArea?: number;
	cleaningArea?: number;
	hrCostPercent?: number;
	profitRate?: number;
	collectionRate?: number;
	planDeliveryDate?: string;
	deliveryDate?: string;
	houseNumLiveRate?: number;
	deliveryStateName?: string;
	deployStatusName?: string;
	deployerCode?: string;
	deployerName?: string;
	lastDeployTime?: string;
	dataSource?: string;
	matchScore?: number;
	benchmarkQualityScore?: number;
	benchmarkProject?: Omit<
		PositionMatrixDetailResponse,
		| "benchmarkProject"
		| "benchmarkPositionMatrixList"
		| "projectPositionMatrixList"
		| "originProjectPositionMatrixList"
	>;
	benchmarkPositionMatrixList?: PositionMatrixRowResponse[];
	projectPositionMatrixList?: PositionMatrixRowResponse[];
	originProjectPositionMatrixList?: PositionMatrixRowResponse[];
	staffList?: DeploymentPlanStaffPreviewDetailResponse[];
}

export interface PositionMatrixRowResponse {
	departmentLine?: string;
	authorizedJobId?: string;
	authorizedJobName?: string;
	jobCode?: string;
	jobName?: string;
	positionCode?: string;
	positionName?: string;
	positionLevel?: string;
	requiredCount?: number;
	budgetCount?: number;
	tagMatchModelId?: number | string | null;
	tagMatchModelName?: string | null;
}

/**
 * 排兵方案中的人员配置明细响应。
 *
 * 用于承接候选人员推荐、人员替换以及方案保存时的单条人员配置数据，
 * 供步骤二 AI 排兵、步骤三方案确认与预览导出链路复用。
 *
 * @author 王善能
 * @since 2026-06-12
 */
export interface DeploymentPlanStaffConfigResponse {
	id?: number;
	projectId?: number;
	requestId?: number;
	solutionNo?: number;
	matrixId?: number;
	departmentLine?: string;
	jobCode?: string;
	jobName?: string;
	positionCode?: string;
	positionName?: string;
	positionLevel?: string;
	isManager?: number;
	empCode?: string;
	empName?: string;
	recommendId?: number;
	cyear?: string;
	age?: number;
	education?: string;
	graduationSchool?: string;
	workExperience?: string;
	staffCost?: number;
	matchScore?: number;
	checked?: string;
	sortOrder?: number;
}

export interface DeploymentStaffTreeNodeResponse {
	id?: string;
	parentId?: string;
	name?: string;
	weight?: number;
	staffCount?: number;
	staffConfigs1?: DeploymentPlanStaffConfigResponse[];
	staffConfigs2?: DeploymentPlanStaffConfigResponse[];
	extra?: {
		staffCount?: number;
		staffConfigs1?: DeploymentPlanStaffConfigResponse[];
		staffConfigs2?: DeploymentPlanStaffConfigResponse[];
	};
	children?: DeploymentStaffTreeNodeResponse[];
}

/**
 * AI 排兵请求项。
 *
 * 用于向 AI 排兵接口提交单条岗位需求，
 * 包含岗位标识、匹配模型与目标配置人数。
 *
 * @author 王善能
 * @since 2026-06-12
 */
export interface DeploymentAiStaffRequestItem {
	jobCode: string;
	positionCode: string;
	tagMatchModelId: number;
	requiredCount: number;
}

export interface DeploymentStaffTreeNode {
	id: string;
	parentId?: string;
	name: string;
	weight?: number;
	extra?: {
		staffCount?: number;
		staffConfigs1?: DeploymentPlanStaffConfigItem[];
		staffConfigs2?: DeploymentPlanStaffConfigItem[];
	};
	children?: DeploymentStaffTreeNode[];
}

export interface DeploymentPlanStaffConfigItem {
	projectId?: number;
	requestId?: number;
	solutionNo?: number;
	matrixId?: number;
	departmentLine?: string;
	jobCode?: string;
	jobName?: string;
	positionCode?: string;
	positionName?: string;
	positionLevel?: string;
	isManager?: number;
	empCode?: string;
	empName?: string;
	recommendId?: number;
	cyear?: string;
	age?: number;
	education?: string;
	graduationSchool?: string;
	workExperience?: string;
	staffCost?: number;
	matchScore?: number;
	checked?: string;
	sortOrder?: number;
}

/**
 * 排兵布阵预览人员明细响应。
 *
 * 用于承接预览抽屉“最终方案选择”表格中的单条人员记录，
 * 后续会继续映射为页面展示行与 PDF 导出快照中的人员明细数据。
 *
 * @author 王善能
 * @since 2026-06-12
 */
export interface DeploymentPlanStaffPreviewDetailResponse {
	departmentLine?: string;
	authorizedJobName?: string;
	jobCode?: string;
	jobName?: string;
	positionCode?: string;
	positionName?: string;
	positionLevel?: string;
	isManager?: number;
	empCode?: string;
	empName?: string;
	recommendId?: number;
	cyear?: string;
	age?: number;
	education?: string;
	graduationSchool?: string;
	workExperience?: string;
	staffCost?: number;
	matchScore?: number;
	individualQualityScore?: number;
}

/**
 * 排兵布阵方案预览详情响应。
 *
 * 当前预览抽屉主要使用 `staffList` 承接最终方案的人员明细，
 * 该结构同时作为页面预览与 PDF 导出数据组装的接口边界。
 *
 * @author 王善能
 * @since 2026-06-12
 */
export interface DeploymentPlanPreviewDetailResponse {
	staffList?: DeploymentPlanStaffPreviewDetailResponse[];
	originProjectPositionMatrixList?: PositionMatrixRowResponse[];
	projectPositionMatrixList?: PositionMatrixRowResponse[];
}

/**
 * 归一化后的排兵布阵方案预览详情。
 *
 * 由预览详情接口响应转换而来，供预览抽屉与 PDF 导出复用。
 *
 * @author 王善能
 * @since 2026-07-02
 */
export interface DeploymentPlanPreviewDetail {
	staffList: DeploymentPlanStaffPreviewDetailResponse[];
	originProjectPositionMatrixList: DeployPositionMatrixRow[];
	projectPositionMatrixList: DeployPositionMatrixRow[];
}

/**
 * 方案人员信息入参。
 *
 * 用于预览、保存、提交接口透传单条人员与岗位矩阵的绑定关系。
 *
 * @author 王善能
 * @since 2026-06-30
 */
export interface DeploymentSolutionStaffPayloadItem {
	matrixId?: number;
	empCode?: string;
}

/**
 * 排兵布阵 PDF 导出快照请求体。
 *
 * 该结构会直接透传到后端 PDF 导出任务，
 * 需要与预览抽屉展示字段保持一致。
 *
 * @author 王善能
 * @since 2026-06-12
 */
export interface ExportDeploymentPdfPayload {
	project: DeploymentItem;
	detail: DeploymentDetail | null;
	title?: string;
	preview?: DeploymentPdfPreviewSnapshot;
}

/**
 * 排兵布阵 PDF 导出预览快照。
 *
 * 与预览抽屉三块表格一一对应，由前端统一组装后透传后端。
 *
 * @author 王善能
 * @since 2026-07-02
 */
export interface DeploymentPdfPreviewSnapshot {
	/** 岗位矩阵配置 */
	matrixRows: DeploymentPdfMatrixRow[];
	/** 实际矩阵及差异 */
	actualMatrixRows: DeploymentPdfMatrixRow[];
	/** 当前页面展示的最终方案编号 */
	schemeNo?: number;
	/** 当前页面展示的最终方案质量分 */
	matchScore?: number;
	/** 当前页面展示的最终方案矩阵 */
	schemeRows?: DeploymentPdfMatrixRow[];
	/** 最终方案人员 */
	schemePersonnelRows: DeploymentPreviewSchemePersonnelRow[];
}

/**
 * 排兵布阵持久化请求体。
 *
 * `deploy/save` 暂存草稿与 `deploy/commit` 保存提交共用该结构，
 * 用于提交当前岗位矩阵及人员配置结果。
 *
 * @author 王善能
 * @since 2026-06-12
 */
export interface DeploySaveForm {
	projectId: number;
	benchmarkProjectId?: number;
	requestId?: number;
	solutionNo?: number;
	/** 前端计算的质量分，提交最终方案时回传 */
	matchScore?: number;
	positionMatrixList: Array<{
		departmentLine?: string;
		authorizedJobId?: string;
		authorizedJobName?: string;
		jobCode?: string;
		jobName?: string;
		positionCode?: string;
		positionName?: string;
		positionLevel?: string;
		requiredCount?: number;
		budgetCount?: number;
		tagMatchModelId?: number;
		tagMatchModelName?: string;
	}>;
	staffConfigSaveForm?: {
		staffConfig1: DeploymentSolutionStaffPayloadItem[];
		staffConfig2: DeploymentSolutionStaffPayloadItem[];
	};
}
