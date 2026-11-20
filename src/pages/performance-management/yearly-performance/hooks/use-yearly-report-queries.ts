/**
 * 年终述职 Query / Mutation Hook
 *
 * 统一维护 queryKey，变更成功后按模块前缀整体失效（文档 Blob 除外）：
 * 文件夹、统计、列表、详情之间存在联动（移动人员会同时影响文件夹视图和列表），
 * 整体失效比逐个精确失效更不容易漏刷。
 */

import type {
	AppraisalFolderAddForm,
	AppraisalFolderAddUsersForm,
	AppraisalFolderQuery,
	AppraisalFolderUpdateForm,
	AppraisalId,
	AppraisalPresentationForm,
	AppraisalUserFilter,
	AppraisalUserQuery,
} from "#src/api/performance-management/yearly-performance";

import {
	addAppraisalFolderUsers,
	AppraisalStatus,
	createAppraisalFolder,
	deleteAppraisalFolders,
	endAppraisalPresentation,
	fetchAppraisalDocumentBlob,
	fetchAppraisalFolders,
	fetchAppraisalFolderUserIds,
	fetchAppraisalOrgTree,
	fetchAppraisalUserDetail,
	fetchAppraisalUserPage,
	fetchAppraisalUserStatistics,
	redoAppraisalPresentation,
	resolveAppraisalDocumentUrl,
	sortAppraisalUsers,
	startAppraisalPresentation,
	updateAppraisalFolder,
} from "#src/api/performance-management/yearly-performance";
import { downloadBlob } from "#src/utils/files";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import {
	DETAIL_GENERATING_POLL_INTERVAL,
	DETAIL_RECORDING_POLL_INTERVAL,
	LIST_POLL_INTERVAL,
	YEARLY_PERFORMANCE_QUERY_KEY,
} from "../constants";
import { moveId } from "../utils";

/** 组织树缓存 10 分钟：组织调整频率低 */
const ORG_TREE_STALE_TIME = 10 * 60 * 1000;

/** 文档 Blob 缓存 5 分钟：同一份 PDF 在步骤间来回切换时不重复下载 */
const DOCUMENT_GC_TIME = 5 * 60 * 1000;

/** 文件夹查询条件（不分页） */
export type AppraisalFolderFilter = Omit<AppraisalFolderQuery, "pageNum" | "pageSize">;

/** queryKey 工厂 */
export const appraisalKeys = {
	all: [YEARLY_PERFORMANCE_QUERY_KEY] as const,
	orgTree: () => [YEARLY_PERFORMANCE_QUERY_KEY, "org-tree"] as const,
	folders: (filter: AppraisalFolderFilter) =>
		[YEARLY_PERFORMANCE_QUERY_KEY, "folders", filter] as const,
	statistics: (filter: AppraisalUserFilter) =>
		[YEARLY_PERFORMANCE_QUERY_KEY, "statistics", filter] as const,
	userPage: (query: AppraisalUserQuery) =>
		[YEARLY_PERFORMANCE_QUERY_KEY, "user-page", query] as const,
	userDetail: (userId: AppraisalId) =>
		[YEARLY_PERFORMANCE_QUERY_KEY, "user-detail", userId] as const,
	document: (url: string) => [YEARLY_PERFORMANCE_QUERY_KEY, "document", url] as const,
};

/**
 * 组织树
 *
 * @returns 查询结果
 */
export function useAppraisalOrgTree() {
	return useQuery({
		queryKey: appraisalKeys.orgTree(),
		queryFn: fetchAppraisalOrgTree,
		staleTime: ORG_TREE_STALE_TIME,
	});
}

/**
 * 组织下的文件夹
 *
 * @param filter - 所属组织与名称关键字
 * @param enabled - 是否启用（批量移动弹窗未选组织时不请求）
 * @returns 查询结果
 */
export function useAppraisalFolders(filter: AppraisalFolderFilter, enabled = true) {
	return useQuery({
		queryKey: appraisalKeys.folders(filter),
		queryFn: () => fetchAppraisalFolders(filter),
		placeholderData: keepPreviousData,
		enabled,
	});
}

