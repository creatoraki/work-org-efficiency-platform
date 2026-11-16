/**
 * 组织大脑 - 人岗匹配 API 接口
 */

import type { PagedData } from "#src/utils/axios-request";
import type { JobMatchCandidateItem } from "../candidate";
import type {
	ExecuteMatchingParams,
	ExecuteMatchingResult,
	ExecuteMatchingResultItem,
	JobMatchCandidateResponseItem,
	JobMatchingDetail,
	JobMatchingDetailResponse,
	JobMatchingItem,
	JobMatchingListParams,
	JobMatchingNameCheckParams,
	JobMatchingSearchOptions,
	SaveJobMatchingParams,
} from "./types";
import { request } from "#src/utils/axios-request";

// 导出所有类型，方便外部使用
export type {
	JobMatchingSearchOptions as ApiSearchOptions,
	ExecuteMatchingParams,
	ExecuteMatchingResult,
	ExecuteMatchingResultItem,
	JobMatchingDetail,
	JobMatchingDetailResponse,
	JobMatchingItem,
	JobMatchingListParams,
	JobMatchingNameCheckParams,
	JobMatchingSearchOptions,
	SaveJobMatchingCandidateItem,
	SaveJobMatchingParams,
} from "./types";

/**
 * 人岗匹配预览结果。
 */
export interface JobMatchingPreviewResult {
	// 候选人列表
	candidates: JobMatchCandidateItem[];
	// 匹配模型快照（JSON）
	modelSnapshot?: string;
	// 匹配模型快照哈希
	modelSnapshotHash?: string;
}

// 人岗匹配 AI 预览接口最长等待 30 分钟，避免大模型匹配任务被默认超时提前中断。
const JOB_MATCHING_PREVIEW_TIMEOUT_MS = 30 * 60 * 1000;

/**
 * 将 AI 预览接口原始候选人结果映射为页面使用的候选人结构。
 *
 * @param item - AI 预览接口候选人结果
 * @returns 页面候选人结构
 * @author 王善能
 * @since 2026-06-26
 */
function mapExecuteMatchingCandidate(item: ExecuteMatchingResultItem): JobMatchCandidateItem {
	return {
		...item,
		username: item.userName,
		userId: Number(item.userId),
		matchScore: item.matchScore ?? 0,
		positionName: item.positionName,
		positionLevel: item.positionLevel,
		positionCode: item.postCode,
	};
}

/**
 * 将后端候选人 VO 映射为页面候选人结构。
 *
 * @param item - 后端候选人 VO
 * @returns 页面候选人结构
 * @author 王善能
 * @since 2026-06-26
 */
function mapDetailCandidate(item: JobMatchCandidateResponseItem): JobMatchCandidateItem {
	return {
		...item,
		empCode: item.empCode ?? item.empBadge,
		username: item.username ?? item.empName,
		positionName: item.positionName ?? item.postName,
		positionLevel: item.positionLevel ?? item.postgradeName,
		remark: item.remark ?? item.matchReason,
	};
}

/**
 * 获取人岗匹配任务列表
 *
 * @param params - 查询参数
 * @returns 人岗匹配任务列表及分页信息
 */
export async function fetchJobMatchingList(
	params: JobMatchingListParams = {},
): Promise<PagedData<JobMatchingItem>> {
	const { pageNum = 1, pageSize = 10, ...restParams } = params;

	return request.get<PagedData<JobMatchingItem>>("orgbrain/jobMatchTask", {
		params: {
			pageNum,
			pageSize,
			...restParams,
		},
		serializer: { arrayFormat: "repeat" },
		showLoading: false,
	});
}

/**
 * 获取人岗匹配任务详情
 *
 * @param id - 任务ID
 * @returns 人岗匹配任务详情
 */
export async function fetchJobMatchingDetail(id: string): Promise<JobMatchingDetail> {
	const detail = await request.get<JobMatchingDetailResponse>(`orgbrain/jobMatchTask/${id}`);
	const candidateList = (detail.candidates ?? []).map(mapDetailCandidate);
	const selectedCandidate = candidateList.find((item) => item.isSelected);
	const { candidates: _candidates, ...restDetail } = detail;

	return {
		...restDetail,

		postgradeId: restDetail.postgradeId ?? "",
		selectedCandidate,
		candidateList,
	};
}

/**
 * 新增人岗匹配任务
 *
 * @param params 新增参数。
 * @returns 新增结果
 */
