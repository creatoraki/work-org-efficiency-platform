import type {
	CreateYearlyReportFolderPayload,
	MoveYearlyReportPayload,
	RenameYearlyReportFolderPayload,
	SortYearlyReportPayload,
	YearlyReportCascaderOption,
	YearlyReportDetail,
	YearlyReportDocumentType,
	YearlyReportFolder,
	YearlyReportFolderQuery,
	YearlyReportFolderTree,
	YearlyReportItem,
	YearlyReportListQuery,
	YearlyReportListResult,
	YearlyReportOrgTree,
	YearlyReportStatistics,
	YearlyReportStatisticsQuery,
} from "./types";

import {
	buildMockDetail,
	buildMockOrgTree,
	mockFolders,
	mockReports,
	nextMockFolderId,
	resolveLeafOrgIds,
} from "./mock";
import {
	YEARLY_REPORT_FOLDER_ALL,
	YEARLY_REPORT_FOLDER_UNFILED,
	YearlyReportStatus,
} from "./types";

/**
 * 年终述职接口
 *
 * 后端接口尚未提供，以下函数统一返回 mock.ts 中的内存数据，并模拟网络延迟。
 * 接口就绪后：按各函数上的 TODO 改为 request.get / request.post 真实请求即可，调用方无需改动。
 */

/**
 * 模拟网络延迟
 *
 * @param ms - 延迟毫秒数
 * @returns Promise
 */
