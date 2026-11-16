/**
 * 面谈管理API相关类型定义
 */

/**
 * 面谈任务列表查询参数
 */
export interface InterviewListParams {
	/** 页码(不能为空) */
	pageNum?: number;
	/** 每页数量(不能为空) */
	pageSize?: number;
	/** 员工名称 */
	name?: string;
	/** 员工id */
	userId?: number;
	/** 所属组织 */
	orgId?: number;
	/** 岗位id */
	jobId?: number;
	/** 职位id */
	postId?: number;
	/** 状态 */
	status?: string;
	/** 待面谈标签id */
	interviewTagId?: number;
	/** 已面谈标签id */
	interviewedTagId?: number;
	/** 面谈人 */
	interviewer?: number;
	/** 转派面谈人 */
	assignInterviewer?: number;
}

/**
 * 面谈任务列表项
 */
export interface InterviewItem {
	/** 岗位id */
	jobId: number;
	/** 岗位名称 */
	jobName: string;
	/** 所属组织 */
	orgId: number;
	/** 所属组织名称 */
	orgName: string;
	/** 所属组织全路径名称 */
	orgFullName: string;
	/** 职位id */
	postId: number;
	/** 职位名称 */
	postName: string;
	/** 主键id */
	id: number;
	/** 员工名称 */
	name: string;
	/** 工号 */
	userCode: string;
	/** 状态 */
	status: string;
	/** 状态名称 */
	statusName: string;
	/** 待面谈标签 */
	interviewTags: string;
	/** 已面谈标签 */
	interviewedTags: string;
	/** 面谈任务id */
	interviewId: string;
	/** 面谈人id */
	interviewUserId: string;
	/** 面谈人名称 */
	interviewUserName: string;
	/** 转派面谈人id */
	assignInterviewUserId: string;
	/** 转派面谈人名称 */
	assignInterviewUserName: string;
	/** 最新触发面谈时间 */
	updateTime: string;
	/** 完成面谈时间 */
	endTime: string;
}

/**
 * 面谈详情标签项
 */
export interface InterviewTagItem {
	/** 主键id */
	id: number;
	/** 面谈主键id */
	interviewId: string;
	/** 标签id */
	tagId: number;
	/** 标签名 */
	tagName: string;
	/** 标签值 */
	tagValue: string;
	/** 标签值 */
	tagValues: string;
	/** 标签值 */
	tagValueList: string[];
}

/**
 * 历史面谈记录项
 */
export interface InterviewHistoryItem {
	/** 主键id */
	id: number;
	/** 面谈目的字典值 */
	purpose: string;
	/** 面谈目的 */
	purposeDesc: string;
	/** 总体评价 */
	overall: string;
	/** 面谈触发时间 */
	createTime: string;
	/** 完成面谈时间 */
	endTime: string;
	/** 面谈标签 */
	tags: Array<{
		/** id */
		id: number;
		/** 名称 */
		name: string;
		/** 值 */
		value: string;
	}>;
	/** 附件列表；未上传附件时后端返回 null */
	fileList?: UploadFileFormItem[] | null;
}

/**
 * 面谈详情历史记录项
 */
export interface InterviewDetailHistoryItem {
	/** 主键id */
	id: number;
	/** 面谈目的字典值 */
	purpose: string;
	/** 面谈目的 */
	purposeDesc: string;
	/** 总体评价 */
	overall: string;
	/** 面谈触发时间 */
	createTime: string;
	/** 完成面谈时间 */
	endTime: string;
	/** 附件列表 */
	fileList?: UploadFileFormItem[];
}

/**
 * 面谈详情树形标签项
 */
export interface InterviewTreeTagItem {
	/** 名称 */
	name: string;
	/** id */
	id: string;
	/** 配置 */
	config: {
		/** id键 */
		idKey: string;
		/** 父id键 */
		parentIdKey: string;
		/** 权重键 */
		weightKey: string;
		/** 名称键 */
		nameKey: string;
		/** 子节点键 */
		childrenKey: string;
		/** 深度 */
		deep: number;
	};
	/** 权重 */
	weight: string;
	/** 父id */
	parentId: string;
	/** 是否为空 */
	empty: boolean;
}

/**
 * 面谈详情响应
 */
export interface InterviewDetailResponse {
	/** 岗位id */
	jobId: number;
	/** 岗位名称 */
	jobName: string;
	/** 所属组织 */
	orgId: number;
	/** 所属组织名称 */
	orgName: string;
	/** 所属组织全路径名称 */
	orgFullName: string;
	/** 职位id */
	postId: number;
	/** 职位名称 */
	postName: string;
	/** 主键id */
	id: number;
	/** 员工名称 */
	name: string;
	/** 工号 */
	userCode: string;
	/** 手机号码 */
	mobileNum: string;
	/** 入职日期 */
	joinDate: string;
	/** 面谈任务id */
	interviewId: number;
	/** 面谈目的 */
	purpose: string;
	/** 总体评价 */
	overall: string;
	/** 面谈人id */
	interviewUserId: number;
	/** 转派面谈人id */
	assignInterviewUserId: number;
	/** 附件列表 */
	fileList?: UploadFileFormItem[];
	/** 树形标签结构 */
	treeTags: InterviewTreeTagItem[];
	/** 历史面谈记录列表 */
	hisList: InterviewDetailHistoryItem[];
}

