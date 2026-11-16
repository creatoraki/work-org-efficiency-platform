import type {
	DeploymentPdfMatrixRow,
	DeploymentPlanPreviewDetail,
	DeploymentPlanStaffPreviewDetailResponse,
	DeploymentPreviewSchemePersonnelRow,
	DeploymentWorkExperienceItem,
	DeployPositionMatrixRow,
	DeploySolution,
} from "#src/api/org-brain/deployment";
import { buildMatrixJobPositionSelectionLabel } from "../config-matrix/matrixJobPositionUtils";

/** 实际矩阵行（带差异） */
export interface ActualMatrixRow extends DeployPositionMatrixRow {
	_diff?: number;
}

function hasTextValue(value?: string | null): boolean {
	return Boolean(value?.trim());
}

/**
 * 统一排兵布阵导出快照中的空值展示文案。
 *
 * 用于在导出快照组装阶段统一字符串字段的空值展示口径，
 * 保证页面展示、导出中心与 PDF 渲染结果保持一致。
 *
 * @param value - 原始字符串字段
 * @returns 标准化后的展示文本；空值统一返回 `/`
 * @author 王善能
 * @since 2026-07-08
 */
function normalizeDeploymentExportText(value?: string | null): string {
	return hasTextValue(value) ? value!.trim() : "/";
}

function hasMeaningfulMatrixContent(row: DeployPositionMatrixRow): boolean {
	return (
		hasTextValue(row.departmentLine) ||
		hasTextValue(row.authorizedJobId) ||
		hasTextValue(row.authorizedJobName) ||
		hasTextValue(row.jobCode) ||
		hasTextValue(row.jobName) ||
		hasTextValue(row.positionCode) ||
		hasTextValue(row.positionName) ||
		hasTextValue(row.positionLevel) ||
		row.requiredCount != null ||
		row.budgetCount != null
	);
}

/**
 * 过滤有效的岗位矩阵配置行。
 *
 * @param rows - 岗位矩阵列表
 * @returns 有效配置行
 * @author 王善能
 * @since 2026-07-02
 */
export function filterMeaningfulMatrixRows(
	rows: DeployPositionMatrixRow[],
): DeployPositionMatrixRow[] {
	return rows.filter(hasMeaningfulMatrixContent);
}

/** 实际矩阵唯一键字段 */
interface ActualMatrixRowKeySource {
	departmentLine?: string;
	authorizedJobId?: string;
	jobCode?: string;
	positionCode?: string;
	positionLevel?: string;
}

/**
 * 预览“实际矩阵及差异”唯一键。
 *
 * 与页面要求保持一致：
 * departmentLine + authorizedJobId + jobCode + positionCode + positionLevel
 *
 * @param row - 岗位矩阵行或具备唯一键字段的对象
 * @returns 唯一键
 * @author 王善能
 * @since 2026-07-01
 */
export function buildActualMatrixRowKey(row: ActualMatrixRowKeySource): string {
	return [
		row.departmentLine?.trim() ?? "",
		row.authorizedJobId?.trim() ?? "",
		row.jobCode?.trim() ?? "",
		row.positionCode?.trim() ?? "",
		row.positionLevel?.trim() ?? "",
	].join("|");
}

/**
 * 人员预览行在缺少 authorizedJobId 时使用的岗位维度 key。
 *
 * @param row - 人员或岗位维度对象
 * @returns 岗位维度 key
 * @author 王善能
 * @since 2026-07-02
 */
function buildStaffPositionLookupKey(row: ActualMatrixRowKeySource): string {
	return [
		row.departmentLine?.trim() ?? "",
		row.jobCode?.trim() ?? "",
		row.positionCode?.trim() ?? "",
		row.positionLevel?.trim() ?? "",
	].join("|");
}

/**
 * 构建岗位矩阵参考索引，供人员预览行补齐编制信息。
 *
 * @param rows - 岗位矩阵参考数据
 * @returns 完整唯一键与岗位维度 key 的索引
 * @author 王善能
 * @since 2026-07-02
 */
