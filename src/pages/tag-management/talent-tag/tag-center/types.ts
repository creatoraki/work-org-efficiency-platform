import type { OnlineStatus, TAG_TYPE, TagCenterStatus } from "../../config";

/**
 * 人才标签中心数据项接口
 */
export interface TagCenterItem {
	/** 唯一标识 */
	id: string;
	/** 标签名称 */
	tagName: string;
	/** 标签值 */
	tagValue: string;
	/** 标签类型 */
	tagType: string;
	/** 标签描述 */
	tagDescription: string;
	/** 业务类别 - 支持级联选择器的数组格式 */
	businessCategory: string | string[];
	/** 是否必填 */
	isRequired: string;
	/** 敏感程度 */
	sensitivityLevel?: string;
	/** 到期时间 */
	existenceCycle: string;
	/** 更新频次 */
	updateFrequency: string;
	/** 维护人 */
	maintainer: string;
	/** 维护人类型（1:人员，2:角色） */
	maintainerType?: string;
	/** 维护人显示名称 */
	maintainerName?: string;
	/** 审核人 */
	auditor?: string;
	/** 审核人类型（1:人员，2:角色） */
	auditorType?: string;
	/** 审核人显示名称 */
	auditorName?: string;
	/** 关联规则 */
	relatedRules: string[];
	/** 审核意见 */
	auditComment?: string;
	/** 打标是否需要审核（手工标签模式下填写，0:否，1:是） */
	isAuditTagging?: string;
	/** 审核流程（手工标签模式下填写） */
	auditProcessTagging?:
		| Array<{
				/** 步骤编号 */
				step: string | number;
				/** 步骤名称 */
				stepName: string;
				/** 审批人ID */
				approver: string | number;
				/** 审批人类型（1:人员，2:角色） */
				type: string;
				/** 审批人显示名称 */
				approverName?: string;
		  }>
		| string;
	/** 是否需要附件证明（手工标签模式下填写，0:否，1:是） */
	isAttProofTagging?: string;
	/** 附件证明要求（手工标签模式下填写） */
	attProofReqsTagging?: string;
	/** 是否需要面谈（手工标签模式下填写，0:否，1:是） */
	isFtfInterview?: string;
	/** 面谈更新频次（手工标签模式下填写，需要配置字典） */
	ftfInterviewUpdFreq?: string;
	/** 面谈人（手工标签模式下填写） */
	ftfInterviewer?: string;
	/** 标签规则id（"系统标签"模式下填写） */
	tagRulesId?: string;
	tagRulesName?: string;
	/** 阿里ai标签描述（"智能标签"模式下填写） */
	aiTagDescription?: string;
	/** 阿里标签编码（"智能标签"模式下填写） */
	aliTagCode?: string;
	/** 状态（使用字典 tag_status，值为 "0": 待上线, "1": 审核中, "2": 已上线, "3": 已拒绝, "4": 已下线） */
	status: TagCenterStatus;
	/** 创建人 */
	creator: string;
	/** 更新人 */
	updater: string;
	/** 创建时间 */
	createTime: string;
	/** 更新时间 */
	updateTime: string;
	/** 职位关联表 */
	tagPositionList?: Array<{
		/** 节点ID */
		id: string;
		/** 节点类型: root-根节点, job-岗位, position-职位 */
		type: string;
	}>;
}

/**
 * 标签中心搜索表单接口
 */
export interface TagCenterSearchForm {
	/** 标签名称 */
	tagName?: string;
	/** 标签值 */
	tagValue?: string;
	/** 标签类型 */
	tagType?: TAG_TYPE[];
	/** 标签描述 */
	tagDescription?: string;
	/** 到期时间 */
	existenceCycle?: string[];
	/** 是否必填 */
	isRequired?: string[];
	/** 更新频次 */
	updateFrequency?: string[];
	/** 状态（使用字典 tag_status，值为 "0": 待上线, "1": 审核中, "2": 已上线, "3": 已拒绝） */
	status?: string[];
	/** 业务类别 */
	businessCategory?: string;
	/** 维护人 */
	maintainer?: string;
	/** 创建人 */
	creator?: string;
	/** 更新人 */
	updater?: string;
}

/**
 * 标签中心表单数据接口
 */
export interface TagCenterFormData {
	/** 标签名称 */
	tagName: string;
	/** 标签类型 */
	tagType: string;
	/** 标签描述 */
	tagDescription: string;
	/** 关联规则 */
	relatedRules: string[];
}

/**
 * 标签审核数据项接口
 */
export interface TagAuditItem {
	/** 唯一标识 */
	id: string;
	/** 标签名称 */
	tagName: string;
	/** 审核类型 */
	auditType: "create" | "update" | "delete";
	/** 审核状态 */
	auditStatus: "pending" | "approved" | "rejected";
	/** 申请人 */
	applicant: string;
	/** 审核人 */
	auditor?: string;
	/** 申请时间 */
	applyTime: string;
	/** 审核时间 */
	auditTime?: string;
	/** 审核原因 */
	auditReason?: string;
}

/**
 * 岗位描述数据项接口
 */
export interface JobDescriptionItem {
	/** 唯一标识 */
	id: string;
	/** 岗位名称 */
	jobTitle: string;
	/** 部门 */
	department: string;
	/** 岗位描述 */
	jobDescription: string;
	/** 任职要求 */
	requirements: string;
	/** 状态 */
	status: OnlineStatus;
	/** 创建人 */
	creator: string;
	/** 创建时间 */
	createTime: string;
}

/**
 * 匹配模型数据项接口
 */
export interface MatchingModelItem {
	/** 唯一标识 */
	id: string;
	/** 模型名称 */
	modelName: string;
	/** 模型类型 */
	modelType: string;
	/** 模型描述 */
	modelDescription: string;
	/** 准确率 */
	accuracy: number;
	/** 状态 */
	status: OnlineStatus;
	/** 创建人 */
	creator: string;
	/** 创建时间 */
	createTime: string;
}

/**
 * 标签中心表单数据接口
 */
export interface TagCenterFormData {
	/** 标签名称 */
	tagName: string;
	/** 标签类型 */
	tagType: string;
	/** 标签描述 */
	tagDescription: string;
	/** 关联规则 */
	relatedRules: string[];
}
