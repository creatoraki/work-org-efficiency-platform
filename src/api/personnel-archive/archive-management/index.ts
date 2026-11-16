/**
 * 档案管理相关API接口
 */

import type { UserTagTreeItem } from "#src/api/tag-management/tag-matching/model";
import type { StrictOptionType } from "#src/api/types/antd";
import type {
	ArchiveManagementItem,
	ArchiveManagementListParams,
} from "#src/pages/personnel-archive/archive-management/types";

import type { PagedData } from "#src/utils/axios-request";
import type {
	AlertCountResponse,
	DetailResponse,
	FileExportDetail,
	SaveTempParams,
	SaveTempResponseItem,
	SubmitArchiveParams,
	TagImportResult,
} from "./types";
import { request } from "#src/utils/axios-request";

// 导出类型，方便外部使用
export type {
	AlertCountResponse,
	ApprovalListItem,
	ChangeListItem,
	ChangeListParams,
	DetailResponse,
	FileExportDetail,
	SaveTempParams,
	SaveTempResponseItem,
	SubmitArchiveParams,
	TagImportErrorItem,
	TagImportResult,
	TreeTagItem,
	TreeTagNode,
} from "./types";

/**
 * 人员档案列表查询接口
 *
 * @param params - 查询参数
 * @param params.pageNum - 页码(不能为空)
 * @param params.pageSize - 每页数量(不能为空)
 * @param params.searchCount - 是否查询总条数
 * @param params.name - 员工名称
 * @param params.orgId - 所属组织
 * @param params.postId - 岗位id
 * @param params.staffJobId - 职位id
 * @param params.tagId - 标签id
 * @param params.perfectDegree - 标签完善度
 * @param params.status - 审核状态
 * @param params.maintainer - 维护人
 * @returns 档案管理列表数据及分页信息
 */
export async function fetchArchiveManagementList(
	params: ArchiveManagementListParams = {},
): Promise<PagedData<ArchiveManagementItem>> {
	const { pageNum = 1, pageSize = 20, ...restParams } = params;

	return request.post<PagedData<ArchiveManagementItem>>(
		"usertag/tag/list",
		{
			pageNum,
			pageSize,
			...restParams,
		},
		{
			showLoading: false,
		},
	);
}

/**
 * 维护人选项查询参数
 */
export interface MaintainerOptionQueryParams {
	/** 搜索关键词 */
	keyword?: string;
	/** 部门ID */
	deptId?: string | number;
	/** 页码 */
	pageNum?: number;
	/** 每页数量 */
	pageSize?: number;
}

/**
 * 获取维护人自动完成选项（调用 /sys/user/page）
 *
 * @param params - 查询参数
 * @param params.keyword - 搜索关键词
 * @param params.pageNum - 页码
 * @param params.pageSize - 每页数量
 * @returns 维护人选项列表
 */
export async function fetchMaintainerOptions(
	params: MaintainerOptionQueryParams = {},
): Promise<PagedData<StrictOptionType>> {
	const { keyword, deptId, pageNum = 1, pageSize = 10 } = params;

	const result = await request.get<
		PagedData<{
			id?: string | number;
			name?: string;
			account?: string;
		}>
	>("sys/user/page", {
		params: {
			status: "1",
			jobStatus: "1",
			pageNum,
			pageSize,
			...(deptId ? { deptId: String(deptId) } : {}),
			...(keyword ? { name: keyword } : {}),
		},
		showLoading: false,
	});

	return {
		...result,
		list: result.list.map((item) => ({
			label: item.name ?? item.account ?? "",
			value: item.id !== undefined ? String(item.id) : (item.account ?? item.name ?? ""),
		})),
	};
}

/**
 * 人员档案人才标签预警统计接口
 *
 * @returns 预警统计数据
 */
export async function fetchArchiveManagementStats(): Promise<AlertCountResponse> {
	return request.get<AlertCountResponse>("usertag/tag/alert/count", {
		showLoading: false,
	});
}

/**
 * 档案管理搜索选项响应数据
 */
export interface ArchiveManagementSearchOptionsResponse {
	/** 维护人选项列表 */
	maintainerOptions: Array<{
		/** 用户ID */
		userId: number;
		/** 用户姓名 */
		userName: string;
	}>;
	/** 标签ID选项列表 */
	tagIdOptions: Array<{
		/** 标签ID */
		tagId: number;
		/** 标签名称 */
		tagName: string;
	}>;
}

/**
 * 获取档案管理搜索选项（维护人、标签ID等）
 * 一次请求返回所有下拉选项
 *
 * @returns 搜索选项数据
 */
