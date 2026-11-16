// target-plan API 相关的类型定义

// 名称检查响应
export interface CheckNameResponse {
	exists: boolean;
}

// 可分解对象参数
export interface SubmitIndicatorTargetDecompositionObjectsParams {
	targetPlanId?: number | string;
	effTaskIndicatorSubmitId?: number | string;
	targetOrgCode?: string;
	targetOrgName?: string;
	suspendedVersion?: string;
	delIds?: (string | number)[];
	kstT?: Record<string, any>;
}

// 主责人参数
export interface SubmitIndicatorTargetDecompositionMainResponsibleParams {
	id?: number | string;
	responsibleUserId?: number | string;
	suspendedVersion?: string;
	sourceNewB?: boolean;
	suspendedEditId?: number | string;
}

// 拆解指标分页参数
export interface FetchIndicatorTargetDecompositionMainResponsibleDecomposingIndicatorsPageParams {
	pageNum: number;
	pageSize: number;
	effTaskIndicatorConfId?: number | string;
	responsibleDepartmentCode?: string;
	name?: string;
}

// 指标下达配置指标分页参数
export interface IndicatorConfDetailsCorrelationMetricsIndicatorPageParams {
	/* 页码(不能为空) */
	pageNum: number;

	/* 每页数量(不能为空) */
	pageSize: number;

	/* 是否查询总条数 */
	searchCount?: boolean;

	/* 排序字段集合 */
	sortItemList?: {
		/* true正序|false倒序 */
		isAsc: boolean;

		/* 排序字段 */
		column: string;
	}[];

	/* 指标下达总任务id */
	effTaskIndicatorConfId: number;

	/* 主责部门code */
	responsibleDepartmentCode?: string;

	/* 指标名称 */
	name?: string;

	/* 	是否全部数据 ：true 是 false:已提交 默认为false */
	allRecords?: boolean;

	/* 待排除配置指标ids */
	indicatorConfDetailsExcludeIds?: Record<string, unknown>[];
}

// 指标下达配置指标列表参数
export interface IndicatorConfDetailsCorrelationMetricsIndicatorListParams {
	/* 指标下达总任务id */
	effTaskIndicatorConfId: number;

	/* 主责部门code */
	responsibleDepartmentCode?: string;

	/* 指标名称 */
	name?: string;

	/* 是否全部数据 ：true 是 false:默认已提交 */
	allRecords?: boolean;

	/* 待排除配置指标ids */
	indicatorConfDetailsExcludeIds?: Record<string, unknown>[];
}

// 指标下达配置指标分页条目
export interface IndicatorConfDetailsCorrelationMetricsIndicatorItem {
	/* id */
	id: number;

	/* 指标id */
	indicatorId: number;

	/* 主责部门 */
	responsibleDepartment: string;

	/* 数据单位 */
	unitName: string;

	/* 指标定义及口径 */
	definition: string;

	/* 指标名称 */
	name: string;
}

// 指标下达配置指标列表响应
export type IndicatorConfDetailsCorrelationMetricsIndicatorListRes = ApiResponse<
	{
		/* id */
		id: number;

		/* 指标id */
		indicatorId: number;

		/* 主责部门 */
		responsibleDepartment: string;

		/* 数据单位 */
		unitName: string;

		/* 指标定义及口径 */
		definition: string;

		/* 指标名称 */
		name: string;

		/* 联动指标状态 */
		tag: number;
	}[]
>;

// 拆解指标参数
export interface SubmitIndicatorTargetDecompositionMainResponsibleDecomposingIndicatorsParams {
	id?: number | string;
	suspendedVersion?: string;
	indicatorConfDetailIdList?: (number | string)[];
	sourceNewB?: boolean;
	suspendedEditId?: number | string;
}

// 主责人提交参数
export interface SubmitIndicatorTargetDecompositionMainResponsibleSubmitParams {
	effTaskIndicatorSubmitId?: number | string;
	targetPlanId?: number | string;
	startTime?: string;
	deadline?: string;
	remark?: string;
	status?: number;
	suspendedVersion?: string;
	effTaskIndicatorSubmitUserDelIds?: (number | string)[];
	kstT?: Record<string, any>;
}

// 可分解对象编辑参数
export interface SubmitIndicatorTargetDecompositionObjectsEditParams {
	id?: number | string;
	targetPlanId?: number | string;
	effTaskIndicatorSubmitId?: number | string;
	targetOrgCode?: string;
	targetOrgName?: string;
	suspendedVersion?: string;
	sourceNewB?: boolean;
	suspendedEditId?: number | string;
	delIds?: (string | number)[];
	kstT?: Record<string, any>;
}

// 拆解指标列表参数
export interface FetchIndicatorTargetDecompositionMainResponsibleDecomposingIndicatorsListParams {
	effTaskIndicatorSubmitUserId?: number | string;
	sourceNewB?: boolean;
	suspendedVersion?: number | string;
	suspendedEditId?: number | string;
}

