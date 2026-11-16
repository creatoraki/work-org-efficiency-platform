import type { GraphData } from "@antv/g6";
import { CommonEvent } from "@antv/g6";
import { Button, Divider, Spin, Tooltip } from "antd";
import { Hand, Minus, Plus } from "lucide-react";
import React, { useEffect, useRef } from "react";
import { DEPLOYMENT_TOOLBAR_ICON_PROPS } from "./icon-props";
import { useDeploymentGraph } from "./useDeploymentGraph";

export interface DeploymentGraphCanvasProps {
	data: GraphData;
	schemeKey: string;
	schemeLabel: string;
}

const toolbarButtonBaseClassName = [
	"!inline-flex",
	"!h-8",
	"!w-8",
	"!items-center",
	"!justify-center",
	"!rounded-md",
	"!border",
	"!p-0",
	"[&_.ant-btn-icon]:!m-0",
	"[&_.ant-btn-icon]:!flex",
	"[&_.ant-btn-icon]:!items-center",
	"[&_.ant-btn-icon]:!justify-center",
].join(" ");

const toolbarButtonClassName = [
	toolbarButtonBaseClassName,
	"!border-gray-200",
	"!bg-white",
	"!text-gray-600",
	"hover:!border-gray-300",
	"hover:!text-gray-800",
].join(" ");

const toolbarActiveButtonClassName = [
	toolbarButtonBaseClassName,
	"!border-[#1677ff]",
	"!bg-[#1677ff]",
	"!text-white",
	"hover:!border-[#4096ff]",
	"hover:!bg-[#4096ff]",
	"hover:!text-white",
].join(" ");

/**
 * 排兵布阵 G6 画布。
 * 视口策略：初次 fitView；容器尺寸变化时以 getViewportCenter 锚点平移，保持用户当前焦点与缩放。
 */
export function DeploymentGraphCanvas({
	data,
	schemeKey,
	schemeLabel,
}: DeploymentGraphCanvasProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const {
		zoomPercent,
		isDragOnly,
		setIsDragOnly,
		isSchemeSwitching,
		handleZoomIn,
		handleZoomOut,
		graphRef,
	} = useDeploymentGraph(containerRef, { graphData: data, schemeKey });

	useEffect(() => {
		const graph = graphRef.current;
		if (!graph || typeof graph.getCanvas !== "function" || graph.destroyed) {
			return;
		}
		let canvas: ReturnType<typeof graph.getCanvas>;
		try {
			canvas = graph.getCanvas();
		} catch {
			return;
		}
		if (!canvas || typeof canvas.setCursor !== "function") {
			return;
		}
		try {
			canvas.setCursor(isDragOnly ? "grab" : "default");
		} catch {
			return;
		}
		if (!isDragOnly) {
			return;
		}
		const onDragStart = () => {
			try {
				canvas?.setCursor?.("grabbing");
			} catch {
				// ignore
			}
		};
		const onDragEnd = () => {
			try {
				canvas?.setCursor?.("grab");
			} catch {
				// ignore
			}
		};
		graph.on(CommonEvent.DRAG_START, onDragStart);
		graph.on(CommonEvent.DRAG_END, onDragEnd);
		return () => {
			graph.off(CommonEvent.DRAG_START, onDragStart);
			graph.off(CommonEvent.DRAG_END, onDragEnd);
			try {
				canvas?.setCursor?.("default");
			} catch {
				// ignore
			}
		};
	}, [graphRef, isDragOnly]);

	return (
		<div className="relative h-full min-h-[200px] w-full">
			<div
				ref={containerRef}
				className={[
					"h-full w-full transition-opacity duration-200",
					isSchemeSwitching ? "opacity-45" : "opacity-100",
				].join(" ")}
			/>
			{isSchemeSwitching ? (
				<div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-white/30 backdrop-blur-[1px]">
					<div className="flex flex-col items-center gap-2 rounded-lg border border-gray-200 bg-white/95 px-6 py-4 shadow-md">
						<Spin size="small" />
						<span className="text-sm text-gray-600">正在切换{schemeLabel}</span>
					</div>
				</div>
			) : null}
			<div className="absolute bottom-2 right-3 inline-flex w-14 flex-col items-center rounded-lg border border-gray-200 bg-white p-2 shadow-sm">
				<div className="flex w-full flex-col items-center gap-1">
					<div className="flex h-8 w-10 select-none items-center justify-center text-xs text-gray-500">
						{zoomPercent}%
					</div>
					<Tooltip title="放大">
						<Button
							type="default"
							size="small"
							icon={<Plus {...DEPLOYMENT_TOOLBAR_ICON_PROPS} />}
							onClick={handleZoomIn}
							className={toolbarButtonClassName}
						/>
					</Tooltip>
					<Tooltip title="缩小">
						<Button
							type="default"
							size="small"
							icon={<Minus {...DEPLOYMENT_TOOLBAR_ICON_PROPS} />}
							onClick={handleZoomOut}
							className={toolbarButtonClassName}
						/>
					</Tooltip>
					<Divider className="!my-0 !w-8 !min-w-0" />
					<Tooltip
						title={
							isDragOnly ? "已开启抓手模式（仅可拖动）" : "抓手（点击后仅可拖动画布）"
						}
					>
						<Button
							type="default"
							size="small"
							icon={
								<Hand
									{...DEPLOYMENT_TOOLBAR_ICON_PROPS}
									className={isDragOnly ? "text-white" : undefined}
								/>
							}
							onClick={() => setIsDragOnly((prev) => !prev)}
							className={
								isDragOnly ? toolbarActiveButtonClassName : toolbarButtonClassName
							}
						/>
					</Tooltip>
				</div>
			</div>
		</div>
	);
}
