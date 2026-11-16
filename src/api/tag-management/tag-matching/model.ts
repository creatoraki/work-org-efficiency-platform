/**
 * 标签匹配管理 - 匹配模型相关API接口
 */

import type {
	BusinessTagTreeNode,
	CreateMatchingModelParams,
	MatchingModelDetailResponse,
	MatchingModelItem,
	MatchingModelListParams,
	RuleItem,
	UpdateMatchingModelParams,
} from "#src/pages/tag-management/tag-matching/model/types";
import type { PagedData } from "#src/utils/axios-request";
import { request } from "#src/utils/axios-request";

/**
 * 获取匹配模型列表
 *
 * @param params - 查询参数，包含分页信息和筛选条件
 * @param options - 请求配置
 * @param options.signal - 取消请求信号
 * @returns 匹配模型列表数据及分页信息
 */
export async function fetchMatchingModelList(
	params?: MatchingModelListParams,
	options?: { signal?: AbortSignal },
): Promise<PagedData<MatchingModelItem>> {
	const requestParams: Record<string, any> = {
		pageNum: params?.pageNum || 1,
		pageSize: params?.pageSize || 12,
		...params,
	};

	return request.post<PagedData<MatchingModelItem>>("matchmodel/model/list", requestParams, {
		signal: options?.signal,
		showLoading: false,
	});
}

/**
 * 组织标签项（接口返回格式）
 */
export interface OrganizationTagItem {
	/** 主键ID */
	id: number;
	/** 标签类型 */
	tagType: string;
	/** 标签名称 */
	tagName: string;
	/** 标签规则id（"系统标签"模式下填写） */
	tagRulesId: number;
	/** 标签值 */
	tagValue: string;
	/** 标签描述 */
	tagDescription: string;
	/** 业务类别 */
	businessCategory: string;
	/** 是否必填：0=否，1=是 */
	isRequired: string;
	/** 敏感程度 */
	sensitivityLevel: string;
	/** 到期时间 */
	existenceCycle: Record<string, unknown>;
	/** 更新频次 */
	updateFrequency: string;
	/** 更新频次名称 */
	updateFrequencyName: string;
	/** 维护人 */
	maintainer: string;
	/** 维护人姓名 */
	maintainerName: string;
	/** 状态（待上线，审核中，已上线，已拒绝） */
	status: string;
	/** 状态名称 */
	statusName: string;
	/** 打标是否需要审核（手工标签模式下填写，0:否，1:是） */
	isAuditTagging: string;
	/** 标签库类型（1:组织标签，2:人才标签） */
	type: string;
	/** 创建人 */
	createBy: string;
	/** 更新人 */
	updateBy: string;
	/** 创建人姓名 */
	createByName: string;
	/** 更新人姓名 */
	updateByName: string;
	/** 创建时间 */
	createTime: Record<string, unknown>;
	/** 更新时间 */
	updateTime: Record<string, unknown>;
}

/**
 * 获取组织标签列表（用于下拉选择）
 */
export async function fetchOrganizationTagList(): Promise<OrganizationTagItem[]> {
	return request.get<OrganizationTagItem[]>("tagmanage/tag/list", {
		params: {
			type: "1",
		},
		showLoading: false,
	});
}

/**
 * 匹配模型搜索选项响应数据
 */
export interface MatchingModelSearchOptionsResponse {
	/** 创建人列表 */
	createByOptions: Array<{
		/** 用户ID */
		userId: number;
		/** 用户姓名 */
		userName: string;
	}>;
	/** 更新人列表 */
	updateByOptions: Array<{
		/** 用户ID */
		userId: number;
		/** 用户姓名 */
		userName: string;
	}>;
}

/**
 * 获取匹配模型搜索选项（创建人、更新人）
 *
 * @returns 搜索选项数据
 */
export async function getMatchingModelSearchOptions(): Promise<MatchingModelSearchOptionsResponse> {
	return request.get<MatchingModelSearchOptionsResponse>("matchmodel/model/search-options", {
		showLoading: false,
	});
}

/**
 * 上线标签匹配模型
 *
 * @param id - 模型id
 * @returns 操作结果
 */
export async function onlineMatchingModel(id: string): Promise<string> {
	return request.post<string>(`matchmodel/model/online/${id}`);
}

/**
 * 下线标签匹配模型
 *
 * @param id - 模型ID
 * @returns 操作结果
 */
export async function offlineMatchingModel(id: string): Promise<string> {
	return request.post<string>(`matchmodel/model/offline/${id}`);
}

/**
 * 删除标签匹配模型
 *
 * @param ids - 模型ID数组
 * @returns 操作结果
 */
export async function deleteMatchingModel(ids: string[]): Promise<string> {
	const idsParam = ids.join(",");
	return request.delete<string>(`matchmodel/model/${idsParam}`);
}

/**
 * 获取匹配模型详情
 *
 * @param id - 模型ID
 * @returns 匹配模型详情数据
 */
