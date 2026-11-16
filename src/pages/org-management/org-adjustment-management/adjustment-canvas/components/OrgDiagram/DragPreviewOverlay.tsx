import React from "react";
import { OrgNodeCardVisual } from "../OrgNodeCard";
import { useZoomStore } from "./store";

export function DragPreviewOverlay() {
	const dragPreview = useZoomStore((state) => state.dragPreview);

	if (!dragPreview) {
		return null;
	}

	const left = dragPreview.pointerX - dragPreview.offsetX;
	const top = dragPreview.pointerY - dragPreview.offsetY;

	return (
		<div
			style={{
				position: "fixed",
				left: 0,
				top: 0,
				zIndex: 9999,
				pointerEvents: "none",
				willChange: "transform",
				transform: `translate3d(${left}px, ${top}px, 0)`,
				filter: "drop-shadow(0 12px 20px rgba(22, 119, 255, 0.22))",
			}}
		>
			<OrgNodeCardVisual
				data={dragPreview.nodeData}
				width={dragPreview.width}
				height={dragPreview.height}
				interactive={false}
			/>
		</div>
	);
}

export default DragPreviewOverlay;