function buildMatrixReferenceMap(
	rows: DeployPositionMatrixRow[],
): Map<string, DeployPositionMatrixRow> {
	const map = new Map<string, DeployPositionMatrixRow>();
	rows.filter(hasMeaningfulMatrixContent).forEach((row) => {
		map.set(buildActualMatrixRowKey(row), row);
		const positionKey = buildStaffPositionLookupKey(row);
		if (!map.has(positionKey)) {
			map.set(positionKey, row);
		}
	});
	return map;
}

export interface BuildConfiguredActualMatrixRowsOptions {
	selectedSolution?: DeploySolution | null;
	staffPreviewList?: DeploymentPlanStaffPreviewDetailResponse[];
	referenceMatrixRows?: DeployPositionMatrixRow[];
}

/**
 * 构建预览“实际矩阵及差异”中的配置矩阵数据。
 *
 * 编辑模式下以步骤一矩阵配置为主，实际人数来自选中方案；
 * 查看模式下若步骤矩阵无效，则回退为按预览人员列表聚合。
 *
 * @param matrixConfig - 步骤一岗位矩阵配置
 * @param options - 方案、人员预览与参考矩阵
 * @returns 配置矩阵行
 * @author 王善能
 * @since 2026-07-02
 */
export function buildConfiguredActualMatrixRows(
	matrixConfig: DeployPositionMatrixRow[],
	options: BuildConfiguredActualMatrixRowsOptions = {},
): DeployPositionMatrixRow[] {
	const referenceMap = buildMatrixReferenceMap([
		...matrixConfig,
		...(options.referenceMatrixRows ?? []),
	]);

	if (options.selectedSolution?.staffMatrixList?.length) {
		const staffCountByKey = new Map<string, number>();
		options.selectedSolution.staffMatrixList.forEach((row) => {
			const key = buildActualMatrixRowKey(row);
			const count = row.staffCount ?? row.staffConfigList?.length ?? 0;
			staffCountByKey.set(key, count);
		});

		return matrixConfig.filter(hasMeaningfulMatrixContent).map((row, index) => ({
			...row,
			requiredCount: staffCountByKey.get(buildActualMatrixRowKey(row)) ?? 0,
			rowKey: row.rowKey ?? `configured_actual_${index}`,
		}));
	}

	if (options.staffPreviewList?.length) {
		const grouped = new Map<string, { template: DeployPositionMatrixRow; count: number }>();
		options.staffPreviewList.forEach((staff) => {
			const reference = referenceMap.get(buildStaffPositionLookupKey(staff));
			const template: DeployPositionMatrixRow = {
				departmentLine: staff.departmentLine ?? reference?.departmentLine ?? "",
				authorizedJobId: reference?.authorizedJobId,
				authorizedJobName: staff.authorizedJobName ?? reference?.authorizedJobName,
				jobCode: staff.jobCode ?? reference?.jobCode ?? "",
				jobName: staff.jobName ?? reference?.jobName ?? "",
				positionCode: staff.positionCode ?? reference?.positionCode ?? "",
				positionName: staff.positionName ?? reference?.positionName ?? "",
				positionLevel: staff.positionLevel ?? reference?.positionLevel ?? "",
				budgetCount: reference?.budgetCount,
				requiredCount: 0,
			};
			const key = buildActualMatrixRowKey(template);
			const existing = grouped.get(key);
			if (existing) {
				existing.count += 1;
				return;
			}
			grouped.set(key, { template, count: 1 });
		});

		return Array.from(grouped.values()).map(({ template, count }, index) => ({
			...template,
			requiredCount: count,
			rowKey: template.rowKey ?? `configured_staff_${index}`,
		}));
	}

	return matrixConfig.filter(hasMeaningfulMatrixContent).map((row, index) => ({
		...row,
		requiredCount: 0,
		rowKey: row.rowKey ?? `configured_actual_${index}`,
	}));
}

/**
 * 工作经历原始项。
 *
 * 用于承接后端原始 workExperience 串拆分后的字段，
 * 不包含前端展示层派生字段。
 */
interface RawWorkExperienceItem extends Omit<
	DeploymentWorkExperienceItem,
	"period" | "orgName" | "postName"
