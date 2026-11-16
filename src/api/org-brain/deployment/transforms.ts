/**
 * 排兵布阵视图层转换（后端未直接提供的结构）。
 * 矩阵/人员/候选人等 API 数据保持后端字段名，此处仅处理 G6 图、方案分组、保存组装。
 */

import type {
	DeploymentAiStaffRequestItem,
	DeploymentPlanStaffConfigItem,
	DeploymentStaffTreeNode,
	DeployPositionMatrixRow,
	DeploySaveForm,
	DeploySolution,
	DeploySolutionMatrixRow,
} from "./types";
import { calculateDeploymentQualityScore } from "./calculate-deployment-quality-score";

function hasTextValue(value?: string | null): boolean {
	return Boolean(value?.trim());
}

function hasSelectedTagMatchModelId(value?: string | number | null): boolean {
	return value !== null && value !== undefined && String(value).trim() !== "";
}

function isMeaningfulMatrixRow(row: DeployPositionMatrixRow): boolean {
	return (
		hasTextValue(row.departmentLine) ||
		hasTextValue(row.authorizedJobId) ||
		hasTextValue(row.authorizedJobName) ||
		hasTextValue(row.jobCode) ||
		hasTextValue(row.jobName) ||
		hasTextValue(row.positionCode) ||
		hasTextValue(row.positionName) ||
		hasTextValue(row.positionLevel) ||
		hasSelectedTagMatchModelId(row.tagMatchModelId) ||
		hasTextValue(row.tagMatchModelName) ||
		row.requiredCount != null
	);
}

function normalizeTagMatchModelId(value?: string | number | null): number | undefined {
	if (!hasSelectedTagMatchModelId(value)) {
		return undefined;
	}
	const parsedValue = Number(value);
	return Number.isFinite(parsedValue) ? parsedValue : undefined;
}

function normalizeOptionalText(value?: string | null): string | undefined {
	const normalizedValue = value?.trim();
	return normalizedValue || undefined;
}

/**
 * 根据方案矩阵内已选人员重算质量分。
 *
 * @param staffMatrixList - 方案矩阵行列表
 * @returns 质量分（0~100，百分制）
 *
 * @author 王善能
 * @since 2026-06-16
 */
export function resolveSolutionMatchScore(staffMatrixList: DeploySolutionMatrixRow[]): number {
	const staffList = staffMatrixList.flatMap((row) => row.staffConfigList ?? []);
	return calculateDeploymentQualityScore(staffList);
}

export function buildMatrixMatchKey(input: {
	departmentLine?: string;
	jobCode?: string;
	positionCode?: string;
	positionLevel?: string;
}): string {
	return [
		input.departmentLine?.trim() ?? "",
		input.jobCode?.trim() ?? "",
		input.positionCode?.trim() ?? "",
		input.positionLevel?.trim() ?? "",
	].join("|");
}

export function buildAiStaffRequestItems(
	matrix: DeployPositionMatrixRow[],
): DeploymentAiStaffRequestItem[] {
	return matrix.filter(isMeaningfulMatrixRow).map((row) => ({
		jobCode: row.jobCode ?? "",
		positionCode: row.positionCode ?? "",
		tagMatchModelId: Number(row.tagMatchModelId),
		requiredCount: row.requiredCount!,
	}));
}

function collectPositionNodes(tree: DeploymentStaffTreeNode): DeploymentStaffTreeNode[] {
	const postNodes: DeploymentStaffTreeNode[] = [];
	const walk = (node: DeploymentStaffTreeNode) => {
		const extra = node.extra;
		if (extra?.staffConfigs1?.length || extra?.staffConfigs2?.length) {
			postNodes.push(node);
		}
		(node.children ?? []).forEach(walk);
	};
	walk(tree);
	return postNodes;
}

function buildStaffConfigMapBySolution(
	tree: DeploymentStaffTreeNode | null,
): Map<number, Map<string, DeploymentPlanStaffConfigItem[]>> {
	const result = new Map<number, Map<string, DeploymentPlanStaffConfigItem[]>>();
	if (!tree) {
		return result;
	}

	collectPositionNodes(tree).forEach((postNode) => {
		const extra = postNode.extra;
		const configsBySolution: Array<[number, DeploymentPlanStaffConfigItem[] | undefined]> = [
			[1, extra?.staffConfigs1],
			[2, extra?.staffConfigs2],
		];
		configsBySolution.forEach(([solutionNo, configs]) => {
			if (!configs?.length) {
				return;
			}
			const solutionMap =
				result.get(solutionNo) ?? new Map<string, DeploymentPlanStaffConfigItem[]>();
			configs.forEach((config) => {
				const key = buildMatrixMatchKey({
					departmentLine: config.departmentLine,
					jobCode: config.jobCode,
					positionCode: config.positionCode,
					positionLevel: config.positionLevel,
				});
				const current = solutionMap.get(key) ?? [];
				current.push(config);
				solutionMap.set(key, current);
			});
			result.set(solutionNo, solutionMap);
		});
	});
	return result;
}

