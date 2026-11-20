import type { ApiResponse, PagedData } from "#src/utils/axios-request";
import type {
	AppraisalFolder,
	AppraisalFolderAddForm,
	AppraisalFolderAddUsersForm,
	AppraisalFolderQuery,
	AppraisalFolderUpdateForm,
	AppraisalId,
	AppraisalOrgNode,
	AppraisalPage,
	AppraisalPresentationForm,
	AppraisalRecord,
	AppraisalStatistics,
	AppraisalUser,
	AppraisalUserDetail,
	AppraisalUserFilter,
	AppraisalUserQuery,
	AppraisalUserSortForm,
} from "./types";

import { request } from "#src/utils/axios-request";
import { AppraisalStatus } from "./types";

/**
 * 绩效管理 · 年终述职
 *
 * 真实接口（docs/swagger/11-20.md，对接说明见 docs/swagger/yearly-performance-api.md）：
 * - GET    appraisal/org/tree                      组织树
 * - POST   appraisal/folder/list                   文件夹分页
 * - POST   appraisal/folder                        新增文件夹
 * - PUT    appraisal/folder                        修改文件夹
 * - DELETE appraisal/folder/{ids}                  删除文件夹（批量）
 * - POST   appraisal/folder/addUsers               批量移入文件夹
 * - POST   appraisal/user/list                     述职人员分页
 * - POST   appraisal/user/statistic                述职状态统计
 * - GET    appraisal/user/{id}                     述职人员详情（含 AI 听记记录）
 * - POST   appraisal/user/sort                     文件夹内排序
 * - POST   appraisal/user/presentation/start|redo|end  开始 / 重新开始 / 结束述职
 *
 * ID 归一：后端 int64 主键（userId / folderId / id）在映射层统一转为 string，
 * 回传时 Jackson 会把数字字符串反序列化为 Long，前端无需再转回 number。
 */

/** 后端分页最大条数（契约 maximum: 500） */
const MAX_PAGE_SIZE = 500;

/** 后端原始 ID：契约为 int64，若后端开启 Long→String 序列化则为字符串 */
type RawId = number | string;

/** 后端原始组织树节点 */
type RawOrgNode = Omit<AppraisalOrgNode, "id" | "parentId" | "children" | "accessible"> & {
	id: RawId;
	parentId?: RawId;
	accessible?: boolean;
	children?: RawOrgNode[];
};

/** 后端原始文件夹 */
type RawFolder = Omit<AppraisalFolder, "id"> & { id: RawId };

/** 后端原始述职人员 */
type RawUser = Omit<AppraisalUser, "userId" | "folderId"> & {
	userId: RawId;
	folderId?: RawId | null;
};

/** 后端原始 AI 听记记录 */
type RawRecord = Omit<AppraisalRecord, "id" | "status"> & {
	id: RawId;
	status?: string | number;
};

/** 后端原始述职人员详情 */
type RawUserDetail = Omit<AppraisalUserDetail, "userId" | "folderId" | "appraisalRecords"> & {
	userId: RawId;
	folderId?: RawId | null;
	appraisalRecords?: RawRecord[] | null;
};

/**
 * 可选 ID 归一为字符串
 *
 * @param value - 后端 ID
 * @returns 字符串 ID，空值返回 undefined
 */
function toOptionalId(value?: RawId | null): AppraisalId | undefined {
	return value === undefined || value === null || value === "" ? undefined : String(value);
}

/**
 * 组织树节点映射
 *
 * accessible 缺省按可访问处理：契约未声明必填，旧数据可能不返回。
 *
 * @param node - 后端节点
 * @returns 前端节点
 */
function mapOrgNode(node: RawOrgNode): AppraisalOrgNode {
	return {
		...node,
		id: String(node.id),
		parentId: toOptionalId(node.parentId),
		accessible: node.accessible !== false,
		children: node.children?.length ? node.children.map(mapOrgNode) : undefined,
	};
}

/**
 * 文件夹映射
 *
 * @param folder - 后端文件夹
 * @returns 前端文件夹
 */
function mapFolder(folder: RawFolder): AppraisalFolder {
	return { ...folder, id: String(folder.id) };
}

/**
 * 述职人员映射
 *
 * @param user - 后端述职人员
 * @returns 前端述职人员
 */
function mapUser(user: RawUser): AppraisalUser {
	return { ...user, userId: String(user.userId), folderId: toOptionalId(user.folderId) };
}