> {
	empName: string;
	effectDate: string;
	firstDeptcode: string;
	firstDeptname: string;
	depid: string;
	deptname: string;
	deptfullname: string;
	postname: string;
	endEffectDate: string;
}

/**
 * 工作经历项，字段与后端 CONCAT_WS 片段一致。
 * 原始串：emp_name:effect_date:first_deptcode:first_deptname:depid:deptname:deptfullname:postname
 */
export interface WorkExperienceItem extends RawWorkExperienceItem {
	period: string;
	orgName: string;
	postName: string;
}

/** 后端 workExperience 单条记录字段数（CONCAT_WS 固定 8 段） */
const DEPLOYMENT_WORK_EXPERIENCE_FIELD_COUNT = 8;

/** 最终方案人员详情行 */
export interface SchemePersonnelRow extends DeploymentPreviewSchemePersonnelRow {
	rowKey: string;
	departmentLine: string;
	authorizedJobName?: string;
	jobName: string;
	positionName: string;
	positionLevel: string;
	staffCount: number;
	empName: string;
	cyear: string;
	age: number;
	graduationSchool: string;
	education: string;
	workExperience: WorkExperienceItem[];
}

/**
 * 计算预览抽屉“实际矩阵及差异”表格数据。
 *
 * 业务口径与页面保持一致：
 * 差异 = 实际人数 requiredCount - 编制人数 budgetCount。
 *
 * 先展示当前配置矩阵；再把原始编制矩阵中未被配置覆盖的岗位追加到表格尾部。
 * 追加行口径：
 * - 人数（人）固定展示 0
 * - 差异(实际-编制) = 0 - budgetCount，即直接展示负编制人数
 *
 * @param projectPositionMatrixList - 当前项目岗位矩阵
 * @param originProjectPositionMatrixList - 原始项目岗位矩阵
 * @returns 带差异值的实际矩阵行列表
 * @author 王善能
 * @since 2026-06-12
 */
export function getActualMatrixRows(
	projectPositionMatrixList: DeployPositionMatrixRow[],
	originProjectPositionMatrixList: DeployPositionMatrixRow[] = [],
): ActualMatrixRow[] {
	const actualRows = projectPositionMatrixList
		.filter(hasMeaningfulMatrixContent)
		.map((row, index) => {
			const budgetCount = row.budgetCount ?? 0;
			const requiredCount = row.requiredCount ?? 0;
			return {
				...row,
				requiredCount,
				_diff: requiredCount - budgetCount,
				rowKey: row.rowKey ?? `actual_config_${index}`,
			};
		});

	const actualRowKeySet = new Set(actualRows.map(buildActualMatrixRowKey));
	const appendedOriginRows = originProjectPositionMatrixList
		.filter(hasMeaningfulMatrixContent)
		.filter((row) => !actualRowKeySet.has(buildActualMatrixRowKey(row)))
		.map((row, index) => {
			const budgetCount = row.budgetCount ?? 0;
			return {
				...row,
				requiredCount: 0,
				_diff: -budgetCount,
				rowKey: row.rowKey ?? `actual_origin_${index}`,
			};
		});

	return [...actualRows, ...appendedOriginRows];
}

/**
 * 排兵布阵预览快照。
 *
 * 对应预览抽屉三块表格数据，预览展示与 PDF 导出共用。
 *
 * @author 王善能
 * @since 2026-07-02
 */
export interface DeploymentPreviewSnapshot {
	matrixConfigRows: DeployPositionMatrixRow[];
	actualMatrixRows: ActualMatrixRow[];
	selectedSolution?: DeploySolution | null;
	schemePersonnelRows: SchemePersonnelRow[];
}

/**
 * 构建排兵布阵预览快照的入参。
 *
 * @author 王善能
 * @since 2026-07-02
 */
export interface BuildDeploymentPreviewSnapshotInput {
	matrixConfig: DeployPositionMatrixRow[];
	originMatrixList: DeployPositionMatrixRow[];
	selectedSolution?: DeploySolution | null;
	staffPreviewList?: DeploymentPlanStaffPreviewDetailResponse[];
}

