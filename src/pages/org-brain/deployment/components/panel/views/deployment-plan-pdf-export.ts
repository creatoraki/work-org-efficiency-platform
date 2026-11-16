import type {
	DeploymentDetail,
	DeploymentItem,
	DeploymentPlanPreviewDetail,
	ExportDeploymentPdfPayload,
} from "#src/api/org-brain/deployment";

import { createPdfExportTask, PdfBizType } from "#src/api/file/export-task";

import {
	buildDeploymentPreviewSnapshot,
	mapDeploymentPreviewSnapshotToPdfPreview,
	resolveDeploymentPreviewOriginMatrixList,
} from "./deployment-preview-rows";

/**
 * 构建排兵布阵 PDF 导出 snapshot。
 *
 * 预览数据统一走 buildDeploymentPreviewSnapshot 组装，
 * 再映射为后端 PDF 模板约定的 preview 结构。
 *
 * @param detail - 排兵布阵详情
 * @param project - 当前项目基础信息
 * @param previewDetail - 预览详情
 * @returns PDF 导出快照
 * @author 王善能
 * @since 2026-06-12
 */
function buildDeploymentPdfSnapshot(
	detail: DeploymentDetail,
	project: DeploymentItem,
	dataMode: "preview" | "view",
	previewDetail?: DeploymentPlanPreviewDetail,
): ExportDeploymentPdfPayload {
	const shouldUseDirectDetail = dataMode === "view";
	const originMatrixList = resolveDeploymentPreviewOriginMatrixList(
		detail.originProjectPositionMatrixList ?? [],
		previewDetail,
	);
	const previewSnapshot = buildDeploymentPreviewSnapshot({
		matrixConfig: detail.projectPositionMatrixList ?? [],
		originMatrixList,
		selectedSolution: detail.solutions?.find((solution) => solution.choice),
		staffPreviewList: shouldUseDirectDetail
			? (detail.staffList ?? [])
			: previewDetail?.staffList,
	});

	return {
		project,
		detail,
		preview: {
			...mapDeploymentPreviewSnapshotToPdfPreview(previewSnapshot),
			schemeNo: shouldUseDirectDetail
				? undefined
				: previewSnapshot.selectedSolution?.solutionNo,
			matchScore: shouldUseDirectDetail
				? detail.matchScore
				: previewSnapshot.selectedSolution?.matchScore,
		},
	};
}

/**
 * 提交排兵布阵方案 PDF 导出任务。
 *
 * @param detail - 排兵布阵详情
 * @param project - 项目信息
 * @param previewDetail - 预览详情
 * @returns 导出任务创建结果
 * @author 王善能
 * @since 2026-06-12
 */
export async function submitDeploymentPlanPdfExport(
	detail: DeploymentDetail,
	project: DeploymentItem,
	dataMode: "preview" | "view",
	previewDetail?: DeploymentPlanPreviewDetail,
) {
	const exportTitle = `${project.projectName ?? "项目"}排兵布阵方案详情`;
	const snapshot = buildDeploymentPdfSnapshot(detail, project, dataMode, previewDetail);

	return createPdfExportTask({
		bizType: PdfBizType.ORG_BRAIN_DEPLOYMENT,
		title: exportTitle,
		snapshot,
	});
}
