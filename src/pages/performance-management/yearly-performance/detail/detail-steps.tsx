import { cn } from "#src/utils";
import { Check } from "lucide-react";
import { DETAIL_STEP_TITLES, DetailStep } from "../constants";

interface DetailStepsProps {
	/** 流程当前步骤（由述职状态决定） */
	currentStep: DetailStep;
	/** 流程是否全部完成（报告已生成） */
	finished: boolean;
	/** 正在查看的步骤 */
	viewingStep: DetailStep;
	/** 切换查看步骤（仅允许查看已到达的步骤） */
	onViewStepChange: (step: DetailStep) => void;
}

/**
 * 详情三步流程条
 *
 * 24px 圆形节点：已完成为白底主色描边对勾，当前为主色实心序号，未开始为 #C0C4CC 实心序号；
 * 节点间连线已完成段主色、未完成段 #C0C4CC。三个节点按标题宽度两端分布，整体宽度固定，全屏时居中。
 * 已到达的步骤可点击回看，正在查看的步骤标题加下划线提示。
 *
 * @param props - 组件属性
 * @param props.currentStep - 流程当前步骤（由述职状态决定）
 * @param props.finished - 流程是否全部完成（报告已生成）
 * @param props.viewingStep - 正在查看的步骤
 * @param props.onViewStepChange - 切换查看步骤（仅允许查看已到达的步骤）
 * @returns 流程条
 *
 * @since 2026-11-16
 */
export function DetailSteps({
	currentStep,
	finished,
	viewingStep,
	onViewStepChange,
}: DetailStepsProps) {
	const steps = [DetailStep.PREPARE, DetailStep.RECORDING, DetailStep.REPORT];
	return (
		<div className="relative mx-auto flex w-full max-w-[577px] justify-between px-[19px]">
			{steps.map((step) => {
				const done = step < currentStep || (finished && step === currentStep);
				const current = step === currentStep && !finished;
				const reachable = step <= currentStep;
				return (
					<button
						key={step}
						type="button"
						disabled={!reachable}
						onClick={() => onViewStepChange(step)}
						className={cn(
							"relative z-[1] flex w-[104px] flex-col items-center border-none bg-transparent p-0",
							reachable ? "cursor-pointer" : "cursor-default",
						)}
					>
						<span
							className={cn(
								"flex size-6 items-center justify-center rounded-full text-sm leading-none",
								done &&
									"border-2 border-solid border-[#0075FF] bg-white text-[#0075FF]",
								current && "bg-[#0075FF] text-white",
								!done && !current && "bg-[#C0C4CC] text-white",
							)}
						>
							{done ? <Check className="size-3.5" strokeWidth={2.5} /> : step + 1}
						</span>
						<span
							className={cn(
								"mt-2 whitespace-nowrap text-sm font-semibold leading-[22px] text-[#323233] underline-offset-4",
								viewingStep === step &&
									step !== currentStep &&
									"underline decoration-[#0075FF]",
							)}
						>
							{DETAIL_STEP_TITLES[step]}
						</span>
					</button>
				);
			})}
			{/* 连线：位于相邻节点之间，左右各留 8px */}
			{[0, 1].map((index) => (
				<span
					key={index}
					aria-hidden
					className={cn(
						"absolute top-[11px] h-0.5",
						index < currentStep ? "bg-[#0075FF]" : "bg-[#C0C4CC]",
					)}
					style={{
						// 节点中心位于 19 + 52 + i * (区间宽度)，用 calc 按容器宽度计算
						left: `calc(19px + 52px + 12px + 8px + ${index} * ((100% - 38px - 104px) / 2))`,
						width: "calc((100% - 38px - 104px) / 2 - 40px)",
					}}
				/>
			))}
		</div>
	);
}