/**
 * 解析预览使用的原始编制矩阵。
 *
 * 优先取预览详情接口返回值，其次回退详情上下文中的 origin 列表。
 *
 * @param detailOriginMatrixList - 详情上下文中的 origin 列表
 * @param previewDetail - 预览详情接口响应
 * @returns 原始编制矩阵
 * @author 王善能
 * @since 2026-07-02
 */
export function resolveDeploymentPreviewOriginMatrixList(
	detailOriginMatrixList: DeployPositionMatrixRow[] = [],
	previewDetail?: DeploymentPlanPreviewDetail | null,
): DeployPositionMatrixRow[] {
	if (previewDetail?.originProjectPositionMatrixList?.length) {
		return previewDetail.originProjectPositionMatrixList;
	}
	return detailOriginMatrixList;
}

/**
 * 构建排兵布阵预览快照。
 *
 * 统一承接三块表格的数据组装：
 * 1. 岗位矩阵配置：步骤一有效配置行
 * 2. 实际矩阵及差异：配置矩阵叠加方案人数后，与 origin 矩阵按唯一键合并
 * 3. 最终方案人员：预览人员列表归一化结果
 *
 * @param input - 预览快照入参
 * @returns 预览快照
 * @author 王善能
 * @since 2026-07-02
 */
export function buildDeploymentPreviewSnapshot(
	input: BuildDeploymentPreviewSnapshotInput,
): DeploymentPreviewSnapshot {
	const matrixConfigRows = filterMeaningfulMatrixRows(input.matrixConfig);
	const configuredActualRows = buildConfiguredActualMatrixRows(matrixConfigRows, {
		selectedSolution: input.selectedSolution,
		staffPreviewList: input.staffPreviewList,
		referenceMatrixRows: input.originMatrixList,
	});
	const actualMatrixRows = getActualMatrixRows(configuredActualRows, input.originMatrixList);
	const schemePersonnelRows = mapDeploymentPlanStaffPreviewDetailListToSchemePersonnelRows(
		input.staffPreviewList ?? [],
	);

	return {
		matrixConfigRows,
		actualMatrixRows,
		selectedSolution: input.selectedSolution,
		schemePersonnelRows,
	};
}

/**
 * 岗位矩阵配置行转换为 PDF 导出矩阵行。
 *
 * @param row - 岗位矩阵配置行
 * @returns PDF 导出矩阵行
 * @author 王善能
 * @since 2026-07-02
 */
export function mapMatrixConfigRowToPdfRow(row: DeployPositionMatrixRow): DeploymentPdfMatrixRow {
	return {
		departmentLine: normalizeDeploymentExportText(row.departmentLine),
		authorizedJobName: normalizeDeploymentExportText(row.authorizedJobName),
		jobPositionLabel: normalizeDeploymentExportText(buildMatrixJobPositionSelectionLabel(row)),
		tagMatchModelName: normalizeDeploymentExportText(row.tagMatchModelName),
		requiredCount: row.requiredCount,
	};
}

/**
 * 实际矩阵行转换为 PDF 导出矩阵行。
 *
 * @param row - 实际矩阵行
 * @returns PDF 导出矩阵行
 * @author 王善能
 * @since 2026-07-02
 */
export function mapActualMatrixRowToPdfRow(row: ActualMatrixRow): DeploymentPdfMatrixRow {
	return {
		...mapMatrixConfigRowToPdfRow(row),
		_diff: row._diff,
	};
}

/**
 * 方案人员行转换为 PDF 导出人员行。
 *
 * @param row - 方案人员行
 * @returns PDF 导出人员行
 * @author 王善能
 * @since 2026-07-02
 */
