/**
 * 年终述职 Query / Mutation Hook
 *
 * 统一维护 queryKey，变更成功后按模块前缀整体失效：
 * 文件夹、组织人数、概览统计、列表、详情之间存在联动（移动人员会同时影响文件夹人数和列表），
 * 整体失效比逐个精确失效更不容易漏刷。
 */

import type {
	CreateYearlyReportFolderPayload,
	MoveYearlyReportPayload,
	RenameYearlyReportFolderPayload,
	SortYearlyReportPayload,
	YearlyReportFolderQuery,
	YearlyReportListQuery,
	YearlyReportStatisticsQuery,
} from "#src/api/performance-management/yearly-performance";

import {
	createYearlyReportFolder,
	deleteYearlyReportFolder,
	fetchFolderOrgOptions,
	fetchManagerCategoryOptions,
	fetchYearlyReportDetail,
	fetchYearlyReportFolderTree,
	fetchYearlyReportList,
	fetchYearlyReportOrgTree,
	fetchYearlyReportStatistics,
	finishYearlyReportRecording,
	moveYearlyReports,
	renameYearlyReportFolder,
	sortYearlyReports,
	startYearlyReport,
} from "#src/api/performance-management/yearly-performance";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { YEARLY_PERFORMANCE_QUERY_KEY } from "../constants";

/** 字典类数据缓存 10 分钟 */
const DICT_STALE_TIME = 10 * 60 * 1000;

/** queryKey 工厂 */
export const yearlyReportKeys = {
	all: [YEARLY_PERFORMANCE_QUERY_KEY] as const,
	orgTree: () => [YEARLY_PERFORMANCE_QUERY_KEY, "org-tree"] as const,
	folderTree: (query: YearlyReportFolderQuery) =>
		[YEARLY_PERFORMANCE_QUERY_KEY, "folder-tree", query] as const,
	statistics: (query: YearlyReportStatisticsQuery) =>
		[YEARLY_PERFORMANCE_QUERY_KEY, "statistics", query] as const,
	list: (query: YearlyReportListQuery) => [YEARLY_PERFORMANCE_QUERY_KEY, "list", query] as const,
	detail: (reportId: string) => [YEARLY_PERFORMANCE_QUERY_KEY, "detail", reportId] as const,
	managerCategoryOptions: () =>
		[YEARLY_PERFORMANCE_QUERY_KEY, "manager-category-options"] as const,
	folderOrgOptions: () => [YEARLY_PERFORMANCE_QUERY_KEY, "folder-org-options"] as const,
};

/**
 * 组织架构树
 *
 * @returns 查询结果
 */
export function useYearlyReportOrgTree() {
	return useQuery({
		queryKey: yearlyReportKeys.orgTree(),
		queryFn: fetchYearlyReportOrgTree,
	});
}

/**
 * 文件夹面板数据
 *
 * @param query - 组织与关键字
 * @param enabled - 是否启用（批量移动弹窗未选组织时不请求）
 * @returns 查询结果
 */
export function useYearlyReportFolderTree(query: YearlyReportFolderQuery, enabled = true) {
	return useQuery({
		queryKey: yearlyReportKeys.folderTree(query),
		queryFn: () => fetchYearlyReportFolderTree(query),
		placeholderData: keepPreviousData,
		enabled,
	});
}

/**
 * 概览统计
 *
 * @param query - 筛选条件（不含状态）
 * @returns 查询结果
 */
export function useYearlyReportStatistics(query: YearlyReportStatisticsQuery) {
	return useQuery({
		queryKey: yearlyReportKeys.statistics(query),
		queryFn: () => fetchYearlyReportStatistics(query),
		placeholderData: keepPreviousData,
	});
}

/**
 * 述职人员分页列表
 *
 * @param query - 筛选与分页参数
 * @returns 查询结果
 */
export function useYearlyReportList(query: YearlyReportListQuery) {
	return useQuery({
		queryKey: yearlyReportKeys.list(query),
		queryFn: () => fetchYearlyReportList(query),
		placeholderData: keepPreviousData,
	});
}

/**
 * 述职详情
 *
 * @param reportId - 述职记录 ID，为空时不请求
 * @returns 查询结果
 */
export function useYearlyReportDetail(reportId?: string) {
	return useQuery({
		queryKey: yearlyReportKeys.detail(reportId ?? ""),
		queryFn: () => fetchYearlyReportDetail(reportId ?? ""),
		enabled: Boolean(reportId),
	});
}

/**
 * 管理者类别级联选项
 *
 * @returns 查询结果
 */
export function useManagerCategoryOptions() {
	return useQuery({
		queryKey: yearlyReportKeys.managerCategoryOptions(),
		queryFn: fetchManagerCategoryOptions,
		staleTime: DICT_STALE_TIME,
	});
}

/**
 * 「所属组织」级联选项
 *
 * @returns 查询结果
 */
export function useFolderOrgOptions() {
	return useQuery({
		queryKey: yearlyReportKeys.folderOrgOptions(),
		queryFn: fetchFolderOrgOptions,
		staleTime: DICT_STALE_TIME,
	});
}

/**
 * 年终述职变更操作集合
 *
 * @returns 各类 mutation
 */
export function useYearlyReportMutations() {
	const queryClient = useQueryClient();
	const invalidateAll = () => queryClient.invalidateQueries({ queryKey: yearlyReportKeys.all });

	const createFolder = useMutation({
		mutationFn: (payload: CreateYearlyReportFolderPayload) => createYearlyReportFolder(payload),
		onSuccess: invalidateAll,
	});
	const renameFolder = useMutation({
		mutationFn: (payload: RenameYearlyReportFolderPayload) => renameYearlyReportFolder(payload),
		onSuccess: invalidateAll,
	});
	const deleteFolder = useMutation({
		mutationFn: (folderId: string) => deleteYearlyReportFolder(folderId),
		onSuccess: invalidateAll,
	});
	const moveReports = useMutation({
		mutationFn: (payload: MoveYearlyReportPayload) => moveYearlyReports(payload),
		onSuccess: invalidateAll,
	});
	const sortReports = useMutation({
		mutationFn: (payload: SortYearlyReportPayload) => sortYearlyReports(payload),
		// 排序失败时同样需要回到服务端顺序，因此放在 onSettled
		onSettled: invalidateAll,
	});
	const startReport = useMutation({
		mutationFn: (reportId: string) => startYearlyReport(reportId),
		onSuccess: invalidateAll,
	});
	const finishRecording = useMutation({
		mutationFn: (reportId: string) => finishYearlyReportRecording(reportId),
		onSuccess: invalidateAll,
	});

	return {
		createFolder,
		renameFolder,
		deleteFolder,
		moveReports,
		sortReports,
		startReport,
		finishRecording,
	};
}