// 指标名称参数
export interface FetchIndicatorNameParams {
	effTaskIndicatorSubmitUserId?: number | string;
}

// 拆解指标名称列表响应
export type SubmitUserViewDataV1IndicatorNameRes = ApiResponse<
	{
		/* 拆解指标id */
		id: number;

		/* 指标名称 */
		indicatorName: string;

		/* 标签 */
		tag: number;
	}[]
>;

// 拆解对象树节点
export interface IndicatorTargetDecompositionObjectsTree {
	id: string;
	name: string;
	parentCode: string;
	canChoose: boolean;
	fullRoadStrength: string;
	data: Record<string, any>;
	children: IndicatorTargetDecompositionObjectsTree[];
}

// 拆解对象树参数
export interface FetchIndicatorTargetDecompositionObjectsTreeParams {
	effTaskIndicatorSubmitId?: number | string;
}

// 撤销发布参数
export interface UndoPublishFlowParams {
	id: number | string;
}

// 目标计划详情
export interface TargetPlan {
	/* 主键id */
	id: number;

	/* 名称 */
	name: string;

	/* 周期-年 */
	year: string;

	/* 子周期 */
	subperiod: number;

	/* 子周期名称 */
	subperiodName: string;

	/* 目标周期 */
	targetCycle: string;

	/* 锁标识 */
	synVersion: number;

	/* 备注 */
	remark: string;
}

// 目标计划详情参数
export interface FetchTargetPlanDetailParams {
	id?: string | number;
}

// 查看数据表头参数
export interface ViewDataHeadParams {
	/* 目标计划id */
	effTargetPlanId: number;

	/* 指标id */
	indicatorId?: number;
}

// 查看数据表头响应
export interface ViewDataHeadRes {
	/* id */
	id: number;

	/* 名称 */
	name: string;
}

// 查看数据响应
export interface ViewDataRes {
	/* 数据单位 */
	unitName: string;

	/* 项目类型 */
	orgCodeStatus: string;

	/* 项目类型 */
	orgCodeStatusStr: string;

	/* 拆解对象id */
	targetOrgCode: string;

	/* 拆解对象名称 */
	targetOrgName: string;

	/* 指标名称 */
	indicatorName: string;

	/* 负责人姓名 */
	responsiblePersonName: string;

	/* 年度目标值 */
	annualTargetValue: number;

	/* 规划k:周期code ,v:值 */
	periodMap: Record<string, unknown>;

	/* 上级汇总权重 */
	parentSummaryWeight: number;

	/* 备注 */
	remarks: string;

	/* 子结点信息 */
	children: string;
}

// 查看数据参数
export interface FetchTargetPlanViewDataParams {
	/* 目标计划id */
	targetPlanId: number;

	/* 拆解对象code */
	targetOrgCode?: string;

	/* 指标id */
	indicatorId?: number;

	/* 主责人姓名 */
	responsibleUserName?: string;
}

// (分页)指标库 for 目标计划参数
export interface PageForTargetPlanParams extends PaginationParams {
	/* 指标名称 */
	name?: string;

	/* 主责部门Code，枚举值[IndicatorResponsibleDepartmentCode]。公共接口，根据当前枚举值进行获取对应值信息 */
	responsibleDepartmentCode?: number;

	/* 指标类型 0:基础指标 1：复合指标 */
	type?: number;

	/* 上线状态 0:未上线 1：已上线 */
	onlineStatus?: number;

	/* 创建者 */
	createByName?: string;

	/* 更新者 */
	updateByName?: string;

	/* 目标计划ID */
	targetPlanId?: number;
}

// (分页)指标库 for 目标计划条目
export interface PageForTargetPlanItem {
	/* 删除标志 */
	delFlag: string;

	/* 创建者 */
	createBy: string;

	/* 创建者 */
	createByName: string;

	/* 更新者 */
	updateBy: string;

	/* 更新者 */
	updateByName: string;

	/* 创建时间 */
	createTime: Record<string, unknown>;

	/* 更新时间 */
	updateTime: Record<string, unknown>;

	/* 主键id */
	id: number;

	/* 指标类型 0:基础指标 1：复合指标 */
	type: number;

	/* 指标名称 */
	name: string;

	/* 主责部门 */
	responsibleDepartmentCode: number;

	/* 主责部门 */
	responsibleDepartment: string;

	/* 指标说明 */
	remark: string;

	/* 数据类型 0:数值 1:百分比 */
	dataType: number;

	/* 小数位数 */
	decimalDigits: number;

	/* 数据单位 */
	unit: number;

	/* 数据单位 */
	unitName: string;

	/* 数据范围开始 */
	dataRangeStart: number;

	/* 数据范围结束 */
	dataRangeEnd: number;

	/* 指标定义及口径 */
	definition: string;

	/* 上线状态 0:未上线 1：已上线 */
	onlineStatus: number;

	/* 锁标识 */
	synVersion: number;
}

// (分页)指标库 for 目标计划响应
export type PageForTargetPlanRes = ApiListResponse<PageForTargetPlanItem>;
