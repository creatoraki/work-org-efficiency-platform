import type { OrganizationTreeNode } from "#src/api/common";
import type {
	DeploymentDetail,
	DeploymentItem,
	DeployPositionMatrixRow,
	PositionMatrixMetaItem,
} from "#src/api/org-brain/deployment";

import type { Ref } from "react";
import type { EditableMatrixTableHandle } from "../config-matrix";
import { fetchOrganizationTree } from "#src/api/common";
import { fetchDeploymentPositionMatrixMeta } from "#src/api/org-brain/deployment";
import deploymentAProject from "#src/assets/svg/deployment-a-project.svg";
import emptyDataImage from "#src/assets/svg/empty-data.svg";
import { SectionTitle } from "#src/components";
import { ResizableSplitLayout } from "#src/components/resizable-split-layout";
import { createDeploymentOrganizationResolver } from "#src/utils";
import { useQuery } from "@tanstack/react-query";
import { Button, Typography } from "antd";
import { useEffect } from "react";

import {
	MATRIX_COMPARE_GROUP_ID,
	MATRIX_COMPARE_LEFT_PANEL_ID,
	MATRIX_COMPARE_RIGHT_PANEL_ID,
} from "../compare-panels";
import { BenchmarkMatrixTable, EditableMatrixTable } from "../config-matrix";
import { DEPLOYMENT_MATRIX_CONFIG_TIP } from "../constants";
import { ProjectInfoDescriptions } from "../project-info";
import { DeploymentProjectPanel } from "../project-panel";
import { StatCardsRow } from "../stat-cards";

const { Text } = Typography;

/**
 * onFindBenchmarkProject 未传时的空操作占位函数。
 * 使用默认参数绑定此函数，避免在组件内部做空值判断。
 */
function noopFindBenchmarkProject() {}

/**
 * 步骤一矩阵区域无数据时的空态组件。
 *
 * @param props - 组件属性
 * @param props.message - 空态提示文案
 * @returns 空态组件
 * @author 王善能
 * @since 2026-07-01
 */
function MatrixSectionEmptyState({ message }: { message: string }) {
	return (
		<div className="flex h-full min-h-0 flex-col items-center justify-center text-center">
			<img src={emptyDataImage} alt="" className="mb-4 h-[140px] w-[140px]" />
			<Text type="secondary">{message}</Text>
		</div>
	);
}

/**
 * 步骤一「配置岗位矩阵」组件的 Props。
 */
interface StepConfigMatrixProps {
	detail?: DeploymentDetail | null;
	project: DeploymentItem;
	findingBenchmark?: boolean;
	editableMatrix: DeployPositionMatrixRow[];
	onMatrixChange: (matrix: DeployPositionMatrixRow[]) => void;
	onFindBenchmarkProject?: () => void;
	matrixTableRef?: Ref<EditableMatrixTableHandle>;
}

/**
 * 步骤一：根据标杆项目配置岗位矩阵。
 *
 * 该组件只服务步骤一固定高度场景：
 * - 左右双栏充满父容器
 * - 双栏支持拖拽
 * - 双栏内容区内部滚动
 * - 右侧矩阵可编辑
 *
 * @param props - 组件属性
 * @param props.detail - 排兵布阵详情数据
 * @param props.project - 待交付项目信息
 * @param props.findingBenchmark - 是否正在执行寻找标杆项目请求
 * @param props.editableMatrix - 可编辑矩阵行数据
 * @param props.onMatrixChange - 矩阵变更回调
 * @param props.onFindBenchmarkProject - 寻找标杆项目回调
 * @param props.matrixTableRef - 岗位矩阵表校验句柄
 * @returns 步骤一配置岗位矩阵视图
 * @author 王善能
 * @since 2026-07-01
 */
export function StepConfigMatrix({
	detail,
	project,
	findingBenchmark = false,
	editableMatrix,
	onMatrixChange,
	onFindBenchmarkProject = noopFindBenchmarkProject,
	matrixTableRef,
}: StepConfigMatrixProps) {
	useEffect(() => {
		if (detail?.projectPositionMatrixList && editableMatrix.length === 0) {
			onMatrixChange(detail.projectPositionMatrixList);
		}
	}, [detail?.projectPositionMatrixList, editableMatrix.length, onMatrixChange]);

	const { data: matrixMeta = [] } = useQuery<PositionMatrixMetaItem[]>({
		queryKey: ["deployment-position-matrix-meta", project.id],
		queryFn: () => fetchDeploymentPositionMatrixMeta(project.id),
		enabled: !!project.id,
	});
	const { data: organizationTreeData = null } = useQuery<OrganizationTreeNode | null>({
		queryKey: ["tag-matching-organization-tree"],
		queryFn: async () => {
			const result = await fetchOrganizationTree();
			return result || null;
		},
		staleTime: 10 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
	});

	const hasDetail = !!detail;
	const benchmarkProjectName = detail?.benchmarkInfo?.benchmarkProjectName?.trim() || "/";
	const hasBenchmark = benchmarkProjectName !== "/";
	const hasBenchmarkMatrix = (detail?.benchmarkPositionMatrixList?.length ?? 0) > 0;
	const orgMatchId = detail?.serverCode?.trim() || detail?.projectGroupCode?.trim() || undefined;
	const resolveDeploymentOrganizationNode =
		createDeploymentOrganizationResolver(organizationTreeData);
	const matchingModelOrganizationNode = resolveDeploymentOrganizationNode(
		detail?.serverCode,
		detail?.projectGroupCode,
	);
	const orgMatchName =
		matchingModelOrganizationNode?.name?.trim() ||
		detail?.projectGroupName?.trim() ||
		project.projectGroupName?.trim() ||
		"";

	if (!hasDetail) {
		return (
			<div className="flex h-full min-h-0 flex-col items-center justify-center rounded-lg bg-white">
				<img src={emptyDataImage} alt="未搜索到标杆项目" className="h-[196px] w-[196px]" />
				<div className="mt-2 flex flex-col items-center gap-2">
					<Text type="secondary">请点击"寻找标杆项目"，再进行配置岗位矩阵</Text>
					<Button
						type="primary"
						loading={findingBenchmark}
						onClick={onFindBenchmarkProject}
					>
						寻找标杆项目
					</Button>
				</div>
			</div>
		);
	}

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
						<div className="shrink-0 overflow-hidden">
							<BenchmarkMatrixTable
								matrix={detail?.benchmarkPositionMatrixList ?? []}
								bodyScrollY={false}
							/>
						</div>
					) : (
						<MatrixSectionEmptyState message="暂无数据" />
					)}
				</>
			}
		/>
	) : (
		<div className="flex h-full min-h-0 flex-col items-center justify-center rounded border bg-white px-4 text-center shadow-sm">
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
					<div className="shrink-0 overflow-hidden">
						<EditableMatrixTable
							ref={matrixTableRef}
							matrix={editableMatrix}
							meta={matrixMeta}
							orgMatchId={orgMatchId}
							orgMatchName={orgMatchName}
							organizationTreeData={matchingModelOrganizationNode}
							onChange={onMatrixChange}
							bodyScrollY={false}
						/>
					</div>
				</>
			}
		/>
	);

	return (
		<ResizableSplitLayout
			groupId={MATRIX_COMPARE_GROUP_ID}
			leftPanelId={MATRIX_COMPARE_LEFT_PANEL_ID}
			rightPanelId={MATRIX_COMPARE_RIGHT_PANEL_ID}
			groupClassName="h-full min-h-0"
			panelClassName="min-h-0"
			panelContentClassName="h-full min-h-0"
			left={leftPanel}
			right={rightPanel}
		/>
	);
}
