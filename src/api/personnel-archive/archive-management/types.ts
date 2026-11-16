/**
 * 档案管理API相关类型定义
 */

/**
 * 树形标签节点中的标签项
 */
export interface TreeTagItem {
	/* 标签id（不为空） */
	id: string;
	/* 用户标签关联id（不为空） */
	userTagId: string;
	/* 标签名 */
	tagName: string;
	/* 原标签值 */
	oldTagValue: string;
	/* 标签值 */
	tagValue: string;
	/* 标签值（多个选项用逗号分隔） */
	tagValues: string;
	/* 标签值列表（选项数组，字符串数组） */
	tagValueList: string[];
	/* 是否过期 */
	expired: boolean;
	/* 是否必填 */
	isRequired: string;
	/* 业务分类 */
	businessCategory: string;
	/* 标签类型 */
	tagType: string;
	/* 是否需要附件证明（0:否，1:是） */
	isAttProofTagging: string;
	/* 附件文件列表 */
	tagFileList: {
		/* 文件名 */
		fileName: string;
		/* 原文件名 */
		originalFilename: string;
	} | null;
	/* 审批意见 */
	approvalComments: string;
	/* 状态 */
	status: string;
	/* 审批时间 */
	approveTime: string;
	/* 审批人 */
	approveUser: string;
}

/**
 * 树形标签节点
 */
export interface TreeTagNode {
	/* 节点id */
	id: string;
	/* 父节点id */
	parentId: string;
	/* 权重 */
	weight: number;
	/* 节点名称 */
	name: string;
	/* 子节点列表 */
	children?: TreeTagNode[];
	/* 标签列表（叶子节点才有） */
	tags?: TreeTagItem[];
}

/**
 * 人员档案详情接口返回数据（按照接口文档 DetailRes）
 */
export interface DetailResponse {
	/* 岗位id */
	jobId: string;
	/* 岗位名称 */
	jobName: string;
	/* 所属组织 */
	orgId: string;
	/* 所属组织名称 */
	orgName: string;
	/* 职位id */
	postId: string;
	/* 职位名称 */
	postName: string;
	/* 主键id */
	id: string;
	/* 员工名称 */
	name: string;
	/* 工号 */
	userCode: string;
	/* 手机号码 */
	mobileNum: string;
	/* 维护完善度 */
	perfectDegree: number;
	/* 入职日期 */
	joinDate?: string;
	/* 维护人 */
	maintainer?: string;
	/* 人才标签列表 */
	treeTags: TreeTagNode[];
	/* 人才标签变更列表 */
	tagChangeList: ChangeListItem[];
}

/**
 * 暂存档案接口参数
 */
export interface SaveTempParams {
	/* 主键id */
	userTagId?: string;
	/* 用户id */
	userId: string;
	/* 标签id */
	tagId: string;
	/* 标签值 */
	tagValue?: string;
	/* 临时保存标签值 */
	tempTagValue: string;
}

/**
 * 暂存档案接口返回数据项
 */
export interface SaveTempResponseItem {
	/* 主键id */
	userTagId: string;
	/* 用户id */
	userId: string;
	/* 标签id */
	tagId: string;
	/* 标签值 */
	tagValue: string;
	/* 临时保存标签值 */
	tempTagValue: string;
}

/**
 * 提交档案接口参数
 */
export interface SubmitArchiveParams {
	/* 主键id */
	userTagId?: string;
	/* 用户id */
	userId: string;
	/* 标签id */
	tagId: string;
	/* 标签值 */
	tagValue: string;
	/* 原标签值 */
	oldTagValue: string;
	/* 附件信息 */
	uploadFileForms?: Array<{
		fileName?: string;
		fileUrl?: string;
		[key: string]: unknown;
	}>;
}

/**
 * 审核列表查询参数
 * 注意：接口文档中 tagIds 类型为 Record<string, unknown>[]，但实际应该是 number[]
 */
export interface ChangeListParams {
	/* 用户id */
	userId: string;
	/* 标签id */
	tagIds: string[];
}

/**
 * 审核列表项
 */
export interface ChangeListItem {
	/** 标签id */
	tagId: string;
	/** 标签名 */
	tagName: string;
	/** 标签值（详情和编辑都使用此字段） */
	tagValue: string;
	/** 原标签值 */
	oldTagValue: string;
	/** 暂存标识，true 表示暂存 */
	tempSave: boolean;
}

/**
 * 审核流程节点项
 */
export interface ApprovalNodeItem {
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
}

/**
 * 审核流程响应
 */
export interface ApprovalNodeListResponse {
	/* 主键id */
	id: string;
	/* 用户id */
	userId: string;
	/* 标签id */
	tagId: string;
	/* 标签名称 */
	tagName: string;
	/* 用户标签审核节点列表 */
	nodeList: ApprovalNodeItem[];
}

/**
 * 审核列表项
 */
export interface ApprovalListItem {
	/* 主键id */
	id: string;
	/* 用户id */
	userId: string;
	/* 标签id */
	tagId: string;
	/* 标签名称 */
	tagName: string;
	/* 当前标签值 */
	tagValue: string;
	/* 原标签值 */
	oldTagValue: string;
	/* 附加信息 */
	extra: string;
	/* 标签附件证明列表 */
	tagFileList: Array<{
		/* 文件名 */
		fileName: string;
		/* 原文件名 */
		originalFilename: string;
	}>;
	/* 审批意见 */
	approvalComments: string;
	/* 状态 */
	status: string;
	/* 业务分类 */
	businessCategory: string;
}

/**
 * 预警统计响应
 */
export interface AlertCountResponse {
	/* 待完善标签员工数 */
	needTagUserCount: number;
	/* 待完善标签数 */
	needTagCount: number;
}

/**
 * 导入档案标签的错误信息
 */
export interface TagImportErrorItem {
	/* 错误所在行号（Excel 行号） */
	rowIndex: number;
	/* 错误原因描述 */
	errorMessage: string;
}

/**
 * 导入档案标签接口响应
 */
export interface TagImportResult {
	/* 导入任务ID */
	id: string | null;
	/* 导入是否全部成功 */
	success: boolean;
	/* 总行数 */
	totalRows: number;
	/* 成功行数 */
	successRows: number;
	/* 失败行数 */
	errorRows: number;
	/* 耗时（毫秒） */
	spendTime?: number;
	/* 完成时间 */
	endTime?: string;
	/* 错误列表 */
	errorList: TagImportErrorItem[];
	/* 需要补充附件的记录列表 */
	needAttachmentList?: unknown[];
}

/**
 * 文件导出详情数据
 */
export interface FileExportDetail {
	/** 主键 */
	id: number;
	/** 文件名称 */
	name: string;
	/** 模块名称 */
	module: string;
	/** 文件大小（字节） */
	fileSize: number;
	/** 状态。 -1：导出失败，0：取消，1：排队中，2：导出中，3：导出完成 */
	status: number;
	/** 状态。 -1：导出失败，0：取消，1：排队中，2：导出中，3：导出完成 */
	statusStr: string;
	/** 进度（百分比字符串，如 "100%"） */
	progress: string;
	/** 备注 */
	remark: string | null;
	/** 桶名称 */
	bucketName: string;
}
