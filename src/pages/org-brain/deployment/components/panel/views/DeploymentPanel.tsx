import type { DeploymentDetail, DeployPositionMatrixRow } from "#src/api/org-brain/deployment";
import type { EditableMatrixTableHandle } from "../config-matrix";
import type { DeploymentPanelProps } from "../types";

import {
	buildAiStaffRequestItems,
	buildSolutionsFromStaffTree,
	commitDeploymentPlan,
	createDeploymentAiStaff,
	fetchDeploymentStaffTree,
	stashDeploymentDraft,
} from "#src/api/org-brain/deployment";
import { BasicContent } from "#src/components";
import { cn } from "#src/utils";
import { Button, Spin } from "antd";
import message from "antd/es/message";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BasicInfoBar, StepAIDeployment, StepConfigMatrix, StepPlanSelection } from "../step-views";
import {
	DEPLOYMENT_STEP_BAR_ITEMS,
	DEPLOYMENT_STEP_DEFINITIONS,
	DeploymentSteps,
	INITIAL_STEP_INDEX,
	STEP_BAR_LAYOUT_CLASS,
} from "../steps";
import { buildDeploymentDetailMatrixHydrationKey } from "./deployment-detail-hydration";
import {
	buildDeploymentPersistDebugPayloads,
	buildDeploymentSavePayload,
	resolveDeploymentPersistContext,
} from "./deployment-persist-payload";
import { DeploymentPayloadDebugDrawer } from "./DeploymentPayloadDebugDrawer";
import { DeploymentPreviewDrawer } from "./DeploymentPreviewDrawer";
import { useAiTaskWaiter } from "./useAiTaskWaiter";

const STEP_COUNT = DEPLOYMENT_STEP_DEFINITIONS.length;

const IS_DEV = import.meta.env.DEV;

