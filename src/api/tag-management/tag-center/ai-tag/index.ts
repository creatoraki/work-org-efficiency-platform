/**
 * AI 智能标签相关 API。
 *
 * 负责承接 AI 标签元数据、会话维度元数据、标签明细分页以及状态批量变更等接口调用，
 * 统一管理真实接口与本地 Mock 接口的路径解析。
 *
 * @author 王善能
 * @since 2026-06-17
 */

import type { PagedData } from "#src/utils/axios-request/types";
import type {
	BatchUpdateLabelMetaStatusParams,
	LabelDataItem,
	LabelDataParams,
	LabelMetaBySessionParams,
	LabelMetaItem,
	LabelMetaParams,
	SmartTagDeleteParams,
} from "./types";
import { request } from "#src/utils/axios-request";

export type {
	BatchUpdateLabelMetaStatusParams,
	LabelDataItem,
	LabelDataParams,
	LabelMetaBySessionParams,
	LabelMetaItem,
	LabelMetaParams,
	SmartTagDeleteParams,
} from "./types";

/**
 * AI 标签真实接口前缀。
 */
const AI_TAG_REAL_PREFIX = "hrbrain";

/**
 * 解析 AI 标签接口路径。
 *
 * @param relativePath - 相对路径，如 label/meta/bySession
 * @returns 完整接口路径
 */
function resolveAiTagUrl(relativePath: string): string {
	return `${AI_TAG_REAL_PREFIX}/${relativePath}`;
}

/**
 * 获取标签元数据。
 *
 * 根据标签 code 查询标签元数据列表。
 *
 * @param params - 请求参数
 * @param params.labelCode - 标签 code，不能为空。
 * @returns 标签元数据列表
 * @remarks
 * 仅负责查询元数据，不包含分页与状态变更逻辑。
 * @example
 * ```ts
 * const meta = await fetchLabelMeta({ labelCode: "hrbrain_sys_calculation_label_info.df0412a44e8f4cd5824916d78a126b74" });
 * ```
 */
export async function fetchLabelMeta(params: LabelMetaParams): Promise<LabelMetaItem[]> {
	return request.post<LabelMetaItem[]>("hrbrain/label/meta", params);
}

/**
 * 根据 sessionId 和操作人工号获取标签元数据。
 *
 * 适用于会话级 AI 打标结果回显场景。
 *
 * @param params - 请求参数
 * @param params.sessionId - 会话 ID，不能为空。
 * @param params.optWorkNo - 操作人工号，不能为空。
 * @returns 标签元数据列表
 * @example
 * ```ts
 * const metaList = await fetchLabelMetaBySession({ sessionId: "session123", optWorkNo: "001" });
 * ```
 */
export async function fetchLabelMetaBySession(
	params: LabelMetaBySessionParams,
): Promise<LabelMetaItem[]> {
	return request.post<LabelMetaItem[]>(resolveAiTagUrl("label/meta/bySession"), params);
}

/**
 * 根据标签 code 分页获取 AI 打标人员明细。
 *
 * @param params - 请求参数
 * @param params.labelCode - 标签 code，不能为空。
 * @param params.pageNum - 页码，默认 1。
 * @param params.pageSize - 每页数量，默认 20。
 * @returns 标签明细分页数据
 * @remarks
 * 当调用方未传分页参数时，使用默认页码和页大小，避免接口入参不完整导致请求失败。
 */
export async function fetchLabelData(params: LabelDataParams) {
	const { pageNum = 1, pageSize = 20, ...restParams } = params;
	return request.post<PagedData<LabelDataItem>>(resolveAiTagUrl("label/data"), {
		pageNum,
		pageSize,
		...restParams,
	});
}

/**
 * 批量修改标签元数据状态。
 *
 * 支持删除、上架、下架操作。
 *
 * @param params - 请求参数
 * @param params.codes - 标签 code 列表，不能为空。
 * @param params.optType - 操作类型：delete-删除，online-上架，offline-下架
 * @returns 修改结果
 * @remarks
 * 该接口仅负责批量状态变更，不做前置业务校验与结果二次加工。
 * @example
 * ```ts
 * const result = await batchUpdateLabelMetaStatus({
 *   codes: ["label1", "label2"],
 *   optType: "delete"
 * });
 * ```
 */
export async function batchUpdateLabelMetaStatus(
	params: BatchUpdateLabelMetaStatusParams,
): Promise<boolean> {
	return request.post<boolean>("hrbrain/label/meta/batchUpdateStatus", params);
}

/**
 * 删除智能标签会话结果。
 *
 * 按 sessionId 维度删除当前 AI 任务中的新增标签与已有标签更新结果。
 *
 * @param params - 请求参数
 * @param params.sessionId - AI 会话 ID
 * @param params.newTagCodes - 新增标签 code 列表
 * @param params.existingTagCodes - 已存在标签 code 列表
 * @returns 删除结果
 *
 * @author 王善能
 * @since 2026-07-06
 */
export async function deleteSmartTag(params: SmartTagDeleteParams): Promise<boolean> {
	return request.post<boolean>(resolveAiTagUrl("label/smartTag/delete"), params);
}
