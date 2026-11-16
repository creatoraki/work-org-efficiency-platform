/**
 * 人员档案详情 Query Hook。
 *
 * 负责统一编辑、只读、审核、审核详情模式的数据请求和缓存 key 生成。
 * 抽屉宿主可复用同一份 queryOptions 做点击预取，避免打开抽屉后才开始发起详情请求。
 */

import type { ArchiveAuditDetailResponse } from "#src/api/personnel-archive/archive-audit";
import type { DetailResponse } from "#src/api/personnel-archive/archive-management";
import type { ArchiveDetailMode } from "../types";
import { fetchArchiveAuditDetail } from "#src/api/personnel-archive/archive-audit";
import { fetchArchiveDetail } from "#src/api/personnel-archive/archive-management";
import { useQuery } from "@tanstack/react-query";

/**
 * 详情查询缓存时间。
 *
 * 5 秒主要用于覆盖 hover 预取到点击打开之间的短间隔，避免长时间复用可能过期的档案数据。
 */
const ARCHIVE_DETAIL_STALE_TIME = 5 * 1000;

/**
 * 人员档案详情查询参数。
 */
export interface ArchiveDetailQueryParams {
	/** 抽屉是否打开，关闭时不触发请求 */
	open?: boolean;
	/** 用户 ID */
	userId: string | number;
	/** 详情模式 */
	mode?: ArchiveDetailMode;
	/** 维护人，管理员编辑或查看时用于后端权限过滤 */
	maintainer?: string;
	/** 是否用于更新，查看详情时固定为 false */
	forUpdate?: boolean;
	/** 审核人 ID，审核模式下用于后端权限过滤 */
	approver?: number;
}

/**
 * 人员档案详情响应。
 */
export type ArchiveDetailQueryData = DetailResponse | ArchiveAuditDetailResponse;

/**
 * 判断当前模式是否走审核详情接口。
 *
 * @param mode - 详情模式
 * @returns 是否为审核链路
 */
function isArchiveAuditMode(mode: ArchiveDetailMode = "edit"): boolean {
	return mode === "audit" || mode === "auditView";
}

/**
 * 生成人员档案详情查询 key。
 *
 * @param params - 查询参数
 * @returns TanStack Query 缓存 key
 */
export function getArchiveDetailQueryKey(params: ArchiveDetailQueryParams) {
	const mode = params.mode ?? "edit";
	return [
		"personnel-archive",
		"archive-detail",
		{
			userId: String(params.userId || ""),
			mode,
			maintainer: params.maintainer ?? "",
			forUpdate: params.forUpdate ?? true,
			approver: params.approver ?? "",
		},
	] as const;
}

/**
 * 获取人员档案详情。
 *
 * @param params - 查询参数
 * @returns 人员档案详情响应
 */
async function fetchArchiveDetailByParams(
	params: ArchiveDetailQueryParams,
): Promise<ArchiveDetailQueryData> {
	if (!params.userId) {
		throw new Error("人员 ID 不能为空");
	}

	if (isArchiveAuditMode(params.mode)) {
		return await fetchArchiveAuditDetail(Number(params.userId), params.approver);
	}

	return await fetchArchiveDetail(
		String(params.userId),
		params.maintainer,
		params.forUpdate ?? true,
	);
}

/**
 * 获取人员档案详情查询配置。
 *
 * @param params - 查询参数
 * @returns 可供 useQuery 和 queryClient.prefetchQuery 复用的配置
 */
export function getArchiveDetailQueryOptions(params: ArchiveDetailQueryParams) {
	return {
		queryKey: getArchiveDetailQueryKey(params),
		queryFn: () => fetchArchiveDetailByParams(params),
		staleTime: ARCHIVE_DETAIL_STALE_TIME,
	};
}

/**
 * 人员档案详情 Query Hook。
 *
 * @param params - 查询参数
 * @returns TanStack Query 查询结果
 */
export function useArchiveDetailQuery(params: ArchiveDetailQueryParams) {
	return useQuery<ArchiveDetailQueryData>({
		...getArchiveDetailQueryOptions(params),
		enabled: Boolean(params.open && params.userId),
	});
}
