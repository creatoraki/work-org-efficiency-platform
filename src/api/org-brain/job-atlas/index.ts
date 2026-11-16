/**
 * 组织大脑 - 岗位图谱 API 接口
 */

import type {
	JobAtlasBaseInfo,
	JobAtlasBenchmarkDetail,
	JobAtlasGradeItemDetail,
	JobAtlasMatrixData,
	JobAtlasMatrixQueryParams,
} from "./types";
import { request } from "#src/utils/axios-request";

export type {
	JobAtlasBaseInfo,
	JobAtlasBenchmarkDetail,
	JobAtlasBenchmarkStandardItem,
	JobAtlasGradeItemDetail,
	JobAtlasMatrixCell,
	JobAtlasMatrixColumnMeta,
	JobAtlasMatrixData,
	JobAtlasMatrixQueryParams,
	JobAtlasMatrixRow,
	JobAtlasOption,
	JobAtlasSalaryBandCell,
} from "./types";

/**
 * 获取岗位图谱基础信息
 */
export async function fetchJobAtlasBaseInfo(): Promise<JobAtlasBaseInfo> {
	return request.get<JobAtlasBaseInfo>("org-brain/job-atlas/base-info", {
		showLoading: false,
	});
}

/**
 * 获取基准岗-职级下拉选项（按族群、序列过滤）
 */
export async function fetchJobAtlasBenchmarkGradeOptions(params: {
	groupIds?: number[];
	sequenceTypeCodes?: string[];
}): Promise<JobAtlasBaseInfo["filterOptions"]["benchmarkJobs"]> {
	return request.get<JobAtlasBaseInfo["filterOptions"]["benchmarkJobs"]>(
		"org-brain/job-atlas/benchmark-grade-options",
		{ params, showLoading: false },
	);
}

/**
 * 查询岗位图谱矩阵
 */
export async function queryJobAtlasMatrix(
	params: JobAtlasMatrixQueryParams,
): Promise<JobAtlasMatrixData> {
	return request.post<JobAtlasMatrixData>("org-brain/job-atlas/matrix/query", params, {
		showLoading: false,
	});
}

/**
 * 获取基准岗抽屉详情
 */
export async function fetchJobAtlasBenchmarkDetail(
	benchmarkId: number,
): Promise<JobAtlasBenchmarkDetail> {
	return request.get<JobAtlasBenchmarkDetail>(
		`org-brain/job-atlas/benchmark-jobs/${benchmarkId}/detail`,
	);
}

/**
 * 获取职级项抽屉详情
 */
export async function fetchJobAtlasGradeItemDetail(
	gradeItemId: number,
): Promise<JobAtlasGradeItemDetail> {
	return request.get<JobAtlasGradeItemDetail>(
		`org-brain/job-atlas/grade-items/${gradeItemId}/detail`,
	);
}