export function mapSchemePersonnelRowToPdfRow(
	row: SchemePersonnelRow,
): DeploymentPreviewSchemePersonnelRow {
	return {
		departmentLine: normalizeDeploymentExportText(row.departmentLine),
		authorizedJobName: normalizeDeploymentExportText(row.authorizedJobName),
		jobPositionLabel: normalizeDeploymentExportText(buildMatrixJobPositionSelectionLabel(row)),
		staffCount: row.staffCount,
		empName: normalizeDeploymentExportText(row.empName),
		cyear: normalizeDeploymentExportText(row.cyear),
		age: row.age,
		graduationSchool: normalizeDeploymentExportText(row.graduationSchool),
		education: normalizeDeploymentExportText(row.education),
		workExperience: row.workExperience.map((item) => ({
			period: normalizeDeploymentExportText(item.period),
			orgName: normalizeDeploymentExportText(item.orgName),
			postName: normalizeDeploymentExportText(item.postName),
			effectDate: normalizeDeploymentExportText(item.effectDate),
			endEffectDate: normalizeDeploymentExportText(item.endEffectDate),
			firstDeptname: normalizeDeploymentExportText(item.firstDeptname),
			deptname: normalizeDeploymentExportText(item.deptname),
			postname: normalizeDeploymentExportText(item.postname),
		})),
	};
}

/**
 * 预览快照转换为 PDF 导出 preview 结构。
 *
 * @param snapshot - 预览快照
 * @returns PDF 导出 preview 结构
 * @author 王善能
 * @since 2026-07-02
 */
export function mapDeploymentPreviewSnapshotToPdfPreview(snapshot: DeploymentPreviewSnapshot) {
	const selectedScheme = snapshot.selectedSolution;
	return {
		matrixRows: snapshot.matrixConfigRows.map(mapMatrixConfigRowToPdfRow),
		actualMatrixRows: snapshot.actualMatrixRows.map(mapActualMatrixRowToPdfRow),
		schemeNo: selectedScheme?.solutionNo,
		matchScore: selectedScheme?.matchScore,
		schemeRows: (selectedScheme?.staffMatrixList ?? []).map(mapMatrixConfigRowToPdfRow),
		schemePersonnelRows: snapshot.schemePersonnelRows.map(mapSchemePersonnelRowToPdfRow),
	};
}

/**
 * 预览岗位分组 key，用于统计同岗位人数。
 */
function buildPreviewStaffGroupKey(item: DeploymentPlanStaffPreviewDetailResponse): string {
	return [
		item.departmentLine?.trim() ?? "",
		item.jobCode?.trim() ?? "",
		item.positionCode?.trim() ?? "",
		item.positionLevel?.trim() ?? "",
	].join("|");
}

/**
 * 解析单条工作经历片段。
 * 格式：emp_name:effect_date:first_deptcode:first_deptname:depid:deptname:deptfullname:postname
 */
function parseDeploymentWorkExperienceSegment(segment: string): RawWorkExperienceItem | null {
	const trimmed = segment.trim();
	if (!trimmed) {
		return null;
	}

	const parts = trimmed.split(":");
	if (parts.length < DEPLOYMENT_WORK_EXPERIENCE_FIELD_COUNT) {
		return null;
	}

	return {
		empName: parts[0] ?? "",
		effectDate: parts[1] ?? "",
		firstDeptcode: parts[2] ?? "",
		firstDeptname: parts[3] ?? "",
		depid: parts[4] ?? "",
		deptname: parts[5] ?? "",
		deptfullname:
			parts.length === DEPLOYMENT_WORK_EXPERIENCE_FIELD_COUNT
				? (parts[6] ?? "")
				: parts.slice(6, -1).join(":"),
		postname: parts[parts.length - 1] ?? "",
		endEffectDate: "至今",
	};
}

/**
 * 根据下一条生效日期设置当前段结束日期：结束时间 = 下一条开始时间，最后一条为「至今」。
 */
function resolveWorkExperienceEndDates(items: RawWorkExperienceItem[]): WorkExperienceItem[] {
	if (items.length <= 1) {
		return items.map((item) => buildDisplayWorkExperienceItem(item, "至今"));
	}

	const sorted = [...items].sort((a, b) => a.effectDate.localeCompare(b.effectDate));
	return sorted
		.map((item, index) => {
			const nextEffectDate = sorted[index + 1]?.effectDate;
			return buildDisplayWorkExperienceItem(item, nextEffectDate?.trim() || "至今");
		})
		.reverse();
}

