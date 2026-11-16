import type { TAG_TYPE } from "#src/pages/tag-management/config.js";

/**
 * 标签审核列表查询参数
 */
export interface TagAuditListParams {
	/** 页码 */
	pageNum?: number;
	/** 每页大小 */
	pageSize?: number;
	/** 标签名称 */
	tagName?: string;
	/** 标签值 */
	tagValue?: string;
	/** 标签描述 */
	tagDescription?: string;
	/** 标签类型 */
	tagType?: TAG_TYPE[];
	/** 业务类别 */
	businessCategory?: string[];
	/** 是否必填 */
	isRequired?: boolean[];
	/** 到期时间 */
	existenceCycle?: string;
	/** 更新频次 */
	updateFrequency?: string;
	/** 提交人 */
	submitter?: string;
	/** 审核人 */
	auditor?: string;
	/** 审核状态 (0待审核，1已通过，2已拒绝) */
	auditStatusArr?: string[];
	/** 标签库类型（1:组织标签，2:人才标签） */
	type: string;
}

/**
 * 标签审核列表项
 */
export interface TagAuditListItem {
	/** 主键ID */
	id: string;
	/** 标签名称 */
	tagName: string;
	/** 标签类型 */
	tagType: string;
	/** 标签类型名称 */
	tagTypeName: string;
	/** 标签值 */
	tagValue: string;
	/** 标签描述 */
	tagDescription: string;
	/** 业务类别 */
	businessCategory: string;
	/** 业务类别名称 */
	businessCategoryName: string;
	/** 是否必填：0=否，1=是 */
	isRequired: string;
	/** 是否必填名称 */
	isRequiredName: string;
	/** 到期时间 */
	existenceCycle: string;
	/** 更新频次 */
	updateFrequency: string;
	/** 更新频次名称 */
	updateFrequencyName: string;
	/** 提交人 */
	submitter: string;
	/** 提交人姓名 */
	submitterName: string;
	/** 审核人 */
	auditor: string;
	/** 审核人姓名 */
	auditorName: string;
	/** 审核状态（待审核，审核通过，审核拒绝） */
	auditStatus: string;
	/** 审核状态名称（待审核，审核通过，审核拒绝） */
	auditStatusName: string;
	/** 更新时间 */
	updateTime: string;
}

/**
 * 批量审核参数
 */
export interface BatchAuditParams {
	/** 标签ID列表 */
	ids: string[];
	/** 审核状态：1=已通过，2=已拒绝 */
	auditStatus: string;
	/** 审核意见（审核拒绝时必填） */
	auditComment?: string;
}

/**
 * 批量审核响应
 */
export type BatchAuditResponse = ApiResponse<boolean>;

/**
 * 审核统计数据
 */
export interface AuditStatisticsData {
	/** 待审核标签数量 */
	pendingCount: number;
	/** 已通过标签总数 */
	passedCount: number;
	/** 本月新增已通过标签数量 */
	passedThisMonthCount: number;
	/** 已拒绝标签总数 */
	rejectedCount: number;
	/** 本月新增已拒绝标签数量 */
	rejectedThisMonthCount: number;
}

/**
 * 审核统计响应
 */
export type AuditStatisticsResponse = ApiResponse<AuditStatisticsData>;

/**
 * 搜索选项数据
 */
export interface SearchOptionsData {
	/** 提交人列表 */
	submitterOptions: Array<{
		/** 用户ID */
		userId: string;
		/** 用户姓名 */
		userName: string;
	}>;
	/** 审核人列表 */
	auditorOptions: Array<{
		/** 用户ID */
		userId: string;
		/** 用户姓名 */
		userName: string;
	}>;
}

/**
 * 搜索选项响应
 */
export type SearchOptionsResponse = ApiResponse<SearchOptionsData>;
