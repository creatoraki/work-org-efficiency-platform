import type { PagedData } from "#src/utils/axios-request";
import type {
	BatchUpdateStatusParams,
	CheckDuplicateNameParams,
	SearchOptionsResponse,
	TagCenterCreateBatchParams,
	TagCenterDetailItem,
	TagCenterListAllItem,
	TagCenterListAllParams,
	TagCenterListItem,
	TagCenterListParams,
	TagCenterUpdateParams,
} from "./types";
import { request } from "#src/utils/axios-request";

// 导出类型
export type {
	BatchUpdateStatusParams,
	CheckDuplicateNameParams,
	SearchOptionsResponse,
	TagCenterCreateBatchParams,
	TagCenterCreateParams,
	TagCenterDetailItem,
	TagCenterListAllItem,
	TagCenterListAllParams,
	TagCenterListItem,
	TagCenterListParams,
	TagCenterUpdateParams,
	TagPositionNode,
} from "./types";

/**
 * 标签表分页查询
 *
 * @param params - 查询参数
 * @returns 标签列表数据及分页信息
 */
export async function fetchTagCenterList(
	params: TagCenterListParams,
): Promise<PagedData<TagCenterListItem>> {
	return request.get<PagedData<TagCenterListItem>>("tagmanage/tag", {
		params,
		showLoading: false,
	});
}

/**
 * 根据id获取标签表详细信息
 *
 * @param id - 标签ID
 * @returns 标签详细信息
 */
export async function fetchTagCenterDetail(id: string): Promise<TagCenterDetailItem> {
	return request.get<TagCenterDetailItem>(`tagmanage/tag/${id}`, {});
}

/**
 * 标签表新增页面：新增保存按钮
 *
 * 约定统一使用数组 body：
 * - 单标签创建：`[payload]`
 * - 智能标签批量创建：`[payload1, payload2, ...]`
 *
 * @param params - 创建参数数组
 * @returns 创建结果
 */
export async function createTagCenter(params: TagCenterCreateBatchParams): Promise<boolean> {
	return request.post<boolean>("tagmanage/tag", params, {});
}

/**
 * 标签表更新页面：更新按钮
 *
 * @param id - 标签ID
 * @param params - 更新参数
 * @returns 更新结果
 */
export async function updateTagCenter(id: string, params: TagCenterUpdateParams): Promise<boolean> {
	return request.patch<boolean>(`tagmanage/tag/${id}`, params, {});
}

/**
 * 标签表主页面，删除按钮,支持批量删除
 *
 * @param ids - 标签ID，支持字符串（多个ID用逗号分隔）或字符串数组
 * @returns 删除结果
 */
export async function deleteTagCenter(ids: string | string[]): Promise<boolean> {
	const idsStr = Array.isArray(ids) ? ids.join(",") : ids;
	return request.delete<boolean>(`tagmanage/tag/${idsStr}`, {});
}

/**
 * 批量修改标签状态（上下线）
 *
 * @param params - 批量修改参数
 * @returns 修改结果
 */
export async function batchUpdateStatus(params: BatchUpdateStatusParams): Promise<boolean> {
	return request.patch<boolean>("tagmanage/tag/batchStatus", params, {});
}

/**
 * 获取首页下拉框查询条件：维护人、创建人、更新人
 *
 * @param type - 标签库类型（'1': 组织标签，'2': 人才标签）
 * @returns 搜索选项数据
 */
export async function getSearchOptions(type: string): Promise<SearchOptionsResponse> {
	return request.get<SearchOptionsResponse>("tagmanage/tag/search-options", {
		params: { type },
		showLoading: false,
	});
}

/**
 * 校验标签名称是否重复
 *
 * @param params - 校验参数对象
 * @returns 返回是否重复的布尔值（true 表示重复，false 表示不重复）
 */
export async function checkDuplicateName(params: CheckDuplicateNameParams): Promise<boolean> {
	return request.get<boolean>("tagmanage/tag/checkDuplicate", {
		params,
	});
}

/**
 * 标签表list查询（非分页）
 *
 * @param params - 查询参数
 * @returns 标签列表数据（数组格式）
 */
export async function fetchTagCenterListAll(
	params?: TagCenterListAllParams,
): Promise<TagCenterListAllItem[]> {
	return request.get<TagCenterListAllItem[]>("tagmanage/tag/list", {
		params,
	});
}

/**
 * 上线标签中心
 *
 * @param ids - 标签ID数组（字符串格式）
 * @returns Promise<void>
 */
export async function onlineTagCenter(ids: string[]): Promise<void> {
	await batchUpdateStatus({
		ids,
		status: "1", // 审核中
	});
}

/**
 * 下线标签中心
 *
 * @param ids - 标签ID数组（字符串格式）
 * @returns Promise<void>
 */
export async function offlineTagCenter(ids: string[]): Promise<void> {
	await batchUpdateStatus({
		ids,
		status: "4", // 已下线
	});
}

/**
 * 批量操作标签中心
 *
 * @param params - 批量操作参数
 * @param params.ids - 标签ID数组
 * @param params.operation - 操作类型
 * @param params.type - 标签库类型（'1': 组织标签，'2': 人才标签）
 * @returns Promise<void>
 */
export async function batchOperateTagCenter(params: {
	ids: string[];
	operation: "online" | "offline" | "delete";
	type: string;
}): Promise<void> {
	if (params.operation === "delete") {
		const idsStr = params.ids.join(",");
		await deleteTagCenter(idsStr);
	} else if (params.operation === "online") {
		await onlineTagCenter(params.ids);
	} else if (params.operation === "offline") {
		await offlineTagCenter(params.ids);
	}
}

/**
 * 获取所有搜索选项（维护人、创建人、更新人）
 * 一次性返回所有选项，调用方解构使用
 *
 * @param type - 标签库类型（'1': 组织标签，'2': 人才标签）
 * @returns 所有选项数据
 */
export async function fetchAllSearchOptions(type: string): Promise<SearchOptionsResponse> {
	return getSearchOptions(type);
}

/**
 * 根据标签名称获取标签详情
 * 通过列表接口实现
 *
 * @param tagName - 标签名称
 * @param type - 标签库类型（'1': 组织标签，'2': 人才标签）
 * @returns 标签详情
 */
export async function fetchTagDetailByName(
	tagName: string,
	type: string,
): Promise<TagCenterListItem | null> {
	const result = await fetchTagCenterList({
		tagName,
		type,
		pageNum: 1,
		pageSize: 1,
	});

	const list = result.list || [];
	return list[0] || null;
}
