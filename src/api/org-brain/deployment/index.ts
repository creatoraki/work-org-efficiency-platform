/**
 * 组织大脑 - 排兵布阵 API 接口
 */

import type { PagedData } from "#src/utils/axios-request";
import type { DeployCandidateItem } from "../candidate";
import type {
	BenchmarkProjectInfo,
	DeploymentAiStaffRequestItem,
	DeploymentDetail,
	DeploymentItem,
	DeploymentListParams,
	DeploymentPlanPreviewDetail,
	DeploymentPlanPreviewDetailResponse,
	DeploymentPlanStaffConfigItem,
	DeploymentPlanStaffConfigResponse,
	DeploymentSearchOptions,
	DeploymentSolutionStaffPayloadItem,
	DeploymentStaffTreeNode,
	DeploymentStaffTreeNodeResponse,
	DeployPositionMatrixRow,
	DeploySaveForm,
	PositionMatrixDetailResponse,
	PositionMatrixMetaItem,
	PositionMatrixRowResponse,
	ProjectBasicInfo,
	ProjectStatistics,
} from "./types";
import { request } from "#src/utils/axios-request";

const DEPLOYMENT_AI_REQUEST_TIMEOUT_MS = 15 * 60 * 1000;

function mapProjectBasicInfo(source?: PositionMatrixDetailResponse | null): ProjectBasicInfo {
	return {
		projectGroupName: source?.projectGroupName,
		province: source?.province,
		city: source?.city,
		area: source?.area,
		planDeliveryDate: source?.planDeliveryDate,
		deliveryDate: source?.deliveryDate ?? "",
		houseNumLiveRate: source?.houseNumLiveRate,
		deliveryArea: source?.deliveryArea,
		projectTypeName: source?.projectTypeName,
		propertyTypeName: source?.propertyTypeName,
		projectGradeName: source?.projectGradeName,
		propertyFeeUnitPrice: source?.propertyFeeUnitPrice,
		deliveryStandardName: source?.deliveryStandardName,
		projectCycleName: source?.projectCycleName,
		operationPlan: source?.operationPlan,
		specialProvisions: source?.specialProvisions,
		totalHouseholds: source?.totalHouseholds,
		deliveryHouseholds: source?.deliveryHouseholds,
		gateCount: source?.gateCount,
		greenArea: source?.greenArea,
		cleaningArea: source?.cleaningArea,
		matchScore: source?.matchScore,
	};
}

function mapProjectStatistics(
	source?: PositionMatrixDetailResponse | null,
): ProjectStatistics | undefined {
	if (!source) {
		return undefined;
	}
	return {
		gateCount: source.gateCount,
		greenArea: source.greenArea,
		cleaningArea: source.cleaningArea,
		elevatorCount: source.elevatorCount,
		laborCostRatio: source.hrCostPercent,
		profitRate: source.profitRate,
		collectionRate: source.collectionRate,
	};
}

function mapBenchmarkProject(
	source?: PositionMatrixDetailResponse["benchmarkProject"] | null,
): BenchmarkProjectInfo | undefined {
	if (!source?.projectName?.trim()) {
		return undefined;
	}
	return {
		benchmarkProjectId: String(source.id ?? ""),
		benchmarkProjectName: source.projectName ?? "",
		...mapProjectBasicInfo(source),
	};
}

/**
 * 岗位矩阵需求人数：仅保留后端返回的有效人数，其余场景保持为空。
 */
export function normalizeRequiredCount(value?: number | null): number | undefined {
	if (value != null && value >= 1) {
		return value;
	}
	return undefined;
}

function normalizeSelectFieldValue(value?: string | null): string | undefined {
	const normalizedValue = value?.trim();
	return normalizedValue || undefined;
}

