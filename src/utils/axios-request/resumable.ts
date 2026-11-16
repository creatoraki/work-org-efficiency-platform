import type { AxiosProgressEvent } from "axios";
import type { RequestInstance, RequestOptions } from "./types";
import type { UploadConfig } from "./upload";
import { logError } from "./logger";
import { uploadFile } from "./upload";

/**
 * 分片配置
 */
export interface ChunkConfig {
	/** 分片大小（字节），默认 2MB */
	chunkSize?: number;
	/** 并发上传分片数，默认 3 */
	concurrency?: number;
	/** 分片上传进度回调 */
	onChunkProgress?: (chunkIndex: number, progress: number, loaded: number, total: number) => void;
	/** 整体上传进度回调 */
	onOverallProgress?: (progress: number, loaded: number, total: number) => void;
}

/**
 * 断点续传配置
 */
export interface ResumableConfig extends UploadConfig, ChunkConfig {
	/** 是否启用断点续传 */
	enableResume?: boolean;
	/** 存储上传进度的键前缀 */
	progressKeyPrefix?: string;
	/** 获取已上传分片列表的函数 */
	getUploadedChunks?: (fileId: string) => Promise<number[]>;
	/** 保存上传进度的函数 */
	saveUploadProgress?: (fileId: string, chunkIndex: number) => Promise<void>;
	/** 清除上传进度的函数 */
	clearUploadProgress?: (fileId: string) => Promise<void>;
}

/**
 * 分片信息
 */
interface ChunkInfo {
	/** 分片索引 */
	index: number;
	/** 分片数据 */
	chunk: Blob;
	/** 分片开始位置 */
	start: number;
	/** 分片结束位置 */
	end: number;
}

/**
 * 生成文件唯一标识
 *
 * @param file - 文件对象
 * @returns 文件标识
 */
function generateFileId(file: File): string {
	// 使用文件名、大小和最后修改时间生成唯一标识
	return `${file.name}-${file.size}-${file.lastModified}`;
}

/**
 * 将文件分片
 *
 * @param file - 文件对象
 * @param chunkSize - 分片大小
 * @returns 分片信息数组
 */
function createChunks(file: File, chunkSize: number): ChunkInfo[] {
	const chunks: ChunkInfo[] = [];
	const totalChunks = Math.ceil(file.size / chunkSize);

	for (let i = 0; i < totalChunks; i++) {
		const start = i * chunkSize;
		const end = Math.min(start + chunkSize, file.size);
		const chunk = file.slice(start, end);

		chunks.push({
			index: i,
			chunk,
			start,
			end,
		});
	}

	return chunks;
}

/**
 * 上传单个分片
 *
 * @param instance - 请求实例
 * @param url - 上传地址
 * @param chunk - 分片信息
 * @param fileId - 文件标识
 * @param totalChunks - 总分片数
 * @param config - 上传配置
 * @returns Promise
 */
async function uploadChunk<T = unknown>(
	instance: RequestInstance,
	url: string,
	chunk: ChunkInfo,
	fileId: string,
	totalChunks: number,
	config: ResumableConfig,
): Promise<T> {
	const formData = new FormData();
	formData.append("file", chunk.chunk);
	formData.append("chunkIndex", String(chunk.index));
	formData.append("totalChunks", String(totalChunks));
	formData.append("fileId", fileId);
	formData.append("fileName", fileId.split("-")[0]); // 从 fileId 中提取文件名

	const uploadConfig = {
		...config,
		onUploadProgress: (progressEvent: AxiosProgressEvent) => {
			if (config?.onChunkProgress && progressEvent.total) {
				const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
				config.onChunkProgress(
					chunk.index,
					progress,
					progressEvent.loaded,
					progressEvent.total,
				);
			}
		},
	} as RequestOptions;

	return instance.post<T>(url, formData, uploadConfig);
}

/**
 * 并发上传分片
 *
 * @param instance - 请求实例
 * @param url - 上传地址
 * @param chunks - 分片信息数组
 * @param fileId - 文件标识
 * @param uploadedChunks - 已上传的分片索引数组
 * @param config - 上传配置
 * @returns Promise 数组
 */
