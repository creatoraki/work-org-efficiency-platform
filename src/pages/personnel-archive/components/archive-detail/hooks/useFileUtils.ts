/**
 * 文件处理工具函数 Hook
 *
 * 提供文件列表处理等纯逻辑工具函数
 */

import { useCallback } from "react";

// API 基础路径
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/shanshu-efficiency-api";

/**
 * useFileUtils 返回值
 */
interface UseFileUtilsReturn {
	/** 规范化文件列表（统一处理数组或单个对象） */
	normalizeFileList: (fileList: any) => any[];
	/** 获取文件预览 URL */
	getFilePreviewUrl: (fileName: string) => string;
}

/**
 * 文件处理工具函数 Hook
 */
export function useFileUtils(): UseFileUtilsReturn {
	/**
	 * 规范化文件列表（统一处理数组或单个对象）
	 *
	 * @param fileList - 文件列表（可能是数组或单个对象）
	 * @returns 文件数组
	 */
	const normalizeFileList = useCallback((fileList: any): any[] => {
		if (!fileList) {
			return [];
		}
		return Array.isArray(fileList) ? fileList : [fileList];
	}, []);

	/**
	 * 获取文件预览 URL
	 *
	 * @param fileName - 文件名
	 * @returns 预览 URL
	 */
	const getFilePreviewUrl = useCallback((fileName: string): string => {
		return `${window.location.origin}${API_BASE_URL}${fileName.startsWith("/") ? "" : "/"}${fileName}`;
	}, []);

	return {
		normalizeFileList,
		getFilePreviewUrl,
	};
}