export async function getArchiveManagementSearchOptions(): Promise<ArchiveManagementSearchOptionsResponse> {
	return request.get<ArchiveManagementSearchOptionsResponse>("usertag/tag/search-options", {
		showLoading: false,
	});
}

/**
 * 人员档案人才标签详情接口
 *
 * @param userId - 用户id
 * @param [maintainer] - 标签维护人，管理员时为必选；非管理员时默认为当前登陆用户，参数失效
 * @param [forUpdate] - 是否用于更新，默认为 true
 * @returns 详情数据（按照接口文档 DetailRes）
 * @example
 * ```ts
 * const detail = await fetchArchiveDetail("6008", "6217", true);
 * ```
 */
export async function fetchArchiveDetail(
	userId: string,
	maintainer?: string,
	forUpdate: boolean = true,
): Promise<DetailResponse> {
	const params: Record<string, string | boolean> = {};
	if (maintainer !== undefined) {
		params.maintainer = String(maintainer);
	}
	params.forUpdate = forUpdate;

	return request.get<DetailResponse>(`usertag/tag/detail/${userId}`, {
		params,
	});
}

/**
 * 人员档案人才标签暂存接口
 *
 * @param params - 暂存参数数组
 * @param [maintainer] - 维护人，从详情接口获取。管理员时为必选；非管理员时为当前登陆用户id，参数无效
 * @returns 暂存结果
 * @example
 * ```ts
 * await saveArchiveDraft([
 *   {
 *     userId: "6008",
 *     tagId: "123",
 *     tempTagValue: "临时值"
 *   }
 * ], "6217");
 * ```
 */
export async function saveArchiveDraft(
	params: SaveTempParams[],
	maintainer?: string | number,
): Promise<SaveTempResponseItem[]> {
	const url =
		maintainer !== undefined
			? `usertag/tag/temp/save?maintainer=${maintainer}`
			: "usertag/tag/temp/save";
	return request.post<SaveTempResponseItem[]>(url, params);
}

/**
 * 人员档案人才标签提交接口
 *
 * @param params - 提交参数数组
 * @param [maintainer] - 维护人，从详情接口获取。管理员时为必选；非管理员时为当前登陆用户id，参数无效
 * @returns 提交结果
 * @example
 * ```ts
 * await submitArchiveForAudit([
 *   {
 *     userId: "6008",
 *     tagId: "123",
 *     tagValue: "新值",
 *     oldTagValue: "旧值"
 *   }
 * ], "6217");
 * ```
 */
export async function submitArchiveForAudit(
	params: SubmitArchiveParams[],
	maintainer?: string | number,
): Promise<string> {
	const url =
		maintainer !== undefined
			? `usertag/tag/submit?maintainer=${maintainer}`
			: "usertag/tag/submit";
	return request.post<string>(url, params);
}

/**
 * 导出导入模板参数（按照接口文档）
 */
export interface ExportTemplateParams {
	/* 用户id列表，为空表示数据范围下的用户 */
	userIds?: string[];
	/* 标签id列表，为空表示导出全部标签 */
	tagIds?: string[];
}

/**
 * 人员档案人才标签导入模版导出接口（异步任务，进度在导出中心查看）
 *
 * @param params - 导出参数
 * @param params.userIds - 用户id列表，为空表示数据范围下的用户
 * @param params.tagIds - 标签id列表，为空表示导出全部标签
 * @returns 导出任务 ID（data）
 */
export async function exportImportTemplate(params?: ExportTemplateParams): Promise<number> {
	const { userIds = [], tagIds = [] } = params || {};
	const requestParams: {
		userIds: string[];
		tagIds: string[];
	} = {
		userIds,
		tagIds,
	};

	return request.post<number>("usertag/tag/export", requestParams);
}

/**
 * 人员档案人才标签导入接口
 *
 * @param file - 导入文件
 * @returns 导入结果（包含错误列表与统计信息）
 */
export async function importData(file: File): Promise<TagImportResult> {
	const formData = new FormData();
	formData.append("file", file);

	return request.post<TagImportResult>("usertag/tag/importData", formData, {
		headers: {
			"Content-Type": "multipart/form-data",
		},
	});
}

/**
 * 获取用户维护标签树（用于导入档案时的标签选择）
 *
 * @returns 标签树数据
 */
export async function fetchUserMaintainTagTree(): Promise<UserTagTreeItem[]> {
	return request.get<UserTagTreeItem[]>("usertag/tag/user/maintain/tag/tree");
}

/**
 * 获取文件导出详情信息
 *
 * @param id - 文件ID
 * @returns 文件导出详情数据
 */
export async function getFileExportDetail(id: number): Promise<FileExportDetail> {
	return request.get<FileExportDetail>(`file/info/${id}`);
}
