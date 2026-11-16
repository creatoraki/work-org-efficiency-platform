import type { DeploymentStepsProps } from "./types";

import { cn } from "#src/utils";
import "./DeploymentSteps.css";

/** 排兵布阵步骤条（局部组件，自定义实现） */
export function DeploymentSteps({
	current,
	items,
	layout = "horizontal",
	titleMaxWidth = 140,
}: DeploymentStepsProps) {
	if (layout === "vertical") {
		return (
			<nav className="flex flex-col gap-4" aria-label="步骤">
				{items.map((item, index) => {
					const isDone = index < current;
					const isCurrent = index === current;
					return (
						<div
							key={
								item.key ??
								(typeof item.title === "string" ? item.title : `step-${index}`)
							}
							className="flex items-start gap-3"
						>
							<span
								className={[
									"mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium text-white transition-colors duration-200",
									(isDone || isCurrent) && "bg-[rgb(var(--oo-colorPrimary))]",
									!isDone && !isCurrent && "bg-[#C0C4CC] text-white",
								]
									.filter(Boolean)
									.join(" ")}
								aria-current={isCurrent ? "step" : undefined}
							>
								{isDone ? "✓" : index + 1}
							</span>
							<div className="flex min-w-0 flex-1 flex-col">
								<span
									className={[
										"text-xs",
										isCurrent
											? "font-semibold text-[rgb(var(--oo-colorPrimary))]"
											: "font-semibold text-gray-600",
									]
										.filter(Boolean)
										.join(" ")}
								>
									{item.title}
								</span>
								{item.subtitle != null && (
									<span className="mt-0.5 text-xs text-gray-400">
										{item.subtitle}
									</span>
								)}
							</div>
						</div>
					);
				})}
			</nav>
		);
	}

	// horizontal：每步一列，连接线用伪元素画（样式见 DeploymentSteps.css），与圆点保持 8px
	const lineY = 12;
	const lineStart = 12 + 8; // 圆半径 + 间距
	return (
		<nav
			className="deployment-steps-nav flex flex-col"
			aria-label="步骤"
			style={
				{
					"--step-line-y": `${lineY}px`,
					"--step-line-start": `${lineStart}px`,
				} as React.CSSProperties
			}
		>
			<div className="flex">
				{items.map((item, index) => {
					const isDone = index < current;
					const isCurrent = index === current;
					const isLast = index === items.length - 1;
					const isFirst = index === 0;
					const stepKey =
						item.key ?? (typeof item.title === "string" ? item.title : `step-${index}`);
					const tailDone = !isLast && index < current;
					const headDone = !isFirst && index <= current;
					return (
						<div key={stepKey} className="flex min-w-0 flex-1 flex-col items-center">
							{/* 图标行：相对定位，伪元素画线从圆点中心到左右边界 */}
							<div
								className={[
									"deployment-step-icon-row relative flex w-full justify-center",
									isFirst && "deployment-step-first",
									isLast && "deployment-step-last",
								]
									.filter(Boolean)
									.join(" ")}
								style={{ height: 24 }}
								data-tail-done={!isLast && tailDone ? "true" : undefined}
								data-head-done={!isFirst && headDone ? "true" : undefined}
							>
								<span
									className={[
										"relative z-[1] flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium text-white transition-colors duration-200",
										(isDone || isCurrent) && "bg-[rgb(var(--oo-colorPrimary))]",
										!isDone && !isCurrent && "bg-[#C0C4CC] text-white",
									]
										.filter(Boolean)
										.join(" ")}
									aria-current={isCurrent ? "step" : undefined}
								>
									{isDone ? "✓" : index + 1}
								</span>
							</div>
							<div
								className="mt-1.5 flex flex-col items-center gap-0.5 text-center text-xs"
								style={{ maxWidth: titleMaxWidth }}
							>
								<span
									className={cn(
										"font-semibold",
										index === current && "text-[rgb(var(--oo-colorPrimary))]",
									)}
								>
									{item.title}
								</span>
								{item.subtitle != null && (
									<span className="text-gray-400">{item.subtitle}</span>
								)}
							</div>
						</div>
					);
				})}
			</div>
		</nav>
	);
}
