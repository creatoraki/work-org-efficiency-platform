/**
 * 面谈管理相关API接口
 */

import type { PagedData } from "#src/utils/axios-request";
import type {
	GetSearchOptionsData,
	GetUserInterviewTagsParams,
	InterviewAssignParams,
	InterviewDetailResponse,
	InterviewHistoryWithUserResponse,
	InterviewItem,
	InterviewListParams,
	InterviewSaveParams,
	InterviewStats,
	UploadFileFormItem,
	UserInterviewTagItem,
} from "./types";
import { ossUploadFiles } from "#src/api/common";
import { request } from "#src/utils/axios-request";

// 导出类型，方便外部使用
export type {
	GetSearchOptionsData,
	InterviewAssignParams,
	InterviewDetailHistoryItem,
	InterviewDetailResponse,
	InterviewHistoryItem,
	InterviewHistoryWithUserResponse,
	InterviewItem,
	InterviewListParams,
	InterviewSaveParams,
	InterviewStats,
	InterviewTagItem,
	InterviewTreeTagItem,
	UploadFileFormItem,
	UserInterviewTagItem,
} from "./types";

/**
 * 人员面谈任务列表查询接口
 *
 * @param params - 查询参数
 * @param params.pageNum - 页码(不能为空)
 * @param params.pageSize - 每页数量(不能为空)
 * @param params.searchCount - 是否查询总条数
 * @param params.name - 员工名称
 * @param params.orgId - 所属组织
 * @param params.postId - 岗位id
 * @param params.staffJobId - 职位id
 * @param params.status - 状态
 * @param params.interviewTagId - 待面谈标签id
 * @param params.interviewedTagId - 已面谈标签id
 * @param params.interviewer - 面谈人
 * @param params.assignInterviewer - 转派面谈人
 * @returns 面谈任务列表数据及分页信息
 */
export async function fetchInterviewList(
	params: InterviewListParams = {},
): Promise<PagedData<InterviewItem>> {
	const { pageNum = 1, pageSize = 20, ...restParams } = params;

	return request.post<PagedData<InterviewItem>>(
		"usertag/interview/list",
		{
			pageNum,
			pageSize,
			...restParams,
		},
		{
			showLoading: false,
		},
	);
}

/**
 * 人员面谈任务详情接口
 *
 * @param userId - 用户id（路径参数）
 * @param interviewUserId - 面谈人id（查询参数，当前登陆用户为管理员时为必选；非管理员时默认为当前登陆用户，参数失效）
 * @param assignInterviewUserId - 转派面谈人id（查询参数，当前登陆用户为管理员时为必选；非管理员时默认为当前登陆用户，参数失效）
 * @returns 面谈任务详情数据
 */
export async function fetchInterviewDetail(
	userId: number,
	interviewUserId?: number,
	assignInterviewUserId?: number,
): Promise<InterviewDetailResponse> {
	const params: Record<string, string> = {};
	if (interviewUserId !== undefined) {
		params.interviewUserId = String(interviewUserId);
	}
	if (assignInterviewUserId !== undefined) {
		params.assignInterviewUserId = String(assignInterviewUserId);
	}

	return request.get<InterviewDetailResponse>(`usertag/interview/${userId}`, {
		params,
	});
}

/**
 * 人员面谈记录查询接口（同时返回用户信息和面谈历史记录）
 *
 * @param userId - 用户id（被面谈人id）
 * @param interviewUserId - 面谈人id（查询参数，当前登陆用户为管理员时为必选；非管理员时默认为当前登陆用户，参数失效）
 * @param assignInterviewUserId - 转派面谈人id（查询参数，当前登陆用户为管理员时为必选；非管理员时默认为当前登陆用户，参数失效）
 * @returns 用户信息和面谈历史记录
 */
export async function fetchInterviewHistoryWithUser(
	userId: number,
	interviewUserId?: number,
	assignInterviewUserId?: number,
): Promise<InterviewHistoryWithUserResponse> {
	const params: Record<string, string> = {};
	if (interviewUserId !== undefined) {
		params.interviewUserId = String(interviewUserId);
	}
	if (assignInterviewUserId !== undefined) {
		params.assignInterviewUserId = String(assignInterviewUserId);
	}

	return request.get<InterviewHistoryWithUserResponse>(`usertag/interview/his/${userId}`, {
		params,
	});
}

