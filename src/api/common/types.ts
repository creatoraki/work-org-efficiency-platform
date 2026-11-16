/**
 * 通用API相关类型定义
 */

/**
 * 岗位选项
 */
export interface JobOptionItem {
	/** 岗位 ID */
	jobId: number;
	/** 岗位名称 */
	jobName: string;
	/** 展示名称 */
	displayName: string;
}

/**
 * 职位选项
 */
export interface PositionOptionItem {
	/** 职位 ID */
	postId: number;
	/** 职位名称 */
	postName: string;
	/** 展示名称 */
	displayName: string;
}

/**
 * 职级选项
 */
export interface PostgradeOptionItem {
	/** 职级 ID */
	postgradeId: number;
	/** 职级名称 */
	postgradeName: string;
}

/**
 * 组织树节点
 */
export interface OrganizationTreeNode {
	/** 组织ID 主键 */
	id: string;
	/** 组织名称 */
	name: string;
	/** 组织编码 */
	code: string;
	/** 祖先编码路径 */
	ancestors?: string;
	/** 部门全称 */
	fullname: string;
	/** 组织层级（如：TOP、GROUP 等） */
	level: string;
	/** 子结点 */
	children?: OrganizationTreeNode[];
}

/**
 * 新增导入任务响应
 */
export interface ImportDataRes {
	/** 返回码 */
	code: number;
	/** 返回码说明 */
	msg: string;
	/** 返回数据 */
	data: boolean;
}

/**
 * OSS 文件操作参数（file/oss/* 接口通用）
 */
export interface OssFileParams {
	/** 桶名称（必传） */
	bucketName: string;
	/** 文件名称（包含路径） */
	fileName: string;
}

/**
 * OSS 单文件上传响应数据（file/oss/upload）。
 */
export interface OssUploadFileResult {
	/** 文件 ID */
	id: number;
	/** 文件名（包含存储路径） */
	fileName: string;
	/** 新文件名（包含存储路径） */
	newFileName: string;
	/** 原文件名 */
	originalFilename: string;
}

/**
 * OSS 批量上传响应数据（file/oss/uploads）。
 *
 * 各字段均为逗号分隔的字符串，字段值按上传文件顺序一一对应。
 */
export interface OssUploadResult {
	/** 新文件名列表（逗号分隔） */
	newFileNames: string;
	/** 文件ID列表（逗号分隔） */
	ids: string;
	/** 文件名列表（逗号分隔） */
	fileNames: string;
	/** 原文件名列表（逗号分隔） */
	originalFilenames: string;
}