/**
 * 从人员树结果推导默认选中方案。
 *
 * 后端推送结果通过 staffConfigs.checked 表达“该人员属于最终选中的方案”，
 * 同一方案下任一人员标记为 "1" 即视为该方案被选中。
 *
 * @param tree - AI 排兵返回的人员树
 * @returns 被选中的方案号；若没有明确标记则返回 undefined
 * @author 王善能
 * @since 2026-06-29
 */
function resolveCheckedSolutionNo(tree: DeploymentStaffTreeNode | null): number | undefined {
	if (!tree) {
		return undefined;
	}

	const checkedSolutionNos = new Set<number>();
	collectPositionNodes(tree).forEach((postNode) => {
		const configsBySolution: Array<[number, DeploymentPlanStaffConfigItem[] | undefined]> = [
			[1, postNode.extra?.staffConfigs1],
			[2, postNode.extra?.staffConfigs2],
		];
		configsBySolution.forEach(([solutionNo, configs]) => {
			if (configs?.some((config) => config.checked === "1")) {
				checkedSolutionNos.add(solutionNo);
			}
		});
	});

	return checkedSolutionNos.size > 0 ? Math.min(...checkedSolutionNos) : undefined;
}

function buildSolutionMatrixRow(
	key: string,
	staffConfigs: DeploymentPlanStaffConfigItem[],
	matrixMetaMap: Map<string, DeployPositionMatrixRow>,
): DeploySolutionMatrixRow {
	const matchedMatrixRow = matrixMetaMap.get(key);
	const base = staffConfigs[0];
	return {
		departmentLine: base?.departmentLine ?? matchedMatrixRow?.departmentLine ?? "",
		authorizedJobId: matchedMatrixRow?.authorizedJobId,
		authorizedJobName: matchedMatrixRow?.authorizedJobName,
		jobCode: base?.jobCode ?? matchedMatrixRow?.jobCode,
		jobName: base?.jobName ?? matchedMatrixRow?.jobName ?? "",
		positionCode: base?.positionCode ?? matchedMatrixRow?.positionCode,
		positionName: base?.positionName ?? matchedMatrixRow?.positionName ?? "",
		positionLevel: base?.positionLevel ?? matchedMatrixRow?.positionLevel ?? "",
		staffCount: staffConfigs.length,
		staffConfigList: staffConfigs,
	};
}

/**
 * 步骤一矩阵 + 人员树 → 方案列表（按 solutionNo 分组）。
 */
export function buildSolutionsFromStaffTree(
	matrix: DeployPositionMatrixRow[],
	staffTree: DeploymentStaffTreeNode | null,
): DeploySolution[] {
	const staffConfigMapBySolution = buildStaffConfigMapBySolution(staffTree);
	const checkedSolutionNo = resolveCheckedSolutionNo(staffTree);
	const matrixMetaMap = new Map(
		matrix.map((row) => [
			buildMatrixMatchKey({
				departmentLine: row.departmentLine,
				jobCode: row.jobCode,
				positionCode: row.positionCode,
				positionLevel: row.positionLevel,
			}),
			row,
		]),
	);

	const solutions = Array.from(staffConfigMapBySolution.entries())
		.sort(([left], [right]) => left - right)
		.map(([solutionNo, configsByKey]) => {
			const staffMatrixList = Array.from(configsByKey.entries())
				.sort(([leftKey], [rightKey]) => {
					const leftIndex = matrix.findIndex(
						(row) =>
							buildMatrixMatchKey({
								departmentLine: row.departmentLine,
								jobCode: row.jobCode,
								positionCode: row.positionCode,
								positionLevel: row.positionLevel,
							}) === leftKey,
					);
					const rightIndex = matrix.findIndex(
						(row) =>
							buildMatrixMatchKey({
								departmentLine: row.departmentLine,
								jobCode: row.jobCode,
								positionCode: row.positionCode,
								positionLevel: row.positionLevel,
							}) === rightKey,
					);
					return leftIndex - rightIndex;
				})
				.map(([key, staffConfigs]) =>
					buildSolutionMatrixRow(key, staffConfigs, matrixMetaMap),
				);

			return {
				solutionNo,
				matchScore: resolveSolutionMatchScore(staffMatrixList),
				staffCost: Array.from(configsByKey.values())
					.flat()
					.reduce((sum, config) => sum + Number(config.staffCost ?? 0), 0),
				choice: checkedSolutionNo === solutionNo,
				staffMatrixList,
			};
		});

	return solutions;
}