/**
 * AI 听记记录映射：status 统一为字符串，便于与 AppraisalRecordStatus 比较
 *
 * @param record - 后端记录
 * @returns 前端记录
 */
function mapRecord(record: RawRecord): AppraisalRecord {
	return {
		...record,
		id: String(record.id),
		status:
			record.status === undefined || record.status === null
				? undefined
				: String(record.status),
	};
}

/**
 * 分页结果映射
 *
 * @param page - 后端分页数据
 * @param mapItem - 行映射
 * @returns 前端分页结果
 */
function mapPage<R, T>(
	page: PagedData<R> | null | undefined,
	mapItem: (item: R) => T,
): AppraisalPage<T> {
	return { list: (page?.list ?? []).map(mapItem), total: Number(page?.total ?? 0) };
}

/** 统计结果中可能承载「状态」的字段名 */
const STATISTIC_STATUS_KEYS = ["appraisalStatus", "status", "code", "key"] as const;
/** 统计结果中可能承载「人数」的字段名 */
const STATISTIC_COUNT_KEYS = ["count", "num", "total", "value", "userCount"] as const;

/**
 * 读取对象上第一个可转为数字的字段
 *
 * @param row - 对象
 * @param keys - 候选字段
 * @returns 数字，未命中为 undefined
 */
function pickNumber(row: Record<string, unknown>, keys: readonly string[]): number | undefined {
	for (const key of keys) {
		const value = Number(row[key]);
		if (row[key] !== undefined && row[key] !== null && Number.isFinite(value)) {
			return value;
		}
	}
	return undefined;
}

/**
 * 统计结果归一为「状态 → 人数」
 *
 * 临时兼容：契约中 appraisal/user/statistic 的 data 为无结构 Object，兼容两种常见形态——
 * 1) 数组：[{ appraisalStatus: 0, count: 13 }, ...]；2) 对象：{ "0": 13, "1": 1, ... }。
 * 影响范围：概览卡片人数、组织架构「总人数」、文件夹「全部」人数。
 * 移除条件：后端在契约中补充统计 VO 后，按真实字段改为直接映射。
 *
 * @param data - 后端统计数据
 * @returns 各状态人数，缺失按 0
 */
export function normalizeAppraisalStatistics(data: unknown): AppraisalStatistics {
	const result: AppraisalStatistics = {
		[AppraisalStatus.PENDING]: 0,
		[AppraisalStatus.IN_PROGRESS]: 0,
		[AppraisalStatus.GENERATING]: 0,
		[AppraisalStatus.READY]: 0,
	};
	const assign = (status: number | undefined, count: number | undefined) => {
		if (status !== undefined && count !== undefined && status in result) {
			result[status as AppraisalStatus] += count;
		}
	};
	if (Array.isArray(data)) {
		for (const row of data) {
			if (row && typeof row === "object") {
				const record = row as Record<string, unknown>;
				assign(
					pickNumber(record, STATISTIC_STATUS_KEYS),
					pickNumber(record, STATISTIC_COUNT_KEYS),
				);
			}
		}
	} else if (data && typeof data === "object") {
		for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
			const count = Number(value);
			if (/^\d+$/.test(key) && Number.isFinite(count)) {
				assign(Number(key), count);
			}
		}
	}
	return result;
}

/* ------------------------------------------------------------------ */
/* 组织树                                                               */
/* ------------------------------------------------------------------ */

/**
 * 获取年终述职组织树（已按当前用户数据权限裁剪，accessible 标识可选节点）
 *
 * @returns 组织树
 */
export async function fetchAppraisalOrgTree(): Promise<AppraisalOrgNode[]> {
	const data = await request.get<RawOrgNode[] | null>("appraisal/org/tree");
	return (data ?? []).map(mapOrgNode);
}

/* ------------------------------------------------------------------ */
/* 文件夹                                                               */
/* ------------------------------------------------------------------ */

/**
 * 分页查询文件夹
 *
 * @param query - 查询条件
 * @returns 分页结果
 */
export async function fetchAppraisalFolderPage(
	query: AppraisalFolderQuery,
): Promise<AppraisalPage<AppraisalFolder>> {
	const data = await request.post<PagedData<RawFolder>>("appraisal/folder/list", query);
	return mapPage(data, mapFolder);
}

/**
 * 查询组织下的全部文件夹（单页最大 500，文件夹即述职会，单组织数量远小于该值）
 *
 * @param query - 组织、名称等条件
 * @returns 文件夹列表
 */