export function DeploymentPanel({
	mode,
	project,
	detail,
	findingBenchmark = false,
	onBack,
	onFindBenchmarkProject,
}: DeploymentPanelProps) {
	const [currentStep, setCurrentStep] = useState(INITIAL_STEP_INDEX);
	const [headerExpanded, setHeaderExpanded] = useState(true);
	const [editableMatrix, setEditableMatrix] = useState<DeployPositionMatrixRow[]>(
		() => detail?.projectPositionMatrixList ?? [],
	);
	const [localDetail, setLocalDetail] = useState<DeploymentDetail | null>(null);
	const [executing, setExecuting] = useState(false);
	const [stashingDraft, setStashingDraft] = useState(false);
	const [committingPlan, setCommittingPlan] = useState(false);
	const [nextStepPending, setNextStepPending] = useState(false);
	const [previewOpen, setPreviewOpen] = useState(false);
	const [payloadDebugOpen, setPayloadDebugOpen] = useState(false);
	const nextStepPendingRef = useRef(false);
	const matrixTableRef = useRef<EditableMatrixTableHandle>(null);
	const hydratedMatrixKeyRef = useRef<string>();
	const { createWaiter, disposeCurrentWaiter } = useAiTaskWaiter();

	const mergedDetail = useMemo(() => {
		const baseDetail = localDetail ?? detail;
		if (!baseDetail) {
			return baseDetail;
		}
		return {
			...baseDetail,
			originProjectPositionMatrixList: baseDetail.originProjectPositionMatrixList?.length
				? baseDetail.originProjectPositionMatrixList
				: (detail?.originProjectPositionMatrixList ?? []),
		};
	}, [localDetail, detail]);
	const detailMatrixHydrationKey = useMemo(
		() => buildDeploymentDetailMatrixHydrationKey(project.id, detail),
		[detail, project.id],
	);

	const currentStepDef = DEPLOYMENT_STEP_DEFINITIONS[currentStep];
	const currentStepKey = currentStepDef?.key;

	useEffect(() => {
		if (!detail || hydratedMatrixKeyRef.current === detailMatrixHydrationKey) {
			return;
		}
		hydratedMatrixKeyRef.current = detailMatrixHydrationKey;
		setEditableMatrix(detail.projectPositionMatrixList ?? []);
		setLocalDetail(null);
	}, [detail, detailMatrixHydrationKey]);

	/** 步骤二已有 requestId 但 solutions 为空时，按人员树补建方案 */
	useEffect(() => {
		if (currentStepKey !== "deploy") {
			return;
		}
		const requestId = mergedDetail?.requestId;
		const solutions = mergedDetail?.solutions ?? [];
		const matrixForRecovery =
			editableMatrix.length > 0
				? editableMatrix
				: (mergedDetail?.projectPositionMatrixList ?? []);
		if (!requestId || solutions.length > 0 || matrixForRecovery.length === 0) {
			return;
		}
		let cancelled = false;
		void fetchDeploymentStaffTree(project.id, requestId)
			.then((staffTree) => {
				if (cancelled) {
					return;
				}
				const rebuiltSolutions = buildSolutionsFromStaffTree(matrixForRecovery, staffTree);
				if (rebuiltSolutions.length > 0 && mergedDetail) {
					setLocalDetail({
						...mergedDetail,
						solutions: rebuiltSolutions,
					});
				}
			})
			.catch(() => {});
		return () => {
			cancelled = true;
		};
	}, [currentStepKey, editableMatrix, mergedDetail, project.id]);

	const runNextStep = useCallback(async () => {
		if (currentStepKey === "matrix") {
			const matrixValid = (await matrixTableRef.current?.validate()) ?? false;
			if (!matrixValid) {
				message.warning("请先完善岗位匹配配置中的必填项");
				return;
			}
			setExecuting(true);
			try {
				const aiTaskWaiter = createWaiter(project.id);
				await createDeploymentAiStaff(project.id, buildAiStaffRequestItems(editableMatrix));
				const requestId = await aiTaskWaiter.promise;
				const staffTree = await fetchDeploymentStaffTree(project.id, requestId);
				const solutions = buildSolutionsFromStaffTree(editableMatrix, staffTree);
				if (mergedDetail) {
					setLocalDetail({
						...mergedDetail,
						requestId: String(requestId),
						projectPositionMatrixList: editableMatrix,
						solutions,
					});
				}
				setCurrentStep(currentStep + 1);
			} catch (error) {
				const errMsg =
					error instanceof Error ? error.message : "一键排兵布阵执行失败，请重试";
				message.error(errMsg);
			} finally {
				disposeCurrentWaiter();
				setExecuting(false);
			}
			return;
		}
		if (currentStep < STEP_COUNT - 1) setCurrentStep(currentStep + 1);
	}, [
		createWaiter,
		currentStep,
		currentStepKey,
		disposeCurrentWaiter,
		editableMatrix,
		mergedDetail,
		project.id,
	]);

	/** 用受控 loading/disabled 防止连点；原生 disabled 会被 React 重渲染覆盖 */
	const handleNextClick = useCallback(() => {
		if (nextStepPendingRef.current) {
			return;
		}
		nextStepPendingRef.current = true;
		setNextStepPending(true);
		void runNextStep().finally(() => {
			nextStepPendingRef.current = false;
			setNextStepPending(false);
		});
	}, [runNextStep]);

	const handlePrev = useCallback(() => {
		if (currentStep > 0) setCurrentStep(currentStep - 1);
	}, [currentStep]);

	/** 步骤一/二：暂存草稿，对应 POST deploy/save */
	const handleStashDeploymentDraft = useCallback(async () => {
		setStashingDraft(true);
		try {
			const context = resolveDeploymentPersistContext(editableMatrix, mergedDetail);
			const payload = buildDeploymentSavePayload(
				project.id,
				context,
				context.selectedSolution?.solutionNo,
			);
			const stashed = await stashDeploymentDraft(payload);
			if (stashed) {
				message.success("暂存成功");
			} else {
				message.error("暂存失败，请稍后重试");
			}
		} catch {
			message.error("暂存失败，请稍后重试");
		} finally {
			setStashingDraft(false);
		}
	}, [editableMatrix, mergedDetail, project.id]);

	/** 步骤三：保存并提交最终方案，对应 POST deploy/commit */
	const handleCommitDeploymentPlan = useCallback(async () => {
		setCommittingPlan(true);
		try {
			const context = resolveDeploymentPersistContext(editableMatrix, mergedDetail);
			if (!context.selectedSolution) {
				message.warning("请先选择方案后再保存");
				return;
			}
			const payload = buildDeploymentSavePayload(
				project.id,
				context,
				context.selectedSolution.solutionNo,
			);
			const committed = await commitDeploymentPlan(payload);
			if (committed) {
				message.success("保存成功");
				onBack();
			} else {
				message.error("保存失败，请稍后重试");
			}
		} catch {
			message.error("保存失败，请稍后重试");
		} finally {
			setCommittingPlan(false);
		}
	}, [editableMatrix, mergedDetail, onBack, project.id]);

	const handleSelectSolution = useCallback(
		(solutionNo: number) => {
			if (!mergedDetail?.solutions) {
				return;
			}
			setLocalDetail({
				...mergedDetail,
				solutions: mergedDetail.solutions.map((solution) => ({
					...solution,
					choice: solution.solutionNo === solutionNo,
				})),
			});
		},
		[mergedDetail],
	);

	/** 矩阵步骤：有行数据即可点击下一步，具体必填项由 Form validateOnly 校验 */
	const canProceedFromMatrix = currentStepKey !== "matrix" || editableMatrix.length > 0;
	const isLastStep = currentStep === STEP_COUNT - 1;
	const persistDebugPayloads = useMemo(
		() => buildDeploymentPersistDebugPayloads(project.id, editableMatrix, mergedDetail),
		[editableMatrix, mergedDetail, project.id],
	);

	const renderStepContent = () => {
		switch (currentStepKey) {
			case "matrix":
				return (
					<StepConfigMatrix
						detail={mergedDetail}
						project={project}
						findingBenchmark={findingBenchmark}
						editableMatrix={editableMatrix}
						onMatrixChange={setEditableMatrix}
						onFindBenchmarkProject={onFindBenchmarkProject}
						matrixTableRef={matrixTableRef}
					/>
				);
			case "deploy":
				return (
					<StepAIDeployment
						detail={mergedDetail}
						project={project}
						hideBasicInfo
						onSolutionsChange={(solutions) => {
							if (!mergedDetail) {
								return;
							}
							setLocalDetail({
								...mergedDetail,
								solutions: solutions ?? undefined,
							});
						}}
					/>
				);
			case "selection":
				return (
					<StepPlanSelection
						detail={mergedDetail}
						project={project}
						onSelectSolution={handleSelectSolution}
					/>
				);
			default:
				return null;
		}
	};

	const dotPatternStyle: React.CSSProperties = {
		backgroundImage: "radial-gradient(circle, #d3d3d3 1px, transparent 1px)",
		backgroundSize: "20px 20px",
		backgroundColor: "#f8f9fa",
	};

	/**
	 * 矩阵步骤空态：仅当完全没有详情数据时展示空态页脚。
	 * 有详情但无标杆项目时，用户仍可配置右侧分析项目矩阵并继续下一步。
	 */
	const isMatrixEmptyState = currentStepKey === "matrix" && !mergedDetail;
	/** 仅首次排兵布阵展示「暂存」；调整模式走步骤三「保存」提交 */
	const showStashDraftButton = mode === "create" && !isMatrixEmptyState;
	const isSelectionStep = currentStepKey === "selection";
	const hasSelectedSolution = Boolean(
		mergedDetail?.solutions?.some((solution) => solution.choice),
	);

	const btnFocusClass = cn(
		"focus-visible:outline-none",
		"focus-visible:ring-2 focus-visible:ring-[rgb(var(--oo-colorPrimary))] focus-visible:ring-offset-2",
	);

	const handleBackToDeploymentList = useCallback(() => {
		disposeCurrentWaiter();
		onBack();
	}, [disposeCurrentWaiter, onBack]);

	const footer = (
		<footer className="sticky bottom-0 z-10 flex shrink-0 items-center justify-between gap-3 border-t bg-white px-6 py-3">
			<div className="flex items-center">
				{IS_DEV && !isMatrixEmptyState ? (
					<Button className={btnFocusClass} onClick={() => setPayloadDebugOpen(true)}>
						调试 JSON
					</Button>
				) : null}
			</div>
			<div className="flex items-center justify-end gap-2">
				{isMatrixEmptyState ? (
					<Button className={btnFocusClass} onClick={handleBackToDeploymentList}>
						返回到排兵布阵
					</Button>
				) : (
					<>
						<Button className={btnFocusClass} onClick={handleBackToDeploymentList}>
							返回到排兵布阵
						</Button>
						{showStashDraftButton && !isSelectionStep ? (
							<Button
								className={btnFocusClass}
								onClick={() => void handleStashDeploymentDraft()}
								loading={stashingDraft}
							>
								暂存
							</Button>
						) : null}
						{isSelectionStep ? (
							<Button
								className={btnFocusClass}
								onClick={() => setPreviewOpen(true)}
								disabled={!mergedDetail?.solutions?.length || !hasSelectedSolution}
							>
								预览
							</Button>
						) : null}
						{currentStep > 0 && (
							<Button className={btnFocusClass} onClick={handlePrev}>
								上一步
							</Button>
						)}
						{isSelectionStep ? (
							<Button
								className={btnFocusClass}
								type="primary"
								onClick={() => void handleCommitDeploymentPlan()}
								loading={committingPlan}
								disabled={!mergedDetail?.solutions?.length || !hasSelectedSolution}
							>
								保存
							</Button>
						) : null}
						{!isLastStep ? (
							<Button
								className={btnFocusClass}
								type="primary"
								onClick={handleNextClick}
								loading={executing || nextStepPending}
								disabled={!canProceedFromMatrix || nextStepPending}
							>
								下一步
							</Button>
						) : null}
					</>
				)}
			</div>
		</footer>
	);

	const headerMode = currentStepDef?.headerMode ?? "plain";
	const isDeployStep = currentStepKey === "deploy";
	const unifiedHeaderHeight = headerExpanded ? 292 : 88;

	/**
	 * 统一渲染步骤头部。
	 * plain 仅展示步骤条；collapsible 复用带边框、基础信息与展开收起的一体化头部。
	 */
	const renderHeader = () => {
		if (headerMode === "collapsible") {
			return (
				<div
					className="relative rounded-lg border border-[#EBEEF5] bg-white transition-[height] duration-300 ease-in-out"
					style={{ height: unifiedHeaderHeight }}
				>
					<div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg">
						<div className="relative shrink-0 px-6 py-4">
							<div className={STEP_BAR_LAYOUT_CLASS}>
								<DeploymentSteps
									current={currentStep}
									items={DEPLOYMENT_STEP_BAR_ITEMS}
								/>
							</div>
						</div>
						<div className="min-h-0 flex-1 px-4 py-4">
							<div
								className={cn(
									"h-full overflow-hidden transition-opacity duration-200",
									!headerExpanded && "opacity-0",
								)}
							>
								<BasicInfoBar detail={mergedDetail} project={project} />
							</div>
						</div>
						<button
							type="button"
							className={cn(
								"absolute bottom-0 left-1/2 z-10 flex size-6 -translate-x-1/2 translate-y-1/2 cursor-pointer select-none items-center justify-center rounded-full border border-[#DCDFE6] bg-white text-[#909399] shadow-sm outline-none active:scale-95 active:outline-none",
								headerExpanded ? "" : "rotate-180",
							)}
							style={{
								transition: "transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
							}}
							onClick={() => setHeaderExpanded((prev) => !prev)}
							aria-label={headerExpanded ? "收起基础信息" : "展开基础信息"}
						>
							<ChevronDown className="size-4" />
						</button>
					</div>
				</div>
			);
		}

		return (
			<div className={STEP_BAR_LAYOUT_CLASS}>
				<DeploymentSteps current={currentStep} items={DEPLOYMENT_STEP_BAR_ITEMS} />
			</div>
		);
	};

	return (
		<section className="flex h-full min-h-0 flex-col overflow-hidden bg-white">
			<BasicContent className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden !p-6">
				<header className="shrink-0">{renderHeader()}</header>
				<main className="relative min-h-0 flex-1 overflow-hidden">
					<div
						className="h-full min-h-0 w-full overflow-hidden"
						style={isDeployStep ? dotPatternStyle : undefined}
					>
						<AnimatePresence mode="wait">
							<motion.div
								key={currentStepKey}
								initial={{ opacity: 0, y: 0 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: 0 }}
								transition={{
									duration: 0.2,
									ease: "easeOut",
								}}
								className="h-full min-h-0 w-full"
							>
								{renderStepContent()}
							</motion.div>
						</AnimatePresence>
					</div>
					{executing ? (
						<div className="absolute inset-0 z-20 flex items-center justify-center bg-white/60 backdrop-blur-[1px]">
							<Spin size="large" tip="排兵布阵中">
								<div className="h-24 w-24" />
							</Spin>
						</div>
					) : null}
				</main>
			</BasicContent>

			{/* 底部按钮 */}
			{footer}

			{IS_DEV ? (
				<DeploymentPayloadDebugDrawer
					open={payloadDebugOpen}
					onClose={() => setPayloadDebugOpen(false)}
					payloads={persistDebugPayloads}
				/>
			) : null}
			<DeploymentPreviewDrawer
				open={previewOpen}
				detail={mergedDetail}
				project={project}
				onClose={() => setPreviewOpen(false)}
				dataMode="preview"
			/>
		</section>
	);
}