export async function fetchMatchingModelDetail(id: string): Promise<MatchingModelDetailResponse> {
	return request.get<MatchingModelDetailResponse>(`matchmodel/model/${id}`, {});
}

/**
 * 创建匹配模型
 *
 * @param params - 创建参数
 * @returns 创建的模型ID
 */
export async function createMatchingModel(params: CreateMatchingModelParams): Promise<number> {
	return request.post<number>("matchmodel/model/save", params);
}

/**
 * 更新匹配模型
 *
 * @param params - 更新参数，必须包含模型ID
 * @returns 更新的模型ID
 */
export async function updateMatchingModel(params: UpdateMatchingModelParams): Promise<number> {
	return request.post<number>("matchmodel/model/save", params);
}

/**
 * 检查模型名称是否重复的请求参数
 */
export interface CheckNameParams {
	/** 主键id（编辑时传入，新增时可不传） */
	id?: number;
	/** 匹配模型名称（必传） */
	name: string;
}

/**
 * 检查模型名称是否重复
 *
 * @param params - 请求参数，包含模型名称和可选的模型ID
 * @returns 是否重复（true表示重复，false表示不重复）
 */
export async function checkName(params: CheckNameParams): Promise<boolean> {
	return request.post<boolean>("matchmodel/model/check/name", params, {});
}

/**
 * 人才标签树中的标签项
 */
export interface UserTagTreeTagItem {
	/** 标签ID */
	id: number;
	/** 标签名称 */
	name: string;
	/** 所属分类 */
	category: string;
	/** 标签值（逗号分隔的字符串） */
	value?: string;
}

/**
 * 人才标签树查询接口返回数据类型
 */
export interface UserTagTreeItem {
	/** 节点ID */
	id: string;
	/** 父节点ID */
	parentId: string;
	/** 权重 */
	weight: number;
	/** 节点名称 */
	name: string;
	/** 子节点列表 */
	children?: UserTagTreeItem[];
	/** 标签列表（叶子节点才有） */
	tags?: UserTagTreeTagItem[] | null;
}

/**
 * 人才标签树查询接口
 *
 * @param tagType - 标签类型（可选）
 * @param filterMaintainer - 过滤维护人（可选）
 * @returns 人才标签树数据
 * @example
 * ```ts
 * const result = await fetchUserTagTree("1", true);
 * ```
 */
export async function fetchUserTagTree(
	tagType?: string,
	filterMaintainer?: boolean,
): Promise<UserTagTreeItem[]> {
	const searchParams: Record<string, string | boolean> = {};
	if (tagType) {
		searchParams.tagType = tagType;
	}
	if (filterMaintainer !== undefined) {
		searchParams.filterMaintainer = filterMaintainer;
	}
	return request.get<UserTagTreeItem[]>("tagmanage/tag/user/tree", {
		params: searchParams,
		showLoading: false,
	});
}

/**
 * 将用户标签树数据转换为业务标签树节点格式
 * 只保留有 tags 的节点，过滤掉 tags 为 null 或空数组的节点
 *
 * @param treeData - 用户标签树数据
 * @returns 业务标签树节点数组
 */
export function convertUserTagTreeToBusinessTagTree(
	treeData: UserTagTreeItem[],
): BusinessTagTreeNode[] {
	if (!treeData || treeData.length === 0) {
		return [];
	}

	/**
	 * 递归转换节点
	 * 过滤掉 tags 为 null 的节点，只保留有 tags 的节点或包含有 tags 子节点的节点
	 *
	 * @param item - 用户标签树节点
	 * @returns 业务标签树节点，如果节点无效则返回 null
	 */
	const convertNode = (item: UserTagTreeItem): BusinessTagTreeNode | null => {
		// 先递归处理子节点
		let validChildren: BusinessTagTreeNode[] = [];
		if (item.children && item.children.length > 0) {
			validChildren = item.children
				.map(convertNode)
				.filter((node): node is BusinessTagTreeNode => node !== null);
		}

		// 处理 tags，转换为标签节点
		const hasTags = item.tags && item.tags.length > 0;
		let tagNodes: BusinessTagTreeNode[] = [];
		if (hasTags && item.tags) {
			tagNodes = item.tags.map((tag) => ({
				id: String(tag.id),
				label: tag.name,
				value: String(tag.id),
				isTag: true,
				businessType: item.name,
				tagValue: tag.value,
			}));
		}

		// 如果节点既没有 tags，也没有有效的子节点，则过滤掉
		if (!hasTags && validChildren.length === 0) {
			return null;
		}

		// 构建节点
		const node: BusinessTagTreeNode = {
			id: item.id,
			label: item.name,
			value: item.id,
			isTag: false,
			businessType: item.name,
		};

		// 合并子节点和标签节点
		const allChildren = [...validChildren, ...tagNodes];
		if (allChildren.length > 0) {
			node.children = allChildren;
		}

		return node;
	};

	return treeData.map(convertNode).filter((node): node is BusinessTagTreeNode => node !== null);
}

