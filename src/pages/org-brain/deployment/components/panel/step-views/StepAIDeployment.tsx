import type { DeployCandidateItem } from "#src/api/org-brain/candidate";
import type {
	DeploymentDetail,
	DeploymentItem,
	DeploymentPlanStaffConfigItem,
	DeploySolutionMatrixRow,
} from "#src/api/org-brain/deployment";
import type { DeploymentNodeData } from "../deployment-graph/types";
import {
	applySolutionStaffMatrix,
	applyStaffConfigToSolutionRow,
	fetchDeploymentAiCandidates,
	formatDeploymentQualityScore,
} from "#src/api/org-brain/deployment";
import { TalentArchiveDrawer } from "#src/pages/org-brain/personnel-archive/components/talent-archive-drawer";
import { Radio, Typography } from "antd";
import message from "antd/es/message";
import { findIndex } from "lodash-es";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { BasicInfoBar } from "../basic-info-bar";
import { SCHEME_LABEL } from "../constants";
import { DeploymentGraphCanvas } from "../deployment-graph/DeploymentGraphCanvas";
import { buildDeploymentGraphData } from "../deployment-graph/graph-data";
import { deploymentGraphHandlersRef } from "../deployment-graph/nodes";
import { DeploymentCandidateDrawer } from "./DeploymentCandidateDrawer";

const { Text } = Typography;

interface StepAIDeploymentProps {
	detail?: DeploymentDetail | null;
	project: DeploymentItem;
	/** 步骤二时由 Panel 统一渲染基础信息，此处不重复展示 */
	hideBasicInfo?: boolean;
	/** 方案索引，由外部控制时使用；不传则内部管理 */
	activeSolutionIndex?: number;
	onActiveSolutionChange?: (index: number) => void;
	onSolutionsChange?: (solutions: DeploymentDetail["solutions"]) => void;
	/** 方案切换按钮容器 ref（左侧） */
	floatingSchemeContainerRef?: React.RefObject<HTMLDivElement | null>;
	/** 质量分容器 ref（右侧） */
	floatingQualityContainerRef?: React.RefObject<HTMLDivElement | null>;
}

/**
 * 步骤二 AI 排兵视图。
 *
 * 负责展示候选方案图谱、切换不同方案，并支持对叶子岗位进行人员替换。
 * 这里调整后的 `staffConfigList` 会直接回写到 `detail.solutions`，
 * 供后续步骤三方案选择、预览抽屉和 PDF 导出继续复用。
 *
 * @param props - 组件属性
 * @param props.detail - 排兵布阵详情
 * @param props.project - 项目基础信息
 * @param props.hideBasicInfo - 是否隐藏基础信息栏
 * @param props.activeSolutionIndex - 外部控制的方案索引
 * @param props.onActiveSolutionChange - 方案切换回调
 * @param props.onSolutionsChange - 方案矩阵更新回调
 * @param props.floatingSchemeContainerRef - 浮动方案切换容器
 * @param props.floatingQualityContainerRef - 浮动质量分容器
 * @returns AI 排兵视图
 * @author 王善能
 * @since 2026-06-12
 */
