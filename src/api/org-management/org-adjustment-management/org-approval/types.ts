/**
 * 组织审批 API 类型
 */

/**
 * 组织审批排序项
 */
export interface OrgApprovalSortItem {
	/** true正序 | false倒序 */
	isAsc: boolean;

	/** 排序字段 */
	column: string;
}

/**
 * 组织审批分页查询参数
 */
export interface OrgApprovalListParams {
	/** 页码(不能为空) */
	pageNum: number;

	/** 每页数量(不能为空) */
	pageSize: number;

	/** 是否查询总条数 */
	searchCount?: boolean;

	/** 排序字段集合 */
	sortItemList?: OrgApprovalSortItem[];

	/** 应用Code */
	appCode?: string;

	/** 业务类型 */
	businessType?: string;

	/** 流程编号 */
	approvalCode?: string;

	/** 流程名称/任务名称 */
	approvalName?: string;

	/** 流程状态 0流程中 1已中止 2已结束 */
	status?: string;

	/** 发起人 */
	initiatorUserName?: string;

	/** 创建人 */
	createUser?: string;
}

/**
 * 组织审批时间字段
 */
export type OrgApprovalDateValue = Record<string, unknown>;

/**
 * 组织审批列表项
 */
export interface OrgApprovalListItem {
	/** 主键id */
	id: string;

	/** 流程实例id */
	instanceId: string;

	/** 流程编号 */
	approvalCode: string;

	/** 流程名称 */
	approvalName: string;

	/** 应用Code */
	appCode: string;

	/** 业务类型 */
	businessType: string;

	/** 业务id */
	businessId: string;

	/** 业务版本 */
	businessVersion: string;

	/** 流程状态 */
	status: string;

	/** 流程状态文案 */
	statusStr: string;

	/** 发起人姓名 */
	initiatorUserName: string;

	/** 发起人id */
	initiatorUserId: string;

	/** 发起时间 */
	startTime: OrgApprovalDateValue;

	/** 完成时间 */
	finishTime: OrgApprovalDateValue;

	/** 租户id */
	tenantId: string;

	/** 删除标识 */
	deleted: number;

	/** 创建人 */
	creator: string;

	/** 更新人 */
	operator: string;

	/** 创建人姓名 */
	creatorName: string;

	/** 更新人姓名 */
	operatorName: string;

	/** 创建时间 */
	gmtCreate: OrgApprovalDateValue;

	/** 更新时间 */
	gmtModify: OrgApprovalDateValue;
}

/**
 * 组织审批分页数据
 */
export interface OrgApprovalListData {
	/** 当前页 */
	pageNum: number;

	/** 每页的数量 */
	pageSize: number;

	/** 总记录数 */
	total: number;

	/** 总页数 */
	pages: number;

	/** 结果集 */
	list: OrgApprovalListItem[];

	/** 是否为空 */
	emptyFlag: boolean;
}

/**
 * 组织审批分页查询响应
 */
export interface OrgApprovalListResponse {
	/** 返回码 */
	code: number;

	/** 返回码说明 */
	msg: string;

	/** 返回数据 */
	data: OrgApprovalListData;
}

/**
 * 组织审批统计查询参数
 */
export type OrgApprovalStatisticsParams = OrgApprovalListParams;

/**
 * 组织审批状态统计项
 */
export interface OrgApprovalStatisticsItem {
	/** 流程状态 */
	status: string;

	/** 流程状态文案 */
	statusStr: string;

	/** 数量 */
	count: number;
}

/**
 * 组织审批统计响应
 */
export interface OrgApprovalStatisticsResponse {
	/** 返回码 */
	code: number;

	/** 返回码说明 */
	msg: string;

	/** 返回数据 */
	data: OrgApprovalStatisticsItem[];
}
