import { motion } from "motion/react";
import { useState } from "react";

export interface WaterDropTabsProps {
	tabs: { label: string; count?: number; value: number }[];
	activeIdx?: number;
	onChange?: (idx: number) => void;
	className?: string;
	style?: React.CSSProperties;
	layoutId?: string;
	color?: string;
}

export function WaterDropTabs({
	tabs,
	activeIdx: propActiveIdx,
	onChange,
	className = "",
	style,
	layoutId = "water-drop-active",
	color,
}: WaterDropTabsProps) {
	const [internalActiveIdx, setInternalActiveIdx] = useState(0);
	const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
	const activeIdx = propActiveIdx !== undefined ? propActiveIdx : internalActiveIdx;
	const activeColor = color || "rgb(var(--oo-colorPrimary))";

	const handleClick = (idx: number) => {
		if (onChange) {
			onChange(idx);
		} else {
			setInternalActiveIdx(idx);
		}
	};

	return (
		<div className={`flex w-full items-center bg-[#f0f2f5] ${className}`} style={style}>
			{tabs.map((tab, idx) => {
				const isActive = activeIdx === idx;
				const isHovered = hoveredIdx === idx;
				const isFirst = idx === 0;
				const isLast = idx === tabs.length - 1;

				return (
					<div
						key={tab.label}
						className={`relative z-0 flex h-[36px] min-w-0 flex-1 cursor-pointer select-none items-center justify-center overflow-visible whitespace-nowrap px-2 text-base font-medium transition-colors duration-150 lg:px-6 ${isActive ? "z-10 text-white" : isHovered ? "" : "text-text-secondary"} `}
						style={!isActive && isHovered ? { color: activeColor } : undefined}
						onClick={() => handleClick(idx)}
						onMouseEnter={() => setHoveredIdx(idx)}
						onMouseLeave={() => setHoveredIdx(null)}
					>
						{/* 悬浮状态背景层 */}
						{!isActive && isHovered && (
							<div className="pointer-events-none absolute inset-0 z-[-1] opacity-10">
								{/* 主体矩形 */}
								<div
									className="absolute inset-0 rounded-t-md"
									style={{ backgroundColor: activeColor }}
								/>

								{/* 左侧尾巴（非第一个时显示） */}
								{!isFirst && (
									<div
										className={`absolute -left-[32px] bottom-0 top-0 h-full w-[36px] ${isLast ? "scale-x-[-1]" : "rotate-180"}`}
									>
										<svg
											viewBox="0 0 2 4"
											preserveAspectRatio="none"
											className="h-full w-full"
											style={{ fill: activeColor }}
										>
											<path d="M 0 0 C 2 0 0 4 2 4 L 0 4 Z" />
										</svg>
									</div>
								)}

								{/* 右侧尾巴（非最后一个时显示） */}
								{!isLast && (
									<div
										className={`absolute -right-[32px] bottom-0 top-0 h-full w-[36px] ${isFirst ? "" : "scale-y-[-1]"}`}
									>
										<svg
											viewBox="0 0 2 4"
											preserveAspectRatio="none"
											className="h-full w-full"
											style={{ fill: activeColor }}
										>
											<path d="M 0 0 C 2 0 0 4 2 4 L 0 4 Z" />
										</svg>
									</div>
								)}
							</div>
						)}

						{/* 激活状态背景层 */}
						{isActive && (
							<motion.div
								layoutId={layoutId}
								className="absolute inset-0 z-[-1]"
								transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
							>
								{/* 主体矩形 */}
								<div
									className="absolute inset-0 rounded-t-md"
									style={{ backgroundColor: activeColor }}
								/>

								{/* 左侧尾巴（非第一个时显示） */}
								{!isFirst && (
									<div
										className={`absolute -left-[32px] bottom-0 top-0 h-full w-[36px] ${isLast ? "scale-x-[-1]" : "rotate-180"}`}
									>
										<svg
											viewBox="0 0 2 4"
											preserveAspectRatio="none"
											className="h-full w-full"
											style={{ fill: activeColor }}
										>
											<path d="M 0 0 C 2 0 0 4 2 4 L 0 4 Z" />
										</svg>
									</div>
								)}

								{/* 右侧尾巴（非最后一个时显示） */}
								{!isLast && (
									<div
										className={`absolute -right-[32px] bottom-0 top-0 h-full w-[36px] ${isFirst ? "" : "scale-y-[-1]"}`}
									>
										<svg
											viewBox="0 0 2 4"
											preserveAspectRatio="none"
											className="h-full w-full"
											style={{ fill: activeColor }}
										>
											<path d="M 0 0 C 2 0 0 4 2 4 L 0 4 Z" />
										</svg>
									</div>
								)}
							</motion.div>
						)}

						<span
							className="relative z-10 min-w-0 max-w-full truncate"
							title={tab.label}
						>
							{tab.label}
						</span>
					</div>
				);
			})}
		</div>
	);
}
