/**
 * 标签中心相关类型定义
 */

import type { TAG_TYPE } from "#src/pages/tag-management/config";

/**
 * 标签中心状态字典常量（使用字典 tag_status）
 */
export const TAG_CENTER_STATUS_DICT = {
	/** 待上线 */
	OFFLINE: "0",
	/** 审核中 */
	REVIEWING: "1",
	/** 已上线 */
	ONLINE: "2",
	/** 已拒绝 */
	REJECTED: "3",
	/** 已下线 */
	OFFLINED: "4",
} as const;

/**
 * 标签中心状态类型（字符串类型，使用字典值）
 */
export type TagCenterStatus = (typeof TAG_CENTER_STATUS_DICT)[keyof typeof TAG_CENTER_STATUS_DICT];

/**
 * 标签位置节点
 */
export interface TagPositionNode {
	/** 节点ID */
	id?: string;
	/** 节点类型: root-根节点, job-岗位, position-职位 */
	type?: string;
}

/**
 * 标签列表项（接口返回格式）
 */
export interface TagCenterListItem {
	/** 主键ID */
	id: string;
	/** 标签类型 */
	tagType: string;
	/** 标签类型名称 */
	tagTypeName: string;
	/** 标签名称 */
	tagName: string;
	/** 标签规则id（"系统标签"模式下填写） */
	tagRulesId: string;
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
	/** 敏感程度 */
	sensitivityLevel: string;
	/** 敏感程度名称 */
	sensitivityLevelName: string;
	/** 到期时间 */
	existenceCycle: string;
	/** 更新频次 */
	updateFrequency: string;
	/** 更新频次名称 */
	updateFrequencyName: string;
	/** 维护人 */
	maintainer: string;
	/** 维护人姓名 */
	maintainerName: string;
	/** 状态（待上线，审核中，已上线，已拒绝） */
	status: TagCenterStatus;
	/** 状态名称 */
	statusName: string;
	/** 打标是否需要审核（手工标签模式下填写，0:否，1:是） */
	isAuditTagging: string;
	/** 标签库类型（1:组织标签，2:人才标签） */
	type: string;
	/** 规则选取类型（0:从规则库选取，1:新建自定义复合规则） */
	ruleSelectionType: string;
	/** 创建人 */
	createBy: string;
	/** 更新人 */
	updateBy: string;
	/** 创建人姓名 */
	createByName: string;
	/** 更新人姓名 */
	updateByName: string;
	/** 创建时间 */
	createTime: string;
	/** 更新时间 */
	updateTime: string;
}

/**
 * 标签详情项（接口返回格式）
 */
export interface TagCenterDetailItem {
	/** 主键ID */
	id: string;
	/** 标签类型 */
	tagType: string;
	/** 标签类型名称 */
	tagTypeName: string;
	/** 标签名称 */
	tagName: string;
	/** 标签规则id */
	tagRulesId: string;
	/** 标签规则名称 */
	tagRulesName: string;
	/** 标签值 */
	tagValue: string;
	/** 标签描述 */
	tagDescription: string;
	/** AI标签描述 */
	aiTagDescription: string;
	/** 阿里AI会话ID（"智能标签"模式下填写） */
	aiSessionId: string;
	/** AI标签编码 */
	aliTagCode: string;
	/** 业务类别 */
	businessCategory: string;
	/** 业务类别名称 */
	businessCategoryName: string;
	/** 是否必填：0=否，1=是 */
	isRequired: string;
	/** 是否必填名称 */
	isRequiredName: string;
	/** 敏感程度 */
	sensitivityLevel: string;
	/** 敏感程度名称 */
	sensitivityLevelName: string;
	/** 到期时间 */
	existenceCycle: string;
	/** 更新频次 */
	updateFrequency: string;
	/** 更新频次名称 */
	updateFrequencyName: string;
	/** 维护人 */
	maintainer: string;
	/** 维护人姓名 */
	maintainerName: string;
	/** 维护人类型 */
	maintainerType: string;
	/** 维护人类型名称 */
	maintainerTypeName: string;
	/** 提交人 */
	submitter: string;
	/** 提交人姓名 */
	submitterName: string;
	/** 审核人 */
	auditor: string;
	/** 审核人姓名 */
	auditorName: string;
	/** 审核状态（待审核，已通过，已拒绝） */
	auditStatus: string;
	/** 审核状态名称 */
	auditStatusName: string;
	/** 审核意见 */
	auditComment: string;
	/** 状态（待上线，审核中，已上线，已拒绝） */
	status: TagCenterStatus;
	/** 状态名称 */
	statusName: string;
	/** 打标是否需要审核（手工标签模式下填写，0:否，1:是） */
	isAuditTagging: string;
	/** 打标是否需要审核名称 */
	isAuditTaggingName: string;
	/** 审核流程（手工标签模式下填写） */
	auditProcessTagging: string;
	/** 是否需要附件证明（手工标签模式下填写，0:否，1:是） */
	isAttProofTagging: string;
	/** 是否需要附件证明名称 */
	isAttProofTaggingName: string;
	/** 附件证明要求（手工标签模式下填写） */
	attProofReqsTagging: string;
	/** 是否需要面谈（手工标签模式下填写，0:否，1:是） */
	isFtfInterview: string;
	/** 是否需要面谈名称 */
	isFtfInterviewName: string;
	/** 面谈更新频次（手工标签模式下填写，需要配置字典） */
	ftfInterviewUpdFreq: string;
	/** 面谈更新频次名称 */
	ftfInterviewUpdFreqName: string;
	/** 面谈人（手工标签模式下填写） */
	ftfInterviewer: string;
	/** 标签库类型（1:组织标签，2:人才标签） */
	type: string;
	/** 标签库类型名称 */
	typeName: string;
	/** 规则选取类型（0:从规则库选取，1:新建自定义复合规则） */
	ruleSelectionType: string;
	/** 创建人 */
	createBy: string;
	/** 更新人 */
	updateBy: string;
	/** 创建人姓名 */
	createByName: string;
	/** 更新人姓名 */
	updateByName: string;
	/** 创建时间 */
	createTime: string;
	/** 更新时间 */
	updateTime: string;
	/** 职位关联表 */
	tagPositionList: TagPositionNode[];
}

