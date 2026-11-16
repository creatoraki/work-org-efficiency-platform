/**
 * 人员档案通用类型定义
 */

/**
 * 审核流程节点项
 */
export interface ApprovalNodeItem {
	/* 审核任务id */
	approvalId: number;
	/* 审核人 */
	approver: number;
	/* 审核人姓名 */
	approverName: string;
	/* 审批意见 */
	approvalComments: string;
	/* 节点id */
	nodeId: number;
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
	id: number;
	/* 用户id */
	userId: number;
	/* 标签id */
	tagId: number;
	/* 标签名称 */
	tagName: string;
	/* 用户标签审核节点列表 */
	nodeList: ApprovalNodeItem[];
}

/**
 * 用户信息
 */
export interface UserInfo {
	/** 用户id */
	id: number;
	/** 用户名称 */
	name: string;
	/** 用户账号 */
	account: string;
	/** 岗位名称code */
	staffJobCode: string;
	/** 职位名称code */
	staffPostCode: string;
	/** 职位名称 */
	staffPostName: string;
	/** 岗位名称 */
	staffJobName: string;
	/** 部门id */
	deptId: number;
	/** 部门名称 */
	deptName: string;
	/** 电话号码 */
	mobileNum: string;
	/** 用户状态 */
	status: string;
	/** 在职状态:1在职2离职3退休 */
	jobStatus: string;
	/** 在职状态名称 */
	jobStatusName: string;
	/** 用户类型 */
	userType: string;
	/** 最后登录时间 */
	loginDate: Record<string, unknown>;
}

/**
 * 部门树节点
 */
export interface DeptTreeNode {
	/** 部门ID */
	deptId: number;
	/** 部门编码 */
	deptCode: string;
	/** 部门名称 */
	deptName: string;
	/** 父部门ID */
	parentId: number;
	/** 子部门 */
	children?: DeptTreeNode[];
}

/**
 * 分页查询用户列表请求参数
 */
export interface PageUserListParams {
	/** 用户账号（支持模糊搜索） */
	account?: string;
	/** 用户姓名（支持模糊搜索） */
	name?: string;
	/** 手机号码（支持模糊搜索） */
	mobileNum?: string;
	/** 用户状态（0正常 1停用） */
	status?: string;
	/** 在职状态（1在职2离职3退休） */
	jobStatus?: string;
	/** 部门id */
	deptId?: number;
	/** 部门编码 */
	deptCode?: string;
	/** 页码(不能为空) */
	pageNum: number;
	/** 每页数量(不能为空) */
	pageSize: number;
	/** 排序字段集合 */
	sortItemList?: unknown[];
}
