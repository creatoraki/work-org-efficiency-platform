// 参考同期值导入分页参数
export interface ReferenceSamePeriodValueImportPageParams {
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

	/* 指标配置任务明细表id */
	effTaskIndicatorConfDetailsId: number;

	/* 指标配置任务明细表--参考设置表id */
	effTaskIndicatorConfDetailsReferenceId: number;

	/* 前端提供悬空版本 */
	suspendedVersion?: string;

	/* 删除数据ids */
	importDelIds?: Record<string, unknown>[];

	/* 导入类型,1:覆盖导入 2:修改导入 */
	excelType?: number;

	/* */
	kstT?: Record<string, unknown>;
}

export interface ReferenceSamePeriodValueImportPageResItem {
	/* 主键id */
	id: number;

	/* 主数据code */
	targetOrgCode: string;

	/* 主数据名称 */
	targetOrgName: string;

	/* 同期值 */
	samePeriodValue: number;

	/* 前端提供悬空版本 */
	suspendedVersion: string;
}

export interface ReferenceSamePeriodValueImportPageRes {
	/* 返回码 */
	code: number;

	/* 返回码说明 */
	msg: string;

	/* 返回数据 */
	data: {
		/* 当前页 */
		pageNum: number;

		/* 每页的数量 */
		pageSize: number;

		/* 总记录数 */
		total: number;

		/* 总页数 */
		pages: number;

		/* 结果集 */
		list: ReferenceSamePeriodValueImportPageResItem[];

		/* 是否为空 */
		emptyFlag: boolean;
	};
}

// 参考指标同期值导入分页参数
export interface ReferenceIndicatorSamePeriodValueImportPageParams {
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

	/* 指标配置任务明细表id */
	effTaskIndicatorConfDetailsId: number;

	/* 指标配置任务明细表--参考设置表id */
	effTaskIndicatorConfDetailsReferenceId: number;

	/* 标配置任务明细表--参考设置--目标配置--基础指标--导入表id */
	effTaskIndicatorConfDetailsBasicIndicatorId: number;

	/* 前端提供悬空版本 */
	suspendedVersion?: string;

	/* 删除数据ids */
	importDelIds?: Record<string, unknown>[];

	/* */
	kstT?: Record<string, unknown>;
}

export interface ReferenceIndicatorSamePeriodValueImportPageResItem {
	/* 主键id */
	id: number;

	/* 主数据code */
	targetOrgCode: string;

	/* 主数据名称 */
	targetOrgName: string;

	/* 同期值 */
	samePeriodValue: number;

	/* 前端提供悬空版本 */
	suspendedVersion: string;
}

// 修改导入同期值参数
export interface EditReferenceSamePeriodValueImportParams {
	/* 主键id */
	id: number;

	/* 同期值 */
	samePeriodValue: number;

	/* 数据来源true:新增数据 */
	sourceNewB: boolean;

	/* 调度当前接口返回的数据(sourceNewB为false的时候进行维护1v1) */
	suspendedEditId?: number;

	/* 前端提供悬空版本 */
	suspendedVersion: string;
}

// 应用计划列表载体
export interface ApplicationPlanListPayload {
	pageNum: number;
	pageSize: number;
	searchCount?: boolean;
	sortItemList?: {
		isAsc: boolean;
		column: string;
	}[];
	indicatorId: number;
}

export interface ApplicationPlanListItem {
	name: string;
	status: number;
	statusStr: string;
}

// 分页响应统计结构
export interface IndicatorConfStatisticsRes {
	targetPlanTotal: number;
	targetPlanTotalNoSubmit: number;
	targetPlanTotalSubmit: number;
	primaryPlanTotal: number;
	primaryPlanNoSubmit: number;
	primaryPlanSubmit: number;
	collaborationPlanTotal: number;
	collaborationPlanNoSubmit: number;
	collaborationPlanSubmit: number;
}

export interface IndicatorConfPageParams {
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

	/* 指标配置id */
	effTaskIndicatorConfId?: number;

	/* 名称精准查询 true:精准 */
	preciseNameFlag?: boolean;

	/* 计划名称 */
	name?: string;

	/* 主责人姓名 */
	responsibleUserName?: string;

	/* 更新人姓名 */
	updateByName?: string;

	/* 周期-年 */
	year?: string;

	/* 子周期 */
	subperiod?: number;

	/* 状态 0：未提交 1：已提交 */
	status?: number;

	/* 1：主责计划：2协作计划 */
	queryModelType?: number;

	/* 兼容页面层当前透传的扩展查询字段 */
	[key: string]: unknown;
}

export interface IndicatorConfPageItem {
	/* 主键id */
	id: number | string;

	/* 目标计划名称 */
	targetPlanName: string;

	/* 目标计划主键id */
	targetPlanId: number;

	/* 主责人id */
	responsibleUserId: number;

	/* 主责人姓名 */
	responsibleUserName: string;

	/* 更新人姓名 */
	updateByName?: string;

	/* 周期-年 */
	year: string;

	/* 子周期 */
	subperiod: number;

	/* 填报开始时间 */
	startTime: string | Record<string, unknown>;

	/* 填报截止时间 */
	deadline: string | Record<string, unknown>;