/**
 * 标签列表查询参数（分页查询）
 */
export interface TagCenterListParams {
	/** 主键ID */
	id?: string;
	/** 标签类型 */
	tagType?: TAG_TYPE;
	/** 标签名称 */
	tagName?: string;
	/** 标签规则id（"系统标签"模式下填写） */
	tagRulesId?: string;
	/** 标签值 */
	tagValue?: string;
	/** 标签描述 */
	tagDescription?: string;
	/** 业务类别 */
	businessCategory?: string;
	/** 是否必填：0=否，1=是 */
	isRequired?: string;
	/** 敏感程度 */
	sensitivityLevel?: string;
	/** 存在周期 */
	existenceCycle?: string;
	/** 更新频次 */
	updateFrequency?: string;
	/** 维护人 */
	maintainer?: string;
	/** 维护人姓名 */
	maintainerName?: string;
	/** 维护人类型 */
	maintainerType?: string;
	/** 状态（待上线，审核中，已上线，已拒绝） */
	status?: string;
	/** 创建人 */
	createBy?: string;
	/** 更新人 */
	updateBy?: string;
	/** 创建人姓名 */
	createByName?: string;
	/** 更新人姓名 */
	updateByName?: string;
	/** 标签库类型（必填，'1': 组织标签，'2': 人才标签） */
	type: string;
	/** 规则选取类型（0:从规则库选取，1:新建自定义复合规则） */
	ruleSelectionType?: string;
	/** 页码(不能为空) */
	pageNum: number;
	/** 每页数量(不能为空) */
	pageSize: number;
}

/**
 * 标签列表查询参数（list查询，非分页）
 */
export interface TagCenterListAllParams {
	/** 主键ID */
	id?: string;
	/** 标签名称 */
	tagName?: string;
	/** 标签类型 */
	tagType?: TAG_TYPE;
	/** 标签规则id */
	tagRulesId?: string;
	/** 标签值 */
	tagValue?: string;
	/** 标签描述 */
	tagDescription?: string;
	/** AI标签描述 */
	aiTagDescription?: string;
	/** AI标签编码 */
	aliTagCode?: string;
	/** 业务类别 */
	businessCategory?: string;
	/** 是否必填：0=否，1=是 */
	isRequired?: string;
	/** 敏感程度 */
	sensitivityLevel?: string;
	/** 存在周期 */
	existenceCycle?: string;
	/** 更新频次 */
	updateFrequency?: string;
	/** 维护人 */
	maintainer?: string;
	/** 维护人姓名 */
	maintainerName?: string;
	/** 维护人类型 */
	maintainerType?: string;
	/** 状态（0:待上线，1:审核中，2:已上线，3:已拒绝，4:已下线） */
	status?: string;
	/** 标签库类型（1:组织标签，2:人才标签） */
	type?: string;
	/** 规则选取类型（0:从规则库选取，1:新建自定义复合规则） */
	ruleSelectionType?: string;
	/** 创建人 */
	createBy?: string;
	/** 更新人 */
	updateBy?: string;
	/** 创建人姓名 */
	createByName?: string;
	/** 更新人姓名 */
	updateByName?: string;
	/** 创建时间 */
	createTime?: string;
	/** 更新时间 */
	updateTime?: string;
}

