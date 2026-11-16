/**
 * 组织大脑 - 人员档案 API 接口
 */

import type { PagedData } from "#src/utils/axios-request";
import type {
	PersonnelArchiveDetail,
	PersonnelArchiveItem,
	PersonnelArchiveListParams,
	PersonnelArchiveTagItem,
	RadarDetailData,
	TalentArchiveCompanyHistoryItem,
} from "./types";
import { request } from "#src/utils/axios-request";

// API 请求前缀常量
const PERSONNEL_ARCHIVE_API_PREFIX = "org-brain/personnel-archive";

// 导出资历抽屉相关类型与接口
export type { CertificateDictItem } from "./common";

export { fetchQualificationCertificateDict } from "./common";

// 导出人才画像相关类型，供前端组件统一从人员档案模块引用
export type {
	RadarDetailData,
	TalentPortraitEducationDetail,
	TalentPortraitOneHeartFourForces,
	TalentPortraitPerformanceDetail,
	TalentPortraitQualificationDetail,
	TalentPortraitRadarData,
	TalentPortraitTagItem,
} from "./types";

// 导出所有类型，方便外部使用
export type {
	PersonnelArchiveDetail,
	PersonnelArchiveItem,
	PersonnelArchiveListParams,
	PersonnelArchiveTagItem,
	// 人才档案相关类型
	TalentArchiveAssessmentItem,
	TalentArchiveBasicInfo,
	TalentArchiveCompanyHistoryItem,
	TalentArchiveCompanyHistoryType,
	TalentArchiveData,
	TalentArchiveDevelopmentItem,
	TalentArchiveEchelonInfo,
	TalentArchiveEducationItem,
	TalentArchiveTrainingItem,
} from "./types";

/**
 * 获取人才档案完整数据（用于岗位匹配场景）
 *
 * 包含：基本信息、考核绩效、培训经历、梯队信息、发展规划
 * 注意：此接口与 fetchPersonnelArchiveDetail 返回相同数据结构，但用于不同业务场景
 *
 * @param userId - 用户ID
 * @returns 人才档案完整数据
 */
export async function fetchTalentArchive(userId: string): Promise<PersonnelArchiveDetail> {
	return request.get<PersonnelArchiveDetail>("org-brain/job-matching/talent-archive", {
		params: { userId },
	});
}

/**
 * 获取人员档案列表
 *
 * @param params - 查询参数
 * @returns 人员档案列表及分页信息
 */
export async function fetchPersonnelArchiveList(
	params: PersonnelArchiveListParams = {},
): Promise<PagedData<PersonnelArchiveItem>> {
	const { pageNum = 1, pageSize = 10, ...restParams } = params;

	return request.post<PagedData<PersonnelArchiveItem>>(
		`${PERSONNEL_ARCHIVE_API_PREFIX}/list`,
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
 * 获取人员档案详情（用于人员档案抽屉展示）
 *
 * @param userId - 用户ID
 * @returns 人员档案详情
 */
export async function fetchPersonnelArchiveDetail(userId: string): Promise<PersonnelArchiveDetail> {
	return request.get<PersonnelArchiveDetail>(`${PERSONNEL_ARCHIVE_API_PREFIX}/detail/${userId}`, {
		errorMessage: false,
	});
}

/**
 * 获取人员公司经历（用于人员档案公司经历区块）
 *
 * @param userId - 用户ID
 * @returns 公司经历列表
 */
export async function fetchPersonnelArchiveCompanyHistory(
	userId: string,
): Promise<TalentArchiveCompanyHistoryItem[]> {
	return request.get<TalentArchiveCompanyHistoryItem[]>(
		`${PERSONNEL_ARCHIVE_API_PREFIX}/company-history/${userId}`,
		{
			errorMessage: false,
		},
	);
}

/**
 * 获取人员标签（用于人才档案标签区块）
 *
 * @param userId - 用户ID
 * @returns 人员标签列表
 */
export async function fetchPersonnelArchiveTags(
	userId: string,
): Promise<PersonnelArchiveTagItem[]> {
	return request.get<PersonnelArchiveTagItem[]>(
		`${PERSONNEL_ARCHIVE_API_PREFIX}/tags/${userId}`,
		{
			errorMessage: false,
		},
	);
}

/**
 * 获取雷达图详情聚合数据（学历、资历、绩效）
 *
 * @param userId - 用户ID
 * @returns 雷达图详情聚合数据
 */
export async function fetchRadarDetail(userId: string): Promise<RadarDetailData> {
	return request.get<RadarDetailData>(`${PERSONNEL_ARCHIVE_API_PREFIX}/radar-detail/${userId}`);
}

/**
 * 导出人员档案 Excel
 *
 * @param params - 查询参数（用于筛选导出数据）
 * @returns 导出任务ID
 */
export async function exportPersonnelArchiveExcel(
	params: PersonnelArchiveListParams = {},
): Promise<number> {
	return request.post<number>(`${PERSONNEL_ARCHIVE_API_PREFIX}/export`, params);
}