/**
 * 人员面谈结果保存接口
 *
 * @param params - 保存参数
 * @param params.id - 主键id
 * @param params.purpose - 面谈目的
 * @param params.overall - 总体评价
 * @param params.tags - 标签列表
 * @returns 保存结果
 */
export async function saveInterview(params: InterviewSaveParams): Promise<string> {
	return request.put<string>("usertag/interview/save", params);
}

/**
 * 人员面谈结果保存并提交接口
 *
 * @param params - 提交参数
 * @param params.id - 主键id
 * @param params.purpose - 面谈目的
 * @param params.overall - 总体评价
 * @param params.tags - 标签列表
 * @returns 提交结果
 */
export async function submitInterview(params: InterviewSaveParams): Promise<string> {
	return request.put<string>("usertag/interview/submit", params);
}

/**
 * 人员面谈任务转派接口
 *
 * @param paramsList - 转派参数数组
 * @param paramsList[].userId - 员工id
 * @param paramsList[].interviewUserId - 面谈人，当前登陆用户为管理员时为必选
 * @param paramsList[].assignInterviewUserId - 转派面谈人
 * @param paramsList[].tagIds - 标签列表id
 * @returns 转派结果
 */
export async function assignInterview(paramsList: InterviewAssignParams[]): Promise<number> {
	return request.post<number>("usertag/interview/assign", paramsList);
}

/**
 * 人员面谈任务统计接口
 *
 * @returns 统计数据
 */
export async function fetchInterviewStats(): Promise<InterviewStats> {
	return request.get<InterviewStats>("usertag/interview/count", {
		showLoading: false,
	});
}

/**
 * 获取首页下拉框查询条件
 *
 * @returns 搜索选项数据
 */
export async function getInterviewManagementSearchOptions(): Promise<GetSearchOptionsData> {
	return request.get<GetSearchOptionsData>("usertag/interview/search-options", {
		showLoading: false,
	});
}

/**
 * 解析批量上传接口返回的逗号分隔字段为 UploadFileFormItem 数组（按索引一一对应）
 */
function parseOssUploadResultToItems(
	res: Awaited<ReturnType<typeof ossUploadFiles>>,
): UploadFileFormItem[] {
	const ids = (res.ids ?? "").split(",").map((s) => s.trim());
	const fileNames = (res.fileNames ?? "").split(",").map((s) => s.trim());
	const newFileNames = (res.newFileNames ?? "").split(",").map((s) => s.trim());
	const originalFilenames = (res.originalFilenames ?? "").split(",").map((s) => s.trim());
	const len = Math.max(
		ids.length,
		fileNames.length,
		newFileNames.length,
		originalFilenames.length,
	);
	return Array.from({ length: len }, (_, i) => ({
		id: ids[i] ? Number(ids[i]) : 0,
		url: fileNames[i] ?? "",
		fileName: fileNames[i] ?? "",
		newFileName: newFileNames[i] ?? "",
		originalFilename: originalFilenames[i] ?? "",
	}));
}

/**
 * 面谈附件批量上传（使用 file/oss/uploads，返回完整数组）
 *
 * @param files - 要上传的文件列表
 * @returns 附件信息数组（与 files 顺序一一对应），可直接合并进 uploadFileForms
 */
export async function uploadInterviewFiles(files: File[]): Promise<UploadFileFormItem[]> {
	if (files.length === 0) return [];
	const res = await ossUploadFiles(files);
	return parseOssUploadResultToItems(res);
}

/**
 * 人员面谈标签查询接口
 *
 * @param params - 查询参数
 * @param params.userId - 员工id
 * @param params.interviewUserId - 面谈人，当前登陆用户为管理员时为必选
 * @returns 标签列表
 */
export async function getUserInterviewTags(
	params: GetUserInterviewTagsParams[],
): Promise<UserInterviewTagItem[]> {
	return request.post<UserInterviewTagItem[]>("usertag/interview/user/tag", params);
}
