/**
 * 人员档案详情视图模型 Hook。
 *
 * 负责将接口详情响应转换为抽屉渲染所需的基础信息、标签树、初始标签映射和变更记录。
 * 该 Hook 将原本散落在组件中的重派生计算集中管理，降低抽屉内容组件的渲染压力。
 */

import type { TreeTagItem, TreeTagNode } from "#src/api/personnel-archive/archive-management";
import type { ChangeRecord } from "../sections";
import type { ArchiveDetailMode } from "../types";
import type { ArchiveDetailQueryData } from "./useArchiveDetailQuery";
import { cloneDeep } from "lodash-es";
import { useMemo } from "react";
import { useTagTreeUtils } from "./useTagTreeUtils";

/**
 * 人员基础信息视图模型。
 */
interface ArchiveBasicInfoData {
	/** 用户 ID */
	id?: string | number;
	/** 姓名 */
	name?: string;
	/** 工号 */
	userCode?: string;
	/** 所属组织 ID */
	orgId?: string | number;
	/** 所属组织名称 */
	orgName?: string;
	/** 岗位 ID */
	jobId?: string | number;
	/** 岗位名称 */
	jobName?: string;
	/** 职位 ID */
	postId?: string | number;
	/** 职位名称 */
	postName?: string;
	/** 手机号码 */
	mobileNum?: string;
	/** 维护完善度 */
	perfectDegree?: number;
	/** 入职日期 */
	joinDate?: string;
}

/**
 * 人员档案详情视图模型参数。
 */
interface UseArchiveDetailViewModelParams {
	/** 当前用户 ID，用于防止旧请求结果污染新抽屉 */
	userId: string | number;
	/** 详情模式 */
	mode: ArchiveDetailMode;
	/** 接口响应 */
	archiveDetailResponse?: ArchiveDetailQueryData;
	/** 标签名称筛选 */
	tagNameFilter: string;
	/** 标签状态筛选 */
	statusFilter?: string;
}

/**
 * 人员档案详情视图模型返回值。
 */
interface UseArchiveDetailViewModelReturn {
	/** 与当前 userId 匹配的详情响应 */
	currentArchiveDetailResponse?: ArchiveDetailQueryData;
	/** 基础信息 */
	basicInfoData: ArchiveBasicInfoData | null;
	/** 是否显示详情骨架屏 */
	shouldShowArchiveDetailSkeleton: boolean;
	/** 从详情接口返回的维护人 */
	maintainerFromDetail?: string;
	/** 原始树形数据 */
	rawTreeData: TreeTagNode[];
	/** 当前模式需要展示的标签状态 */
	visibleStatuses: string[];
	/** 按模式过滤后的树形数据 */
	filteredTreeData: TreeTagNode[];
	/** 实际用于选中、表格和树展示的数据 */
	treeDataForDisplay: TreeTagNode[];
	/** 初始标签映射 */
	initLeafNodeTags: Map<string, TreeTagItem>;
	/** 初始变更记录 */
	initialChangeRecords: ChangeRecord[];
}

/**
 * 将 treeTags 对象转换为 TreeTagNode[] 数组。
 *
 * @param treeTags - 后端返回的树形标签对象或数组
 * @returns 标准树形节点数组
 */
function convertTreeTagsToNodes(treeTags: unknown): TreeTagNode[] {
	if (!treeTags) {
		return [];
	}

	/**
	 * 转换单个树节点。
	 *
	 * @param node - 后端节点对象
	 * @returns 标准树节点
	 */
	const convertNode = (node: any): TreeTagNode => {
		const tags =
			node.tags && Array.isArray(node.tags)
				? node.tags.map((tag: any) => cloneDeep(tag))
				: [];

		const converted: TreeTagNode = {
			id: String(node.id || ""),
			name: String(node.name || ""),
			parentId: String(node.parentId || "0"),
			weight: typeof node.weight === "number" ? node.weight : Number(node.weight) || 0,
			tags,
			children: undefined,
		};

		if (node.children && Array.isArray(node.children) && node.children.length > 0) {
			converted.children = node.children.map(convertNode);
		}

		return converted;
	};

	return Array.isArray(treeTags) ? treeTags.map(convertNode) : [convertNode(treeTags)];
}

/**
 * 获取当前模式下需要显示的标签状态列表。
 *
 * @param mode - 详情模式
 * @returns 状态列表，空数组表示不过滤
 */
function getVisibleStatusesByMode(mode: ArchiveDetailMode): string[] {
	if (mode === "audit") {
		return ["2"];
	}
	if (mode === "auditView") {
		return ["3", "4"];
	}
	return [];
}

/**
 * 判断变更记录是否命中筛选条件。
 *
 * @param item - 变更记录接口项
 * @param params - 筛选上下文
 * @param params.visibleStatuses - 当前模式允许显示的标签状态
 * @param params.visibleTagIdsSet - 当前模式允许显示的标签 ID 集合
 * @param params.statusFilter - 用户选择的标签状态筛选
 * @param params.tagNameFilter - 用户输入的标签名称筛选
 * @param params.initLeafNodeTags - 初始化标签映射，用于补齐变更记录状态
 * @returns 是否保留该记录
 */
