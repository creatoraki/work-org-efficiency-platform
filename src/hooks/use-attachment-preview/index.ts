import type { ImagePreviewItem } from "#src/components/image-preview-modal";
import {
	downloadFileByParamsFromOss,
	getOssBucketName,
	getPreviewBlobFromOss,
} from "#src/api/file/oss";
import { downloadBlob, isImageFile, isPdfFile } from "#src/utils";
import { message } from "antd";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * 统一的附件预览/下载入参接口
 *
 * 同时覆盖两种场景：
 * - 已上传到 OSS 的文件（fileName 有值，localFile 为空）
 * - 本地选中但尚未上传的文件（localFile 有值，fileName 为空）
 */
export interface PreviewableAttachment {
	/** 唯一标识，与 ImagePreviewItem.key 对应 */
	key: string;
	/** 用于展示和下载时的文件名 */
	displayName: string;
	/** OSS 存储路径，本地文件为空字符串或 undefined */
	fileName?: string;
	/** 本地 File 对象，仅在文件尚未上传时存在 */
	localFile?: File;
}

/**
 * 附件预览与下载 hook
 *
 * 统一处理「已上传到 OSS 的文件」和「本地选中但尚未上传的文件」两种情况：
 * - 图片：弹窗灯箱（本地文件用 createObjectURL，OSS 文件走 blob 接口懒加载）
 * - PDF：新窗口打开（同上）
 * - 下载：本地文件直接下载，OSS 文件通过接口拉取
 *
 * @example
 * ```tsx
 * const {
 *   imagePreviewOpen, setImagePreviewOpen,
 *   imagePreviewIndex, setImagePreviewIndex,
 *   imagePreviewItems, handlePreviewAttachment, handleDownloadAttachment, fetchBlobSrc,
 * } = useAttachmentPreview();
 *
 * // 预览时传入当前上下文的完整文件列表（用于图片轮播范围）
 * handlePreviewAttachment(toPreviewable(file), allFiles.map(toPreviewable));
 * ```
 */
export function useAttachmentPreview() {
	const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
	const [imagePreviewIndex, setImagePreviewIndex] = useState(0);
	const [activePreviewFiles, setActivePreviewFiles] = useState<PreviewableAttachment[]>([]);

	// 本地文件 blob URL 缓存，避免每次渲染重新创建
	const localBlobUrlCacheRef = useRef<Map<string, string>>(new Map());

	// 组件卸载时统一回收所有 blob URL，防止内存泄漏
	useEffect(() => {
		return () => {
			localBlobUrlCacheRef.current.forEach((url) => URL.revokeObjectURL(url));
			localBlobUrlCacheRef.current.clear();
		};
	}, []);

	/** 获取本地文件的预览 blob URL（带缓存） */
	const getLocalBlobUrl = useCallback((file: PreviewableAttachment): string | null => {
		if (!file.localFile) return null;
		const cache = localBlobUrlCacheRef.current;
		const cached = cache.get(file.key);
		if (cached) return cached;
		const url = URL.createObjectURL(file.localFile);
		cache.set(file.key, url);
		return url;
	}, []);

	const imagePreviewItems = useMemo<ImagePreviewItem[]>(
		() =>
			activePreviewFiles.map((file) => ({
				key: file.key,
				name: file.displayName,
				// 本地文件直接提供 src，OSS 文件留空由 fetchBlobSrc 懒加载
				src: file.localFile ? (getLocalBlobUrl(file) ?? "") : "",
			})),
		[activePreviewFiles, getLocalBlobUrl],
	);

	/**
	 * 预览附件
	 *
	 * @param file - 要预览的附件（已规范化为 PreviewableAttachment）
	 * @param allFiles - 当前上下文中所有附件（用于确定图片灯箱的轮播范围）
	 */
	const handlePreviewAttachment = useCallback(
		async (file: PreviewableAttachment, allFiles: PreviewableAttachment[]) => {
			const { displayName, fileName, localFile } = file;

			if (isPdfFile(displayName)) {
				// 本地 PDF：直接用 blob URL 打开
				if (localFile) {
					const url = getLocalBlobUrl(file) ?? URL.createObjectURL(localFile);
					window.open(url, "_blank", "noopener,noreferrer");
					return;
				}
				// OSS PDF：通过鉴权接口获取 blob 后打开
				if (!fileName) {
					message.warning("文件路径无效");
					return;
				}
				const bucketName = getOssBucketName();
				if (!bucketName) {
					message.warning("未配置 OSS 桶，无法预览");
					return;
				}
				try {
					const blob = await getPreviewBlobFromOss({ bucketName, fileName });
					const url = URL.createObjectURL(blob);
					window.open(url, "_blank", "noopener,noreferrer");
					setTimeout(() => URL.revokeObjectURL(url), 30000);
				} catch (e) {
					console.error("预览附件失败:", e);
					message.error("预览失败");
				}
				return;
			}

			if (isImageFile(displayName)) {
				if (!localFile && !getOssBucketName()) {
					message.warning("未配置 OSS 桶，无法预览");
					return;
				}
				const images = allFiles.filter((f) => isImageFile(f.displayName));
				const idx = images.findIndex((f) => f.key === file.key);
				if (idx < 0) {
					message.warning("未找到可预览的图片");
					return;
				}
				setActivePreviewFiles(images);
				setImagePreviewIndex(idx);
				setImagePreviewOpen(true);
			}
		},
		[getLocalBlobUrl],
	);

	/** 下载附件 */
	const handleDownloadAttachment = useCallback(async (file: PreviewableAttachment) => {
		// 本地文件直接下载
		if (file.localFile) {
			downloadBlob(file.localFile, file.displayName);
			return;
		}
		if (!file.fileName) {
			message.warning("文件路径无效");
			return;
		}
		const bucketName = getOssBucketName();
		if (!bucketName) {
			message.warning("未配置 OSS 桶，无法下载");
			return;
		}
		try {
			const blob = await downloadFileByParamsFromOss({ bucketName, fileName: file.fileName });
			downloadBlob(blob, file.displayName);
		} catch (e) {
			console.error("下载附件失败:", e);
			message.error("下载失败");
		}
	}, []);

	/**
	 * ImagePreviewModal 的 fetchBlobSrc 回调
	 *
	 * 本地文件（src 已设置）返回 null；OSS 文件通过鉴权接口懒加载 blob URL。
	 */
	const fetchBlobSrc = useCallback(
		async (item: ImagePreviewItem): Promise<string | null> => {
			const file = activePreviewFiles.find((f) => f.key === item.key);
			if (!file) return null;
			// 本地文件 src 已由 imagePreviewItems 直接提供，无需再次获取
			if (file.localFile) return null;
			if (!file.fileName) return null;
			const bucketName = getOssBucketName();
			if (!bucketName) return null;
			const blob = await getPreviewBlobFromOss({ bucketName, fileName: file.fileName });
			return URL.createObjectURL(blob);
		},
		[activePreviewFiles],
	);

	return {
		imagePreviewOpen,
		setImagePreviewOpen,
		imagePreviewIndex,
		setImagePreviewIndex,
		imagePreviewItems,
		handlePreviewAttachment,
		handleDownloadAttachment,
		fetchBlobSrc,
	};
}