function delay(ms = 200) {
	return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

/**
 * 深拷贝模拟数据，避免调用方修改内存表
 *
 * @param value - 原始数据
 * @returns 拷贝后的数据
 */
function clone<T>(value: T): T {
	return structuredClone(value);
}

/**
 * 管理者类别是否匹配级联筛选
 *
 * 模拟规则：第一级匹配类别前缀（地区公司 / 业务集团 / 服务集团）；
 * 第二级「三级以下管理者」匹配类别中含「三级以下」的人员，其余归为「三级及以上管理者」。
 *
 * @param category - 人员管理者类别全路径
 * @param filter - 级联筛选路径
 * @returns 是否匹配
 */
function matchManagerCategory(category: string, filter?: string[]) {
	if (!filter?.length) {
		return true;
	}
	const [group, level] = filter;
	if (group && !category.startsWith(group)) {
		return false;
	}
	if (!level) {
		return true;
	}
	const isJunior = category.includes("三级以下");
	return level === "三级以下管理者" ? isJunior : !isJunior;
}

/**
 * 按筛选条件过滤述职人员（不含分页）
 *
 * @param query - 筛选条件；不传 status 时不过滤状态（概览统计使用）
 * @returns 过滤后的人员
 */
function filterReports(query: YearlyReportStatisticsQuery & { status?: YearlyReportStatus }) {
	const leafOrgIds = resolveLeafOrgIds(query.orgId);
	const keyword = query.employeeName?.trim();
	return mockReports.filter((item) => {
		if (!leafOrgIds.has(item.orgId)) {
			return false;
		}
		if (query.folderId === YEARLY_REPORT_FOLDER_UNFILED && item.folderId) {
			return false;
		}
		if (
			query.folderId &&
			query.folderId !== YEARLY_REPORT_FOLDER_ALL &&
			query.folderId !== YEARLY_REPORT_FOLDER_UNFILED &&
			item.folderId !== query.folderId
		) {
			return false;
		}
		if (keyword && !item.userName.toLowerCase().includes(keyword.toLowerCase())) {
			return false;
		}
		if (!matchManagerCategory(item.managerCategory, query.managerCategory)) {
			return false;
		}
		if (query.status && item.status !== query.status) {
			return false;
		}
		if (query.reportTimeStart && item.reportStartTime < query.reportTimeStart) {
			return false;
		}
		if (query.reportTimeEnd && item.reportStartTime > query.reportTimeEnd) {
			return false;
		}
		return true;
	});
}

/**
 * 按文件夹内顺序重排述职顺序号
 *
 * 文件夹即一场述职会，卡片序号即出场顺序，移动或拖拽后需要连续编号。
 *
 * @param folderId - 文件夹 ID
 */
function reindexFolder(folderId: string) {
	mockReports
		.filter((item) => item.folderId === folderId)
		.forEach((item, index) => {
			item.sortNo = index + 1;
		});
}

/**
 * 统计文件夹人数
 *
 * @param folderId - 文件夹 ID
 * @returns 人数
 */
function countFolder(folderId: string) {
	return mockReports.filter((item) => item.folderId === folderId).length;
}

/**
 * 查找述职人员，不存在时抛错
 *
 * @param reportId - 述职记录 ID
 * @returns 述职人员（内存表引用）
 */
function findReport(reportId: string): YearlyReportItem {
	const target = mockReports.find((item) => item.reportId === reportId);
	if (!target) {
		throw new Error("述职记录不存在");
	}
	return target;
}

/**
 * 获取组织架构树
 *
 * @returns 组织树与总人数
 */
export async function fetchYearlyReportOrgTree(): Promise<YearlyReportOrgTree> {
	// TODO(接口就绪): 改为 request.get("performance/yearly-report/org-tree").json()
	await delay(150);
	return { totalCount: mockReports.length, nodes: buildMockOrgTree() };
}

/**
 * 获取文件夹面板数据
 *
 * @param query - 当前组织与文件夹关键字
 * @returns 文件夹树数据
 */
export async function fetchYearlyReportFolderTree(
	query: YearlyReportFolderQuery,
): Promise<YearlyReportFolderTree> {
	// TODO(接口就绪): 改为 request.get("performance/yearly-report/folders", { searchParams }).json()
	await delay(150);
	const leafOrgIds = resolveLeafOrgIds(query.orgId);
	const keyword = query.keyword?.trim();
	const scoped = mockReports.filter((item) => leafOrgIds.has(item.orgId));
	const folders: YearlyReportFolder[] = mockFolders
		.filter((folder) => leafOrgIds.has(folder.orgId))
		.filter((folder) => !keyword || folder.folderName.includes(keyword))
		.map((folder) => ({ ...folder, headCount: countFolder(folder.folderId) }));
	return {
		totalCount: scoped.length,
		unfiledCount: scoped.filter((item) => !item.folderId).length,
		folders,
	};
}

/**
 * 新增文件夹
 *
 * @param payload - 所属组织、述职日期、文件夹名称
 * @returns 新文件夹
 */
export async function createYearlyReportFolder(
	payload: CreateYearlyReportFolderPayload,
): Promise<YearlyReportFolder> {
	// TODO(接口就绪): 改为 request.post("performance/yearly-report/folder", { json: payload }).json()
	await delay();
	const folderName = payload.folderName.trim();
	if (
		mockFolders.some((item) => item.orgId === payload.orgId && item.folderName === folderName)
	) {
		throw new Error("该组织下已存在同名文件夹");
	}
	const folder: YearlyReportFolder = {
		folderId: nextMockFolderId(),
		folderName,
		orgId: payload.orgId,
		reportDate: payload.reportDate,
		headCount: 0,
	};
	mockFolders.push(folder);
	return clone(folder);
}

/**
 * 重命名文件夹
 *
 * @param payload - 文件夹 ID 与新名称
 */
export async function renameYearlyReportFolder(
	payload: RenameYearlyReportFolderPayload,
): Promise<void> {
	// TODO(接口就绪): 改为 request.put("performance/yearly-report/folder", { json: payload }).json()
	await delay();
	const folder = mockFolders.find((item) => item.folderId === payload.folderId);
	if (!folder) {
		throw new Error("文件夹不存在");
	}
	folder.folderName = payload.folderName.trim();
}

/**
 * 删除文件夹，文件夹内人员回到「未归入文件夹」
 *
 * @param folderId - 文件夹 ID
 */
export async function deleteYearlyReportFolder(folderId: string): Promise<void> {
	// TODO(接口就绪): 改为 request.delete(`performance/yearly-report/folder/${folderId}`).json()
	await delay();
	const index = mockFolders.findIndex((item) => item.folderId === folderId);
	if (index < 0) {
		throw new Error("文件夹不存在");
	}
	mockFolders.splice(index, 1);
	mockReports.forEach((item) => {
		if (item.folderId === folderId) {
			item.folderId = undefined;
		}
	});
}

/**
 * 获取概览统计
 *
 * @param query - 筛选条件（不含状态）
 * @returns 各状态人数
 */
export async function fetchYearlyReportStatistics(
	query: YearlyReportStatisticsQuery,
): Promise<YearlyReportStatistics> {
	// TODO(接口就绪): 改为 request.post("performance/yearly-report/statistics", { json: query }).json()
	await delay(150);
	const rows = filterReports(query);
	const countBy = (status: YearlyReportStatus) =>
		rows.filter((item) => item.status === status).length;
	return {
		pendingCount: countBy(YearlyReportStatus.PENDING),
		inProgressCount: countBy(YearlyReportStatus.IN_PROGRESS),
		generatingCount: countBy(YearlyReportStatus.GENERATING),
		readyCount: countBy(YearlyReportStatus.READY),
	};
}

/**
 * 分页查询述职人员
 *
 * @param query - 筛选与分页参数
 * @returns 分页结果
 */
export async function fetchYearlyReportList(
	query: YearlyReportListQuery,
): Promise<YearlyReportListResult> {
	// TODO(接口就绪): 改为 request.post("performance/yearly-report/page", { json: query }).json()
	await delay();
	const rows = filterReports(query);
	const start = (query.pageNum - 1) * query.pageSize;
	return {
		list: clone(rows.slice(start, start + query.pageSize)),
		total: rows.length,
	};
}

/**
 * 批量移动述职人员至文件夹
 *
 * @param payload - 述职记录 ID 与目标文件夹
 */
export async function moveYearlyReports(payload: MoveYearlyReportPayload): Promise<void> {
	// TODO(接口就绪): 改为 request.post("performance/yearly-report/move", { json: payload }).json()
	await delay();
	const folder = mockFolders.find((item) => item.folderId === payload.folderId);
	if (!folder) {
		throw new Error("目标文件夹不存在");
	}
	const sourceFolders = new Set<string>();
	payload.reportIds.forEach((reportId) => {
		const target = findReport(reportId);
		if (target.folderId) {
			sourceFolders.add(target.folderId);
		}
		target.folderId = folder.folderId;
	});
	sourceFolders.forEach(reindexFolder);
	reindexFolder(folder.folderId);
}

/**
 * 人员卡片拖拽排序
 *
 * 只调整传入记录之间的相对顺序：按 reportIds 顺序依次回填到这些记录原本占据的位置。
 *
 * @param payload - 排序后的述职记录 ID
 */
export async function sortYearlyReports(payload: SortYearlyReportPayload): Promise<void> {
	// TODO(接口就绪): 改为 request.post("performance/yearly-report/sort", { json: payload }).json()
	await delay(120);
	const idSet = new Set(payload.reportIds);
	const slots = mockReports
		.map((item, index) => (idSet.has(item.reportId) ? index : -1))
		.filter((index) => index >= 0);
	const sorted = payload.reportIds.map(findReport);
	slots.forEach((slot, index) => {
		mockReports[slot] = sorted[index];
	});
	if (
		payload.folderId &&
		payload.folderId !== YEARLY_REPORT_FOLDER_ALL &&
		payload.folderId !== YEARLY_REPORT_FOLDER_UNFILED
	) {
		reindexFolder(payload.folderId);
	}
}

/**
 * 获取述职详情
 *
 * @param reportId - 述职记录 ID
 * @returns 述职详情
 */
export async function fetchYearlyReportDetail(reportId: string): Promise<YearlyReportDetail> {
	// TODO(接口就绪): 改为 request.get(`performance/yearly-report/${reportId}`).json()
	await delay(200);
	return clone(buildMockDetail(findReport(reportId)));
}

/**
 * 开始述职（待述职 → 述职中）
 *
 * @param reportId - 述职记录 ID
 */
export async function startYearlyReport(reportId: string): Promise<void> {
	// TODO(接口就绪): 改为 request.post(`performance/yearly-report/${reportId}/start`).json()
	await delay();
	const target = findReport(reportId);
	if (target.status !== YearlyReportStatus.PENDING) {
		throw new Error("当前状态不可开始述职");
	}
	target.status = YearlyReportStatus.IN_PROGRESS;
}

/**
 * 结束录音（述职中 → 报告生成中）
 *
 * @param reportId - 述职记录 ID
 */
export async function finishYearlyReportRecording(reportId: string): Promise<void> {
	// TODO(接口就绪): 改为 request.post(`performance/yearly-report/${reportId}/finish`).json()
	await delay();
	const target = findReport(reportId);
	if (target.status !== YearlyReportStatus.IN_PROGRESS) {
		throw new Error("当前状态不可结束录音");
	}
	target.status = YearlyReportStatus.GENERATING;
}

/**
 * 获取管理者类别级联选项
 *
 * @returns 级联选项
 */
export async function fetchManagerCategoryOptions(): Promise<YearlyReportCascaderOption[]> {
	// TODO(接口就绪): 改为字典接口 request.get("system/dict/yearly_report_manager_category").json()
	await delay(100);
	const levels = ["三级及以上管理者", "三级以下管理者"].map((label) => ({ value: label, label }));
	return ["地区公司", "业务集团", "服务集团"].map((label) => ({
		value: label,
		label,
		children: clone(levels),
	}));
}

/**
 * 获取「所属组织」级联选项
 *
 * 产品规则：文件夹只能建在集团 / 地区公司 / 业务集团下的二级组织上，
 * 因此只取组织树第二、三层（一级分组 → 可建文件夹组织）。
 *
 * @returns 级联选项
 */
export async function fetchFolderOrgOptions(): Promise<YearlyReportCascaderOption[]> {
	// TODO(接口就绪): 与组织树接口共用，按 folderEnabled 过滤
	await delay(100);
	const [root] = buildMockOrgTree();
	return (root?.children ?? []).map((group) => ({
		value: group.orgId,
		label: group.orgName,
		children: (group.children ?? [])
			.filter((child) => child.folderEnabled)
			.map((child) => ({ value: child.orgId, label: child.orgName })),
	}));
}

/**
 * 下载述职文档（备课材料 / 录音转写 / 评分报告）
 *
 * @param reportId - 述职记录 ID
 * @param documentType - 文档类型
 * @returns 文件名
 */
export async function downloadYearlyReportDocument(
	reportId: string,
	documentType: YearlyReportDocumentType,
): Promise<string> {
	// TODO(接口就绪): 改为 request.get(`performance/yearly-report/${reportId}/download`, { searchParams: { documentType } }).blob() 并触发浏览器下载
	await delay(300);
	const target = findReport(reportId);
	const documentName = {
		prep: "述职备课材料",
		transcript: "述职录音转写",
		report: "述职综合评分报告",
	}[documentType];
	return `${target.userName}-${documentName}.pdf`;
}
