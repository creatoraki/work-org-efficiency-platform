/**
 * 人员档案模块统一配置
 */

/**
 * 字典数据缓存时间（毫秒）：5分钟
 * 用于组织树、岗位、职位等字典数据的缓存
 */
export const DICT_CACHE_TIME = 5 * 60 * 1000;

/**
 * 人员档案字典 key 统一管理
 */
export const PERSONNEL_ARCHIVE_DICT_KEYS = {
	// 面谈目的字典
	INTERVIEW_PURPOSE: "user_interview_purpose",
	// 面谈状态字典
	INTERVIEW_STATUS: "user_interview_status",
	// 档案审核状态字典
	ARCHIVE_APPROVAL_STATUS: "user_tag_approval_status",
	// 档案审核状态字典（用于审核页面）
	ARCHIVE_APPROVAL_STATUS_FOR_APPROVAL: "user_tag_approval_status_for_approval",
	// 标签状态字典
	TAG_STATUS: "user_tag_status",
	// 学历字典
	EDUCATION: "personnel_archive_education",
	// 绩效字典
	PERFORMANCE: "personnel_archive_performance",
} as const;

/**
 * 数据缓存时间配置（毫秒）
 */
export const CACHE_TIME = {
	/** 组织树数据缓存时间 */
	ORGANIZATION_TREE: DICT_CACHE_TIME,
	/** 岗位字典数据缓存时间 */
	JOB_DICT: DICT_CACHE_TIME,
	/** 职位字典数据缓存时间 */
	POSITION_DICT: DICT_CACHE_TIME,
	/** 标签树数据缓存时间 */
	TAG_TREE: DICT_CACHE_TIME,
} as const;

/**
 * 档案审核状态字典常量（使用字典 user_tag_approval_status）
 */
export const ARCHIVE_AUDIT_STATUS_DICT = {
	/** 待提交 */
	PENDING_SUBMIT: "0",
	/** 待维护 */
	PENDING_MAINTENANCE: "1",
	/** 待审核 */
	PENDING_AUDIT: "2",
	/** 已通过 */
	APPROVED: "3",
	/** 已拒绝 */
	REJECTED: "4",
	/** 已审核 */
	AUDITED: "5",
} as const;

/**
 * 档案审核状态类型（字符串类型，使用字典值）
 */
export type ArchiveAuditStatus =
	(typeof ARCHIVE_AUDIT_STATUS_DICT)[keyof typeof ARCHIVE_AUDIT_STATUS_DICT];

/**
 * 完善度等级枚举
 */
export enum CompletionLevel {
	HIGH = "高",
	MEDIUM = "中等",
	LOW = "低",
}

/**
 * 档案审核操作类型
 */
export type ArchiveAuditOperationType = "audit" | "viewDetail" | "viewProcess";

/**
 * 档案审核操作按钮映射规则
 */
export const ARCHIVE_AUDIT_OPERATION_BUTTON_MAPPING: Record<
	ArchiveAuditStatus,
	readonly ArchiveAuditOperationType[]
> = {
	[ARCHIVE_AUDIT_STATUS_DICT.PENDING_SUBMIT]:
		[] as const satisfies readonly ArchiveAuditOperationType[], // 待提交：无操作
	[ARCHIVE_AUDIT_STATUS_DICT.PENDING_MAINTENANCE]:
		[] as const satisfies readonly ArchiveAuditOperationType[], // 待维护：无操作
	[ARCHIVE_AUDIT_STATUS_DICT.PENDING_AUDIT]: [
		"audit",
		"viewDetail",
		"viewProcess",
	] as const satisfies readonly ArchiveAuditOperationType[], // 待审核：审核、审核详情（需有已审核标签）、审核进程
	[ARCHIVE_AUDIT_STATUS_DICT.APPROVED]: [
		"viewDetail",
		"viewProcess",
	] as const satisfies readonly ArchiveAuditOperationType[], // 已通过：审核详情、审核进程
	[ARCHIVE_AUDIT_STATUS_DICT.REJECTED]: [
		"viewDetail",
		"viewProcess",
	] as const satisfies readonly ArchiveAuditOperationType[], // 已拒绝：审核详情、审核进程
	[ARCHIVE_AUDIT_STATUS_DICT.AUDITED]: [
		"viewDetail",
		"viewProcess",
	] as const satisfies readonly ArchiveAuditOperationType[], // 已审核：审核详情、审核进程
};

/**
 * 档案审核操作按钮文本配置
 */
export const ARCHIVE_AUDIT_OPERATION_BUTTON_TEXT = {
	audit: "审核",
	viewDetail: "审核详情",
	viewProcess: "审核进程",
} satisfies Record<string, string>;

/**
 * 完善度等级配置
 */
export const COMPLETION_LEVEL_CONFIG = {
	高: { color: "#0075FF" },
	中等: { color: "#14B968" },
	低: { color: "#F5222D" },
} satisfies Record<string, { color: string }>;

