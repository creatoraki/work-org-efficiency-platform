/**
 * 人才标签审核页面类型定义
 */

import type { TAG_TYPE } from "../../config";

/**
 * 审核状态枚举
 */
export enum TagAuditStatus {
	/** 待审核 */
	PENDING = "pending",
	/** 已通过 */
	APPROVED = "approved",
	/** 已拒绝 */
	REJECTED = "rejected",
}

/**
 * 审核类型枚举
 */
export enum TagAuditType {
	/** 创建 */
	CREATE = "create",
	/** 更新 */
	UPDATE = "update",
	/** 删除 */
	DELETE = "delete",
}

/**
 * 标签类型枚举
 */
export enum TagType {
	/** 系统标签 */
	SYSTEM = "system",
	/** 手动标签 */
	MANUAL = "manual",
	/** 智能标签 */
	INTELLIGENT = "intelligent",
}

/**
 * 标签审核数据项接口
 */
export interface TagAuditItem {
	/** 唯一标识 */
	id: string;
	/** 标签名称 */
	tagName: string;
	/** 标签值 */
	tagValue?: string;
	/** 标签类型 */
	tagType: TagType;
	/** 标签类型名称 */
	tagTypeName?: string;
	/** 是否必填 */
	isRequired: boolean;
	/** 是否必填名称 */
	isRequiredName?: string;
	/** 业务类别 */
	businessCategory: string;
	/** 业务类别名称 */
	businessCategoryName?: string;
	/** 到期时间 */
	existenceCycle: string;
	/** 标签描述 */
	tagDescription?: string;
	/** 重要等级 */
	importanceLevel: string;
	/** 更新频次 */
	updateFrequency: string;
	/** 更新频次名称 */
	updateFrequencyName?: string;
	/** 审核类型 */
	auditType: TagAuditType;
	/** 审核状态 */
	auditStatus: TagAuditStatus;
	/** 审核状态名称 */
	auditStatusName?: string;
	/** 申请人 */
	applicant: string;
	/** 提交人 */
	submitter: string;
	/** 提交人姓名 */
	submitterName?: string;
	/** 提交时间 */
	submitTime: string;
	/** 审核人 */
	auditor?: string;
	/** 审核人姓名 */
	auditorName?: string;
	/** 申请时间 */
	applyTime: string;
	/** 审核时间 */
	auditTime?: string;
	/** 审核原因/备注 */
	auditReason?: string;
	/** 审核意见 */
	auditComment?: string;
	/** 更新时间 */
	updateTime: string;
}

/**
 * 标签审核搜索表单接口
 */
export interface TagAuditSearchForm {
	/** 标签名称 */
	tagName?: string;
	/** 标签值 */
	tagValue?: string;
	/** 标签描述 */
	tagDescription?: string;
	/** 标签类型 */
	tagType?: TAG_TYPE[];
	/** 是否必填 */
	isRequired?: boolean[];
	/** 审核类型 */
	auditType?: TagAuditType[];
	/** 审核状态 */
	auditStatus?: TagAuditStatus[];
	/** 业务类别 */
	businessCategory?: string[];
	/** 重要等级 */
	importanceLevel?: string[];
	/** 到期时间 */
	existenceCycle?: string;
	/** 提交人 */
	submitter?: string;
	/** 审核人 */
	auditor?: string;
	/** 申请时间范围 */
	applyTimeRange?: [string, string];
	/** 审核时间范围 */
	auditTimeRange?: [string, string];
}

/**
 * 审核统计数据接口
 */
export interface TagAuditStatistics {
	/** 待审核数量 */
	pending: number;
	/** 已通过数量 */
	approved: number;
	/** 已拒绝数量 */
	rejected: number;
	/** 总数量 */
	total: number;
	/** 本月新增已通过数量 */
	approvedThisMonth: number;
	/** 本月新增已拒绝数量 */
	rejectedThisMonth: number;
}

/**
 * 审核记录详情接口
 */
export interface TagAuditRecord extends TagAuditItem {
	/** 标签详细信息 */
	tagDetails?: {
		/** 标签类型 */
		tagType?: TAG_TYPE;
		/** 标签描述 */
		tagDescription?: string;
		/** 业务类别 */
		businessCategory?: string | string[];
		/** 是否必填 */
		isRequired?: boolean;
		/** 到期时间 */
		existenceCycle?: string;
		/** 更新频次 */
		updateFrequency?: string;
		/** 维护人 */
		maintainer?: string;
	};
	/** 审核历史 */
	auditHistory?: Array<{
		/** 操作时间 */
		operateTime: string;
		/** 操作人 */
		operator: string;
		/** 操作类型 */
		operateType: "submit" | "approve" | "reject" | "revoke";
		/** 操作备注 */
		remark?: string;
	}>;
}

/**
 * 审核操作接口
 */
export interface TagAuditOperation {
	/** 审核项目ID */
	id: string;
	/** 审核状态 */
	auditStatus: TagAuditStatus.APPROVED | TagAuditStatus.REJECTED;
	/** 审核原因 */
	auditReason?: string;
}

/**
 * 批量审核操作接口
 */
export interface TagBatchAuditOperation {
	/** 审核项目ID列表 */
	ids: string[];
	/** 审核状态 */
	auditStatus: TagAuditStatus.APPROVED | TagAuditStatus.REJECTED;
	/** 审核原因 */
	auditReason?: string;
}
