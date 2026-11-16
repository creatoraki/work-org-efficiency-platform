import type { ReactNode, PointerEvent as ReactPointerEvent } from "react";

import { cn } from "#src/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
import { SIDE_PANEL_MAX_WIDTH, SIDE_PANEL_MIN_WIDTH } from "../constants";

interface SidePanelProps {
	/** 是否收起 */
	collapsed: boolean;
	/** 收起 / 展开 */
	onCollapsedChange: (collapsed: boolean) => void;
	/** 面板宽度 */
	width: number;
	/** 拖拽调整宽度 */
	onWidthChange: (width: number) => void;
	/** 左列：组织架构 */
	left: ReactNode;
	/** 右列：文件夹 */
	right: ReactNode;
}

/**
 * 左侧「组织架构 + 文件夹」面板
 *
 * - 展开：1px #E4E7ED 描边、16px 内边距，两列等宽，中间 1px 分隔线（左右各 8px）；
 * - 收起：收为 10px 窄条，右侧投影；
 * - 右边框中点为 20px 圆形收起 / 展开按钮；右边框其余区域可拖拽调整宽度（设计稿 18 要求可拖拽宽度）。
 *
 * @param props - 组件属性
 * @param props.collapsed - 是否收起
 * @param props.onCollapsedChange - 收起 / 展开
 * @param props.width - 面板宽度
 * @param props.onWidthChange - 拖拽调整宽度
 * @param props.left - 左列：组织架构
 * @param props.right - 右列：文件夹
 * @returns 侧边面板
 *
 * @since 2026-11-16
 */
export function SidePanel({
	collapsed,
	onCollapsedChange,
	width,
	onWidthChange,
	left,
	right,
}: SidePanelProps) {
	const dragRef = useRef<{ startX: number; startWidth: number } | null>(null);

	const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
		dragRef.current = { startX: event.clientX, startWidth: width };
		event.currentTarget.setPointerCapture(event.pointerId);
	};
	const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
		if (!dragRef.current) {
			return;
		}
		const next = dragRef.current.startWidth + event.clientX - dragRef.current.startX;
		onWidthChange(Math.min(SIDE_PANEL_MAX_WIDTH, Math.max(SIDE_PANEL_MIN_WIDTH, next)));
	};
	const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
		dragRef.current = null;
		event.currentTarget.releasePointerCapture(event.pointerId);
	};

	return (
		<aside
			className={cn(
				"relative h-full shrink-0",
				collapsed
					? "w-2.5 bg-white shadow-[2px_0_6px_0_rgba(0,0,0,0.06)]"
					: "rounded border border-solid border-[#E4E7ED] bg-white",
			)}
			style={collapsed ? undefined : { width }}
		>
			{collapsed ? null : (
				<div className="flex h-full min-h-0 p-[15px]">
					<div className="min-w-0 flex-1">{left}</div>
					<div className="mx-2 w-px shrink-0 bg-[#E4E7ED]" />
					<div className="min-w-0 flex-1">{right}</div>
				</div>
			)}

			{collapsed ? null : (
				<div
					className="absolute -right-[3px] top-0 z-[1] h-full w-[6px] cursor-col-resize"
					onPointerDown={handlePointerDown}
					onPointerMove={handlePointerMove}
					onPointerUp={handlePointerUp}
					aria-hidden
				/>
			)}

			<button
				type="button"
				aria-label={collapsed ? "展开组织架构与文件夹" : "收起组织架构与文件夹"}
				onClick={() => onCollapsedChange(!collapsed)}
				className={cn(
					"absolute top-1/2 z-[2] flex size-5 -translate-y-1/2 translate-x-1/2 cursor-pointer items-center justify-center rounded-full border border-solid p-0 transition-colors",
					collapsed
						? "-right-px border-[#EBEEF5] bg-white text-[#909399] shadow-[0_2px_6px_0_rgba(0,0,0,0.12)] hover:text-[#0075FF]"
						: "-right-px border-[#E4E7ED] bg-[#F5F7FA] text-[#323233] hover:text-[#0075FF]",
				)}
			>
				{collapsed ? (
					<ChevronRight className="size-3.5" strokeWidth={2} />
				) : (
					<ChevronLeft className="size-3.5" strokeWidth={2} />
				)}
			</button>
		</aside>
	);
}
