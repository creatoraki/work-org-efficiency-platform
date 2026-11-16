export interface PreviewIndicatorHead {
	subperiodName: string;
	unitName: string;
	indicatorMap: Record<string, number>;
	periodMap: Record<string, number>;
}

export interface PreviewIndicatorRow {
	targetOrgCode: string;
	targetOrgName: string;
	samePeriodValue: number;
	referenceValue: number;
	annualTargetValue: number;
	deviationValue: number;
	basicIndicator: Record<string, number>;
	periodic: Record<string, any>;
	statusStr: string;
}

export interface SuspendIndicatorConfigIndicatorListParams {
	id?: number | string;
	dataId: number;
	suspendedVersion?: string;
	indicatorListIds?: string[];
	sourceNewB?: boolean;
	suspendedEditId?: number | string;
}

export interface DetailSortParams {
	/* 指标配置id */
	taskIndicatorConfId: number;

	/* 排序项列表 */
	items: {
		/* 配置指标id */
		detailId: number;

		/* 排序值（值越小越靠前） */
		sort: number;
	}[];
}

export interface ReferenceConfDetailIndicatorListItem {
	/* 主键id */
	id: number;

	/* 指标id */
	effIndicatorId: number;

	/* 指标名称 */
	indicatorName: string;

	/* 指标配置任务明细表id */
	effTaskIndicatorConfDetailsId: number;

	/* 数据单位 */
	unit: number;

	/* 数据单位 */
	unitName: string;
}

export interface AddReferenceConfDetailIndicatorParams {
	/* 参考设置表id */
	effTaskIndicatorConfDetailsReferenceId: number;

	/* 配置指标ids */
	confDetailIds: Record<string, unknown>[];
}

// Parameter interface
export interface PageRetrieveConfDetailsSelectedParams {
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

	/* 目标计划id */
	effTargetPlanId: number;
}

export interface PageRetrieveConfDetailsSelectedResItem {
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
export interface PageRetrieveConfDetailsSelectedRes {
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
		list: PageRetrieveConfDetailsSelectedResItem[];

		/* 是否为空 */
		emptyFlag: boolean;
	};
}

// Parameter interface
export interface PageRetrieveBasicIndicatorSelectedParams {
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

	/* 目标计划id */
	effTargetPlanId: number;
}

export interface PageRetrieveBasicIndicatorSelectedResItem {
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
