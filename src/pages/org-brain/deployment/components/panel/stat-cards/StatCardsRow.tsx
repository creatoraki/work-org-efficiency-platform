import type { ProjectStatistics } from "#src/api/org-brain/deployment";
import type { ReactNode } from "react";

import arrowDown from "#src/assets/svg/arrow-down.svg";
import arrowUp from "#src/assets/svg/arrow-up.svg";
import { Button } from "antd";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { STAT_CARD_CONFIG } from "./config";
import { StatCard } from "./StatCard";

interface StatCardsRowProps {
	stats?: ProjectStatistics;
	/** 标杆项目统计，传入时在门岗数/绿化面积/保洁面积数字右侧展示对比差距 */
	benchmarkStats?: ProjectStatistics;
}

/** 数值对比：仅显示差值 + 上下箭头（正数带 +，负数带 -）。供步骤二等在原值右侧追加对比时复用 */
export function DiffValueArrow({ diff, decimalPlaces }: { diff: number; decimalPlaces?: number }) {
	const isUp = diff > 0;
	const prefix = diff >= 0 ? "+" : "-";
	const value =
		decimalPlaces != null
			? Math.abs(diff).toFixed(decimalPlaces)
			: Math.abs(diff).toLocaleString();
	return (
		<span className="inline-flex items-center gap-0.5 whitespace-nowrap text-xs text-red-500">
			{prefix}
			{value}
			<img src={isUp ? arrowUp : arrowDown} alt="" className="inline-block size-[18px]" />
		</span>
	);
}

export function StatCardsRow({ stats, benchmarkStats }: StatCardsRowProps) {
	const scrollRef = useRef<HTMLDivElement | null>(null);
	const [canScrollLeft, setCanScrollLeft] = useState(false);
	const [canScrollRight, setCanScrollRight] = useState(false);

	const syncScrollState = useCallback(() => {
		const node = scrollRef.current;
		if (!node) {
			setCanScrollLeft(false);
			setCanScrollRight(false);
			return;
		}
		const maxScrollLeft = node.scrollWidth - node.clientWidth;
		setCanScrollLeft(node.scrollLeft > 4);
		setCanScrollRight(maxScrollLeft - node.scrollLeft > 4);
	}, []);

	const handleScroll = useCallback((direction: "left" | "right") => {
		const node = scrollRef.current;
		if (!node) {
			return;
		}
		const distance = Math.max(node.clientWidth * 0.72, 240);
		node.scrollBy({
			left: direction === "left" ? -distance : distance,
			behavior: "smooth",
		});
	}, []);

	const cards = STAT_CARD_CONFIG.filter(
		(item) => stats != null && stats[item.key] !== undefined && stats[item.key] !== null,
	).map((item) => {
		const raw = stats?.[item.key] as number | undefined;
		const value = item.format && typeof raw === "number" ? raw.toFixed(2) : raw;
		const projNum = typeof raw === "number" ? raw : undefined;
		const benchNum = benchmarkStats?.[item.key] as number | undefined;
		const showDiff = projNum != null && benchNum != null && projNum !== benchNum;
		let extra: ReactNode = null;
		if (benchmarkStats && showDiff && item.key === "gateCount") {
			extra = <DiffValueArrow diff={projNum - benchNum} />;
		} else if (
			benchmarkStats &&
			showDiff &&
			(item.key === "greenArea" || item.key === "cleaningArea")
		) {
			extra = (
				<DiffValueArrow
					diff={projNum - benchNum}
					decimalPlaces={item.format ? 2 : undefined}
				/>
			);
		}
		return (
			<StatCard
				key={item.key}
				label={item.label}
				unit={item.unit}
				value={value}
				iconSrc={item.iconSrc}
				iconBg={item.iconBg}
				extra={extra}
			/>
		);
	});

	useEffect(() => {
		const node = scrollRef.current;
		if (!node) {
			return;
		}
		syncScrollState();
		const observer = new ResizeObserver(() => {
			syncScrollState();
		});
		observer.observe(node);
		node.addEventListener("scroll", syncScrollState, { passive: true });
		return () => {
			observer.disconnect();
			node.removeEventListener("scroll", syncScrollState);
		};
	}, [cards.length, syncScrollState]);

	return (
		<div className="relative h-[60px] min-w-0 overflow-visible">
			<div
				ref={scrollRef}
				className="hide-scrollbar absolute inset-x-0 top-0 flex flex-nowrap gap-3 overflow-x-auto overflow-y-hidden"
			>
				{cards}
			</div>
			{canScrollLeft && (
				<div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center bg-gradient-to-r from-white via-white/90 to-transparent pr-6">
					<Button
						type="text"
						shape="circle"
						size="small"
						icon={<ChevronLeft size={14} strokeWidth={2} />}
						className="pointer-events-auto border border-[#dcdfe6] bg-white text-[#606266] shadow-sm hover:!bg-white"
						onClick={() => handleScroll("left")}
					/>
				</div>
			)}
			{canScrollRight && (
				<div className="pointer-events-none absolute inset-y-0 right-0 z-10 flex items-center bg-gradient-to-l from-white via-white/90 to-transparent pl-6">
					<Button
						type="text"
						shape="circle"
						size="small"
						icon={<ChevronRight size={14} strokeWidth={2} />}
						className="pointer-events-auto border border-[#dcdfe6] bg-white text-[#606266] shadow-sm hover:!bg-white"
						onClick={() => handleScroll("right")}
					/>
				</div>
			)}
		</div>
	);
}