function collectSolutionStaffPayload(
	solution?: DeploySolution,
): Array<{ matrixId?: number; empCode?: string }> {
	return (
		solution?.staffMatrixList?.flatMap((row) =>
			row.staffConfigList
				.filter((config) => Boolean(config.empCode))
				.map((config) => ({
					matrixId: config.matrixId,
					empCode: config.empCode ?? "",
				})),
		) ?? []
	);
}

/**
 * 组装单个方案的人员信息请求体。
 *
 * 供预览详情、保存、提交等接口复用同一份“方案人员信息”结构，
 * 避免页面层直接依赖 deploy/save 的完整 payload 组装逻辑。
 *
 * @param solution - 当前方案
 * @returns 方案人员信息数组
 * @author 王善能
 * @since 2026-06-30
 */
export function buildDeploymentSolutionStaffPayload(
	solution?: DeploySolution,
): Array<{ matrixId?: number; empCode?: string }> {
	return collectSolutionStaffPayload(solution);
}

/**
 * 组装排兵布阵持久化请求体。
 * 供 deploy/save（暂存）与 deploy/commit（保存/提交）共用。
 */
export function buildDeploymentPersistPayload(
	projectId: string,
	requestId: string | undefined,
	matrix: DeployPositionMatrixRow[],
	solutions: DeploySolution[] | undefined,
	solutionNo?: number,
	benchmarkProjectId?: number,
): DeploySaveForm {
	const solution1 = solutions?.find((item) => item.solutionNo === 1);
	const solution2 = solutions?.find((item) => item.solutionNo === 2);
	const selectedSolution = solutionNo
		? solutions?.find((item) => item.solutionNo === solutionNo)
		: solutions?.find((item) => item.choice);
	const hasSolutionConfigs =
		collectSolutionStaffPayload(solution1).length > 0 ||
		collectSolutionStaffPayload(solution2).length > 0;
	return {
		projectId: Number(projectId),
		benchmarkProjectId,
		requestId: requestId ? Number(requestId) : undefined,
		matchScore: selectedSolution?.matchScore,
		positionMatrixList: matrix.filter(isMeaningfulMatrixRow).map((row) => ({
			departmentLine: normalizeOptionalText(row.departmentLine),
			authorizedJobId: normalizeOptionalText(row.authorizedJobId),
			authorizedJobName: normalizeOptionalText(row.authorizedJobName),
			jobCode: normalizeOptionalText(row.jobCode),
			jobName: normalizeOptionalText(row.jobName),
			positionCode: normalizeOptionalText(row.positionCode),
			positionName: normalizeOptionalText(row.positionName),
			positionLevel: normalizeOptionalText(row.positionLevel),
			requiredCount: row.requiredCount,
			budgetCount: row.budgetCount,
			tagMatchModelId: normalizeTagMatchModelId(row.tagMatchModelId),
			tagMatchModelName: normalizeOptionalText(row.tagMatchModelName),
		})),
		staffConfigSaveForm: hasSolutionConfigs
			? {
					staffConfig1: collectSolutionStaffPayload(solution1),
					staffConfig2: collectSolutionStaffPayload(solution2),
				}
			: undefined,
		solutionNo: hasSolutionConfigs ? solutionNo : undefined,
	};
}

/** 候选人抽屉确认后写回方案矩阵行 */
export function applyStaffConfigToSolutionRow(
	row: DeploySolutionMatrixRow,
	staffConfigList: DeploymentPlanStaffConfigItem[],
): DeploySolutionMatrixRow {
	return {
		...row,
		staffCount: staffConfigList.length,
		staffConfigList,
	};
}

/**
 * 人员替换后同步更新方案质量分。
 *
 * @param solution - 原方案
 * @param staffMatrixList - 更新后的矩阵
 * @returns 带新质量分的方案（matchScore 为 0~100 百分制）
 */
export function applySolutionStaffMatrix(
	solution: DeploySolution,
	staffMatrixList: DeploySolutionMatrixRow[],
): DeploySolution {
	return {
		...solution,
		staffMatrixList,
		matchScore: resolveSolutionMatchScore(staffMatrixList),
	};
}
