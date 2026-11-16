import { request } from "#src/utils/axios-request";

export * from "./types";

/** 从环境变量读取 OSS 桶名称（dev/test: eff-test，prd: eff-prd），预览/下载接口必传 */
const OSS_BUCKET_NAME = import.meta.env.VITE_OSS_BUCKET_NAME as string | undefined;

/** 获取 OSS 桶名称（必传），未配置环境变量时返回空字符串 */
export function getOssBucketName(): string {
	return OSS_BUCKET_NAME ?? "";
}

export interface OssFileParams {
	/** 桶名称（必传） */
	bucketName: string;
	fileName: string;
}

function buildOssQuery(params: OssFileParams): string {
	const searchParams = new URLSearchParams();
	searchParams.set("bucketName", params.bucketName);
	searchParams.set("fileName", params.fileName);
	return searchParams.toString();
}

/**
 * 从OSS下载文件
 * @param bucketName 桶名称
 * @param fileName 文件名
 */
export async function downloadFileFromOss(bucketName: string, fileName: string): Promise<Blob> {
	const query = buildOssQuery({ bucketName, fileName });
	return request.get<Blob>(`file/oss/download?${query}`, {
		responseType: "blob",
	});
}

/**
 * 通过参数下载 OSS 文件（bucketName 必传）
 */
export async function downloadFileByParamsFromOss(params: OssFileParams): Promise<Blob> {
	const query = buildOssQuery(params);
	return request.get<Blob>(`file/oss/download?${query}`, {
		responseType: "blob",
	});
}

/**
 * 获取 OSS 文件预览地址（bucketName 必传）
 */
export function getFilePreviewUrlFromOss(params: OssFileParams): string {
	const query = buildOssQuery(params);
	const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";
	const normalizedBaseUrl = apiBaseUrl.endsWith("/") ? apiBaseUrl.slice(0, -1) : apiBaseUrl;
	return `${window.location.origin}${normalizedBaseUrl}/file/oss/preview?${query}`;
}

/**
 * 通过预览接口获取 OSS 文件 Blob（用于需鉴权的图片预览等）
 */
export async function getPreviewBlobFromOss(params: OssFileParams): Promise<Blob> {
	const query = buildOssQuery(params);
	return request.get<Blob>(`file/oss/preview?${query}`, {
		responseType: "blob",
	});
}
