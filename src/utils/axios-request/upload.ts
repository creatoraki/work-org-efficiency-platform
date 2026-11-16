import type { AxiosProgressEvent } from "axios";
import type { RequestInstance, RequestOptions } from "./types";

/**
 * 上传进度回调函数
 *
 * @param progress - 进度信息（0-100）
 * @param loaded - 已上传字节数
 * @param total - 总字节数
 */
export type UploadProgressCallback = (progress: number, loaded: number, total: number) => void;

/**
 * 下载进度回调函数
 *
 * @param progress - 进度信息（0-100）
 * @param loaded - 已下载字节数
 * @param total - 总字节数
 */
export type DownloadProgressCallback = (progress: number, loaded: number, total: number) => void;

/**
 * 文件上传配置
 */
export interface UploadConfig extends Omit<RequestOptions, "onUploadProgress"> {
	/** 上传进度回调 */
	onUploadProgress?: UploadProgressCallback;
	/** 是否显示上传进度提示 */
	showProgress?: boolean;
}

/**
 * 文件下载配置
 */
export interface DownloadConfig extends Omit<RequestOptions, "onDownloadProgress"> {
	/** 下载进度回调 */
	onDownloadProgress?: DownloadProgressCallback;
	/** 下载文件名（如果不提供，从响应头获取） */
	filename?: string;
	/** 是否显示下载进度提示 */
	showProgress?: boolean;
}

/**
 * 上传文件
 *
 * @param instance - 请求实例
 * @param url - 上传地址
 * @param file - 文件对象或 FormData
 * @param config - 上传配置
 * @returns Promise
 */
export async function uploadFile<T = unknown>(
	instance: RequestInstance,
	url: string,
	file: File | FormData,
	config?: UploadConfig,
): Promise<T> {
	const formData = file instanceof FormData ? file : new FormData();
	if (file instanceof File) {
		formData.append("file", file);
	}

	const finalConfig = {
		...config,
		headers: {
			"Content-Type": "multipart/form-data",
			...config?.headers,
		},
		onUploadProgress: (progressEvent: AxiosProgressEvent) => {
			if (config?.onUploadProgress && progressEvent.total) {
				const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
				config.onUploadProgress(progress, progressEvent.loaded, progressEvent.total);
			}
		},
	} as RequestOptions;

	return instance.post<T>(url, formData, finalConfig);
}

/**
 * 下载文件
 *
 * @param instance - 请求实例
 * @param url - 下载地址
 * @param config - 下载配置
 * @returns Promise<Blob>
 */
export async function downloadFile(
	instance: RequestInstance,
	url: string,
	config?: DownloadConfig,
): Promise<Blob> {
	const finalConfig = {
		...config,
		responseType: "blob" as const,
		onDownloadProgress: (progressEvent: AxiosProgressEvent) => {
			if (config?.onDownloadProgress && progressEvent.total) {
				const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
				config.onDownloadProgress(progress, progressEvent.loaded, progressEvent.total);
			}
		},
	} as RequestOptions;

	const response = await instance.get<Blob>(url, finalConfig);

	// 直接返回 Blob（拦截器已处理类型转换）
	return response as Blob;
}

/**
 * 保存文件到本地
 *
 * @param blob - 文件 Blob 对象
 * @param filename - 文件名
 */
export function saveFile(blob: Blob, filename: string): void {
	const url = window.URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	window.URL.revokeObjectURL(url);
}

/**
 * 下载文件并保存到本地
 *
 * @param instance - 请求实例
 * @param url - 下载地址
 * @param filename - 文件名（可选，如果不提供则从响应头获取）
 * @param config - 下载配置
 * @returns Promise<void>
 */
export async function downloadAndSaveFile(
	instance: RequestInstance,
	url: string,
	filename?: string,
	config?: DownloadConfig,
): Promise<void> {
	const blob = await downloadFile(instance, url, config);

	// 如果没有提供文件名，尝试从响应头获取
	if (!filename && config?.withFullResponse) {
		// 如果返回了完整响应，可以从响应头获取文件名
		// 这里需要根据实际情况调整
		filename = "download";
	}

	saveFile(blob, filename || "download");
}

// 导出断点续传相关类型和函数
export type { ChunkConfig, ResumableConfig } from "./resumable";
export {
	clearProgressFromLocalStorage,
	getProgressFromLocalStorage,
	saveProgressToLocalStorage,
	uploadFileWithChunks,
} from "./resumable";