/** 矩阵 API 行 → 前端矩阵行（保留后端字段名，仅补 rowKey） */
function mapPositionMatrixRow(
	row: PositionMatrixRowResponse,
	index: number,
): DeployPositionMatrixRow {
	const departmentLine = normalizeSelectFieldValue(row.departmentLine);
	const authorizedJobId = normalizeSelectFieldValue(row.authorizedJobId);
	const authorizedJobName = normalizeSelectFieldValue(row.authorizedJobName);
	const jobCode = normalizeSelectFieldValue(row.jobCode);
	const jobName = normalizeSelectFieldValue(row.jobName);
	const positionCode = normalizeSelectFieldValue(row.positionCode);
	const positionName = normalizeSelectFieldValue(row.positionName);
	const positionLevel = normalizeSelectFieldValue(row.positionLevel);
	return {
		rowKey: `${departmentLine ?? jobName ?? "row"}_${jobCode ?? jobName ?? index}_${positionCode ?? positionName ?? index}_${positionLevel ?? index}_${index}`,
		departmentLine,
		authorizedJobId,
		authorizedJobName,
		jobCode,
		jobName,
		positionCode,
		positionName,
		positionLevel,
		budgetCount: row.budgetCount,
		requiredCount: normalizeRequiredCount(row.requiredCount),
		tagMatchModelId: row.tagMatchModelId == null ? undefined : row.tagMatchModelId,
		tagMatchModelName: normalizeSelectFieldValue(row.tagMatchModelName),
	};
}

/**
 * 后端矩阵数据进入前端时，先按“条线 -> 编制岗位”稳定分组排序。
 *
 * 这样页面层拿到的数据天然满足表格合并对“物理相邻行”的要求，
 * 避免各视图组件各自兜底排序，保证整个排兵布阵链路口径一致。
 *
 * @param rows - 已映射为前端结构的矩阵行
 * @returns 排序后的矩阵行
 * @author 王善能
 * @since 2026-07-07
 */
function sortPositionMatrixRows(rows: DeployPositionMatrixRow[]): DeployPositionMatrixRow[] {
	const departmentOrder: string[] = [];
	const departmentBuckets = new Map<string, DeployPositionMatrixRow[]>();

	rows.forEach((row) => {
		const departmentKey = row.departmentLine ?? "";
		let departmentBucket = departmentBuckets.get(departmentKey);
		if (!departmentBucket) {
			departmentBucket = [];
			departmentBuckets.set(departmentKey, departmentBucket);
			departmentOrder.push(departmentKey);
		}
		departmentBucket.push(row);
	});

	return departmentOrder.flatMap((departmentKey) => {
		const departmentRows = departmentBuckets.get(departmentKey) ?? [];
		const authorizedOrder: string[] = [];
		const authorizedBuckets = new Map<string, DeployPositionMatrixRow[]>();

		departmentRows.forEach((row) => {
			const authorizedKey = row.authorizedJobName ?? "";
			let authorizedBucket = authorizedBuckets.get(authorizedKey);
			if (!authorizedBucket) {
				authorizedBucket = [];
				authorizedBuckets.set(authorizedKey, authorizedBucket);
				authorizedOrder.push(authorizedKey);
			}
			authorizedBucket.push(row);
		});

		return authorizedOrder.flatMap(
			(authorizedKey) => authorizedBuckets.get(authorizedKey) ?? [],
		);
	});
}

function mapPositionMatrixDetail(detail: PositionMatrixDetailResponse): DeploymentDetail {
	return {
		...detail,
		id: String(detail.id ?? ""),
		projectInfo: mapProjectBasicInfo(detail),
		projectStatistics: mapProjectStatistics(detail),
		benchmarkInfo: mapBenchmarkProject(detail.benchmarkProject),
		benchmarkStatistics: mapProjectStatistics(detail.benchmarkProject),
		benchmarkQualityScore: detail.benchmarkQualityScore,
		benchmarkPositionMatrixList: sortPositionMatrixRows(
			(detail.benchmarkPositionMatrixList ?? []).map(mapPositionMatrixRow),
		),
		projectPositionMatrixList: sortPositionMatrixRows(
			(detail.projectPositionMatrixList ?? []).map(mapPositionMatrixRow),
		),
		originProjectPositionMatrixList: sortPositionMatrixRows(
			(detail.originProjectPositionMatrixList ?? []).map(mapPositionMatrixRow),
		),
		staffList: detail.staffList ?? [],
	};
}

export type { DeployCandidateItem } from "../candidate";

export {
	calculateDeploymentQualityScore,
	formatDeploymentQualityScore,
	roundDeploymentQualityScore,
} from "./calculate-deployment-quality-score";

