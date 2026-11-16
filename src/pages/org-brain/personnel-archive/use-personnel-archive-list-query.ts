import type {
	PersonnelArchiveItem,
	PersonnelArchiveListParams,
} from "#src/api/org-brain/personnel-archive";
import type { PagedData } from "#src/utils/axios-request";
import { fetchPersonnelArchiveList } from "#src/api/org-brain/personnel-archive";
import { hashKey, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef } from "react";

/**
 * 人员档案分页状态。
 *
 * @author 王善能
 * @since 2026-07-17
 */
export interface PersonnelArchivePaginationState {
	current: number;
	pageSize: number;
}

/**
 * 人员档案列表筛选参数。
 *
 * @author 王善能
 * @since 2026-07-17
 */
export type PersonnelArchiveFilters = Omit<PersonnelArchiveListParams, "pageNum" | "pageSize">;

/**
 * 人员档案列表视图状态。
 *
 * @author 王善能
 * @since 2026-07-17
 */
export type PersonnelArchiveListViewState =
	| "initial-loading"
	| "page-transition"
	| "ready"
	| "load-failed"
	| "recoverable-error"
	| "refresh-error";

/**
 * 最近一次成功查询的页面快照。
 *
 * @author 王善能
 * @since 2026-07-17
 */
interface PersonnelArchivePageSnapshot {
	data: PagedData<PersonnelArchiveItem>;
	filterSignature: string;
	pagination: PersonnelArchivePaginationState;
}

/**
 * 查询人员档案列表并维护可恢复的分页失败状态。
 *
 * 分页请求失败时返回最近一次相同筛选条件下的成功页面；筛选条件变化后请求失败
 * 不复用旧结果，避免旧筛选数据冒充新结果。
 *
 * @param pagination - 当前分页状态。
 * @param filters    - 当前筛选参数。
 * @returns 列表数据、加载状态、错误状态与恢复分页信息。
 *
 * @author 王善能
 * @since 2026-07-17
 */
export function usePersonnelArchiveListQuery(
	pagination: PersonnelArchivePaginationState,
	filters: PersonnelArchiveFilters,
) {
	const filterSignature = useMemo(() => hashKey([filters]), [filters]);
	const lastSuccessfulPageRef = useRef<PersonnelArchivePageSnapshot>();
	const query = useQuery({
		queryKey: ["personnel-archive-list", pagination.current, pagination.pageSize, filters],
		queryFn: () =>
			fetchPersonnelArchiveList({
				pageNum: pagination.current,
				pageSize: pagination.pageSize,
				...filters,
			}),
		placeholderData: (previousData, previousQuery) => {
			const previousFilters = previousQuery?.queryKey[3] as
				| PersonnelArchiveFilters
				| undefined;
			return previousFilters && hashKey([previousFilters]) === filterSignature
				? previousData
				: undefined;
		},
	});

	useEffect(() => {
		if (!query.data || query.isError || query.isPlaceholderData || query.isRefetchError) {
			return;
		}
		lastSuccessfulPageRef.current = {
			data: query.data,
			filterSignature,
			pagination,
		};
	}, [
		filterSignature,
		pagination,
		query.data,
		query.isError,
		query.isPlaceholderData,
		query.isRefetchError,
	]);

	const matchingSnapshot =
		(query.isError || query.isRefetchError) &&
		lastSuccessfulPageRef.current?.filterSignature === filterSignature
			? lastSuccessfulPageRef.current
			: undefined;
	const shouldRollbackPagination =
		!!matchingSnapshot &&
		(matchingSnapshot.pagination.current !== pagination.current ||
			matchingSnapshot.pagination.pageSize !== pagination.pageSize);
	const page = query.data ?? matchingSnapshot?.data;
	let viewState: PersonnelArchiveListViewState = "ready";
	if (query.isRefetchError && matchingSnapshot) {
		viewState = "refresh-error";
	} else if (query.isError) {
		if (shouldRollbackPagination) {
			viewState = "recoverable-error";
		} else {
			viewState = "load-failed";
		}
	} else if (query.isLoading) {
		viewState = "initial-loading";
	} else if (query.isPlaceholderData) {
		viewState = "page-transition";
	}

	return {
		page,
		viewState,
		displayPagination: shouldRollbackPagination ? matchingSnapshot.pagination : pagination,
		refetch: query.refetch,
	};
}