	/* 权限 */
	perm: number;

	/* 备注 */
	remark: string;

	/* 子任务变更时间 */
	subTaskChangeTime: string | Record<string, unknown>;

	/* 提交状态（0:未提交 1已提交） */
	submissionStatus: number;

	/* 提交状态文案 */
	submissionStatusStr: string;

	/* 数据修改版本号 */
	synVersion: number;

	/* 目标周期 */
	targetCycle: string;
}

export interface IndicatorConfPageRes {
	/* 返回码 */
	code: number;

	/* 返回码说明 */
	msg: string;

	/* 返回数据 */
	data: {
		/* 当前页 */
		pageNum: number;

		/* 每页的数量 */
		pageSize: number;

		/* 总记录数 */
		total: number;

		/* 总页数 */
		pages: number;

		/* 结果集 */
		list: IndicatorConfPageItem[];

		/* 是否为空 */
		emptyFlag: boolean;
	};
}

export interface IndicatorConfPageListRes {
	data: IndicatorConfPageItem[];
	total: number;
}

export interface ReferenceTargetOrgItem {
	/* 拆解对象编码 */
	targetOrgCode: string;

	/* 拆解对象名称 */
	targetOrgName: string;
}

// 组织树节点
export interface DataDimOepOrgTreeNode {
	/* id */
	id: string;

	/* 名称 */
	name: string;

	/* parenCode */
	parentCode: string;

	/* 是否可选 true:可选 false:不可选 */
	canChoose: boolean;

	/* 全路劲 */
	fullRoadStrength: string;

	/* data */
	data: {
		oepOrgUuid: string;
	};

	/* 子节点 */
	children: DataDimOepOrgTreeNode[];
}

export interface ReferenceBasicDetailRes {
	id: number;
	targetMethod: number;
	referenceValue: string;
	referenceValueDesc: string;
	basicIndicatorDesc: string;
	fillMethod: number;
	floatingRatioReferenceValue: {
		basicIndicatorName: string;
		unit: number;
		unitName: string;
		value: number;
		supportAdjustment: number;
		innerAdjustmentRange: {
			adjustmentRangeBoundaryRule: number;
			adjustmentRangeMin: number;
			adjustmentRangeMax: number;
		};
	};
	allowModifyFillValue: number;
	effTaskIndicatorConfDetailsBasicIndicatorBOS: Array<{
		id: number;
		unit: number;
		unitName: string;
		effTaskIndicatorConfDetailsReferenceId: number;
		indicatorId: number;
		indicatorName: string;
		dataSourceType: number;
		dataSourceTypeStr: string;
		dataSourceDesc: string;
		supportAdjustment: number;
		adjustmentRangeBoundaryRule: number;
		adjustmentRangeMin: number;
		adjustmentRangeMax: number;
		deviationRange: string;
	}>;
	referenceConfDetailIndicatorListBOS: Array<{
		id: number;
		effIndicatorId: number;
		indicatorName: string;
		effTaskIndicatorConfDetailsId: number;
		unit: number;
		unitName: string;
	}>;
}

export interface DetailTreeItem {
	/* 拆解指标id */
	id: number;

	/* 指标名称 */
	name: string;

	/* 单位 */
	unitName: string;

	/* 指标id */
	indicatorId: number;

	/* 状态（0:未提交 1:已提交） */
	status: number;

	/* 排序 */
	sort: number;

	/* 指标类型 0:基础指标 1：复合指标 */
	type: number;

	/* 标识 */
	typeStr: string;

	/* 填报数量 */
	fillInQuantity: number;

	/* 填报记录ids */
	listOverviewIds: Record<string, unknown>[];

	/* 填报标签(进行中、已校验) */
	fillInLabels: string;
}

export interface DetailTreeGroup {
	/* 主责部门 */
	responsibleDepartment: string;

	/* 配置指标信息 */
	innerDetailList: DetailTreeItem[];
}

// Parameter interface
export interface PageRetrieveParams {
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

	/* 指标名称 */
	name?: string;

	/* 指标类型 0:基础指标 1：复合指标 */
	type?: number;

	/* 主责部门 */
	responsibleDepartmentCode?: number;

	/* 排除指标集 */
	excludeIndicators?: Record<string, unknown>[];
}

export interface PageRetrieveResItem {
	/* 主键id */
	id: number;

	/* 指标名称 */
	name: string;

	/* 主责部门 */
	responsibleDepartmentCode: number;

	/* 主责部门 */
	responsibleDepartment: string;

	/* 数据单位 */
	unit: number;

	/* 数据单位 */
	unitName: string;

	/* 指标定义及口径 */
	definition: string;
}

// Response interface
export interface PageRetrieveRes {
	/* 返回码 */
	code: number;

	/* 返回码说明 */
	msg: string;

	/* 返回数据 */
	data: {
		/* 当前页 */
		pageNum: number;

		/* 每页的数量 */
		pageSize: number;

		/* 总记录数 */
		total: number;

		/* 总页数 */
		pages: number;

		/* 结果集 */
		list: PageRetrieveResItem[];

		/* 是否为空 */
		emptyFlag: boolean;
	};
}