export function StepAIDeployment({
	detail,
	project,
	hideBasicInfo,
	activeSolutionIndex: externalSolutionIndex,
	onActiveSolutionChange,
	onSolutionsChange,
	floatingSchemeContainerRef,
	floatingQualityContainerRef,
}: StepAIDeploymentProps) {
	const [internalSolutionIndex, setInternalSolutionIndex] = useState(0);
	const activeSolutionIndex = externalSolutionIndex ?? internalSolutionIndex;
	const setActiveSolutionIndex = useCallback(
		(index: number) => {
			onActiveSolutionChange?.(index);
			if (externalSolutionIndex == null) {
				setInternalSolutionIndex(index);
			}
		},
		[onActiveSolutionChange, externalSolutionIndex],
	);
	const [solutionMatrixMap, setSolutionMatrixMap] = useState<
		Record<number, DeploySolutionMatrixRow[]>
	>({});
	const [drawerNodeData, setDrawerNodeData] = useState<DeploymentNodeData | null>(null);
	const [candidatesLoading, setCandidatesLoading] = useState(false);
	const [archiveCandidateId, setArchiveCandidateId] = useState<string | null>(null);
	const [archiveCandidateIds, setArchiveCandidateIds] = useState<string[]>([]);
	const [archiveCandidates, setArchiveCandidates] = useState<DeployCandidateItem[]>([]);
	const [isArchiveOpen, setIsArchiveOpen] = useState(false);
	const solutions = detail?.solutions ?? [];
	const currentSolution = solutions[activeSolutionIndex];

	const solutionSignature = useMemo(
		() =>
			solutions
				.map((solution) => `${solution.solutionNo}:${solution.staffMatrixList.length}`)
				.join("|"),
		[solutions],
	);

	useEffect(() => {
		setSolutionMatrixMap(() => {
			const next: Record<number, DeploySolutionMatrixRow[]> = {};
			solutions.forEach((solution) => {
				next[solution.solutionNo] = solution.staffMatrixList;
			});
			return next;
		});
		const checkedSolutionIndex = solutions.findIndex((solution) => solution.choice);
		setActiveSolutionIndex(checkedSolutionIndex >= 0 ? checkedSolutionIndex : 0);
	}, [solutionSignature, setActiveSolutionIndex]);

	const syncSolutionsToParent = useCallback(
		(matrixMap: Record<number, DeploySolutionMatrixRow[]>) => {
			if (!detail?.solutions || !onSolutionsChange) {
				return;
			}
			onSolutionsChange(
				detail.solutions.map((solution) => {
					const staffMatrixList =
						matrixMap[solution.solutionNo] ?? solution.staffMatrixList;
					return applySolutionStaffMatrix(solution, staffMatrixList);
				}),
			);
		},
		[detail?.solutions, onSolutionsChange],
	);

	const handleLeafUpdate = useCallback(
		(payload: {
			solutionNo: number;
			rowIndex: number;
			staffConfigList?: DeploymentPlanStaffConfigItem[];
		}) => {
			setSolutionMatrixMap((prev) => {
				const source = prev[payload.solutionNo] ?? [];
				const nextRows = source.map((row, index) => {
					if (index !== payload.rowIndex) {
						return row;
					}
					if (!payload.staffConfigList) {
						return row;
					}
					return applyStaffConfigToSolutionRow(row, payload.staffConfigList);
				});
				const next = {
					...prev,
					[payload.solutionNo]: nextRows,
				};
				syncSolutionsToParent(next);
				return next;
			});
		},
		[syncSolutionsToParent],
	);

	const handleOpenCandidateDrawer = useCallback(
		(nodeData: DeploymentNodeData) => {
			const requestId = detail?.requestId;
			setDrawerNodeData(nodeData);
			if (!requestId || !nodeData.positionCode) {
				setCandidatesLoading(false);
				return;
			}
			setCandidatesLoading(true);
			void fetchDeploymentAiCandidates(requestId, nodeData.positionCode)
				.then((candidates: DeployCandidateItem[]) => {
					setDrawerNodeData({
						...nodeData,
						candidates,
					});
				})
				.catch(() => {
					setDrawerNodeData(nodeData);
				})
				.finally(() => {
					setCandidatesLoading(false);
				});
		},
		[detail?.requestId],
	);

	const handleDrawerConfirm = useCallback(
		(staffConfigList: DeploymentPlanStaffConfigItem[]) => {
			if (
				!drawerNodeData ||
				drawerNodeData.solutionNo == null ||
				drawerNodeData.rowIndex == null
			) {
				return;
			}
			handleLeafUpdate({
				solutionNo: drawerNodeData.solutionNo,
				rowIndex: drawerNodeData.rowIndex,
				staffConfigList,
			});
			setDrawerNodeData(null);
		},
		[drawerNodeData, handleLeafUpdate],
	);

	const handleViewArchive = useCallback(
		(candidate: DeployCandidateItem, candidates: DeployCandidateItem[]) => {
			try {
				if (candidate.userId == null) {
					throw new Error("候选人缺少 userId，无法打开人员档案");
				}
				const currentUserId = String(candidate.userId);
				const candidateUserIds = candidates.map((item) => {
					if (item.userId == null) {
						throw new Error("候选人缺少 userId，无法打开人员档案");
					}
					return String(item.userId);
				});
				setArchiveCandidateId(currentUserId);
				setArchiveCandidateIds(
					candidateUserIds.length > 0 ? candidateUserIds : [currentUserId],
				);
				setArchiveCandidates(candidates);
				setIsArchiveOpen(true);
			} catch (error) {
				console.error("打开人员档案失败:", error);
				message.warning("当前候选人暂无可用档案");
			}
		},
		[],
	);

	const archiveCandidateIndex = useMemo(
		() =>
			archiveCandidateId
				? findIndex(archiveCandidateIds, (code) => code === archiveCandidateId)
				: -1,
		[archiveCandidateId, archiveCandidateIds],
	);
	const archiveCurrentCandidate = useMemo(
		() =>
			archiveCandidateId
				? (archiveCandidates.find(
						(candidate) =>
							candidate.userId != null &&
							String(candidate.userId) === archiveCandidateId,
					) ?? null)
				: null,
		[archiveCandidateId, archiveCandidates],
	);

	deploymentGraphHandlersRef.onLeafUpdate = handleLeafUpdate;
	deploymentGraphHandlersRef.onOpenCandidateDrawer = handleOpenCandidateDrawer;

	const graphData = useMemo(() => {
		if (!currentSolution) {
			return { nodes: [], edges: [] };
		}
		const matrix =
			solutionMatrixMap[currentSolution.solutionNo] ?? currentSolution.staffMatrixList;
		return buildDeploymentGraphData({
			projectName: project.projectName,
			solutionNo: currentSolution.solutionNo,
			matrix,
		});
	}, [
		activeSolutionIndex,
		currentSolution,
		project.projectName,
		solutionMatrixMap,
		solutions.length,
	]);

	const solutionKey = currentSolution ? String(currentSolution.solutionNo) : "none";
	const solutionLabel = currentSolution
		? `方案${SCHEME_LABEL[currentSolution.solutionNo] ?? currentSolution.solutionNo}`
		: "";

	const solutionLabels = solutions.map((solution, index) => ({
		label: `方案${SCHEME_LABEL[solution.solutionNo] ?? solution.solutionNo}`,
		value: index,
	}));

	const schemeControl =
		solutions.length > 0 ? (
			<Radio.Group
				optionType="button"
				buttonStyle="solid"
				value={activeSolutionIndex}
				onChange={(e) => setActiveSolutionIndex(e.target.value)}
				options={solutionLabels}
				className="[&_.ant-radio-button-wrapper]:min-w-[80px] [&_.ant-radio-button-wrapper]:text-center"
			/>
		) : null;

	const qualityControl =
		solutions.length > 0 ? (
			<Text className="text-[13px] text-[#5F6B7A]">
				质量分：
				<Text strong className="ml-1 text-[15px] text-[#151B26]">
					{currentSolution
						? formatDeploymentQualityScore(currentSolution.matchScore)
						: "/"}
				</Text>
				<span className="ml-0.5 text-[#151B26]">分</span>
			</Text>
		) : null;

	const schemeTarget = floatingSchemeContainerRef?.current;
	const qualityTarget = floatingQualityContainerRef?.current;
	const hasPortalTargets = schemeTarget && qualityTarget;

	return (
		<div className="flex h-full min-h-0 flex-col">
			{!hideBasicInfo && (
				<div className="mb-3 shrink-0">
					<BasicInfoBar detail={detail} project={project} />
				</div>
			)}
			<DeploymentCandidateDrawer
				open={!!drawerNodeData}
				nodeData={drawerNodeData}
				candidatesLoading={candidatesLoading}
				onClose={() => {
					setDrawerNodeData(null);
					setCandidatesLoading(false);
				}}
				onConfirm={handleDrawerConfirm}
				onViewArchive={handleViewArchive}
			/>

			<TalentArchiveDrawer
				open={isArchiveOpen}
				userId={archiveCandidateId ?? ""}
				matchRate={archiveCurrentCandidate?.matchScore}
				isCandidateMode
				currentIndex={archiveCandidateIndex >= 0 ? archiveCandidateIndex + 1 : 0}
				totalCount={archiveCandidateIds.length}
				canPrevious={archiveCandidateIndex > 0}
				canNext={
					archiveCandidateIndex >= 0 &&
					archiveCandidateIndex < archiveCandidateIds.length - 1
				}
				onPrevious={() => {
					if (archiveCandidateIndex > 0) {
						setArchiveCandidateId(
							archiveCandidateIds[archiveCandidateIndex - 1] ?? null,
						);
					}
				}}
				onNext={() => {
					if (
						archiveCandidateIndex >= 0 &&
						archiveCandidateIndex < archiveCandidateIds.length - 1
					) {
						setArchiveCandidateId(
							archiveCandidateIds[archiveCandidateIndex + 1] ?? null,
						);
					}
				}}
				onClose={() => {
					setIsArchiveOpen(false);
					setArchiveCandidateId(null);
					setArchiveCandidateIds([]);
					setArchiveCandidates([]);
				}}
			/>

			{schemeTarget && schemeControl ? createPortal(schemeControl, schemeTarget) : null}
			{qualityTarget && qualityControl ? createPortal(qualityControl, qualityTarget) : null}

			<div className="relative min-h-0 w-full flex-1">
				{solutions.length > 0 ? (
					<>
						<div className="h-full w-full">
							<DeploymentGraphCanvas
								data={graphData}
								schemeKey={solutionKey}
								schemeLabel={solutionLabel}
							/>
						</div>

						{!hasPortalTargets && (
							<>
								<div className="absolute left-4 top-4 z-10">{schemeControl}</div>
								<div className="absolute right-4 top-4 z-10">{qualityControl}</div>
							</>
						)}
					</>
				) : (
					<div className="py-16 text-center">
						<Text type="secondary">暂无排兵布阵方案，请先完成步骤一配置</Text>
					</div>
				)}
			</div>
		</div>
	);
}
