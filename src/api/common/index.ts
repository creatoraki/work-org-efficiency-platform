/**
 * 通用API接口
 */

import type {
	ImportDataRes,
	JobOptionItem,
	OssFileParams,
	OssUploadFileResult,
	OssUploadResult,
	PositionOptionItem,
	PostgradeOptionItem,
} from "./types";

import { request } from "#src/utils/axios-request";

export { fetchOrganizationTree, fetchUsersByDeptId } from "./org";
// 导出类型
export type {
	ImportDataRes,
	JobOptionItem,
	OrganizationTreeNode,
	OssFileParams,
	OssUploadFileResult,
	OssUploadResult,
	PositionOptionItem,
	PostgradeOptionItem,
} from "./types";

/**
 * 获取岗位选项列表
 *
 * @returns 岗位选项列表
 */
export async function fetchJobOptions(): Promise<JobOptionItem[]> {
	return request.get<JobOptionItem[]>("post/job/options");
}

/**
 * 获取职位选项列表
 *
 * @param jobIds - 岗位 ID 列表；为空时返回全部职位选项
 * @returns 职位选项列表
 */
export async function fetchPositionOptions(jobIds?: number[]): Promise<PositionOptionItem[]> {
	const params: Record<string, string> = {};
	if (jobIds && jobIds.length > 0) {
		params.jobIds = jobIds.join(",");
	}
	return request.get<PositionOptionItem[]>("post/position/options", {
		params,
	});
}

/**
 * 获取职级选项列表
 *
 * @param postIds - 职位 ID 列表；为空时返回全部职级选项
 * @returns 职级选项列表
 */
export async function fetchPostgradeOptions(postIds?: string[]): Promise<PostgradeOptionItem[]> {
	const params: Record<string, string> = {};
	if (postIds && postIds.length > 0) {
		params.postIds = postIds.join(",");
	}
	return request.get<PostgradeOptionItem[]>("post/postgrade/options", {
		params,
	});
}

// 文件操作（file/oss/* 新接口，四个接口统一维护在此处）

/**
 * 单个文件上传接口（POST file/oss/upload）
 *
 * @param file - 要上传的文件
 * @returns 单文件上传结果
 */
export async function ossUploadFile(file: File): Promise<OssUploadFileResult> {
	const formData = new FormData();
	formData.append("file", file);
	return request.post<OssUploadFileResult>("file/oss/upload", formData, {
		headers: { "Content-Type": "multipart/form-data" },
	});
}

/**
 * 批量文件上传接口（POST file/oss/uploads）
 *
 * @param files - 要上传的文件数组
 * @returns 上传结果（newFileNames / ids / fileNames / originalFilenames，均为逗号分隔字符串）
 */
export async function ossUploadFiles(files: File[]): Promise<OssUploadResult> {
	const formData = new FormData();
	files.forEach((file) => formData.append("files", file));
	return request.post<OssUploadResult>("file/oss/uploads", formData, {
		headers: { "Content-Type": "multipart/form-data" },
	});
}

/**
 * 预览文件接口（GET file/oss/preview）
 *
 * 通过鉴权代理获取 OSS 文件 Blob，适用于需要登录态才能访问的图片/文档预览。
 *
 * @param params - OSS 文件参数（bucketName、fileName）
 * @returns 文件 Blob
 */
export async function ossPreviewFile(params: OssFileParams): Promise<Blob> {
	const searchParams = new URLSearchParams();
	searchParams.set("bucketName", params.bucketName);
	searchParams.set("fileName", params.fileName);
	return request.get<Blob>(`file/oss/preview?${searchParams.toString()}`, {
		responseType: "blob",
	});
}

/**
 * 下载文件接口（GET file/oss/download）
 *
 * @param params - OSS 文件参数（bucketName、fileName）
 * @returns 文件 Blob
 */
export async function ossDownloadFile(params: OssFileParams): Promise<Blob> {
	const searchParams = new URLSearchParams();
	searchParams.set("bucketName", params.bucketName);
	searchParams.set("fileName", params.fileName);
	return request.get<Blob>(`file/oss/download?${searchParams.toString()}`, {
		responseType: "blob",
		headers: { "Content-Type": undefined },
	} as Parameters<typeof request.get>[1]);
}

// 导入任务

/**
 * 新增导入任务
 *
 * @param templateId - 模板 id
 * @param extMapStr - 额外信息
 * @param file - 导入文件
 * @returns 导入任务响应
 */
export async function importData(
	templateId: number,
	extMapStr: string,
	file: File,
): Promise<ImportDataRes> {
	const formData = new FormData();
	formData.append("file", file);
	formData.append("templateId", String(templateId));
	formData.append("extMapStr", extMapStr);

	return request.put<ImportDataRes>("support/import", formData);
}
