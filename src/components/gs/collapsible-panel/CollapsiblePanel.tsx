import type { CollapsiblePanelProps } from "./types";

import { useCallback, useEffect, useState } from "react";
import { CollapseToggleButton, ResizeHandle } from "./components";
import { useResize } from "./hooks";

/** 默认面板宽度 */
const DEFAULT_PANEL_WIDTH = 320;

/**
 * 格式化宽度值
 *
 * @param width - 宽度值，支持数字或字符串
 * @returns 格式化后的 CSS 宽度值
 */
function formatWidth(width: number | string): string {
	if (typeof width === "number") return `${width}px`;
	if (typeof width === "string") {
		const hasUnit = /px|vw|vh|rem/.test(width);
		if (hasUnit) return width;
		const num = Number.parseFloat(width);
		if (!Number.isNaN(num)) return `${num}px`;
	}
	return `${DEFAULT_PANEL_WIDTH}px`;
}

/**
 * 可折叠面板组件
 *
 * 支持折叠/展开、拖拽调整宽度等功能
 *
 * @param props - 组件属性
 * @param props.children - 面板内容
 * @param props.defaultCollapsed - 初始是否折叠
 * @param props.width - 面板宽度，支持数字(px)或字符串(带单位)
 * @param props.className - 自定义类名
 * @param props.onCollapsedChange - 折叠状态变化回调
 * @param props.resizable - 是否启用拖拽调整宽度功能
 * @param props.minWidth - 最小宽度限制（像素）
 * @param props.maxWidth - 最大宽度限制（像素）
 * @param props.onWidthChange - 宽度变化回调
 * @returns 可折叠面板元素
 * @example
 * ```tsx
 * <CollapsiblePanel
 *   width={320}
 *   resizable
 *   onCollapsedChange={(collapsed) => console.log(collapsed)}
 * >
 *   <div>面板内容</div>
 * </CollapsiblePanel>
 * ```
 */
export function CollapsiblePanel({
	children,
	defaultCollapsed = false,
	width = DEFAULT_PANEL_WIDTH,
	className = "",
	onCollapsedChange,
	resizable = false,
	minWidth = 200,
	maxWidth = 800,
	onWidthChange,
}: CollapsiblePanelProps) {
	const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

	// 使用拖拽 Hook
	const initialWidth = typeof width === "number" ? width : DEFAULT_PANEL_WIDTH;
	const { currentWidth, isResizing, handleMouseDown, setWidth } = useResize({
		initialWidth,
		minWidth,
		maxWidth,
		disabled: !resizable || isCollapsed,
		onWidthChange,
	});

	// 切换折叠状态
	const handleToggle = useCallback(() => {
		const newState = !isCollapsed;
		setIsCollapsed(newState);
		onCollapsedChange?.(newState);
	}, [isCollapsed, onCollapsedChange]);

	// 当外部 width 属性变化时，同步内部状态
	useEffect(() => {
		const newWidth = typeof width === "number" ? width : DEFAULT_PANEL_WIDTH;
		setWidth(newWidth);
	}, [width, setWidth]);

	return (
		<div className="relative flex">
			{/* 面板主体 */}
			<div
				className={`relative flex flex-shrink-0 flex-col overflow-hidden rounded border border-[#e7e8e9] ${isResizing ? "select-none" : "transition-[width] duration-300 ease-in-out"} ${className} `}
				style={{ width: isCollapsed ? 0 : formatWidth(currentWidth) }}
			>
				<div
					className="flex flex-1 flex-col overflow-hidden"
					style={{ width: formatWidth(currentWidth) }}
				>
					{children}
				</div>
			</div>

			{/* 间隙区域（包含按钮） */}
			<div
				className={`relative z-10 flex h-full w-1.5 flex-col items-center justify-center gap-2 transition-all duration-300 ease-in-out`}
				style={
					isCollapsed
						? {
								background:
									"linear-gradient(89.97deg, rgba(0,0,0,0.07) 0%, rgba(70,70,70,0.0508) 29.02%, rgba(255,255,255,0.0001) 99.94%)",
								transform: "translateX(0)",
							}
						: {
								transform: "translateX(-3px)",
							}
				}
			>
				<CollapseToggleButton isCollapsed={isCollapsed} onToggle={handleToggle} />
				{resizable && !isCollapsed && (
					<ResizeHandle isResizing={isResizing} onMouseDown={handleMouseDown} />
				)}
			</div>
		</div>
	);
}