/**
 * 标签列表项（list查询接口返回格式，无分页信息）
 */
export interface TagCenterListAllItem {
	/** 主键ID */
	id: string;
	/** 标签类型 */
	tagType: TAG_TYPE;
	/** 标签类型名称 */
	tagTypeName?: string;
	/** 标签名称 */
	tagName: string;
	/** 标签规则id（"系统标签"模式下填写） */
	tagRulesId: string;
	/** 标签值 */
	tagValue: string;
	/** 标签描述 */
	tagDescription: string;
	/** 业务类别 */
	businessCategory: string;
	/** 是否必填：0=否，1=是 */
	isRequired: string;
	/** 敏感程度 */
	sensitivityLevel: string;
	/** 到期时间 */
	existenceCycle: string;
	/** 更新频次 */
	updateFrequency: string;
	/** 更新频次名称 */
	updateFrequencyName: string;
	/** 维护人 */
	maintainer: string;
	/** 维护人姓名 */
	maintainerName: string;
	/** 状态（待上线，审核中，已上线，已拒绝） */
	status: string;
	/** 状态名称 */
	statusName: string;
	/** 打标是否需要审核（手工标签模式下填写，0:否，1:是） */
	isAuditTagging: string;
	/** 标签库类型（1:组织标签，2:人才标签） */
	type: string;
	/** 规则选取类型（0:从规则库选取，1:新建自定义复合规则） */
	ruleSelectionType: string;
	/** 创建人 */
	createBy: string;
	/** 更新人 */
	updateBy: string;
	/** 创建人姓名 */
	createByName: string;
	/** 更新人姓名 */
	updateByName: string;
	/** 创建时间 */
	createTime: string;
	/** 更新时间 */
	updateTime: string;
}

/**
 * 单个标签创建参数
 */
export interface TagCenterCreateParams {
	/** 标签类型 */
	tagType?: TAG_TYPE;
	/** 标签名称 */
	tagName: string;
	/** 标签规则id（"系统标签-从规则库选取"模式下填写） */
	tagRulesId?: string;
	/** 标签值 */
	tagValue?: string;
	/** 标签描述 */
	tagDescription?: string;
	/** 阿里AI会话id（"智能标签"模式下填写） */
	aiSessionId?: string;
	/** AI标签描述 */
	aiTagDescription?: string;
	/** 阿里标签编码 */
	aliTagCode?: string;
	/** 业务类别 */
	businessCategory?: string;
	/** 是否必填：0=否，1=是 */
	isRequired?: string;
	/** 敏感程度 */
	sensitivityLevel?: string;
	/** 存在周期 */
	existenceCycle?: string;
	/** 更新频次 */
	updateFrequency?: string;
	/** 维护人 */
	maintainer?: string;
	/** 维护人姓名 */
	maintainerName?: string;
	/** 维护人类型 */
	maintainerType?: string;
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
	/** 审核意见 */
	auditComment?: string;
	/** 状态（待上线，审核中，已上线，已拒绝，已下线） */
	status?: string;
	/** 打标是否需要审核（"手工标签"模式下填写，0:否，1:是） */
	isAuditTagging?: string;
	/** 审核流程（"手工标签"模式下填写） */
	auditProcessTagging?: string;
	/** 是否需要附件证明（"手工标签"模式下填写，0:否，1:是） */
	isAttProofTagging?: string;
	/** 附件证明要求（"手工标签"模式下填写） */
	attProofReqsTagging?: string;
	/** 是否需要面谈（"手工标签"模式下填写，0:否，1:是） */
	isFtfInterview?: string;
	/** 面谈更新频次（"手工标签"模式下填写，需要配置字典） */
	ftfInterviewUpdFreq?: string;
	/** 面谈人（"手工标签"模式下填写） */
	ftfInterviewer?: string;
	/** 标签规则库类型（1:组织标签，2:人才标签） */
	type: string;
	/** 规则选取类型（0:从规则库选取，1:新建自定义复合规则） */
	ruleSelectionType?: string;
	/** 岗位职位列表 */
	tagPositionList?: TagPositionNode[];
	/** 是否在组织大脑中显示 */
	isDisplayInOrgBrain?: boolean;
	/** 标签显隐情况（0:隐性，1:显性） */
	tagVisibility?: string;
	/** 标签分布模块 */
	tagDistributionModule?: string;
}

