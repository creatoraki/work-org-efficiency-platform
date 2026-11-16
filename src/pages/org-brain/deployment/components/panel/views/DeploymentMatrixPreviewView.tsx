import type {
	DeploymentDetail,
	DeploymentItem,
	DeployPositionMatrixRow,
} from "#src/api/org-brain/deployment";

import deploymentAProject from "#src/assets/svg/deployment-a-project.svg";
import emptyDataImage from "#src/assets/svg/empty-data.svg";
import { SectionTitle } from "#src/components";
import { ResizableSplitLayout } from "#src/components/resizable-split-layout";
import { Typography } from "antd";

import {
	MATRIX_COMPARE_GROUP_ID,
	MATRIX_COMPARE_LEFT_PANEL_ID,
	MATRIX_COMPARE_RIGHT_PANEL_ID,
} from "../compare-panels";
import { BenchmarkMatrixTable, EditableMatrixTable } from "../config-matrix";
import {
	DEPLOYMENT_MATRIX_CONFIG_TIP,
	DEPLOYMENT_PREVIEW_MATRIX_SCROLL_ROW_THRESHOLD,
	DEPLOYMENT_TABLE_DEFAULT_SCROLL_Y,
} from "../constants";
import { ProjectInfoDescriptions } from "../project-info";
import { DeploymentProjectPanel } from "../project-panel";
import { StatCardsRow } from "../stat-cards";

const { Text } = Typography;

function noopMatrixChange() {}

function resolvePreviewBodyScrollY(rowCount: number): number | false {
	if (rowCount > DEPLOYMENT_PREVIEW_MATRIX_SCROLL_ROW_THRESHOLD) {
		return DEPLOYMENT_TABLE_DEFAULT_SCROLL_Y;
	}
	return false;
}

function MatrixSectionEmptyState({ message }: { message: string }) {
	return (
		<div className="flex min-h-0 flex-1 flex-col items-center justify-center py-8 text-center">
			<img src={emptyDataImage} alt="" className="mb-4 h-[140px] w-[140px]" />
			<Text type="secondary">{message}</Text>
		</div>
	);
}

interface DeploymentMatrixPreviewViewProps {
	detail: DeploymentDetail;
	project: DeploymentItem;
	matrix: DeployPositionMatrixRow[];
}

/**
 * 排兵布阵预览双栏视图。
 *
 * 该组件只服务预览场景：
 * - 双栏支持拖拽
 * - 双栏高度按内容自然撑开
 * - 矩阵只读
 *
 * @param props - 组件属性
 * @param props.detail - 排兵布阵详情
 * @param props.project - 项目信息
 * @param props.matrix - 分析项目矩阵
 * @returns 预览双栏视图
 * @author 王善能
 * @since 2026-07-01
 */
export function DeploymentMatrixPreviewView({
	detail,
	project,
	matrix,
}: DeploymentMatrixPreviewViewProps) {
	const benchmarkProjectName = detail.benchmarkInfo?.benchmarkProjectName?.trim() || "/";
	const hasBenchmark = benchmarkProjectName !== "/";
	const hasBenchmarkMatrix = (detail?.benchmarkPositionMatrixList?.length ?? 0) > 0;
	const hasProjectMatrix = matrix.length > 0;

	const leftPanel = hasBenchmark ? (
		<DeploymentProjectPanel
			layoutMode="fill"
			headClassName="bg-[#0075ff]"
			title={
				<span className="inline-flex items-center gap-2">
					<span>标杆项目：{benchmarkProjectName}</span>
					<img src={deploymentAProject} alt="标杆项目" className="h-6 w-auto" />
				</span>
			}
			infoSection={
				<>
					<SectionTitle title="基础信息" className="mt-4" />
					<div className="shrink-0">
						<StatCardsRow stats={detail?.benchmarkStatistics} />
					</div>
					<ProjectInfoDescriptions detail={detail} isBenchmark />
				</>
			}
			matrixSection={
				<>
					<SectionTitle
						title="岗位矩阵配置"
						className="mb-3 shrink-0"
						extra={
							<Text type="secondary" className="text-xs">
								提示：来源 EHR 系统
							</Text>
						}
					/>
					{hasBenchmarkMatrix ? (
						<BenchmarkMatrixTable
							matrix={detail?.benchmarkPositionMatrixList ?? []}
							bodyScrollY={resolvePreviewBodyScrollY(
								detail?.benchmarkPositionMatrixList?.length ?? 0,
							)}
						/>
					) : (
						<MatrixSectionEmptyState message="暂无数据" />
					)}
				</>
			}
		/>
	) : (
		<div className="flex h-full min-h-0 flex-col items-center justify-center rounded border bg-white px-4 py-8 text-center shadow-sm">
			<img src={emptyDataImage} alt="" className="h-[140px] w-[140px]" />
			<Text type="secondary">暂无标杆参考，可基于项目基础信息进行各岗人数调配</Text>
		</div>
	);

	const rightPanel = (
		<DeploymentProjectPanel
			layoutMode="fill"
			headClassName="bg-[#14b968]"
			title={`分析项目：${project.projectName}`}
			infoSection={
				<>
					<SectionTitle title="基础信息" className="mt-4" />
					<div className="shrink-0">
						<StatCardsRow
							stats={detail?.projectStatistics}
							benchmarkStats={hasBenchmark ? detail?.benchmarkStatistics : undefined}
						/>
					</div>
					<ProjectInfoDescriptions detail={detail} />
				</>
			}
			matrixSection={
				<>
					<SectionTitle
						title="岗位矩阵配置"
						className="mb-3 shrink-0"
						extra={
							<Text type="secondary" className="text-xs" ellipsis={{ tooltip: true }}>
								{DEPLOYMENT_MATRIX_CONFIG_TIP}
							</Text>
						}
					/>
					{hasProjectMatrix ? (
						<EditableMatrixTable
							matrix={matrix}
							meta={[]}
							onChange={noopMatrixChange}
							readonly
							bodyScrollY={resolvePreviewBodyScrollY(matrix.length)}
						/>
					) : (
						<MatrixSectionEmptyState message="暂无数据，请在编制系统进行配置" />
					)}
				</>
			}
		/>
	);

	return (
		<ResizableSplitLayout
			groupId={MATRIX_COMPARE_GROUP_ID}
			leftPanelId={MATRIX_COMPARE_LEFT_PANEL_ID}
			rightPanelId={MATRIX_COMPARE_RIGHT_PANEL_ID}
			groupStyle={{ height: "auto" }}
			panelClassName="min-h-0"
			panelContentClassName="h-full min-h-0"
			left={leftPanel}
			right={rightPanel}
		/>
	);
}