/**
 * 组装工作经历展示字段。
 *
 * @param item - 原始工作经历项
 * @param endEffectDate - 结束时间
 * @returns 补齐展示字段后的工作经历项
 * @author 王善能
 * @since 2026-06-12
 */
function buildDisplayWorkExperienceItem(
	item: RawWorkExperienceItem,
	endEffectDate: string,
): WorkExperienceItem {
	const normalizedEndEffectDate = endEffectDate || "至今";
	const normalizedOrgName = item.firstDeptname || item.deptname || "";
	const normalizedPostName = item.postname || "";

	return {
		...item,
		endEffectDate: normalizedEndEffectDate,
		period: formatWorkExperiencePeriod(item.effectDate, normalizedEndEffectDate),
		orgName: normalizedOrgName,
		postName: normalizedPostName,
	};
}

/**
 * 格式化工作经历时间段文案。
 *
 * @param effectDate - 开始时间
 * @param endEffectDate - 结束时间
 * @returns 标准时间段文案
 * @author 王善能
 * @since 2026-06-12
 */
function formatWorkExperiencePeriod(effectDate: string, endEffectDate: string): string {
	const start = effectDate?.trim() || "";
	const end = endEffectDate?.trim() || "";

	if (!start && !end) {
		return "";
	}
	if (!start) {
		return end;
	}
	if (!end) {
		return start;
	}
	if (end === "至今") {
		return `${start}至今`;
	}
	return `${start} 至 ${end}`;
}

/**
 * 解析排兵布阵 workExperience 原始串。
 *
 * 多条记录以 `;` 分隔，单条记录为固定 8 个冒号分隔字段。
 * 该方法同时服务于预览抽屉渲染与 PDF 导出快照构建，
 * 因此需要保证字段拆分口径稳定。
 *
 * @param raw - 接口 workExperience 原始字符串
 * @returns 工作经历列表
 * @author 王善能
 * @since 2026-06-12
 */
export function parseDeploymentWorkExperienceString(raw?: string): WorkExperienceItem[] {
	if (!raw?.trim()) {
		return [];
	}

	const records = raw
		.split(";")
		.map(parseDeploymentWorkExperienceSegment)
		.filter((item): item is WorkExperienceItem => item != null);

	if (records.length > 0) {
		return resolveWorkExperienceEndDates(records);
	}

	return [];
}

/**
 * 解析接口 workExperience 字段。
 */
function parsePreviewWorkExperience(raw?: string): WorkExperienceItem[] {
	return parseDeploymentWorkExperienceString(raw);
}

/**
 * 将预览接口返回的 staffList 转换为方案人员表格行。
 *
 * 这里会补齐同岗位人数统计，并将 workExperience 原始字符串
 * 归一化为预览与导出都可复用的结构化数组。
 *
 * @param staffList - 预览接口返回的人员明细
 * @returns 方案人员表格行
 * @author 王善能
 * @since 2026-06-12
 */
export function mapDeploymentPlanStaffPreviewDetailListToSchemePersonnelRows(
	staffList: DeploymentPlanStaffPreviewDetailResponse[],
): SchemePersonnelRow[] {
	const groupCountMap = staffList.reduce<Record<string, number>>((acc, item) => {
		const key = buildPreviewStaffGroupKey(item);
		acc[key] = (acc[key] ?? 0) + 1;
		return acc;
	}, {});

	return staffList.map((item, index) => {
		const groupKey = buildPreviewStaffGroupKey(item);
		return {
			rowKey: `preview_staff_${item.empCode ?? index}_${index}`,
			departmentLine: item.departmentLine ?? "",
			authorizedJobName: item.authorizedJobName,
			jobName: item.jobName ?? "",
			positionName: item.positionName ?? "",
			positionLevel: item.positionLevel ?? "",
			staffCount: groupCountMap[groupKey] ?? 1,
			empName: item.empName ?? "/",
			cyear: item.cyear ?? "0",
			age: Number(item.age) || 0,
			graduationSchool: item.graduationSchool ?? "",
			education: item.education ?? "",
			workExperience: parsePreviewWorkExperience(item.workExperience),
		};
	});
}