/**
 * 完善度等级阈值配置
 */
export const COMPLETION_LEVEL_THRESHOLD = {
	HIGH: 70, // 70%以上为高
	MEDIUM: 30, // 30%以上为中等
	LOW: 0, // 30%以下为低
} as const;

/**
 * 计算完善度等级
 */
export function calculateCompletionLevel(rate: number): CompletionLevel {
	if (rate >= COMPLETION_LEVEL_THRESHOLD.HIGH) {
		return CompletionLevel.HIGH;
	}
	if (rate >= COMPLETION_LEVEL_THRESHOLD.MEDIUM) {
		return CompletionLevel.MEDIUM;
	}
	return CompletionLevel.LOW;
}

/**
 * 获取表格工具栏配置
 * @param settingIcon 自定义设置图标，默认为"列表选项"按钮
 */
export const TABLE_CONFIG = {
	/** 表格工具栏配置 */
	OPTIONS: {
		reload: false,
		density: false,
		fullScreen: false,
		setting: true,
	},
	/** 分页配置 */
	PAGINATION: {
		defaultPageSize: 20,
		showSizeChanger: true,
		showQuickJumper: true,
		pageSizeOptions: ["10", "20", "50", "100"] satisfies readonly (string | number)[],
		showTotal: (total: number) => `共 ${total} 条`,
	},
} as const;

/**
 * 面谈目的字典
 * 后端返回数字，前端显示中文
 */
export const INTERVIEW_PURPOSE_DICT: Record<string | number, string> = {
	1: "绩效面谈（晋升）",
	2: "绩效面谈（调薪）",
	3: "绩效面谈（年度/季度考评）",
	4: "入职面谈",
	5: "离职面谈",
	6: "试用/转正面谈",
	7: "带教面谈",
	8: "临时面谈",
};

/**
 * 面谈目的选项
 */
export const INTERVIEW_PURPOSE_OPTIONS = [
	{ label: "绩效面谈（晋升）", value: 1 },
	{ label: "绩效面谈（调薪）", value: 2 },
	{ label: "绩效面谈（年度/季度考评）", value: 3 },
	{ label: "入职面谈", value: 4 },
	{ label: "离职面谈", value: 5 },
	{ label: "试用/转正面谈", value: 6 },
	{ label: "带教面谈", value: 7 },
	{ label: "临时面谈", value: 8 },
] as const;

/**
 * 面谈状态字典
 * 后端返回数字字符串，前端显示中文
 */
export const INTERVIEW_STATUS_DICT: Record<string | number, string> = {
	0: "待面谈",
	1: "已面谈",
};

/**
 * 面谈状态选项（value 为字符串类型）
 */
export const INTERVIEW_STATUS_OPTIONS = [
	{ label: "待面谈", value: "0" },
	{ label: "已面谈", value: "1" },
] as const;

/**
 * 审核状态字典（数字形式）
 * 后端返回数字，前端显示中文
 */
export const AUDIT_STATUS_NUMBER_DICT: Record<string | number, string> = {
	1: "待维护",
	2: "待审核",
	3: "已通过",
	4: "已拒绝",
	5: "待提交",
};

/**
 * 获取面谈目的显示文本
 */
export function getInterviewPurposeText(purpose: number | string | undefined): string {
	if (purpose === undefined || purpose === null) {
		return "-";
	}
	// 转换为字符串或数字进行查找
	const key = typeof purpose === "string" ? Number(purpose) || purpose : purpose;
	return INTERVIEW_PURPOSE_DICT[key] ?? String(purpose);
}

/**
 * 获取面谈状态显示文本
 */
export function getInterviewStatusText(status: number | string | undefined): string {
	if (status === undefined || status === null) {
		return "-";
	}
	// 转换为字符串进行查找（支持数字字符串）
	const key = typeof status === "number" ? String(status) : status;
	return INTERVIEW_STATUS_DICT[key] || String(status);
}

/**
 * 获取审核状态显示文本（数字形式）
 * 注意：此函数已废弃，请使用 useDict("user_tag_approval_status") 的 translate 方法
 */
export function getAuditStatusText(status: number | string | undefined): string {
	if (status === undefined || status === null) {
		return "-";
	}
	// 先尝试数字字典
	const key = typeof status === "string" ? Number(status) || status : status;
	return AUDIT_STATUS_NUMBER_DICT[key] ?? String(status);
}

/**
 * 人员档案模块权限标识统一管理
 */
export const PERSONNEL_ARCHIVE_PERMISSIONS = {
	/** 档案导入权限：用于档案管理的导入档案按钮 */
	ARCHIVE_IMPORT: "usertag:tag:import",
	/** 档案审核权限：用于档案审核的审核按钮、审核通过按钮、审核驳回按钮 */
	ARCHIVE_APPROVE: "usertag:approval:approve",
} as const;
