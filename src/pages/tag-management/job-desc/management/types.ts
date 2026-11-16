/**
 * 岗位描述管理相关类型定义
 */

/**
 * 岗位描述单条维度说明
 */
export interface JobDescriptionEntry {
	/** 维度名称 */
	dimension?: string;
	/** 具体说明 */
	content?: string;
}

/**
 * 附件文件接口（仅用于前端内部处理）
 *
 * 注意：后端 attachments 字段为 JSON 字符串（数组），如：
 * `[{"originalFileName":"a.pdf","fileName":"path/a.pdf"}]`
 * 此接口仅用于前端将字符串解析后的内部数据结构
 *
 * @internal
 */
export interface JobDescAttachmentFile {
	/** 文件名（全路径，如 "uploads/2024/file.pdf"） */
	fileName: string;
	/** 原文件名（仅用于展示，如 "file.pdf"） */
	originalFileName?: string;
}

/**
 * 岗位基本描述数据结构 - 支持动态key
 */
export interface JobBasicDescription {
	/** 动态字段，至少包含一个key */
	[key: string]: string | null;
}

/**
 * 岗位个性描述数据结构 - 支持动态key
 */
export interface JobPersonalizedDescription {
	/** 动态字段，可选 */
	[key: string]: string | null;
}

/**
 * 岗位描述状态（使用字典 tag_status）
 * 0: 待上线, 1: 审核中, 2: 已上线, 3: 已拒绝, 4: 已下线
 */
export type JobDescStatus = "0" | "1" | "2" | "3" | "4";

/**
 * 岗位描述状态常量（用于前端判断）
 */
export const JOB_DESC_STATUS = {
	/** 待上线 */
	PENDING: "0",
	/** 审核中 */
	REVIEWING: "1",
	/** 已上线 */
	ONLINE: "2",
	/** 已拒绝 */
	REJECTED: "3",
	/** 已下线 */
	OFFLINE: "4",
} as const;

/**
 * 后端原始岗位描述数据
 */
export interface JobDescManagementApiItem {
	/** ID（主键） */
	id: string;
	/** 岗位ID */
	jobId: number;
	/** 岗位名称 */
	jobName: string;
	/** 族群ID */
	ethnicId?: number;
	/** 族群名称 */
	ethnicName?: string;
	/** 部门编码 */
	deptCode: string;
	/** 部门名称 */
	deptName: string;
	/** 职位ID */
	positionId: number;
	/** 职位名称 */
	positionName: string;
	/** 职级 */
	postGrade: number | string;
	/** 岗位基本描述 */
	basicDesc: string;
	/** 岗位个性化描述 */
	personalizedDesc: string;
	/** 审核部门（实际为数据权限） */
	auditDept: string;
	/** 审核部门名称 */
	auditDeptName: string;
	/** 审核人 */
	auditor?: string;
	/** 审核人姓名 */
	auditorName?: string;
	/** 审核意见 */
	auditComment?: string;
	/** 状态（0:待上线，1:审核中，2:已上线，3:已拒绝，4:已下线） */
	status: JobDescStatus;
	/** 状态名称 */
	statusName: string;
	/** 创建人 */
	createBy?: string;
	/** 更新人 */
	updateBy?: string;
	/** 更新人姓名 */
	updateByName?: string;
	/** 创建时间 */
	createTime: string;
	/** 更新时间 */
	updateTime: string;
	/** 附件路径（逗号分隔字符串，如 "path1,path2,path3"） */
	attachments?: string;
}

/**
 * 岗位描述管理列表项
 */
export type JobDescManagementItem = JobDescManagementApiItem;

/**
 * 岗位描述搜索表单接口
 */
export interface JobDescSearchForm {
	/** 岗位名称 */
	jobName?: string;
	/** 组织编码 */
	deptCode?: string | string[];
	/** 职位名称 */
	positionName?: string;
	/** 职级 */
	postGrade?: string;
	/** 岗位基本描述 */
	basicDesc?: string;
	/** 岗位个性描述 */
	personalizedDesc?: string;
	/** 审核部门 */
	auditDept?: string;
	/** 状态 */
	status?: JobDescStatus[];
	/** 更新人 */
	updateBy?: string;
	/** 更新人姓名 */
	updateByName?: string;
}

/**
 * 岗位描述表单数据接口
 */
export interface JobDescFormData {
	/** 岗位ID */
	jobId?: number;
	/** 岗位名称 */
	jobName: string;
	/** 部门编码 */
	deptCode: string;
	/** 职位ID */
	positionId?: number;
	/** 职位名称 */
	positionName: string;
	/** 职级 */
	postGrade?: number | string;
	/** 审核部门（数据权限） */
	auditDept?: string;
	/** 岗位基本描述 */
	basicDesc: string;
	/** 岗位个性描述 */
	personalizedDesc?: string;
	/** 状态 */
	status?: JobDescStatus;
}

/**
 * 抽屉模式类型
 */
export type DrawerMode = "edit" | "readonly";

/**
 * 批量操作类型
 */
export type BatchOperationType = "online" | "offline" | "delete";

/**
 * 操作按钮类型
 */
export type OperationButtonType = "edit" | "delete" | "online" | "offline";