/**
 * 标签批量创建参数。
 *
 * 创建接口已切换为数组 body：单标签创建传 `[{}]`，智能标签批量创建传 `[{},{...}]`。
 */
export type TagCenterCreateBatchParams = TagCenterCreateParams[];

/**
 * 标签更新参数
 */
export interface TagCenterUpdateParams {
	/** 主键ID */
	id?: string;
	/** 标签类型 */
	tagType?: TAG_TYPE;
	/** 标签名称 */
	tagName?: string;
	/** 标签规则id（"系统标签-从规则库选取"模式下填写） */
	tagRulesId?: string;
	/** 标签值 */
	tagValue?: string;
	/** 标签描述 */
	tagDescription?: string;
	/** 阿里AI会话id（"智能标签"模式下填写） */
	aiSessionId?: string;
	/** AI标签描述 */
	aiTagDescription?: string;
	/** 阿里标签编码 */
	aliTagCode?: string;
	/** 业务类别 */
	businessCategory?: string;
	/** 是否必填：0=否，1=是 */
	isRequired?: string;
	/** 敏感程度 */
	sensitivityLevel?: string;
	/** 存在周期 */
	existenceCycle?: string;
	/** 更新频次 */
	updateFrequency?: string;
	/** 维护人 */
	maintainer?: string;
	/** 维护人姓名 */
	maintainerName?: string;
	/** 维护人类型 */
	maintainerType?: string;
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
	/** 审核意见 */
	auditComment?: string;
	/** 状态（待上线，审核中，已上线，已拒绝，已下线） */
	status?: string;
	/** 打标是否需要审核（"手工标签"模式下填写，0:否，1:是） */
	isAuditTagging?: string;
	/** 审核流程（"手工标签"模式下填写） */
	auditProcessTagging?: string;
	/** 是否需要附件证明（"手工标签"模式下填写，0:否，1:是） */
	isAttProofTagging?: string;
	/** 附件证明要求（"手工标签"模式下填写） */
	attProofReqsTagging?: string;
	/** 是否需要面谈（"手工标签"模式下填写，0:否，1:是） */
	isFtfInterview?: string;
	/** 面谈更新频次（"手工标签"模式下填写，需要配置字典） */
	ftfInterviewUpdFreq?: string;
	/** 面谈人（"手工标签"模式下填写） */
	ftfInterviewer?: string;
	/** 标签规则库类型（1:组织标签，2:人才标签） */
	type: string;
	/** 规则选取类型（0:从规则库选取，1:新建自定义复合规则） */
	ruleSelectionType?: string;
	/** 岗位职位列表 */
	tagPositionList?: TagPositionNode[];
	/** 是否在组织大脑中显示 */
	isDisplayInOrgBrain?: boolean;
	/** 标签显隐情况（0:隐性，1:显性） */
	tagVisibility?: string;
	/** 标签分布模块 */
	tagDistributionModule?: string;
}

/**
 * 批量修改状态参数
 */
export interface BatchUpdateStatusParams {
	/** 标签ID列表 */
	ids: string[];
	/** 状态（字典值：0-待上线，1-审核中，2-已上线，3-已拒绝，4-已下线） */
	status: string;
}

/**
 * 搜索选项响应数据
 */
export interface SearchOptionsResponse {
	/** 维护人列表 */
	maintainerOptions: Array<{
		/** 用户ID */
		userId: string;
		/** 用户姓名 */
		userName: string;
	}>;
	/** 创建人列表 */
	createByOptions: Array<{
		/** 用户ID */
		userId: string;
		/** 用户姓名 */
		userName: string;
	}>;
	/** 更新人列表 */
	updateByOptions: Array<{
		/** 用户ID */
		userId: string;
		/** 用户姓名 */
		userName: string;
	}>;
}

/**
 * 校验标签名称是否重复的请求参数
 */
export interface CheckDuplicateNameParams {
	/** 标签ID（编辑时传入，新增时可不传） */
	id?: string;
	/** 标签名称，不能为空 */
	name: string;
	/** 标签库类型（1:组织标签，2:人才标签） */
	type: string;
}
