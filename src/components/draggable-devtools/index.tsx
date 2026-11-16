import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useCallback, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "react-query-devtools-percent";
// 默认定位在视口左下角，与拖动边界下限保持一致
const DEFAULT_POSITION = { x: 0, y: 95 };
const BOUNDARY_OFFSET = 50;

export function DraggableDevTools() {
	const [positionPercent, setPositionPercent] = useState(DEFAULT_POSITION);
	const [isDragging, setIsDragging] = useState(false);
	const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

	// 使用 useMemo 缓存计算结果
	const pixelPosition = useMemo(
		() => ({
			x: (positionPercent.x / 100) * window.innerWidth,
			y: (positionPercent.y / 100) * window.innerHeight,
		}),
		[positionPercent.x, positionPercent.y],
	);

	// 使用 useCallback 优化函数引用
	const getPercentPosition = useCallback(
		(x: number, y: number) => ({
			x: (x / window.innerWidth) * 100,
			y: (y / window.innerHeight) * 100,
		}),
		[],
	);

	// 初始化位置
	useEffect(() => {
		const saved = sessionStorage.getItem(STORAGE_KEY);
		if (saved) {
			try {
				setPositionPercent(JSON.parse(saved));
			} catch {
				// 静默处理错误，使用默认位置
			}
		}
	}, []);

	// 防抖保存位置
	useEffect(() => {
		const timer = setTimeout(() => {
			sessionStorage.setItem(STORAGE_KEY, JSON.stringify(positionPercent));
		}, 100);
		return () => clearTimeout(timer);
	}, [positionPercent]);

	const handleMouseDown = useCallback(
		(e: React.MouseEvent) => {
			setDragOffset({
				x: e.clientX - pixelPosition.x,
				y: e.clientY - pixelPosition.y,
			});
			setIsDragging(true);
			e.preventDefault();
		},
		[pixelPosition.x, pixelPosition.y],
	);

	const handleMouseMove = useCallback(
		(e: MouseEvent) => {
			if (!isDragging) return;

			const newX = e.clientX - dragOffset.x;
			const newY = e.clientY - dragOffset.y;

			// 边界限制
			const maxX = window.innerWidth - BOUNDARY_OFFSET;
			const maxY = window.innerHeight - BOUNDARY_OFFSET;
			const validX = Math.max(0, Math.min(newX, maxX));
			const validY = Math.max(0, Math.min(newY, maxY));

			setPositionPercent(getPercentPosition(validX, validY));
		},
		[isDragging, dragOffset.x, dragOffset.y, getPercentPosition],
	);

	const handleMouseUp = useCallback(() => {
		setIsDragging(false);
	}, []);

	// 拖动事件监听
	useEffect(() => {
		if (!isDragging) return;

		document.addEventListener("mousemove", handleMouseMove);
		document.addEventListener("mouseup", handleMouseUp);

		return () => {
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("mouseup", handleMouseUp);
		};
	}, [isDragging, handleMouseMove, handleMouseUp]);

	// 使用 useMemo 缓存样式对象
	const containerStyle = useMemo(
		() => ({
			position: "fixed" as const,
			left: `${positionPercent.x}%`,
			top: `${positionPercent.y}%`,
			zIndex: 9999,
			cursor: isDragging ? "grabbing" : "grab",
			userSelect: "none" as const,
		}),
		[positionPercent.x, positionPercent.y, isDragging],
	);

	return (
		<div onMouseDown={handleMouseDown} style={containerStyle}>
			<ReactQueryDevtools initialIsOpen={false} buttonPosition="relative" />
		</div>
	);
}
