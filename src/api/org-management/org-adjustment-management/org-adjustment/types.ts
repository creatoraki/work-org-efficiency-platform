/**
 * 组织调整任务 API 类型
 * TODO: 补充组织调整任务相关类型定义
 */

/**
 * 组织调整任务统计数据
 */
export interface OrgAdjustmentTaskStatisticsData {
	/** 全部组织调整任务数 */
	totalCount: number;

	/** 进行中组织调整任务数 */
	doingCount: number;

	/** 已完成组织调整任务数 */
	doneCount: number;
}

/**
 * 组织调整任务统计接口响应
 */
export interface OrgAdjustmentTaskStatisticsResponse extends ApiResponse<OrgAdjustmentTaskStatisticsData> {}

/**
 * 组织调整任务查询条件中的用户选项
 */
export interface OrgAdjustmentTaskSearchUserOption {
	/** 用户ID */
	userId: number;

	/** 用户姓名 */
	userName: string;
}

/**
 * 组织调整任务列表查询条件数据
 */
export interface OrgAdjustmentTaskSearchOptionsData {
	/** 任务名称 */
	taskNameOptions: string[];

	/** 创建人 */
	createByOptions: OrgAdjustmentTaskSearchUserOption[];

	/** 更新人 */
	updateByOptions: OrgAdjustmentTaskSearchUserOption[];
}

/**
 * 组织调整任务列表查询条件接口响应
 */
export interface OrgAdjustmentTaskSearchOptionsResponse extends ApiResponse<OrgAdjustmentTaskSearchOptionsData> {}

/**
 * 组织调整任务列表排序项
 */
export interface OrgAdjustmentTaskSortItem {
	/** true 正序 | false 倒序 */
	isAsc: boolean;

	/** 排序字段 */
	column: string;
}

/**
 * 组织调整任务列表查询参数
 */
export interface OrgAdjustmentTaskListParams {
	/** 页码 */
	pageNum: number;

	/** 每页数量 */
	pageSize: number;

	/** 是否查询总条数 */
	searchCount?: boolean;

	/** 排序字段集合 */
	sortItemList?: OrgAdjustmentTaskSortItem[];

	/** 状态 */
	statusList?: string[];

	/** 任务名称 */
	taskName?: string;

	/** 创建人 */
	createBy?: string;

	/** 更新人 */
	updateBy?: string;
}

/**
 * 组织调整任务列表项
 */
export interface OrgAdjustmentTaskListItem {
	/** 主键id */
	id: number;

	/** 任务名称 */
	taskName: string;

	/** 状态 */
	status: string;

	/** 创建者姓名 */
	createByName: string;

	/** 更新者姓名 */
	updateByName: string;

	/** 创建时间 */
	createTime: Record<string, unknown>;

	/** 更新时间 */
	updateTime: Record<string, unknown>;

	/** 备注 */
	remark: string;
}

/**
 * 组织调整任务列表查询接口响应
 */
export interface OrgAdjustmentTaskListResponse extends ApiListResponse<OrgAdjustmentTaskListItem> {}

/**
 * 创建组织调整任务参数
 */
export interface CreateOrgAdjustmentTaskParams {
	/** 主键id，新增时为空 */
	id?: number;

	/** 任务名称 */
	taskName?: string;

	/** 备注 */
	remark?: string;
}

/**
 * 创建组织调整任务接口响应
 */
export interface CreateOrgAdjustmentTaskResponse extends ApiResponse<number> {}

/**
 * 编辑组织调整任务参数
 */
export interface EditOrgAdjustmentTaskParams {
	/** 主键id */
	id?: number;

	/** 任务名称 */
	taskName?: string;

	/** 备注 */
	remark?: string;
}

/**
 * 编辑组织调整任务接口响应
 */
export interface EditOrgAdjustmentTaskResponse extends ApiResponse<string> {}

/**
 * 删除组织调整任务参数
 */
export type RemoveOrgAdjustmentTaskParams = Array<string | number>;

/**
 * 删除组织调整任务接口响应
 */
export interface RemoveOrgAdjustmentTaskResponse extends ApiResponse<string> {}