async function uploadChunksConcurrently<T = unknown>(
	instance: RequestInstance,
	url: string,
	chunks: ChunkInfo[],
	fileId: string,
	uploadedChunks: number[],
	config: ResumableConfig,
): Promise<T[]> {
	const { concurrency = 3 } = config;
	const totalChunks = chunks.length;
	const results: T[] = [];
	const errors: Error[] = [];

	// 过滤出未上传的分片
	const pendingChunks = chunks.filter((chunk) => !uploadedChunks.includes(chunk.index));

	// 分批上传
	for (let i = 0; i < pendingChunks.length; i += concurrency) {
		const batch = pendingChunks.slice(i, i + concurrency);

		const batchPromises = batch.map(async (chunk) => {
			try {
				const result = await uploadChunk<T>(
					instance,
					url,
					chunk,
					fileId,
					totalChunks,
					config,
				);
				// 保存上传进度
				if (config.saveUploadProgress) {
					await config.saveUploadProgress(fileId, chunk.index);
				}
				return { chunk, result };
			} catch (error) {
				errors.push(error as Error);
				throw error;
			}
		});

		const batchResults = await Promise.allSettled(batchPromises);

		for (const result of batchResults) {
			if (result.status === "fulfilled") {
				results.push(result.value.result);
			}
		}

		// 如果有错误，停止上传
		if (errors.length > 0) {
			throw errors[0];
		}
	}

	return results;
}

/**
 * 分片上传文件
 *
 * @param instance - 请求实例
 * @param url - 上传地址
 * @param file - 文件对象
 * @param config - 断点续传配置
 * @returns Promise
 */
export async function uploadFileWithChunks<T = unknown>(
	instance: RequestInstance,
	url: string,
	file: File,
	config?: ResumableConfig,
): Promise<T> {
	const {
		chunkSize = 2 * 1024 * 1024, // 默认 2MB
		enableResume = true,
		getUploadedChunks,
		clearUploadProgress,
		onOverallProgress,
	} = config || {};

	// 如果文件小于分片大小，直接上传
	if (file.size <= chunkSize) {
		return uploadFile<T>(instance, url, file, config);
	}

	const fileId = generateFileId(file);
	const chunks = createChunks(file, chunkSize);
	const totalChunks = chunks.length;

	// 获取已上传的分片（断点续传）
	let uploadedChunks: number[] = [];
	if (enableResume && getUploadedChunks) {
		try {
			uploadedChunks = await getUploadedChunks(fileId);
		} catch (error) {
			logError(error);
		}
	}

	// 计算已上传的字节数
	let uploadedBytes = 0;
	for (const chunk of chunks) {
		if (uploadedChunks.includes(chunk.index)) {
			uploadedBytes += chunk.chunk.size;
		}
	}

	// 更新整体进度
	if (onOverallProgress && uploadedBytes > 0) {
		const progress = Math.round((uploadedBytes / file.size) * 100);
		onOverallProgress(progress, uploadedBytes, file.size);
	}

	// 如果所有分片都已上传，直接返回成功
	if (uploadedChunks.length === totalChunks) {
		// 这里应该调用合并接口，但具体实现取决于后端
		// 暂时返回一个成功的结果
		return Promise.resolve({} as T);
	}

	// 上传分片
	const results = await uploadChunksConcurrently<T>(
		instance,
		url,
		chunks,
		fileId,
		uploadedChunks,
		config || {},
	);

	// 上传完成后，清除进度记录
	if (clearUploadProgress) {
		await clearUploadProgress(fileId);
	}

	// 这里应该调用合并接口，但具体实现取决于后端
	// 暂时返回最后一个结果
	return results[results.length - 1] || ({} as T);
}

/**
 * 使用本地存储保存上传进度
 *
 * @param fileId - 文件标识
 * @param chunkIndex - 分片索引
 */
export async function saveProgressToLocalStorage(
	fileId: string,
	chunkIndex: number,
): Promise<void> {
	const key = `upload_progress_${fileId}`;
	const existing = localStorage.getItem(key);
	const chunks = existing ? JSON.parse(existing) : [];

	if (!chunks.includes(chunkIndex)) {
		chunks.push(chunkIndex);
		localStorage.setItem(key, JSON.stringify(chunks));
	}
}

/**
 * 从本地存储获取已上传分片
 *
 * @param fileId - 文件标识
 * @returns 已上传的分片索引数组
 */
export async function getProgressFromLocalStorage(fileId: string): Promise<number[]> {
	const key = `upload_progress_${fileId}`;
	const existing = localStorage.getItem(key);
	return existing ? JSON.parse(existing) : [];
}

/**
 * 清除本地存储的上传进度
 *
 * @param fileId - 文件标识
 */
export async function clearProgressFromLocalStorage(fileId: string): Promise<void> {
	const key = `upload_progress_${fileId}`;
	localStorage.removeItem(key);
}