export async function fetchAppraisalFolders(
	query: Omit<AppraisalFolderQuery, "pageNum" | "pageSize">,
): Promise<AppraisalFolder[]> {
	const page = await fetchAppraisalFolderPage({ ...query, pageNum: 1, pageSize: MAX_PAGE_SIZE });
	return page.list;
}

/**
 * 新增文件夹
 *
 * 契约返回无结构 Object：若 data 为数字 / 数字字符串则视为新文件夹 ID，否则返回 undefined，
 * 由调用方按「组织 + 名称」回查定位。
 *
 * @param form - 文件夹信息
 * @returns 新文件夹 ID（后端未返回时为 undefined）
 */
export async function createAppraisalFolder(
	form: AppraisalFolderAddForm,
): Promise<AppraisalId | undefined> {
	const data = await request.post<unknown>("appraisal/folder", form);
	if (typeof data === "number" || (typeof data === "string" && /^\d+$/.test(data))) {
		return String(data);
	}
	if (data && typeof data === "object" && "id" in data) {
		return toOptionalId((data as { id?: RawId }).id);
	}
	return undefined;
}

/**
 * 修改文件夹（重命名时需回传原述职日期）
 *
 * @param form - 文件夹信息
 */
export async function updateAppraisalFolder(form: AppraisalFolderUpdateForm): Promise<void> {
	await request.put<unknown>("appraisal/folder", form);
}

/**
 * 删除文件夹（批量），路径参数以逗号拼接
 *
 * @param ids - 文件夹 ID
 */
export async function deleteAppraisalFolders(ids: AppraisalId[]): Promise<void> {
	await request.delete<unknown>(`appraisal/folder/${ids.join(",")}`);
}

/**
 * 批量将述职人员移入文件夹
 *
 * @param form - 目标文件夹与人员
 */
export async function addAppraisalFolderUsers(form: AppraisalFolderAddUsersForm): Promise<void> {
	await request.post<unknown>("appraisal/folder/addUsers", form);
}

/* ------------------------------------------------------------------ */
/* 述职人                                                               */
/* ------------------------------------------------------------------ */

/**
 * 分页查询述职人员
 *
 * @param query - 筛选与分页
 * @returns 分页结果
 */
export async function fetchAppraisalUserPage(
	query: AppraisalUserQuery,
): Promise<AppraisalPage<AppraisalUser>> {
	const data = await request.post<PagedData<RawUser>>("appraisal/user/list", query);
	return mapPage(data, mapUser);
}

/**
 * 查询文件夹内全部述职人员 ID（按后端默认顺序，同 sort 升序兜底）
 *
 * 排序接口需要整个文件夹的有序 ID 列表，而页面可能处于分页 / 筛选状态，因此单独拉全量。
 *
 * @param folderId - 文件夹 ID
 * @returns 有序 ID 列表
 */
export async function fetchAppraisalFolderUserIds(folderId: AppraisalId): Promise<AppraisalId[]> {
	const page = await fetchAppraisalUserPage({ folderId, pageNum: 1, pageSize: MAX_PAGE_SIZE });
	return page.list
		.map((user, index) => ({ user, index }))
		.sort((a, b) => (a.user.sort ?? a.index) - (b.user.sort ?? b.index) || a.index - b.index)
		.map(({ user }) => user.userId);
}

/**
 * 述职状态统计
 *
 * @param filter - 与列表一致的筛选条件（不含分页）
 * @returns 各状态人数
 */
export async function fetchAppraisalUserStatistics(
	filter: AppraisalUserFilter,
): Promise<AppraisalStatistics> {
	const data = await request.post<unknown>("appraisal/user/statistic", filter);
	return normalizeAppraisalStatistics(data);
}

/**
 * 获取述职人员详情（含备课材料 / 评分报告 Url 与 AI 听记记录）
 *
 * @param userId - 述职人员 ID
 * @returns 详情
 */
export async function fetchAppraisalUserDetail(userId: AppraisalId): Promise<AppraisalUserDetail> {
	const data = await request.get<RawUserDetail>(`appraisal/user/${userId}`);
	return {
		...data,
		userId: String(data.userId),
		folderId: toOptionalId(data.folderId),
		appraisalRecords: (data.appraisalRecords ?? []).map(mapRecord),
	};
}

