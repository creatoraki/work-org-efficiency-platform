import type { DeploymentDetail } from "#src/api/org-brain/deployment";

/**
 * 构建详情矩阵灌入 key。
 *
 * `DeploymentPanel` 会先以空 detail 渲染，再等待接口异步回填。
 * 该 key 用于判断是否需要重新用后端详情初始化本地可编辑矩阵，
 * 同时避免普通组件重渲染覆盖用户正在编辑的矩阵。
 *
 * @param projectId - 当前项目 id
 * @param detail - 后端排兵布阵详情
 * @returns 当前详情矩阵版本 key
 * @author 王善能
 * @since 2026-06-15
 */
export function buildDeploymentDetailMatrixHydrationKey(
	projectId: string,
	detail?: DeploymentDetail | null,
): string {
	const matrixSignature = (detail?.projectPositionMatrixList ?? [])
		.map((row, index) =>
			[
				row.rowKey ?? index,
				row.departmentLine,
				row.authorizedJobId,
				row.jobCode,
				row.positionCode,
				row.positionLevel,
				row.tagMatchModelId,
				row.requiredCount,
				row.budgetCount,
			].join(":"),
		)
		.join("|");

	return [
		projectId,
		detail?.id ?? "",
		detail?.requestId ?? "",
		detail?.projectPositionMatrixList?.length ?? 0,
		matrixSignature,
	].join("::");
}