/**
 * 获取所有规则列表（用于规则选择）
 *
 * @returns 规则列表数据
 */
export async function fetchAllRulesList(): Promise<RuleItem[]> {
	const requestParams = {
		pageNum: 1,
		pageSize: 500,
	};
	const result = await request.post<FetchRuleLibraryListResponse>(
		"matchmodel/rule/list",
		requestParams,
		{ showLoading: false },
	);
	if (result.list) {
		return result.list.map((rule: RuleLibraryListItem) => ({
			id: String(rule.id),
			ruleName: rule.ruleName,
			conditions: rule.details.map((detail) => ({
				id: String(detail.id),
				orgTagId: String(detail.orgTagId),
				orgTagValue: detail.orgTagValue ? String(detail.orgTagValue) : undefined,
				jobPostId: detail.jobPostId ? String(detail.jobPostId) : undefined,
				ruleValue: detail.ruleValue,
				organizationTag: detail.orgTagName,
			})),
		}));
	}
	return [];
}

/**
 * 查询规则列表参数
 */
export interface FetchRuleLibraryListParams {
	/** 页码(不能为空) */
	pageNum: number;
	/** 每页数量(不能为空) */
	pageSize: number;
	/** 模型规则ID列表 */
	modelRuleIdList?: Record<string, unknown>[];
}

/**
 * 规则明细项（接口返回格式）
 */
export interface RuleDetailItem {
	/** 所属组织 */
	orgId: number;
	/** 所属组织名称 */
	orgName: string;
	/** 岗位职位类型（job:岗位, position:职位, root:根节点） */
	jobPostType: string;
	/** 岗位职位id */
	jobPostId: number;
	/** 主键id */
	id: number;
	/** 规则id */
	ruleId: number;
	/** 组织标签id */
	orgTagId: number;
	/** 组织标签值 */
	orgTagValue?: string;
	/** 组织标签名称 */
	orgTagName: string;
	/** 规则结果值 */
	ruleValue: string;
	/** 人才标签id */
	userTagId?: number;
	/** 人才标签值 */
	userTagValue?: string;
}

/**
 * 规则列表项（接口返回格式）
 */
export interface RuleLibraryListItem {
	/** 主键id */
	id: number;
	/** 规则名称 */
	ruleName: string;
	/** 标签匹配规则明细 */
	details: RuleDetailItem[];
}

/**
 * 查询规则列表响应
 */
export interface FetchRuleLibraryListResponse {
	/** 当前页 */
	pageNum: number;
	/** 每页的数量 */
	pageSize: number;
	/** 总记录数 */
	total: number;
	/** 总页数 */
	pages: number;
	/** 结果集 */
	list: RuleLibraryListItem[];
	/** 是否为空 */
	emptyFlag: boolean;
}

/**
 * 保存规则库参数（单个规则）
 */
export interface SaveRuleLibraryItemParams {
	/** 主键id */
	id?: number;
	/** 规则名称 */
	ruleName: string;
	/** 删除标志 */
	delFlag?: string;
	/** 规则明细 */
	details: {
		/** 主键id */
		id?: number;
		/** 规则id */
		ruleId?: number;
		/** 组织标签id */
		orgTagId: number;
		/** 组织标签值 */
		orgTagValue?: string;
		/** 岗位职位类型（job:岗位, position:职位, root:根节点） */
		jobPostType: string;
		/** 岗位职位id */
		jobPostId: number;
		/** 规则结果值 */
		ruleValue: string;
		/** 人才标签id */
		userTagId?: number;
		/** 人才标签值 */
		userTagValue?: string;
		/** 删除标志 */
		delFlag?: string;
	}[];
}

/**
 * 保存规则库响应项
 */
export interface SaveRuleLibraryResponseItem {
	/** 规则名称 */
	ruleName: string;
	/** 规则被引用的匹配模型列表 */
	refMatchModelList: {
		/** id */
		id: number;
		/** 名称 */
		name: string;
	}[];
}

/**
 * 查询规则库列表
 *
 * @param params - 查询参数，包含分页信息
 * @returns 规则库列表数据及分页信息
 */
export async function fetchRuleLibraryList(
	params: FetchRuleLibraryListParams,
): Promise<FetchRuleLibraryListResponse> {
	return request.post<FetchRuleLibraryListResponse>("matchmodel/rule/list", params, {
		showLoading: false,
	});
}

/**
 * 保存规则库
 *
 * @param rules - 规则列表
 * @returns 保存结果，包含被引用的匹配模型信息
 */
export async function saveRuleLibrary(
	rules: SaveRuleLibraryItemParams[],
): Promise<SaveRuleLibraryResponseItem[]> {
	return request.post<SaveRuleLibraryResponseItem[]>("matchmodel/rule", rules);
}
