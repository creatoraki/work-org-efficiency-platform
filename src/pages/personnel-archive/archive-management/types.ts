/**
 * 档案管理相关类型定义
 */

/**
 * 档案管理列表项接口
 * 字段命名严格按照接口文档返回值（ListRes.list）
 */
export interface ArchiveManagementItem {
	/* 主键id */
	id: number;
	/* 员工名称 */
	name: string;
	/* 工号 */
	userCode: string;
	/* 头像URL（可选，如果未上传则使用默认头像） */
	avatar?: string;
	/* 所属组织 */
	orgId: string;
	/* 所属组织名称 */
	orgName: string;
	/* 所属组织完整路径名称 */
	orgFullName?: string;
	/* 岗位id */
	jobId: string;
	/* 岗位名称 */
	jobName: string;
	/* 职位id */
	postId: string;
	/* 职位名称 */
	postName: string;
	/* 维护标签（字符串，逗号分隔） */
	manageTags: string;
	/* 标签数量 */
	totalTagCount: number;
	/* 待补充标签 */
	needTagTags: string;
	/* 维护完善度 */
	perfectDegree: number;
	/* 维护人 */
	maintainerName: string;
	/* 维护人id */
	maintainer: string;
	/* 审核状态 */
	status: string;
	/* 更新时间 */
	updateTime: string;
}

/**
 * 档案管理搜索表单
 * 字段命名严格按照接口文档（ListParams）
 */
export interface ArchiveManagementSearchForm {
	/* 员工名称（支持姓名/工号模糊搜索） */
	name?: string;
	/* 所属组织id（联级选择器取最后一个值） */
	orgId?: string;
	/* 岗位id */
	jobId?: string;
	/* 职位id */
	postId?: string;
	/* 标签id */
	tagId?: string;
	/* 标签完善度 */
	perfectDegree?: number;
	/* 审核状态 */
	status?: string;
	/* 维护人 */
	maintainer?: string;
}

/**
 * 档案管理列表查询参数
 * 字段命名严格按照接口文档（ListParams）
 */
export interface ArchiveManagementListParams extends ArchiveManagementSearchForm {
	/* 页码(不能为空) */
	pageNum?: number;
	/* 每页数量(不能为空) */
	pageSize?: number;
}

/**
 * 数据统计预警
 */
export interface ArchiveManagementStats {
	/* 待完善员工数 */
	pendingEmployeeCount: number;
	/* 待维护标签数 */
	pendingTagCount: number;
}

/**
 * 标签信息
 */
export interface TagInfo {
	id: string;
	tagName: string; // 标签名称
	tagValue: string; // 标签值
	status: "待维护" | "待提交" | "待审核" | "已通过" | "已拒绝"; // 标签状态
	rejectionReason?: string; // 拒绝原因
	attachmentProof?: string; // 附件证明说明
	attachmentUrl?: string; // 附件URL
	isExpired?: boolean; // 是否过期
	category: string; // 标签分类
	subCategory?: string; // 子分类
	isRequired?: boolean; // 是否必填
	options?: Array<{ label: string; value: string }>; // 下拉选项
	expiryDate?: string; // 过期时间
	attachments?: Array<{ url: string; name: string }>; // 附件列表
	// 后端返回的原始字段
	userTagId?: number; // 用户标签关联id
	tagValues?: string; // 标签值（多个）
	tagValueList?: string[]; // 标签值列表
	tagType?: string; // 标签类型
}

/**
 * 标签分类结构
 */
export interface TagCategory {
	id: string;
	name: string; // 分类名称
	children?: TagCategory[]; // 子分类
	tags: TagInfo[]; // 标签列表
}

/**
 * 审核流程节点（对应接口返回的 ApprovalNodeItem）
 */
export interface AuditProcessNode {
	/* 审核任务id */
	approvalId: string;
	/* 审核人 */
	approver: string;
	/* 审核人姓名 */
	approverName: string;
	/* 审批意见 */
	approvalComments: string;
	/* 节点id */
	nodeId: string;
	/* 节点名称 */
	nodeName: string;
	/* 状态 */
	status: string;
	/* 更新时间 */
	updateTime: string;
	/* 关联标签名称（从外层数据获取） */
	tagName?: string;
	/* 解析后的审核时间（从 updateTime 解析，用于显示） */
	auditTime?: string;
}

/**
 * 附件上传项
 */
export interface AttachmentItem {
	tagName: string; // 标签名称
	requirement: string; // 要求说明
	fileList: any[]; // 文件列表
}

/**
 * 标签选项（用于导入导出）
 */
export interface TagOption {
	label: string; // 标签名称
	value: string; // 标签ID
	needAttachment?: boolean; // 是否需要附件证明
	attachmentRequirement?: string; // 附件证明要求
}
