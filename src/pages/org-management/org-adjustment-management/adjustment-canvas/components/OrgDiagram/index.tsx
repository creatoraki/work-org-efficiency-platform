/**
 * OrgDiagram - 组织关系图组件
 * 使用 forwardRef 暴露 CanvasRef 接口，兼容 CanvasToolbar
 */

import type { GraphData } from "@antv/g6";
import type { CanvasRef, OrgNodeBatchAction } from "../../types";
import type { NodeDropInfo } from "./store";
import React, { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import DragPreviewOverlay from "./DragPreviewOverlay";
import { useZoomStore } from "./store";
import { useGraphInstance } from "./useGraphInstance";

interface OrgDiagramProps {
	className?: string;
	showGrid?: boolean;
	backgroundColor?: string;
	/** 组织树数据（G6 格式） */
	orgData?: GraphData;
	/** 选中的卡片 ID 集合 */
	selectedCardIds?: Set<string>;
	/** 切换卡片选择状态 */
	onCardToggle?: (cardId: string) => void;
	/** 展开节点 */
	onNodeExpand?: (nodeId: string) => void;
	/** 切换节点启用禁用状态 */
	onNodeStatusToggle?: (nodeId: string) => void;
	/** 节点批量菜单操作 */
	onNodeBatchAction?: (nodeId: string, action: OrgNodeBatchAction) => void;
	/** 查看子节点变更对比 */
	onNodeCompare?: (nodeId: string) => void;
	/** 节点拖拽落点 */
	onNodeDrop?: (sourceId: string, targetId: string) => void;
	/** 节点拖拽是否可落点 */
	canNodeDrop?: (source: NodeDropInfo, target: NodeDropInfo) => boolean;
	/** 抓手模式 */
	isDragMode?: boolean;
	/** 是否允许通过拖拽执行操作 */
	dropDragEnabled?: boolean;
}

function createZoomBehavior(container: HTMLDivElement) {
	return {
		type: "zoom-canvas" as const,
		origin: [container.clientWidth / 2, container.clientHeight / 2] as [number, number],
	};
}

export const OrgDiagram = forwardRef<CanvasRef, OrgDiagramProps>(
	(
		{
			className,
			showGrid = true,
			backgroundColor = "#f8f9fa",
			orgData,
			selectedCardIds,
			onCardToggle,
			onNodeExpand,
			onNodeStatusToggle,
			onNodeBatchAction,
			onNodeCompare,
			onNodeDrop,
			canNodeDrop,
			isDragMode = true,
			dropDragEnabled = true,
		},
		ref,
	) => {
		const containerRef = useRef<HTMLDivElement>(null!);
		const isDragModeRef = useRef(isDragMode);
		const focusRetryTimersRef = useRef<number[]>([]);
		const graphRef = useGraphInstance(
			containerRef,
			orgData,
			selectedCardIds,
			onCardToggle,
			onNodeExpand,
			onNodeStatusToggle,
			onNodeBatchAction,
			onNodeCompare,
		);
		const { setDragModeEnabled, setNodeDropAction, clearNodeDrag } = useZoomStore.getState();

		const clearFocusRetryTimers = () => {
			focusRetryTimersRef.current.forEach((timer) => window.clearTimeout(timer));
			focusRetryTimersRef.current = [];
		};

		const focusNodeToViewportCenter = (nodeId: string) => {
			const graph = graphRef.current;
			const container = containerRef.current;
			if (!graph || !container || !graph.hasNode(nodeId)) {
				return;
			}

			const nodeBounds = graph.getElementRenderBounds(nodeId);
			if (!nodeBounds) {
				return;
			}

			const [nodeViewportX, nodeViewportY] = graph.getViewportByCanvas(nodeBounds.center);
			const deltaX = container.clientWidth / 2 - nodeViewportX;
			const deltaY = container.clientHeight / 2 - nodeViewportY;
			graph.translateBy([deltaX, deltaY], false);
		};

		const focusNodeWithRetry = (nodeId: string) => {
			clearFocusRetryTimers();
			[0, 80, 180].forEach((delay) => {
				const timer = window.setTimeout(() => {
					focusNodeToViewportCenter(nodeId);
					focusRetryTimersRef.current = focusRetryTimersRef.current.filter(
						(item) => item !== timer,
					);
				}, delay);
				focusRetryTimersRef.current.push(timer);
			});
		};

		useEffect(() => {
			isDragModeRef.current = isDragMode;
			setDragModeEnabled(dropDragEnabled);
			if (!dropDragEnabled) {
				clearNodeDrag();
			}
		}, [isDragMode, dropDragEnabled, setDragModeEnabled, clearNodeDrag]);

		useEffect(() => {
			setNodeDropAction(onNodeDrop, canNodeDrop);
		}, [onNodeDrop, canNodeDrop, setNodeDropAction]);

		useEffect(() => {
			const container = containerRef.current;
			if (!container) {
				return;
			}

			const handleWheel = (event: WheelEvent) => {
				if (isDragModeRef.current) {
					return;
				}

				event.preventDefault();
				const horizontalDelta = event.shiftKey
					? Math.abs(event.deltaX) > 0
						? event.deltaX
						: event.deltaY
					: event.deltaX;
				const verticalDelta = event.shiftKey ? 0 : event.deltaY;
				graphRef.current?.translateBy([-horizontalDelta, -verticalDelta]);
			};

			container.addEventListener("wheel", handleWheel, { passive: false });

			return () => {
				container.removeEventListener("wheel", handleWheel);
			};
		}, [graphRef]);

		useEffect(() => {
			return () => {
				clearFocusRetryTimers();
			};
		}, []);

		useImperativeHandle(
			ref,
			() => ({
				graph: graphRef.current,
				zoomIn: () => {
					graphRef.current?.zoomBy(1.2);
				},
				zoomOut: () => {
					graphRef.current?.zoomBy(0.8);
				},
				zoomFit: () => {
					graphRef.current?.fitView();
				},
				zoomReset: () => {
					graphRef.current?.zoomTo(1);
				},
				focusNode: (nodeId: string) => {
					focusNodeWithRetry(nodeId);
				},
				changeLayout: (layout: string) => {
					if (!graphRef.current) return;
					graphRef.current.setLayout({ type: layout });
					graphRef.current.layout();
				},
				exportImage: () => {
					// 暂未实现
				},
				exportData: () => {
					// 暂未实现
				},
				toggleFullscreen: () => {
					// 暂未实现
				},
				toggleMinimap: () => {
					// 暂未实现
				},
				setDragMode: (enabled: boolean) => {
					const container = containerRef.current;
					if (!graphRef.current || !container) return;
					const graph = graphRef.current;
					const behaviors = graph.getBehaviors().filter((behavior: any) => {
						const behaviorType =
							typeof behavior === "string" ? behavior : behavior.type;
						return behaviorType !== "drag-canvas" && behaviorType !== "zoom-canvas";
					});

					if (enabled) {
						graph.setBehaviors([
							createZoomBehavior(container),
							"drag-canvas",
							...behaviors,
						]);
					} else {
						graph.setBehaviors([...behaviors]);
					}

					isDragModeRef.current = enabled;
				},
			}),
			[clearNodeDrag, graphRef],
		);

		return (
			<>
				<div
					ref={containerRef}
					className={className}
					style={{
						width: "100%",
						height: "100%",
						backgroundImage: showGrid
							? "radial-gradient(circle, #d3d3d3 1px, transparent 1px)"
							: "none",
						backgroundSize: showGrid ? "20px 20px" : undefined,
						backgroundColor,
					}}
				/>
				<DragPreviewOverlay />
			</>
		);
	},
);

OrgDiagram.displayName = "OrgDiagram";

export default OrgDiagram;
