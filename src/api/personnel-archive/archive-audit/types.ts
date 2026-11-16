/**
 * 档案审核API相关类型定义
 */

/**
 * 档案审核列表查询参数
 */
import type { ArchiveAuditStatus } from "#src/pages/personnel-archive/config";

export interface ArchiveAuditListParams {
	/* 页码(不能为空) */
	pageNum?: number;
	/* 每页数量(不能为空) */
	pageSize?: number;
	/* 员工名称 */
	name?: string;
	/* 所属组织 */
	orgId?: number;
	/* 岗位id */
	jobId?: number;
	/* 职位id */
	postId?: number;
	/* 状态 */
	status?: string;
	/* 待审核标签id */
	approveTagId?: number;
	/* 已审核标签id */
	approvedTagId?: number;
	/* 提交人 */
	submitUser?: number;
	/* 审核人 */
	approver?: number;
}

/**
 * 档案审核列表项
 */
export interface ArchiveAuditItem {
	/* 主键id */
	id: number;
	/* 用户id（用于查询详情和标签列表） */
	userId?: number;
	/* 员工名称 */
	name: string;
	/* 工号 */
	userCode: string;
	/* 所属组织 */
	orgId: number;
	/* 所属组织名称 */
	orgName: string;
	/* 所属组织完整路径名称 */
	orgFullName?: string;
	/* 岗位id */
	jobId: number;
	/* 岗位名称 */
	jobName: string;
	/* 职位id */
	postId: number;
	/* 职位名称 */
	postName: string;
	/* 入职时间 */
	joinDate: string;
	/* 审核状态 */
	status: ArchiveAuditStatus;
	/* 待审核标签 */
	approveTags: string;
	/* 已审核标签 */
	approvedTags: string;
	/* 提交人姓名 */
	submitUserName: string;
	/* 审核人姓名 */
	approverName: string;
	/* 审核人ID */
	approver?: number;
	/* 更新时间 */
	updateTime: string;
}

/**
 * 档案审核详情标签项
 */
export interface ArchiveAuditTagItem {
	/* 主键id */
	id: number;
	/* 用户id */
	userId: number;
	/* 标签id */
	tagId: number;
	/* 标签名称 */
	tagName: string;
	/* 当前标签值 */
	tagValue: string;
	/* 原标签值 */
	oldTagValue: string;
	/* 标签附件证明列表 */
	tagFileList?: Array<{
		/* 文件名 */
		fileName: string;
		/* 原文件名 */
		originalFilename: string;
	}>;
	/* 状态 */
	status: string;
	/* 业务分类 */
	businessCategory: string;
	/* 创建者姓名 */
	createByName?: string;
	/* 附加信息 */
	extra?: string;
	/* 审核时间 */
	approvalTime?: string;
	/* 审批意见 */
	approvalComments?: string;
}

/**
 * 档案审核详情响应
 */
export interface ArchiveAuditDetailResponse {
	/* 主键id */
	id: number;
	/* 员工名称 */
	name: string;
	/* 工号 */
	userCode: string;
	/* 所属组织 */
	orgId: number;
	/* 所属组织名称 */
	orgName: string;
	/* 岗位id */
	jobId: number;
	/* 岗位名称 */
	jobName: string;
	/* 职位id */
	postId: number;
	/* 职位名称 */
	postName: string;
	/* 手机号码 */
	mobileNum: string;
	/* 维护完善度 */
	perfectDegree: number;
	/* 入职日期 */
	joinDate?: string;
	/* 维护人 */
	maintainer?: string;
	/* 标签列表 */
	tags?: Array<{
		/* 标签id */
		id: number;
		/* 用户标签关联id */
		userTagId: number;
		/* 标签名 */
		tagName: string;
		/* 标签值 */
		tagValue: string;
		/* 标签值 */
		tagValues: string;
		/* 标签值 */
		tagValueList: string[];
		/* 是否过期 */
		expired: boolean;
		/* 是否必填 */
		isRequired: string;
		/* 业务分类 */
		businessCategory: string;
		/* 标签类型 */
		tagType: string;
		/* 是否需要附件证明（手工标签模式下填写，0:否，1:是） */
		isAttProofTagging: string;
	}>;
	/* 标签列表（树形结构） */
	treeTags: Array<{
		name: string;
		id: string;
		config: {
			idKey: string;
			parentIdKey: string;
			weightKey: string;
			nameKey: string;
			childrenKey: string;
			deep: number;
		};
		parentId: string;
		weight: string;
		empty: boolean;
	}>;
	/** 人才标签变更列表 */
	tagChangeList: Array<{
		/** 标签id */
		tagId: number;
		/** 标签名 */
		tagName: string;
		/** 标签值（详情和编辑都使用此字段） */
		tagValue: string;
		/** 原标签值 */
		oldTagValue: string;
		/** 暂存标识，true 表示暂存 */
		tempSave: boolean;
	}>;
}

/**
 * 审核驳回参数
 */
export interface RefuseParams {
	/* 审批意见 */
	approvalComments: string;
	/* 审批流程id列表 */
	ids: number[];
}

/**
 * 审核通过参数
 */
export interface PassParams {
	/* 审批流程id列表 */
	ids: number[];
}

/**
 * 审核统计响应
 */
export interface ArchiveAuditStats {
	/* 待审核数 */
	approveNum: number;
	/* 已通过数 */
	passedNum: number;
	/* 本月新增已通过数 */
	monthPassedNum: number;
	/* 已拒绝数 */
	refusedNum: number;
	/* 本月新增已拒绝数 */
	monthRefusedNum: number;
}

/**
 * 搜索选项数据
 */
export interface GetSearchOptionsData {
	/* 提交人 */
	submitUserOptions: {
		/* 用户ID */
		userId: number;

		/* 用户姓名 */
		userName: string;
	}[];

	/* 审核人 */
	approverOptions: {
		/* 用户ID */
		userId: number;

		/* 用户姓名 */
		userName: string;
	}[];

	/* 待审核标签id */
	approveTagIdOptions: {
		/* 标签ID */
		tagId: number;

		/* 标签名称 */
		tagName: string;
	}[];

	/* 已审核标签id */
	approvedTagIdOptions: {
		/* 标签ID */
		tagId: number;

		/* 标签名称 */
		tagName: string;
	}[];
}