export async function createJobMatching(params: SaveJobMatchingParams): Promise<boolean> {
	return request.post<boolean>("orgbrain/jobMatchTask", {
		taskName: params.taskName,
		orgCode: params.orgCode,
		orgName: params.orgName,
		orgFullPath: params.orgFullPath,
		orgFullName: params.orgFullName,
		jobId: Number(params.jobId),
		jobName: params.jobName,
		postId: Number(params.postId),
		postName: params.postName,
		postgradeId: params.postgradeId,
		postgradeName: params.postgradeName,
		modelId: params.modelId ? Number(params.modelId) : undefined,
		modelName: params.modelName,
		modelSnapshot: params.modelSnapshot,
		modelSnapshotHash: params.modelSnapshotHash,
		candidates: params.candidates,
	});
}

/**
 * 编辑人岗匹配任务
 *
 * @param params - 编辑参数
 * @returns 编辑结果
 */
export async function updateJobMatching(params: SaveJobMatchingParams): Promise<boolean> {
	return request.put<boolean>(`orgbrain/jobMatchTask/${params.id}`, {
		id: params.id ? Number(params.id) : undefined,
		taskName: params.taskName,
		orgCode: params.orgCode,
		orgName: params.orgName,
		orgFullPath: params.orgFullPath,
		orgFullName: params.orgFullName,
		jobId: params.jobId ? Number(params.jobId) : undefined,
		jobName: params.jobName,
		postId: params.postId ? Number(params.postId) : undefined,
		postName: params.postName,
		postgradeId: params.postgradeId,
		postgradeName: params.postgradeName,
		modelId: params.modelId ? Number(params.modelId) : undefined,
		modelName: params.modelName,
		modelSnapshot: params.modelSnapshot,
		modelSnapshotHash: params.modelSnapshotHash,
		candidates: params.candidates,
		refreshModelSnapshot: params.refreshModelSnapshot,
	});
}

/**
 * 删除人岗匹配任务
 *
 * @param id - 任务ID
 * @returns 是否删除成功
 */
export async function deleteJobMatching(id: string): Promise<boolean> {
	return request.delete<boolean>(`orgbrain/jobMatchTask/${id}`);
}

/**
 * 校验人岗匹配任务名称是否重复
 *
 * @param params - 名称校验参数
 * @returns true 表示重名，false 表示不重名
 */
export async function checkJobMatchingName(params: JobMatchingNameCheckParams): Promise<boolean> {
	return request.post<boolean>("orgbrain/jobMatchTask/checkName", params);
}

/**
 * 执行人岗匹配（AI匹配候选人）
 *
 * @param params 匹配参数。
 * @returns 匹配结果
 */
export async function executeJobMatching(
	params: ExecuteMatchingParams,
	options?: { signal?: AbortSignal },
): Promise<JobMatchingPreviewResult> {
	const result = await request.post<ExecuteMatchingResult>(
		"orgbrain/jobMatchTask/matchPreview",
		{
			orgCode: params.orgCode,
			orgName: params.orgName,
			jobId: Number(params.jobId),
			jobName: params.jobName,
			postId: Number(params.postId),
			postName: params.postName,
			postgradeId: params.postgradeId,
			postgradeName: params.postgradeName,
			modelId: Number(params.modelId),
			pageNum: params.pageNum,
			pageSize: params.pageSize,
		},
		{
			signal: options?.signal,
			timeout: JOB_MATCHING_PREVIEW_TIMEOUT_MS,
		},
	);

	return {
		candidates: Array.isArray(result.content)
			? result.content.map(mapExecuteMatchingCandidate)
			: [],
		modelSnapshot: result.modelSnapshot,
		modelSnapshotHash: result.modelSnapshotHash,
	};
}

/**
 * 获取搜索选项（匹配模型、候选人、操作人等）
 *
 * @returns 搜索选项数据
 */
export async function fetchJobMatchingSearchOptions(): Promise<JobMatchingSearchOptions> {
	const filterOptions = await request.get<JobMatchingSearchOptions>(
		"orgbrain/jobMatchTask/filterOptions",
		{
			showLoading: false,
		},
	);

	return {
		modelOptions: filterOptions.modelOptions ?? [],
		candidateOptions: filterOptions.candidateOptions ?? [],
		operatorOptions: filterOptions.operatorOptions ?? [],
	};
}