/**
 * 述职状态统计
 *
 * 同一筛选条件共用一个 queryKey：axios 实例会取消「完全相同」的并发请求，
 * 不同 key 发出相同请求体会互相取消，因此调用方需保证相同条件传入相同对象结构。
 *
 * @param filter - 筛选条件
 * @param enabled - 是否启用
 * @returns 查询结果
 */
export function useAppraisalStatistics(filter: AppraisalUserFilter, enabled = true) {
	return useQuery({
		queryKey: appraisalKeys.statistics(filter),
		queryFn: () => fetchAppraisalUserStatistics(filter),
		placeholderData: keepPreviousData,
		enabled,
	});
}

/**
 * 述职人员分页列表
 *
 * 当前页存在「述职中 / 报告生成中」人员时定时刷新：状态由钉钉闪记回调与 T+1 报告在后端流转。
 *
 * @param query - 筛选与分页
 * @param enabled - 是否启用
 * @returns 查询结果
 */
export function useAppraisalUserPage(query: AppraisalUserQuery, enabled = true) {
	return useQuery({
		queryKey: appraisalKeys.userPage(query),
		queryFn: () => fetchAppraisalUserPage(query),
		placeholderData: keepPreviousData,
		enabled,
		refetchInterval: ({ state }) =>
			state.data?.list.some(
				(user) =>
					user.appraisalStatus === AppraisalStatus.IN_PROGRESS ||
					user.appraisalStatus === AppraisalStatus.GENERATING,
			)
				? LIST_POLL_INTERVAL
				: false,
	});
}

/**
 * 述职人员详情
 *
 * 述职中 5 秒刷新（等待闪记录制完成），报告生成中 30 秒刷新（等待评分报告）。
 *
 * @param userId - 述职人员 ID，为空时不请求
 * @returns 查询结果
 */
export function useAppraisalUserDetail(userId?: AppraisalId) {
	return useQuery({
		queryKey: appraisalKeys.userDetail(userId ?? ""),
		queryFn: () => fetchAppraisalUserDetail(userId ?? ""),
		enabled: Boolean(userId),
		refetchInterval: ({ state }) => {
			switch (state.data?.appraisalStatus) {
				case AppraisalStatus.IN_PROGRESS:
					return DETAIL_RECORDING_POLL_INTERVAL;
				case AppraisalStatus.GENERATING:
					return DETAIL_GENERATING_POLL_INTERVAL;
				default:
					return false;
			}
		},
	});
}

/**
 * 述职文档 Blob（备课材料 / 评分报告 PDF）
 *
 * @param url - 文档地址，为空时不请求
 * @returns 查询结果
 */
export function useAppraisalDocument(url?: string) {
	return useQuery({
		queryKey: appraisalKeys.document(url ?? ""),
		queryFn: ({ signal }) => fetchAppraisalDocumentBlob(url ?? "", signal),
		enabled: Boolean(url),
		staleTime: Number.POSITIVE_INFINITY,
		gcTime: DOCUMENT_GC_TIME,
	});
}

/** 文档下载参数 */
export interface DocumentDownloadPayload {
	/** 文档地址 */
	url: string;
	/** 保存的文件名 */
	fileName: string;
}

/**
 * 下载述职文档
 *
 * 优先复用预览时已缓存的 Blob 并按指定文件名保存；
 * 拉取失败（如 OSS 未开启跨域）时回退为新窗口打开原地址，由浏览器处理下载。
 *
 * @returns 下载 mutation
 */
export function useDocumentDownload() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({ url, fileName }: DocumentDownloadPayload) => {
			try {
				const blob = await queryClient.fetchQuery({
					queryKey: appraisalKeys.document(url),
					queryFn: ({ signal }) => fetchAppraisalDocumentBlob(url, signal),
					staleTime: Number.POSITIVE_INFINITY,
					gcTime: DOCUMENT_GC_TIME,
				});
				downloadBlob(blob, fileName);
			} catch {
				window.open(resolveAppraisalDocumentUrl(url), "_blank", "noopener");
			}
		},
	});
}

/** 批量下载结果 */
export interface BatchDownloadResult {
	/** 已下载份数 */
	downloaded: number;
	/** 跳过人数（报告未生成或文件未同步） */
	skipped: number;
}