/**
 * 附件信息（对应后端 UploadFileForm）
 */
export interface UploadFileFormItem {
	/** 文件id */
	id: number;
	/** 文件下载地址 */
	url: string;
	/** 文件名称（包含路径） */
	fileName: string;
	/** 新文件名称 */
	newFileName: string;
	/** 原文件名称 */
	originalFilename: string;
}

/**
 * 面谈保存参数
 */
export interface InterviewSaveParams {
	/** 主键id */
	id?: number;
	/** 用户id */
	userId?: number;
	/** 面谈人id */
	interviewUserId?: number;
	/** 转派面谈人id */
	assignInterviewUserId?: number;
	/** 面谈目的 */
	purpose: string;
	/** 总体评价 */
	overall: string;
	/** 标签列表 */
	tags?: Array<{
		/** 标签id */
		tagId?: number;
		/** 标签值 */
		tagValue?: string;
	}>;
	/** 附件信息列表 */
	uploadFileForms?: UploadFileFormItem[];
}

/**
 * 人员面谈标签查询参数
 */
export interface GetUserInterviewTagsParams {
	/** 员工id */
	userId: number;
	/** 面谈人，当前登陆用户为管理员时为必选 */
	interviewUserId?: number;
}

/**
 * 人员面谈标签项
 */
export interface UserInterviewTagItem {
	/** 标签ID */
	tagId: number;
	/** 标签名称 */
	tagName: string;
}

/**
 * 面谈转派参数
 */
export interface InterviewAssignParams {
	/** 员工id */
	userId: number;
	/** 面谈人，当前登陆用户为管理员时为必选 */
	interviewUserId: number;
	/** 转派面谈人 */
	assignInterviewUserId: number;
	/** 标签列表id */
	tagIds: number[];
}

/**
 * 面谈统计响应
 */
export interface InterviewStats {
	/** 待面谈数 */
	interviewNum: number;
	/** 已面谈数 */
	interviewedNum: number;
	/** 本月新增已面谈数 */
	monthInterviewedNum: number;
}

/**
 * 搜索选项数据
 */
export interface GetSearchOptionsData {
	/** 员工名称 */
	userOptions: {
		/** 用户ID */
		userId: number;
		/** 用户姓名 */
		userName: string;
	}[];
	/** 面谈人 */
	interviewerOptions: {
		/** 用户ID */
		userId: number;
		/** 用户姓名 */
		userName: string;
	}[];
	/** 转派面谈人 */
	assignInterviewerOptions: {
		/** 用户ID */
		userId: number;
		/** 用户姓名 */
		userName: string;
	}[];
	/** 待面谈标签id */
	interviewTagIdOptions: {
		/** 标签ID */
		tagId: number;
		/** 标签名称 */
		tagName: string;
	}[];
	/** 已面谈标签id */
	interviewedTagIdOptions: {
		/** 标签ID */
		tagId: number;
		/** 标签名称 */
		tagName: string;
	}[];
}

/**
 * 人员面谈记录查询响应接口（包含用户信息和面谈历史记录）
 */
export interface InterviewHistoryWithUserResponse {
	/** 用户信息 */
	user: {
		/** 岗位id */
		jobId: number;
		/** 岗位名称 */
		jobName: string;
		/** 所属组织 */
		orgId: number;
		/** 所属组织名称 */
		orgName: string;
		/** 所属组织全路径名称 */
		orgFullName: string;
		/** 职位id */
		postId: number;
		/** 职位名称 */
		postName: string;
		/** 主键id */
		id: number;
		/** 员工名称 */
		name: string;
		/** 工号 */
		userCode: string;
		/** 手机号码 */
		mobileNum: string;
		/** 入职日期 */
		joinDate: string;
	};
	/** 人员面谈历史任务 */
	interviewHisList: {
		/** 主键id */
		id: number;
		/** 面谈目的字典值 */
		purpose: string;
		/** 面谈目的 */
		purposeDesc: string;
		/** 总体评价 */
		overall: string;
		/** 面谈触发时间 */
		createTime: string;
		/** 完成面谈时间 */
		endTime: string;
		/** 面谈标签 */
		tags: {
			/** id */
			id: number;
			/** 名称 */
			name: string;
			/** 值 */
			value: string;
		}[];
		/** 附件列表；未上传附件时后端返回 null */
		fileList?: UploadFileFormItem[] | null;
	}[];
}
