import type {
	MatchingModelItem,
	MatchingModelListParams,
} from "#src/pages/tag-management/tag-matching/model/types";
import { fetchMatchingModelList } from "#src/api/tag-management/tag-matching/model";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { trim } from "lodash-es";
import { useCallback, useMemo } from "react";

/** 匹配模型远程状态。 */
export interface MatchingModelRemoteState {
	loading: boolean;
	queried: boolean;
	loadFailed: boolean;
}

interface MatchingModelCurrentValue {
	id?: string | number;
	name?: string;
}

interface UseMatchingModelRemoteOptionsOptions {
	params?: MatchingModelListParams;
	enabled?: boolean;
	staleTime?: number;
	gcTime?: number;
}

const ONLINE_MATCHING_MODEL_STATUS = "1";
const MATCHING_MODEL_QUERY_KEY = "matching-model-remote-options";

function buildMatchingModelQueryKey(params?: MatchingModelListParams) {
	return [
		MATCHING_MODEL_QUERY_KEY,
		params?.orgMatchId ?? "",
		params?.status ?? "",
		params?.pageNum ?? 1,
		params?.pageSize ?? 500,
		params?.jobIds ?? [],
		params?.postIds ?? [],
		params?.postLevelIds ?? [],
	] as const;
}

function prependCurrentMatchingModel(
	options: MatchingModelItem[],
	currentValue?: MatchingModelCurrentValue,
	orgMatchId?: string,
): MatchingModelItem[] {
	const currentId = trim(String(currentValue?.id ?? ""));
	const currentName = trim(String(currentValue?.name ?? ""));
	if (!currentId || !currentName) {
		return options;
	}
	if (options.some((option) => String(option.id) === currentId)) {
		return options;
	}
	return [
		{
			id: currentId,
			name: currentName,
			orgId: orgMatchId,
			orgLevel: "SYS",
			status: ONLINE_MATCHING_MODEL_STATUS,
		},
		...options,
	];
}

/**
 * 维护匹配模型下拉选项的 Query 缓存与远程状态。
 *
 * 标准实现由 TanStack Query 负责请求状态管理与并发去重，
 * 但查询触发时机保持“按需拉取 + 主动刷新最新数据”：
 * 1. 默认不在参数齐全时自动请求，避免抽屉首屏产生额外接口调用；
 * 2. 由调用方在下拉展开、模型保存成功等明确交互时机触发 refreshOptions；
 * 3. refreshOptions 每次都会主动失效当前 query 并重新请求，确保下拉看到的是最新结果；
 * 4. 同一 queryKey 仍用于共享请求状态，避免多处组件在同一时刻重复并发同一请求。
 *
 * @param options - hook 配置
 * @param options.params - 匹配模型查询参数
 * @param options.enabled - 是否允许自动请求
 * @param options.staleTime - 缓存新鲜时间
 * @param options.gcTime - 缓存回收时间
 * @returns 展示选项、远程状态与手动刷新方法
 * @author 王善能
 * @since 2026-07-10
 */
export function useMatchingModelRemoteOptions({
	params,
	enabled = false,
	staleTime,
	gcTime,
}: UseMatchingModelRemoteOptionsOptions) {
	const queryClient = useQueryClient();
	const queryKey = useMemo(() => buildMatchingModelQueryKey(params), [params]);
	const queryEnabled = Boolean(params) && enabled;

	const query = useQuery({
		queryKey,
		queryFn: async ({ signal }) => {
			if (!params) {
				return [] as MatchingModelItem[];
			}
			const response = await fetchMatchingModelList(params, { signal });
			return response?.list ?? [];
		},
		enabled: queryEnabled,
		staleTime,
		gcTime,
	});

	const options = query.data ?? [];
	const getDisplayOptions = useCallback(
		(currentValue?: MatchingModelCurrentValue) =>
			prependCurrentMatchingModel(options, currentValue, params?.orgMatchId),
		[options, params?.orgMatchId],
	);

	const refreshOptions = useCallback(async () => {
		if (!params) {
			return [] as MatchingModelItem[];
		}
		await queryClient.invalidateQueries({
			queryKey,
			exact: true,
		});
		const result = await queryClient.fetchQuery({
			queryKey,
			queryFn: async ({ signal }) => {
				const response = await fetchMatchingModelList(params, { signal });
				return response?.list ?? [];
			},
			staleTime,
			gcTime,
		});
		return result;
	}, [gcTime, params, queryClient, queryKey, staleTime]);

	return {
		getDisplayOptions,
		remoteState: {
			loading: query.isFetching,
			queried: query.isFetched && !query.isError,
			loadFailed: query.isError,
		} satisfies MatchingModelRemoteState,
		refreshOptions,
	};
}
