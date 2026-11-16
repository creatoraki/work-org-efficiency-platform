import type { PagedData } from "#src/utils/axios-request";
import type {
	BatchUpdateStatusParams,
	CheckDuplicateNameParams,
	JobPositionTreeNode,
	OrgTagRuleDataItem,
	OrgTagRuleListParams,
	RuleLibraryCreateParams,
	RuleLibraryListParams,
	RuleLibraryUpdateParams,
	SearchOptionsResponse,
	TagRuleLibraryApiItem,
	TalentTagRuleDataItem,
	TalentTagRuleListParams,
	UnassociatedRuleItem,
} from "./types";
import { request } from "#src/utils/axios-request";

// 导出类型
export type {
	BatchUpdateStatusParams,
	CheckDuplicateNameParams,
	JobPositionTreeNode,
	OrgTagRuleDataItem,
	OrgTagRuleListParams,
	RuleLibraryCreateParams,
	RuleLibraryListParams,
	RuleLibraryUpdateParams,
	SearchOptionsResponse,
	TagRuleLibraryApiItem,
	TalentTagRuleDataItem,
	TalentTagRuleListParams,
	UnassociatedRuleItem,
} from "./types";

/**
 * 标签规则库表分页查询
 * @param {RuleLibraryListParams} params - 查询参数
 * @param {string} params.type - 标签规则库类型（必填，'1': 组织标签规则库，'2': 人才标签规则库）
 * @returns {Promise<PagedData<TagRuleLibraryApiItem>>} 规则库列表数据
 */
export async function fetchRuleLibraryList(
	params: RuleLibraryListParams,
): Promise<PagedData<TagRuleLibraryApiItem>> {
	return request.get<PagedData<TagRuleLibraryApiItem>>("tagmanage/tagrule", {
		params,
		showLoading: false,
	});
}

/**
 * 根据id获取标签规则库表详细信息
 * @param {string} id - 规则库ID
 * @returns {Promise<TagRuleLibraryApiItem>} 规则库详细信息
 */
export async function fetchRuleLibraryDetail(id: string): Promise<TagRuleLibraryApiItem> {
	return request.get<TagRuleLibraryApiItem>(`tagmanage/tagrule/${id}`, {});
}

/**
 * 标签规则库表新增页面：新增保存按钮
 * @param {RuleLibraryCreateParams} params - 创建参数
 * @param {string} params.type - 标签规则库类型（必填，'1': 组织标签规则库，'2': 人才标签规则库）
 * @returns {Promise<boolean>} 创建结果
 */
export async function createRuleLibrary(params: RuleLibraryCreateParams): Promise<boolean> {
	return request.post<boolean>("tagmanage/tagrule", params, {});
}

/**
 * 标签规则库表更新页面：更新按钮
 * @param {string} id - 规则库ID
 * @param {RuleLibraryUpdateParams} params - 更新参数
 * @param {string} params.type - 标签规则库类型（必填，'1': 组织标签规则库，'2': 人才标签规则库）
 * @returns {Promise<boolean>} 更新结果
 */
export async function updateRuleLibrary(
	id: string,
	params: RuleLibraryUpdateParams,
): Promise<boolean> {
	return request.patch<boolean>(`tagmanage/tagrule/${id}`, params, {});
}

/**
 * 标签规则库表主页面，删除按钮,支持批量删除
 * @param {string} ids - 标签规则ID，支持多个ID用逗号分隔的字符串，如 "1,2,3"
 * @returns {Promise<boolean>} 删除结果
 */
export async function deleteRuleLibrary(ids: string): Promise<boolean> {
	return request.delete<boolean>(`tagmanage/tagrule/${ids}`, {});
}

/**
 * 批量修改上线状态
 * 批量修改标签规则的上线状态
 * @param {BatchUpdateStatusParams} params - 批量修改参数
 * @param {string[]} params.ids - 标签规则ID列表
 * @param {string} params.onlineStatus - 上线状态（'1': 开发中，'2': 已上线，'3': 已下线）
 * @returns {Promise<boolean>} 修改结果
 */
export async function batchUpdateStatus(params: BatchUpdateStatusParams): Promise<boolean> {
	return request.patch<boolean>("tagmanage/tagrule/batchStatus", params, {});
}

/**
 * 上线规则库
 * 批量将标签规则状态修改为已上线
 * @param {string[]} ids - 标签规则ID数组
 * @returns {Promise<void>}
 */
export async function onlineRuleLibrary(ids: string[]): Promise<void> {
	await batchUpdateStatus({
		ids,
		onlineStatus: "1", // 1:开发中
	});
}

