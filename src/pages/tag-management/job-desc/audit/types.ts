/**
 * 岗位描述审核页面类型定义
 */

/**
 * 审核状态（使用字典 tag_audit_status）
 * 0: 待审核, 1: 已通过, 2: 已拒绝
 */
export type JobDescAuditStatus = "0" | "1" | "2";

/**
 * 审核状态常量（用于前端判断）
 */
export const JOB_DESC_AUDIT_STATUS = {
	/** 待审核 */
	PENDING: "0",
	/** 已通过 */
	APPROVED: "1",
	/** 已拒绝 */
	REJECTED: "2",
} as const;

/**
 * 岗位描述审核数据项接口（字段名与接口文档保持一致）
 */
export interface JobDescAuditItem {
	/** 唯一标识 */
	id: string;
	/** 岗位ID */
	jobId: number;
	/** 岗位名称 */
	jobName: string;
	/** 部门编码 */
	deptCode: string;
	/** 组织名称 */
	deptName: string;
	/** 职位ID */
	positionId: number;
	/** 职位名称 */
	positionName: string;
	/** 职级 */
	postGrade: number;
	/** 岗位基本描述 */
	basicDesc: string;
	/** 岗位个性化描述 */
	personalizedDesc: string;
	/** 提交人 */
	submitter: string;
	/** 提交人姓名 */
	submitterName: string;
	/** 审核部门（实际为数据权限） */
	auditDept: string;
	/** 审核人 */
	auditor: string;
	/** 审核人姓名 */
	auditorName: string;
	/** 审核状态（0待审核，1已通过，2已拒绝） */
	auditStatus: string;
	/** 审核状态名称 */
	auditStatusName: string;
	/** 审核意见 */
	auditComment: string;
	/** 创建时间 */
	createTime: string;
	/** 更新时间 */
	updateTime: string;
	/** 附件路径（逗号分隔字符串，如 "path1,path2,path3"） */
	attachments?: string;
}

/**
 * 岗位描述审核搜索表单接口（字段名与接口文档保持一致，仅保留实际使用的搜索字段）
 */
export interface JobDescAuditSearchForm {
	/** 岗位ID */
	jobId?: number;
	/** 岗位名称 */
	jobName?: string;
	/** 部门编码 */
	deptCode?: string;
	/** 职位ID */
	positionId?: number;
	/** 职位名称 */
	positionName?: string;
	/** 职级 */
	postGrade?: string | number;
	/** 岗位基本描述 */
	basicDesc?: string;
	/** 岗位个性化描述 */
	personalizedDesc?: string;
	/** 提交人 */
	submitter?: string;
	/** 审核部门（数据权限） */
	auditDept?: string;
	/** 审核人 */
	auditor?: string;
	/** 审核状态 */
	auditStatus?: JobDescAuditStatus[];
}

/**
 * 审核统计数据接口（字段名与接口文档保持一致）
 */
export interface JobDescAuditStatistics {
	/** 待审核标签数量 */
	pendingCount: number;
	/** 已通过标签数量 */
	passedCount: number;
	/** 已拒绝标签数量 */
	rejectedCount: number;
	/** 本月新增已通过数量 */
	passedThisMonthCount: number;
	/** 本月新增已拒绝数量 */
	rejectedThisMonthCount: number;
}

/**
 * 岗位描述审核列表查询参数
 */
export interface JobDescAuditListParams extends JobDescAuditSearchForm {
	/** 页码 */
	pageNum?: number;
	/** 每页数量 */
	pageSize?: number;
}

export interface JobDescAuditUpdateParams {
	/** ID（主键） */
	id: string;
	/** 审核部门（数据权限） */
	auditDept?: string;
	/** 审核人 */
	auditor?: string;
	/** 审核人姓名 */
	auditorName?: string;
	/** 审核状态（0待审核，1已通过，2已拒绝） */
	auditStatus: JobDescAuditStatus;
	/** 审核意见 */
	auditComment?: string;
}

export interface JobDescAuditBatchParams {
	/** 岗位描述审核ID列表 */
	ids: string[];
	/** 审核状态（1已通过，2已拒绝） */
	auditStatus: Exclude<JobDescAuditStatus, "0">;
	/** 审核意见 */
	auditComment?: string;
}

export interface JobDescAuditJobNameOption {
	/** 岗位ID */
	jobId: number;
	/** 岗位名称 */
	jobName: string;
}

export interface JobDescAuditDeptOption {
	/** 部门编码 */
	deptCode: string;
	/** 部门名称 */
	deptName: string;
}

export interface JobDescAuditPositionOption {
	/** 职位ID */
	positionId: number;
	/** 职位名称 */
	positionName: string;
}

export interface JobDescAuditPostGradeOption {
	/** 职级 */
	postGrade: number;
	/** 职级名称 */
	postGradeName: string;
}

export interface JobDescAuditUserOption {
	/** 用户ID */
	userId: number;
	/** 用户姓名 */
	userName: string;
}

export interface JobDescAuditDeptAuthorityOption {
	/** 审核部门编码 */
	auditDept: string;
	/** 审核部门名称 */
	auditDeptName: string;
}

export interface JobDescAuditStatusOption {
	/** 审核状态 */
	auditStatus: string;
	/** 审核状态名称 */
	auditStatusName: string;
}

export interface JobDescAuditSearchOptions {
	/** 岗位名称列表 */
	jobNameOptions: JobDescAuditJobNameOption[];
	/** 组织列表 */
	deptOptions: JobDescAuditDeptOption[];
	/** 职位列表 */
	positionOptions: JobDescAuditPositionOption[];
	/** 职级列表 */
	postGradeOptions: JobDescAuditPostGradeOption[];
	/** 提交人列表 */
	submitterOptions: JobDescAuditUserOption[];
	/** 审核部门列表 */
	auditDeptOptions: JobDescAuditDeptAuthorityOption[];
	/** 审核状态列表 */
	auditStatusOptions: JobDescAuditStatusOption[];
	/** 审核人列表 */
	auditorOptions: JobDescAuditUserOption[];
}

export type JobDescAuditSearchOptionsResponse = ApiResponse<JobDescAuditSearchOptions>;

export interface JobDescAuditDetailInfo {
	id: string;
	submitter: string;
	submitterName: string;
	auditDept: string;
	auditor: string;
	auditorName: string;
	auditStatus: JobDescAuditStatus;
	auditComment: string;
	createTime: string;
	updateTime: string;
}

export type JobDescAuditDetailResponse = ApiResponse<JobDescAuditDetailInfo>;