export type { DeploymentQualityStaffItem } from "./calculate-deployment-quality-score";
export {
	applySolutionStaffMatrix,
	applyStaffConfigToSolutionRow,
	buildAiStaffRequestItems,
	buildDeploymentPersistPayload,
	buildDeploymentSolutionStaffPayload,
	buildMatrixMatchKey,
	buildSolutionsFromStaffTree,
	resolveSolutionMatchScore,
} from "./transforms";

export type {
	BenchmarkProjectInfo,
	DeploymentAiStaffRequestItem,
	DeploymentDetail,
	DeploymentItem,
	DeploymentListParams,
	DeploymentPdfMatrixRow,
	DeploymentPdfPreviewSnapshot,
	DeploymentPlanPreviewDetail,
	DeploymentPlanPreviewDetailResponse,
	DeploymentPlanStaffConfigItem,
	DeploymentPlanStaffConfigResponse,
	DeploymentPlanStaffPreviewDetailResponse,
	DeploymentPreviewSchemePersonnelRow,
	DeploymentSearchOptions,
	DeploymentStaffTreeNode,
	DeploymentStaffTreeNodeResponse,
	DeploymentWorkExperienceItem,
	DeployPositionMatrixRow,
	DeployPositionMatrixRowOptions,
	DeploySaveForm,
	DeploySolution,
	DeploySolutionMatrixRow,
	ExportDeploymentPdfPayload,
	PositionMatrixDetailResponse,
	PositionMatrixMetaItem,
	PositionMatrixRowResponse,
	ProjectBasicInfo,
	ProjectStatistics,
} from "./types";

function mapStaffConfigItem(
	item: DeploymentPlanStaffConfigResponse,
): DeploymentPlanStaffConfigItem {
	return {
		projectId: item.projectId,
		requestId: item.requestId,
		solutionNo: item.solutionNo,
		matrixId: item.matrixId,
		departmentLine: item.departmentLine ?? "",
		jobCode: item.jobCode ?? "",
		jobName: item.jobName ?? "",
		positionCode: item.positionCode ?? "",
		positionName: item.positionName ?? "",
		positionLevel: item.positionLevel ?? "",
		isManager: item.isManager,
		empCode: item.empCode ?? "",
		empName: item.empName ?? "",
		recommendId: item.recommendId,
		cyear: item.cyear ?? "",
		age: item.age,
		education: item.education ?? "",
		graduationSchool: item.graduationSchool ?? "",
		workExperience: item.workExperience ?? "",
		staffCost: item.staffCost,
		matchScore: item.matchScore,
		checked: item.checked ?? "",
		sortOrder: item.sortOrder,
	};
}

/** Hutool Tree JSON：extra 可能嵌套或平铺，仅在 API 边界归一化一次 */
function resolveStaffTreeNodeExtra(
	node: DeploymentStaffTreeNodeResponse,
): DeploymentStaffTreeNode["extra"] {
	const nested = node.extra;
	const staffConfigs1 = nested?.staffConfigs1 ?? node.staffConfigs1;
	const staffConfigs2 = nested?.staffConfigs2 ?? node.staffConfigs2;
	const staffCount = nested?.staffCount ?? node.staffCount;
	if (staffCount === undefined && !staffConfigs1?.length && !staffConfigs2?.length) {
		return undefined;
	}
	return {
		staffCount,
		staffConfigs1: (staffConfigs1 ?? []).map(mapStaffConfigItem),
		staffConfigs2: (staffConfigs2 ?? []).map(mapStaffConfigItem),
	};
}

function mapStaffTreeNode(node: DeploymentStaffTreeNodeResponse): DeploymentStaffTreeNode {
	const extra = resolveStaffTreeNodeExtra(node);
	return {
		id: node.id ?? "",
		parentId: node.parentId,
		name: node.name ?? "",
		weight: node.weight,
		extra,
		children: (node.children ?? []).map(mapStaffTreeNode),
	};
}

