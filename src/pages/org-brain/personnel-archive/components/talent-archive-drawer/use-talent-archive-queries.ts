import type { TalentArchiveViewData } from "./types";

import {
	fetchPersonnelArchiveCompanyHistory,
	fetchPersonnelArchiveDetail,
	fetchPersonnelArchiveTags,
} from "#src/api/org-brain/personnel-archive";
import { useQuery } from "@tanstack/react-query";

/** 档案数据变更频率低，抽屉内统一使用 5 分钟缓存。 */
const ARCHIVE_CACHE_TIME = 5 * 60 * 1000;

/**
 * 并行查询人才档案抽屉所需的数据。
 *
 * 三个接口只依赖 userId，在抽屉打开时同时发起；React Query 根据 queryKey
 * 处理人员切换和缓存复用，展示组件不再参与请求编排。
 *
 * @param userId  当前查看人员用户ID。
 * @param enabled 是否启用查询。
 * @returns 人才档案视图数据及分区加载状态。
 *
 * @author 王善能
 * @since 2026-07-15
 */
export function useTalentArchiveQueries(userId: string, enabled: boolean): TalentArchiveViewData {
	const {
		data: detail,
		isLoading: detailLoading,
		isError: isDetailError,
		refetch: refetchDetail,
	} = useQuery({
		queryKey: ["personnel-archive-detail", userId],
		queryFn: () => fetchPersonnelArchiveDetail(userId),
		enabled,
		staleTime: ARCHIVE_CACHE_TIME,
		gcTime: ARCHIVE_CACHE_TIME,
	});
	const {
		data: tags = [],
		isLoading: tagsLoading,
		isError: isTagsError,
		refetch: refetchTags,
	} = useQuery({
		queryKey: ["personnel-archive-tags", userId],
		queryFn: () => fetchPersonnelArchiveTags(userId),
		enabled,
		staleTime: ARCHIVE_CACHE_TIME,
		gcTime: ARCHIVE_CACHE_TIME,
	});
	const {
		data: companyHistory = [],
		isLoading: companyHistoryLoading,
		isError: isCompanyHistoryError,
		refetch: refetchCompanyHistory,
	} = useQuery({
		queryKey: ["personnel-archive-company-history", userId],
		queryFn: () => fetchPersonnelArchiveCompanyHistory(userId),
		enabled,
		staleTime: ARCHIVE_CACHE_TIME,
		gcTime: ARCHIVE_CACHE_TIME,
	});
	const { basicInfo, assessments = [], educations = [], trainings = [] } = detail ?? {};

	return {
		basicInfo,
		detailLoading,
		detailError: isDetailError && !detail,
		retryDetail: () => {
			void refetchDetail();
		},
		tags,
		tagsLoading,
		tagsLoadFailed: isTagsError && tags.length === 0,
		retryTags: () => {
			void refetchTags();
		},
		companyHistory,
		companyHistoryLoading,
		companyHistoryLoadFailed: isCompanyHistoryError && companyHistory.length === 0,
		retryCompanyHistory: () => {
			void refetchCompanyHistory();
		},
		assessments,
		educations,
		trainings,
	};
}
