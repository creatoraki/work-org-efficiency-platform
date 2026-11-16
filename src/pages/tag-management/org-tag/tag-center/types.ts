import type { TAG_TYPE, TagCenterStatus } from "../../config";

/**
 * 组织标签中心数据项接口
 */
export interface TagCenterItem {
	/** 主键ID */
	id: string;
	/** 标签类型 */
	tagType: string;
	/** 标签类型名称 */
	tagTypeName?: string;
	/** 标签名称 */
	tagName: string;
	/** 标签规则id */
	tagRulesId?: string;
	/** 标签值 */
	tagValue: string;
	/** 标签描述 */
	tagDescription: string;
	/** AI标签描述 */
	aiTagDescription?: string;
	/** AI标签编码 */
	aliTagCode?: string;
	/** 业务类别 */
	businessCategory: string;
	/** 业务类别名称 */
	businessCategoryName?: string;
	/** 是否必填：0=否，1=是 */
	isRequired: string;
	/** 是否必填名称 */
	isRequiredName?: string;
	/** 敏感程度 */
	sensitivityLevel?: string;
	/** 敏感程度名称 */
	sensitivityLevelName?: string;
	/** 存在周期 */
	existenceCycle: string;
	/** 更新频次 */
	updateFrequency: string;
	/** 更新频次名称 */
	updateFrequencyName?: string;
	/** 维护人 */
	maintainer: string;
	/** 维护人姓名 */
	maintainerName?: string;
	/** 维护人类型 */
	maintainerType?: string;
	/** 维护人类型名称 */
	maintainerTypeName?: string;
	/** 提交人 */
	submitter?: string;
	/** 提交人姓名 */
	submitterName?: string;
	/** 审核人 */
	auditor?: string;
	/** 审核人姓名 */
	auditorName?: string;
	/** 审核状态（待审核，已通过，已拒绝） */
	auditStatus?: string;
	/** 审核状态名称 */
	auditStatusName?: string;
	/** 审核意见 */
	auditComment?: string;
	/** 状态（待上线，审核中，已上线，已拒绝，已下线） */
	status: TagCenterStatus;
	/** 状态名称 */
	statusName?: string;
	/** 打标是否需要审核（手工标签模式下填写，0:否，1:是） */
	isAuditTagging?: string;
	/** 打标是否需要审核名称 */
	isAuditTaggingName?: string;
	/** 审核流程（手工标签模式下填写） */
	auditProcessTagging?: string;
	/** 是否需要附件证明（手工标签模式下填写，0:否，1:是） */
	isAttProofTagging?: string;
	/** 是否需要附件证明名称 */
	isAttProofTaggingName?: string;
	/** 附件证明要求（手工标签模式下填写） */
	attProofReqsTagging?: string;
	/** 是否需要面谈（手工标签模式下填写，0:否，1:是） */
	isFtfInterview?: string;
	/** 是否需要面谈名称 */
	isFtfInterviewName?: string;
	/** 面谈更新频次（手工标签模式下填写，需要配置字典） */
	ftfInterviewUpdFreq?: string;
	/** 面谈更新频次名称 */
	ftfInterviewUpdFreqName?: string;
	/** 面谈人（手工标签模式下填写） */
	ftfInterviewer?: string;
	/** 标签库类型（1:组织标签，2:人才标签） */
	type: string;
	/** 标签库类型名称 */
	typeName?: string;
	/** 创建人 */
	createBy: string;
	/** 更新人 */
	updateBy: string;
	/** 创建人姓名 */
	createByName?: string;
	/** 更新人姓名 */
	updateByName?: string;
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
	/** 状态 */
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