function isChangeRecordVisible(
	item: any,
	params: {
		visibleStatuses: string[];
		visibleTagIdsSet: Set<string>;
		statusFilter?: string;
		tagNameFilter: string;
		initLeafNodeTags: Map<string, TreeTagItem>;
	},
): boolean {
	const itemTagId = String(item.tagId);

	if (params.visibleStatuses.length > 0 && !params.visibleTagIdsSet.has(itemTagId)) {
		return false;
	}

	if (params.statusFilter) {
		const tag = params.initLeafNodeTags.get(itemTagId);
		const itemStatus = tag ? String(tag.status || "1") : String(item.status || "1");
		if (itemStatus !== params.statusFilter) {
			return false;
		}
	}

	if (params.tagNameFilter) {
		const itemTagName = item.tagName || "";
		if (!itemTagName.toLowerCase().includes(params.tagNameFilter.toLowerCase())) {
			return false;
		}
	}

	return true;
}

/**
 * 人员档案详情视图模型 Hook。
 *
 * @param params - 视图模型参数
 * @param params.userId - 当前用户 ID
 * @param params.mode - 详情模式
 * @param params.archiveDetailResponse - 接口响应
 * @param params.tagNameFilter - 标签名称筛选
 * @param params.statusFilter - 标签状态筛选
 * @returns 详情抽屉渲染所需的派生数据
 */
export function useArchiveDetailViewModel({
	userId,
	mode,
	archiveDetailResponse,
	tagNameFilter,
	statusFilter,
}: UseArchiveDetailViewModelParams): UseArchiveDetailViewModelReturn {
	const { collectAllTags, filterTreeNodesByStatus } = useTagTreeUtils();

	const currentArchiveDetailResponse = useMemo(() => {
		if (!archiveDetailResponse) {
			return undefined;
		}
		return String(archiveDetailResponse.id) === String(userId)
			? archiveDetailResponse
			: undefined;
	}, [archiveDetailResponse, userId]);

	const basicInfoData = useMemo<ArchiveBasicInfoData | null>(() => {
		if (!currentArchiveDetailResponse) {
			return null;
		}

		return {
			id: currentArchiveDetailResponse.id,
			name: currentArchiveDetailResponse.name,
			userCode: currentArchiveDetailResponse.userCode,
			orgId: currentArchiveDetailResponse.orgId,
			orgName: currentArchiveDetailResponse.orgName,
			jobId: currentArchiveDetailResponse.jobId,
			jobName: currentArchiveDetailResponse.jobName,
			postId: currentArchiveDetailResponse.postId,
			postName: currentArchiveDetailResponse.postName,
			mobileNum: currentArchiveDetailResponse.mobileNum,
			perfectDegree: currentArchiveDetailResponse.perfectDegree,
			joinDate: currentArchiveDetailResponse.joinDate,
		};
	}, [currentArchiveDetailResponse]);

	const rawTreeData = useMemo(() => {
		return convertTreeTagsToNodes(currentArchiveDetailResponse?.treeTags);
	}, [currentArchiveDetailResponse?.treeTags]);

	const visibleStatuses = useMemo(() => getVisibleStatusesByMode(mode), [mode]);

	const filteredTreeData = useMemo(() => {
		if (!rawTreeData.length) {
			return [] as TreeTagNode[];
		}
		return filterTreeNodesByStatus(rawTreeData, visibleStatuses);
	}, [rawTreeData, visibleStatuses, filterTreeNodesByStatus]);

	const { tags: filteredTags, tagIds } = useMemo(() => {
		if (!filteredTreeData.length) {
			return { tags: [] as TreeTagItem[], tagIds: new Set<string>() };
		}
		return collectAllTags(filteredTreeData);
	}, [filteredTreeData, collectAllTags]);

	const initLeafNodeTags = useMemo(() => {
		const map = new Map<string, TreeTagItem>();
		const allTagsForInit =
			visibleStatuses.length === 0 ? collectAllTags(rawTreeData).tags : filteredTags;

		allTagsForInit.forEach((tag) => {
			const tagId = (tag as any).tagId;
			if (tagId != null) {
				map.set(String(tagId), cloneDeep(tag));
			}
		});

		return map;
	}, [rawTreeData, filteredTags, visibleStatuses, collectAllTags]);

	const treeDataForDisplay = useMemo(() => {
		return visibleStatuses.length === 0 ? rawTreeData : filteredTreeData;
	}, [rawTreeData, filteredTreeData, visibleStatuses]);

	const initialChangeRecords = useMemo(() => {
		const tagChangeList = currentArchiveDetailResponse?.tagChangeList || [];
		if (tagChangeList.length === 0) {
			return [] as ChangeRecord[];
		}

		const visibleTagIdsSet = new Set(tagIds);

		return tagChangeList
			.filter((item) =>
				isChangeRecordVisible(item, {
					visibleStatuses,
					visibleTagIdsSet,
					statusFilter,
					tagNameFilter,
					initLeafNodeTags,
				}),
			)
			.map((item: any) => {
				const tagId = String(item.tagId);
				const oldValue = item.oldTagValue?.trim() ?? "";
				const newValue = item.tagValue?.trim() ?? "";

				return {
					id: tagId,
					tagName: item.tagName,
					oldValue: oldValue || "",
					newValue: newValue || "",
					tempSave: item.tempSave === true,
				};
			});
	}, [
		currentArchiveDetailResponse?.tagChangeList,
		initLeafNodeTags,
		tagIds,
		tagNameFilter,
		statusFilter,
		visibleStatuses,
	]);

	return {
		currentArchiveDetailResponse,
		basicInfoData,
		shouldShowArchiveDetailSkeleton: !basicInfoData,
		maintainerFromDetail: currentArchiveDetailResponse?.maintainer,
		rawTreeData,
		visibleStatuses,
		filteredTreeData,
		treeDataForDisplay,
		initLeafNodeTags,
		initialChangeRecords,
	};
}
