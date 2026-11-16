/**
 * 岗位描述管理相关API接口
 */

import type {
	JobDescFormData,
	JobDescManagementApiItem,
	JobDescSearchForm,
} from "#src/pages/tag-management/job-desc/management/types";
import type { PagedData } from "#src/utils/axios-request";
import type { JobDescSearchOptionsResponse } from "./management/types";
import { request } from "#src/utils/axios-request";

type FetchJobDescManagementListParams = JobDescSearchForm & {
	pageNum?: number;
	pageSize?: number;
	jobId?: string | number;
	positionId?: string | number;
};

/**
 * 获取岗位描述管理列表（分页查询）
 */
export async function fetchJobDescManagementList(
	params?: FetchJobDescManagementListParams,
): Promise<PagedData<JobDescManagementApiItem>> {
	const {
		pageNum = 1,
		pageSize = 10,
		jobId,
		jobName,
		deptCode,
		positionId,
		positionName,
		postGrade,
		basicDesc,
		personalizedDesc,
		auditDept,
		status,
		updateBy,
		updateByName,
	} = params || {};

	const pickLast = (value?: string | string[]) => {
		if (!value) {
			return undefined;
		}
		return Array.isArray(value) ? value[value.length - 1] : value;
	};

	const searchParams = new URLSearchParams();
	const appendParam = (key: string, value: unknown) => {
		if (value === undefined || value === null) {
			return;
		}
		if (typeof value === "string") {
			const trimmed = value.trim();
			if (!trimmed) {
				return;
			}
			searchParams.append(key, trimmed);
			return;
		}
		searchParams.append(key, String(value));
	};

	Object.entries({
		jobId,
		jobName,
		deptCode: pickLast(deptCode),
		positionId,
		positionName,
		postGrade,
		basicDesc,
		personalizedDesc,
		auditDept,
		status: Array.isArray(status) ? status.join(",") : status,
		updateBy,
		updateByName,
		pageNum,
		pageSize,
	}).forEach(([key, value]) => {
		appendParam(key, value);
	});

	return request.get<PagedData<JobDescManagementApiItem>>("jobdescription", {
		params: Object.fromEntries(searchParams.entries()),
		showLoading: false,
	});
}

/** 更新岗位描述时的提交 payload */
export type UpdateJobDescPayload = Partial<JobDescFormData> & {
	/**
	 * 原始附件（用于后端对比）
	 *
	 * 说明：
	 * - existingAttachments 为 record 原始 attachments（JSON 字符串），用于后端对比
	 */
	existingAttachments?: string;
	/**
	 * 编辑后的附件（JSON 字符串）
	 *
	 * 格式：`[{"originalFileName":"a.pdf","fileName":"path/a.pdf"}]`
	 * - 新增本地文件时，fileName 允许为空字符串，originalFileName 必须有值
	 */
	attachments?: string;
	/** 新上传的文件 */
	newFiles?: File[];
};

/**
 * 更新岗位描述（接口要求 multipart/form-data）
 * - updateForm: JSON 字符串，包含表单字段和 attachments（编辑后的附件路径，逗号分隔）
 * - files: 新上传的文件二进制数组
 * - params.existingAttachments: 原始附件路径（用于后端对比）
 */
export async function updateJobDescManagement(
	id: string | number,
	data: UpdateJobDescPayload,
): Promise<boolean> {
	const numericId = typeof id === "string" ? Number(id) : id;
	const { existingAttachments, attachments, newFiles, ...formFields } = data;
	const updateForm = JSON.stringify({
		id: numericId,
		...formFields,
		attachments: attachments ?? existingAttachments ?? "",
	});

	const formData = new FormData();
	formData.append("updateForm", updateForm);
	if (newFiles?.length) {
		newFiles.forEach((file) => formData.append("files", file));
	}

	return request.patch<boolean>(`jobdescription/${id}`, formData, {
		params:
			existingAttachments != null && existingAttachments !== ""
				? { existingAttachments }
				: undefined,
	});
}

/**
 * 删除岗位描述（批量删除）
 */
export async function deleteJobDescManagement(ids: string[]): Promise<boolean> {
	return request.delete<boolean>(`jobdescription/${ids.join(",")}`);
}

/**
 * 批量上下线岗位描述
 */
export async function batchUpdateJobDescStatus(
	ids: string[],
	operation: "online" | "offline",
): Promise<boolean> {
	return request.post<boolean>("jobdescription/batch/status", {
		ids,
		operation,
	});
}

/**
 * 上线岗位描述
 */
export async function onlineJobDescManagement(ids: string[]): Promise<boolean> {
	return batchUpdateJobDescStatus(ids, "online");
}

/**
 * 下线岗位描述
 */
export async function offlineJobDescManagement(ids: string[]): Promise<boolean> {
	return batchUpdateJobDescStatus(ids, "offline");
}

export async function fetchJobDescSearchOptions(): Promise<JobDescSearchOptionsResponse> {
	return request.get<JobDescSearchOptionsResponse>("jobdescription/search-options", {
		showLoading: false,
	});
}

/**
 * 校验岗位描述导入文件
 */
export async function validateJobDescImport(file: File): Promise<{
	success: boolean;
	errorList: Array<{ rowIndex: number; errorMessage: string }>;
	totalRows: number;
	successRows: number;
	errorRows: number;
}> {
	const formData = new FormData();
	formData.append("file", file);

	return request.post<{
		success: boolean;
		errorList: Array<{ rowIndex: number; errorMessage: string }>;
		totalRows: number;
		successRows: number;
		errorRows: number;
	}>("jobdescription/import/validate", formData, {
		headers: {
			"Content-Type": "multipart/form-data",
		},
	});
}

/**
 * 导入岗位描述
 */
export async function importJobDescManagement(file: File): Promise<{
	success: boolean;
	errorList: Array<{ rowIndex: number; errorMessage: string }>;
	totalRows: number;
	successRows: number;
	errorRows: number;
}> {
	const formData = new FormData();
	formData.append("file", file);

	return request.post<{
		success: boolean;
		errorList: Array<{ rowIndex: number; errorMessage: string }>;
		totalRows: number;
		successRows: number;
		errorRows: number;
	}>("jobdescription/import", formData, {
		headers: {
			"Content-Type": "multipart/form-data",
		},
	});
}

/**
 * 下载导入模板
 */
export async function downloadJobDescTemplate(): Promise<Blob> {
	return request.post<Blob>(
		"jobdescription/import/template",
		{},
		{
			responseType: "blob",
		},
	);
}
