import type {
	DeploymentDetail,
	DeployPositionMatrixRow,
	DeploySaveForm,
} from "#src/api/org-brain/deployment";
import { buildDeploymentPersistPayload } from "#src/api/org-brain/deployment";

export interface DeploymentPersistContext {
	matrix: DeployPositionMatrixRow[];
	solutions: NonNullable<DeploymentDetail["solutions"]>;
	requestId?: string;
	benchmarkProjectId?: string;
	selectedSolution?: NonNullable<DeploymentDetail["solutions"]>[number];
}

/** 暂存 / 保存接口调试预览数据 */
export interface DeploymentPersistDebugPayloads {
	stash: DeploySaveForm;
	commit: DeploySaveForm | null;
}

/**
 * 汇总当前步骤可提交的矩阵、方案与 requestId。
 */
export function resolveDeploymentPersistContext(
	editableMatrix: DeployPositionMatrixRow[],
	detail: DeploymentDetail | null | undefined,
): DeploymentPersistContext {
	const matrix =
		editableMatrix.length > 0 ? editableMatrix : (detail?.projectPositionMatrixList ?? []);
	const solutions = detail?.solutions ?? [];
	const selectedSolution = solutions.find((solution) => solution.choice);
	return {
		matrix,
		solutions,
		requestId: detail?.requestId,
		benchmarkProjectId: detail?.benchmarkInfo?.benchmarkProjectId,
		selectedSolution,
	};
}

/**
 * 将页面状态组装为 deploy/save 与 deploy/commit 共用请求体。
 */
export function buildDeploymentSavePayload(
	projectId: string,
	context: DeploymentPersistContext,
	solutionNo?: number,
): DeploySaveForm {
	return buildDeploymentPersistPayload(
		projectId,
		context.requestId,
		context.matrix,
		context.solutions,
		solutionNo,
		context.benchmarkProjectId ? Number(context.benchmarkProjectId) : undefined,
	);
}

/**
 * 构建暂存与保存接口将发送的请求体，供开发调试预览。
 */
export function buildDeploymentPersistDebugPayloads(
	projectId: string,
	editableMatrix: DeployPositionMatrixRow[],
	detail: DeploymentDetail | null | undefined,
): DeploymentPersistDebugPayloads {
	const context = resolveDeploymentPersistContext(editableMatrix, detail);
	return {
		stash: buildDeploymentSavePayload(projectId, context, context.selectedSolution?.solutionNo),
		commit: context.selectedSolution
			? buildDeploymentSavePayload(projectId, context, context.selectedSolution.solutionNo)
			: null,
	};
}
