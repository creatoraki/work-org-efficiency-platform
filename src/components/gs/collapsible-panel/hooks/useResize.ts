import type { UseResizeOptions, UseResizeReturn } from "../types";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * 拖拽调整宽度的自定义 Hook
 *
 * @param options - 配置选项
 * @param options.initialWidth - 初始宽度
 * @param options.minWidth - 最小宽度
 * @param options.maxWidth - 最大宽度
 * @param options.disabled - 是否禁用拖拽
 * @param options.onWidthChange - 宽度变化回调
 * @returns 拖拽状态和处理函数
 * @example
 * ```ts
 * const { currentWidth, isResizing, handleMouseDown } = useResize({
 *   initialWidth: 320,
 *   minWidth: 200,
 *   maxWidth: 800,
 *   onWidthChange: (width) => console.log(width),
 * })
 * ```
 */
export function useResize({
	initialWidth,
	minWidth,
	maxWidth,
	disabled = false,
	onWidthChange,
}: UseResizeOptions): UseResizeReturn {
	const [currentWidth, setCurrentWidth] = useState(initialWidth);
	const [isResizing, setIsResizing] = useState(false);
	const startXRef = useRef(0);
	const startWidthRef = useRef(0);

	// 拖拽开始
	const handleMouseDown = useCallback(
		(e: React.MouseEvent) => {
			if (disabled) return;

			e.preventDefault();
			setIsResizing(true);
			startXRef.current = e.clientX;
			startWidthRef.current = currentWidth;
		},
		[disabled, currentWidth],
	);

	// 拖拽过程中
	const handleMouseMove = useCallback(
		(e: MouseEvent) => {
			if (!isResizing) return;

			const deltaX = e.clientX - startXRef.current;
			const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidthRef.current + deltaX));

			setCurrentWidth(newWidth);
			onWidthChange?.(newWidth);
		},
		[isResizing, minWidth, maxWidth, onWidthChange],
	);

	// 拖拽结束
	const handleMouseUp = useCallback(() => {
		if (!isResizing) return;
		setIsResizing(false);
	}, [isResizing]);

	// 监听全局鼠标事件
	useEffect(() => {
		if (isResizing) {
			document.addEventListener("mousemove", handleMouseMove);
			document.addEventListener("mouseup", handleMouseUp);

			return () => {
				document.removeEventListener("mousemove", handleMouseMove);
				document.removeEventListener("mouseup", handleMouseUp);
			};
		}
	}, [isResizing, handleMouseMove, handleMouseUp]);

	// 设置宽度的函数
	const setWidth = useCallback((width: number) => {
		setCurrentWidth(width);
	}, []);

	return {
		currentWidth,
		isResizing,
		handleMouseDown,
		setWidth,
	};
}