/**
 * 批量下载评分报告
 *
 * 契约暂无批量打包下载接口：逐个读取详情中的 evaluationReportUrl 并顺序下载，
 * 首次会触发浏览器「允许下载多个文件」确认。后端提供打包接口后替换 mutationFn 即可。
 *
 * @returns 批量下载 mutation
 */
export function useBatchReportDownload() {
	const queryClient = useQueryClient();
	const download = useDocumentDownload();
	return useMutation({
		mutationFn: async (
			users: { userId: AppraisalId; userName: string; appraisalStatus: AppraisalStatus }[],
		): Promise<BatchDownloadResult> => {
			let downloaded = 0;
			for (const user of users) {
				if (user.appraisalStatus !== AppraisalStatus.READY) {
					continue;
				}
				const detail = await queryClient.fetchQuery({
					queryKey: appraisalKeys.userDetail(user.userId),
					queryFn: () => fetchAppraisalUserDetail(user.userId),
				});
				if (detail.evaluationReportUrl) {
					await download.mutateAsync({
						url: detail.evaluationReportUrl,
						fileName: `${user.userName}-述职综合评分报告.pdf`,
					});
					downloaded += 1;
				}
			}
			return { downloaded, skipped: users.length - downloaded };
		},
	});
}

/** 文件夹内排序参数 */
export interface ReorderPayload {
	/** 文件夹 ID */
	folderId: AppraisalId;
	/** 移动的述职人员 */
	userId: AppraisalId;
	/** 目标：放到某人当前位置（拖拽），或放到第 N 位（序号输入，从 1 开始） */
	target: { overUserId: AppraisalId } | { position: number };
}

/**
 * 年终述职变更操作集合
 *
 * @returns 各类 mutation 与整体失效方法
 */
export function useAppraisalMutations() {
	const queryClient = useQueryClient();
	/** 失效除文档 Blob 外的全部查询（引用稳定，可作为 effect / callback 依赖） */
	const invalidateAll = useCallback(
		() =>
			queryClient.invalidateQueries({
				queryKey: appraisalKeys.all,
				predicate: (query) => query.queryKey[1] !== "document",
			}),
		[queryClient],
	);

	const createFolder = useMutation({
		mutationFn: (form: AppraisalFolderAddForm) => createAppraisalFolder(form),
		onSuccess: invalidateAll,
	});
	const updateFolder = useMutation({
		mutationFn: (form: AppraisalFolderUpdateForm) => updateAppraisalFolder(form),
		onSuccess: invalidateAll,
	});
	const deleteFolder = useMutation({
		mutationFn: (folderId: AppraisalId) => deleteAppraisalFolders([folderId]),
		onSuccess: invalidateAll,
	});
	const moveUsers = useMutation({
		mutationFn: (form: AppraisalFolderAddUsersForm) => addAppraisalFolderUsers(form),
		onSuccess: invalidateAll,
	});
	const reorder = useMutation({
		/**
		 * 排序接口需要整个文件夹的有序 ID：先拉全量顺序，再按目标位置移动后整体提交，
		 * 避免分页 / 筛选状态下只提交局部顺序。
		 */
		mutationFn: async ({ folderId, userId, target }: ReorderPayload) => {
			const ids = await fetchAppraisalFolderUserIds(folderId);
			const toIndex =
				"overUserId" in target ? ids.indexOf(target.overUserId) : target.position - 1;
			if (toIndex < 0) {
				return;
			}
			const next = moveId(ids, userId, toIndex);
			if (next.every((id, index) => id === ids[index])) {
				return;
			}
			await sortAppraisalUsers({ folderId, userIdsSorted: next });
		},
		// 排序失败时同样需要回到服务端顺序，因此放在 onSettled
		onSettled: invalidateAll,
	});
	const start = useMutation({
		mutationFn: (form: AppraisalPresentationForm) => startAppraisalPresentation(form),
		onSuccess: invalidateAll,
	});
	const redo = useMutation({
		mutationFn: (form: AppraisalPresentationForm) => redoAppraisalPresentation(form),
		onSuccess: invalidateAll,
	});
	const end = useMutation({
		mutationFn: (form: AppraisalPresentationForm) => endAppraisalPresentation(form),
		onSuccess: invalidateAll,
	});

	return {
		invalidateAll,
		createFolder,
		updateFolder,
		deleteFolder,
		moveUsers,
		reorder,
		start,
		redo,
		end,
	};
}