/**
 * 下线规则库
 * 批量将标签规则状态修改为已下线
 * @param {string[]} ids - 标签规则ID数组
 * @returns {Promise<void>}
 */
export async function offlineRuleLibrary(ids: string[]): Promise<void> {
	await batchUpdateStatus({
		ids,
		onlineStatus: "3", // 3:已下线 (使用后端字典值)
	});
}

/**
 * 获取标签规则搜索选项
 * 获取标签规则搜索时需要的选项数据（关联标签列表、创建人列表、更新人列表）
 * @param {string} type - 标签规则库类型（'1': 组织标签规则库，'2': 人才标签规则库）
 * @returns {Promise<SearchOptionsResponse>} 搜索选项数据
 */
export async function getSearchOptions(type: string): Promise<SearchOptionsResponse> {
	return request.get<SearchOptionsResponse>("tagmanage/tagrule/searchOptions", {
		params: { type },
		showLoading: false,
	});
}

/**
 * 校验标签规则名称是否重复
 * @param {CheckDuplicateNameParams} params - 校验参数对象
 * @param {string} [params.id] - 规则ID（编辑时传入，新增时可不传）
 * @param {string} params.name - 规则名称，不能为空
 * @param {string} params.type - 标签规则库类型（必填，'1': 组织标签规则库，'2': 人才标签规则库）
 * @returns {Promise<boolean>} 返回是否重复的布尔值（true 表示重复，false 表示不重复）
 */
export async function checkDuplicateName(params: CheckDuplicateNameParams): Promise<boolean> {
	return request.get<boolean>("tagmanage/tagrule/checkDuplicate", {
		params,
	});
}

/**
 * 岗位职位虚拟树查询接口
 * 获取岗位-职位树形结构数据（人才标签规则库专用）
 * @returns {Promise<JobPositionTreeNode[]>} 岗位职位树形结构数据
 */
export async function getJobPositionTree(): Promise<JobPositionTreeNode[]> {
	return request.get<JobPositionTreeNode[]>("post/job/position/tree", {});
}

/**
 * 查询已上线且未关联标签的规则列表
 * 用于标签中心选择规则下拉选项
 * @param {object} params - 查询参数
 * @param {string} params.type - 标签规则库类型（必填，'1': 组织标签规则库，'2': 人才标签规则库）
 * @param {string} [params.id] - 标签ID（编辑时传入，新增时可不传）
 * @returns {Promise<UnassociatedRuleItem[]>} 已上线且未关联标签的规则列表
 */
export async function fetchUnassociatedRules(params: {
	type: string;
	id?: string;
}): Promise<UnassociatedRuleItem[]> {
	const searchParams: Record<string, string> = {
		type: params.type,
	};
	if (params.id) {
		searchParams.id = params.id;
	}
	return request.get<UnassociatedRuleItem[]>("tagmanage/tagrule/unassociated", {
		params: searchParams,
	});
}

/**
 * 预览人才系统数仓标签明细数据（分页）
 *
 * @param params - 查询参数
 * @param params.tagRuleId - 标签规则ID（必填）
 * @param params.pageNum - 页码(不能为空)
 * @param params.pageSize - 每页数量(不能为空)
 * @param params.sortItemList - 排序字段集合
 * @param params.jobPositionList - 岗位职位列表
 * @returns 人才标签规则列表数据
 */
export async function fetchTalentTagRuleList(
	params: TalentTagRuleListParams,
): Promise<PagedData<TalentTagRuleDataItem>> {
	return request.post<PagedData<TalentTagRuleDataItem>>(
		"tagmanage/tagrule/userSysDataWarehouseTagDetail",
		params,
		{ showLoading: false },
	);
}

/**
 * 预览组织系统数仓标签明细数据（分页）
 *
 * @param params - 查询参数
 * @param params.tagRuleId - 标签规则ID（必填）
 * @param params.pageNum - 页码(不能为空)
 * @param params.pageSize - 每页数量(不能为空)
 * @param params.searchCount - 是否查询总条数
 * @param params.sortItemList - 排序字段集合
 * @returns 组织标签规则列表数据
 */
export async function fetchOrgTagRuleList(
	params: OrgTagRuleListParams,
): Promise<PagedData<OrgTagRuleDataItem>> {
	return request.post<PagedData<OrgTagRuleDataItem>>(
		"tagmanage/tagrule/orgSysDataWarehouseTagDetail",
		params,
		{ showLoading: false },
	);
}