/**
 * 文件夹内述职人员排序
 *
 * @param form - 文件夹与排好序的完整 ID 列表
 */
export async function sortAppraisalUsers(form: AppraisalUserSortForm): Promise<void> {
	await request.post<unknown>("appraisal/user/sort", form);
}

/**
 * 开始述职（待述职 → 述职中）
 *
 * 防重复录制（他人已开启 / 本人正在录制他人）由后端以业务错误返回，
 * 这里关闭全局 toast，交给页面以确认弹窗展示后端文案。
 *
 * @param form - 文件夹与述职人员
 */
export async function startAppraisalPresentation(form: AppraisalPresentationForm): Promise<void> {
	await request.post<unknown>("appraisal/user/presentation/start", form, { errorMessage: false });
}

/**
 * 重新开始述职（丢弃已录制内容，重新开启 AI 听记）
 *
 * @param form - 文件夹与述职人员
 */
export async function redoAppraisalPresentation(form: AppraisalPresentationForm): Promise<void> {
	await request.post<unknown>("appraisal/user/presentation/redo", form, { errorMessage: false });
}

/**
 * 结束述职（述职中 → 报告生成中），对应卡片「结束录音」与详情「提交」
 *
 * @param form - 文件夹与述职人员
 */
export async function endAppraisalPresentation(form: AppraisalPresentationForm): Promise<void> {
	await request.post<unknown>("appraisal/user/presentation/end", form);
}

/* ------------------------------------------------------------------ */
/* 述职文档（备课材料 / 评分报告 PDF）                                    */
/* ------------------------------------------------------------------ */

/** 接口前缀（与 axios 实例 baseURL 一致） */
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

/**
 * 是否为可直接访问的绝对地址（http(s) / 协议相对 / blob / data）
 *
 * @param url - 地址
 * @returns 是否绝对地址
 */
function isAbsoluteUrl(url: string) {
	return /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(url);
}

/**
 * 相对路径 → 接口相对路径（去掉开头斜杠与接口前缀，交给 axios baseURL 拼接）
 *
 * @param url - 后端返回的相对路径，如 /shanshu-efficiency-api/file/xx.pdf 或 file/xx.pdf
 * @returns 接口相对路径，如 file/xx.pdf
 */
function toApiPath(url: string) {
	const path = url.startsWith(`${API_BASE_URL}/`) ? url.slice(API_BASE_URL.length) : url;
	return path.replace(/^\/+/, "");
}

/**
 * 解析述职文档地址
 *
 * 契约只说明是「Url」，未约定是 OSS 绝对地址还是后端相对路径：
 * 绝对地址原样使用；相对路径按接口前缀拼接（与档案附件预览规则一致）。
 *
 * @param url - materialUrl / evaluationReportUrl
 * @returns 可访问地址
 */
export function resolveAppraisalDocumentUrl(url: string): string {
	if (isAbsoluteUrl(url)) {
		return url;
	}
	return `${window.location.origin}${API_BASE_URL}/${toApiPath(url)}`;
}

/**
 * 拉取述职文档为 Blob（预览与下载共用）
 *
 * - 相对路径走 axios 实例，自动携带鉴权头；
 * - 绝对地址（OSS 等）直接 fetch，若目标未开启 CORS 会抛错，由调用方回退为直接打开地址。
 *
 * @param url - materialUrl / evaluationReportUrl
 * @param signal - 取消信号
 * @returns 文档 Blob
 */
export async function fetchAppraisalDocumentBlob(url: string, signal?: AbortSignal): Promise<Blob> {
	let blob: Blob;
	if (isAbsoluteUrl(url)) {
		const response = await fetch(url, { signal });
		if (!response.ok) {
			throw new Error(`文档获取失败（${response.status}）`);
		}
		blob = await response.blob();
	} else {
		blob = await request.get<Blob>(toApiPath(url), {
			responseType: "blob",
			signal,
			errorMessage: false,
		});
	}
	// blob 响应不经过业务码校验：后端出错时会以 JSON 返回 { code, msg }，这里还原为错误
	if (blob.type.includes("json")) {
		const payload = JSON.parse(await blob.text()) as Partial<ApiResponse<unknown>>;
		throw new Error(payload.msg || "文档获取失败");
	}
	// 部分存储服务返回 application/octet-stream，浏览器内置预览只认 application/pdf
	return blob.type === "application/pdf" ? blob : new Blob([blob], { type: "application/pdf" });
}
