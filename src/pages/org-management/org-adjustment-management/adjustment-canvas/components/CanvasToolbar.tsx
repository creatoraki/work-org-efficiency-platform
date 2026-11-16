/**
 * 画布工具栏组件
 */

import type { CanvasRef } from "../types";
import {
	DragOutlined,
	SettingOutlined,
	UndoOutlined,
	ZoomInOutlined,
	ZoomOutOutlined,
} from "@ant-design/icons";
import { Button, Divider, Tooltip } from "antd";
import React, { useCallback } from "react";
import { useZoomStore } from "./OrgDiagram/store";

interface CanvasToolbarProps {
	canvasRef: React.RefObject<CanvasRef>;
	className?: string;
	onOpenSettings?: () => void;
	isDragMode: boolean;
	onToggleDragMode: () => void;
	canUndo: boolean;
	onUndo: () => void;
}

const TOOLBAR_BUTTON_BASE_CLASSNAME = [
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

const TOOLBAR_BUTTON_CLASSNAME = [
	TOOLBAR_BUTTON_BASE_CLASSNAME,
	"!border-gray-200",
	"!bg-white",
	"!text-gray-600",
	"hover:!border-gray-300",
	"hover:!text-gray-800",
	"disabled:!border-gray-200",
	"disabled:!bg-white",
].join(" ");

const TOOLBAR_ACTIVE_BUTTON_CLASSNAME = [
	TOOLBAR_BUTTON_BASE_CLASSNAME,
	"!border-[#1677ff]",
	"!bg-[#1677ff]",
	"!text-white",
	"hover:!border-[#4096ff]",
	"hover:!bg-[#4096ff]",
	"hover:!text-white",
].join(" ");

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
	canvasRef,
	className,
	onOpenSettings,
	isDragMode,
	onToggleDragMode,
	canUndo,
	onUndo,
}) => {
	const zoomPercent = useZoomStore((state) => state.zoomPercent);
	const { notifyZoomChanged } = useZoomStore.getState();

	const handleZoomIn = useCallback(() => {
		const canvas = canvasRef.current;
		if (canvas) {
			canvas.zoomIn();
			notifyZoomChanged();
		}
	}, [canvasRef, notifyZoomChanged]);

	const handleZoomOut = useCallback(() => {
		const canvas = canvasRef.current;
		if (canvas) {
			canvas.zoomOut();
			notifyZoomChanged();
		}
	}, [canvasRef, notifyZoomChanged]);

	const toggleDragMode = useCallback(() => {
		const canvas = canvasRef.current;
		if (canvas) {
			canvas.setDragMode(!isDragMode);
		}
		onToggleDragMode();
	}, [canvasRef, isDragMode, onToggleDragMode]);

	return (
		<div
			className={`inline-flex w-14 flex-col items-center rounded-lg border border-gray-200 bg-white p-2 shadow-sm ${className || ""}`}
		>
			<div className="flex w-full flex-col items-center gap-1">
				<div className="flex h-8 w-10 select-none items-center justify-center text-xs text-gray-500">
					{zoomPercent}%
				</div>
				<Tooltip title="放大" placement="left">
					<Button
						type="default"
						icon={<ZoomInOutlined />}
						onClick={handleZoomIn}
						className={TOOLBAR_BUTTON_CLASSNAME}
					/>
				</Tooltip>
				<Tooltip title="缩小" placement="left">
					<Button
						type="default"
						icon={<ZoomOutOutlined />}
						onClick={handleZoomOut}
						className={TOOLBAR_BUTTON_CLASSNAME}
					/>
				</Tooltip>
				<Divider className="!my-0 !w-8 !min-w-0" />
				<Tooltip title="撤销" placement="left">
					<Button
						type="default"
						icon={<UndoOutlined />}
						disabled={!canUndo}
						onClick={onUndo}
						className={TOOLBAR_BUTTON_CLASSNAME}
					/>
				</Tooltip>

				<Tooltip title="抓手模式" placement="left">
					<Button
						type="default"
						icon={<DragOutlined />}
						onClick={toggleDragMode}
						className={
							isDragMode ? TOOLBAR_ACTIVE_BUTTON_CLASSNAME : TOOLBAR_BUTTON_CLASSNAME
						}
					/>
				</Tooltip>
				<Divider className="!my-0 !w-8 !min-w-0" />
				<Tooltip title="设置" placement="left">
					<Button
						type="default"
						icon={<SettingOutlined />}
						onClick={onOpenSettings}
						className={TOOLBAR_BUTTON_CLASSNAME}
					/>
				</Tooltip>
			</div>
		</div>
	);
};

export default CanvasToolbar;
