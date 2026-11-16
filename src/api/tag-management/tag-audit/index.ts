import type {
	AuditStatisticsData,
	BatchAuditParams,
	BatchAuditResponse,
	SearchOptionsData,
	TagAuditListItem,
	TagAuditListParams,
} from "./types";
import { request } from "#src/utils/axios-request";

export type { TagAuditListItem } from "./types";

/**
 * 分页获取标签审核列表
 *
 * @param params - 查询参数，包含分页信息和筛选条件
 * @returns 标签审核列表数据及分页信息
 * @example
 * ```ts
 * const result = await fetchTagAuditList({
 *   pageNum: 1,
 *   pageSize: 10,
 *   type: '2',
 *   tagName: '标签'
 * });
 * ```
 */
export async function fetchTagAuditList(
	params: TagAuditListParams,
): Promise<PagedData<TagAuditListItem>> {
	return request.get<PagedData<TagAuditListItem>>("tagmanage/tagApprove/page", {
		params,
		showLoading: false,
	});
}

/**
 * 获取标签审核统计信息
 *
 * @param type - 标签类型（必填，'1': 组织标签，'2': 人才标签）
 * @returns 标签审核统计数据
 * @example
 * ```ts
 * const result = await fetchTagAuditStatistics('2');
 * console.log(result.pendingCount);
 * ```
 */
export async function fetchTagAuditStatistics(type: string): Promise<AuditStatisticsData> {
	return request.get<AuditStatisticsData>("tagmanage/tagApprove/statistics", {
		params: {
			type,
		},
		showLoading: false,
	});
}

/**
 * 批量审核标签
 *
 * @param params - 批量审核参数，包含 type（必填，'1': 组织标签，'2': 人才标签）
 * @returns 审核结果
 * @throws {ValidationError} 当参数格式不正确时抛出
 * @example
 * ```ts
 * const result = await batchAuditTags({
 *   ids: ['1', '2', '3'],
 *   auditStatus: '1',
 *   auditComment: '审核通过',
 *   type: '2'
 * });
 * ```
 */
export async function batchAuditTags(
	params: BatchAuditParams & { type: string },
): Promise<BatchAuditResponse> {
	const { type, ...restParams } = params;
	return request.post<BatchAuditResponse>("tagmanage/tagApprove/batch-audit", {
		...restParams,
		type,
	});
}

/**
 * 获取首页下拉框查询条件：提交人、审核人
 *
 * @param params - 查询参数
 * @param params.type - 标签类型（必填，'1': 组织标签，'2': 人才标签）
 * @returns 提交人和审核人选项列表
 * @example
 * ```ts
 * const result = await fetchSearchOptions({ type: '2' });
 * console.log(result.submitterOptions);
 * ```
 */
export async function fetchSearchOptions(params: { type: string }): Promise<SearchOptionsData> {
	return request.get<SearchOptionsData>("tagmanage/tagApprove/search-options", {
		params: {
			type: params.type,
		},
		showLoading: false,
	});
}