export async function fetchDeploymentList(
	params: DeploymentListParams = {},
): Promise<PagedData<DeploymentItem>> {
	const { pageNum = 1, pageSize = 10, ...restParams } = params;
	return request.post<PagedData<DeploymentItem>>(
		"org-brain/deployment/list",
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

export async function fetchDeploymentSearchOptions(): Promise<DeploymentSearchOptions> {
	return request.get<DeploymentSearchOptions>("org-brain/deployment/search-options", {
		showLoading: false,
	});
}

export async function fetchDeploymentPositionMatrix(
	projectId: string,
): Promise<DeploymentDetail | null> {
	const response = await request.get<PositionMatrixDetailResponse | null>(
		`deploy/position/matrix/${projectId}`,
	);
	return response ? mapPositionMatrixDetail(response) : null;
}

export async function fetchDeploymentPlanStaffDetail(
	projectId: string,
): Promise<DeploymentDetail | null> {
	const response = await request.post<PositionMatrixDetailResponse | null>(
		`deploy/planstaff/detail/${projectId}`,
	);
	return response ? mapPositionMatrixDetail(response) : null;
}

export async function createDeploymentPositionMatrix(
	projectId: string,
): Promise<DeploymentDetail | null> {
	const response = await request.put<PositionMatrixDetailResponse | null>(
		`deploy/position/matrix/${projectId}`,
	);
	return response ? mapPositionMatrixDetail(response) : null;
}

export async function fetchDeploymentPositionMatrixMeta(
	projectId: string,
): Promise<PositionMatrixMetaItem[]> {
	const response = await request.get<PositionMatrixMetaItem[]>(
		`deploy/position/matrix/meta/${projectId}`,
	);
	return response ?? [];
}

export async function createDeploymentAiStaff(
	projectId: string,
	items: DeploymentAiStaffRequestItem[],
): Promise<boolean> {
	return request.put<boolean>(`deploy/ai/staff/${projectId}`, items, {
		timeout: DEPLOYMENT_AI_REQUEST_TIMEOUT_MS,
	});
}

export async function fetchDeploymentStaffTree(
	projectId: string,
	requestId: string | number,
): Promise<DeploymentStaffTreeNode | null> {
	const response = await request.get<DeploymentStaffTreeNodeResponse | null>(
		`deploy/staff/${projectId}/${requestId}`,
	);
	return response ? mapStaffTreeNode(response) : null;
}

export async function fetchDeploymentAiCandidates(
	requestId: string | number,
	positionCode: string,
): Promise<DeployCandidateItem[]> {
	return request.get<DeployCandidateItem[]>(`deploy/ai/staff/${requestId}/${positionCode}`);
}

/**
 * 查询排兵方案预览详情。
 *
 * 对应 POST deploy/planstaff/preview/detail，返回 DeployPlanPreviewDetailBO。
 * 预览抽屉会复用其中的 staffList 与 originProjectPositionMatrixList。
 *
 * @param projectId - 项目 id
 * @param requestId - 请求 id
 * @param solutionNo - 方案序号
 * @param staffList - 方案人员信息
 * @returns 预览详情
 * @author 王善能
 * @since 2026-07-02
 */
export async function fetchDeploymentPlanPreviewDetail(
	projectId: string,
	requestId: string,
	solutionNo: number,
	staffList: DeploymentSolutionStaffPayloadItem[],
): Promise<DeploymentPlanPreviewDetail> {
	const response = await request.post<DeploymentPlanPreviewDetailResponse>(
		`deploy/planstaff/preview/detail/${projectId}/${requestId}/${solutionNo}`,
		staffList,
	);
	return {
		staffList: response?.staffList ?? [],
		originProjectPositionMatrixList: sortPositionMatrixRows(
			(response?.originProjectPositionMatrixList ?? []).map(mapPositionMatrixRow),
		),
		projectPositionMatrixList: sortPositionMatrixRows(
			(response?.projectPositionMatrixList ?? []).map(mapPositionMatrixRow),
		),
	};
}

/**
 * 暂存排兵布阵草稿。
 *
 * @param payload - 岗位矩阵与方案人员配置
 * @returns 是否暂存成功
 */
export async function stashDeploymentDraft(payload: DeploySaveForm): Promise<boolean> {
	return request.post<boolean>("deploy/save", payload);
}

/**
 * 保存并提交最终排兵方案。
 * 新建与调整排兵布阵均走该接口。
 *
 * @param payload - 岗位矩阵、选中方案与人员配置
 * @returns 是否提交成功
 */
export async function commitDeploymentPlan(payload: DeploySaveForm): Promise<boolean> {
	return request.post<boolean>("deploy/commit", payload);
}

export async function markDeploymentOfflineDeployed(id: string): Promise<boolean> {
	return request.put<boolean>(`org-brain/deployment/${id}/offline-deployed`);
}
