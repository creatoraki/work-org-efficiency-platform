import type { AdjustmentOperationType } from "../types";
import React, { useEffect, useState } from "react";

export type FloatingActionMenuAction =
	| AdjustmentOperationType
	| "precreate"
	| "stop"
	| "projectMap";

interface FloatingActionMenuProps {
	anchorNodeId: string | null;
	operationType: AdjustmentOperationType;
	visible: boolean;
	showDisableAction?: boolean;
	showProjectMapAction?: boolean;
	onActionClick: (action: FloatingActionMenuAction) => void;
}

interface MenuPosition {
	top: number;
	left: number;
}

const MENU_HOVER_BACKGROUND = "rgba(22, 119, 255, 0.08)";
const MENU_HOVER_TEXT = "rgba(22, 119, 255, 1)";
const DANGER_HOVER_BACKGROUND = "rgba(245, 108, 108, 0.08)";
const DANGER_HOVER_TEXT = "rgba(245, 108, 108, 1)";

const ACTION_LABEL_MAP: Record<AdjustmentOperationType, string> = {
	merge: "合并组织",
	split: "拆分组织",
	move: "平移组织",
};

const EXTRA_ACTION_LABEL_MAP: Record<
	Exclude<FloatingActionMenuAction, AdjustmentOperationType | "stop">,
	string
> = {
	precreate: "预创建组织",
	projectMap: "项目分布地图",
};

const MENU_BUTTON_STYLE: React.CSSProperties = {
	width: "100%",
	padding: "8px 12px",
	border: "none",
	borderRadius: 6,
	background: "transparent",
	appearance: "none",
	WebkitAppearance: "none",
	textAlign: "left",
	fontSize: 14,
	lineHeight: "20px",
	color: "#303133",
	cursor: "pointer",
	transition: "background-color 0.2s ease, color 0.2s ease",
};

function isSamePosition(left: MenuPosition | null, right: MenuPosition | null) {
	return left?.top === right?.top && left?.left === right?.left;
}

export const FloatingActionMenu: React.FC<FloatingActionMenuProps> = ({
	anchorNodeId,
	operationType,
	visible,
	showDisableAction = true,
	showProjectMapAction = false,
	onActionClick,
}) => {
	const [position, setPosition] = useState<MenuPosition | null>(null);
	const [hoveredAction, setHoveredAction] = useState<FloatingActionMenuAction | null>(null);

	useEffect(() => {
		if (!visible || !anchorNodeId) {
			setPosition(null);
			setHoveredAction(null);
			return;
		}

		let frameId = 0;

		const updatePosition = () => {
			const anchor = document.querySelector(
				`[data-org-node-id="${anchorNodeId}"]`,
			) as HTMLElement | null;
			if (!anchor) {
				setPosition(null);
				frameId = window.requestAnimationFrame(updatePosition);
				return;
			}

			const rect = anchor.getBoundingClientRect();
			const nextPosition = {
				top: Math.max(16, rect.top + rect.height / 2 - 18),
				left: Math.min(window.innerWidth - 136, rect.right + 12),
			};

			setPosition((prev) => (isSamePosition(prev, nextPosition) ? prev : nextPosition));
			frameId = window.requestAnimationFrame(updatePosition);
		};

		updatePosition();

		return () => {
			window.cancelAnimationFrame(frameId);
		};
	}, [anchorNodeId, visible]);

	if (!visible || !position) {
		return null;
	}

	const actionList: FloatingActionMenuAction[] = [
		...(operationType === "split"
			? (["split", "precreate"] as FloatingActionMenuAction[])
			: [operationType]),
		...(showProjectMapAction ? (["projectMap"] as FloatingActionMenuAction[]) : []),
		...(showDisableAction ? (["stop"] as FloatingActionMenuAction[]) : []),
	];

	return (
		<div
			style={{
				position: "fixed",
				top: position.top,
				left: position.left,
				zIndex: 40,
				minWidth: 132,
				padding: 6,
				borderRadius: 8,
				background: "rgba(255, 255, 255, 0.98)",
				boxShadow: "0 10px 24px rgba(0, 0, 0, 0.14)",
				border: "1px solid rgba(220, 223, 230, 1)",
			}}
		>
			{actionList.map((action) => {
				const isDangerAction = action === "stop";
				const label =
					action in ACTION_LABEL_MAP
						? ACTION_LABEL_MAP[action as AdjustmentOperationType]
						: action in EXTRA_ACTION_LABEL_MAP
							? EXTRA_ACTION_LABEL_MAP[action as keyof typeof EXTRA_ACTION_LABEL_MAP]
							: "停用组织";

				return (
					<button
						key={action}
						type="button"
						onClick={() => onActionClick(action)}
						style={{
							...MENU_BUTTON_STYLE,
							background:
								hoveredAction === action
									? isDangerAction
										? DANGER_HOVER_BACKGROUND
										: MENU_HOVER_BACKGROUND
									: "transparent",
							color:
								hoveredAction === action
									? isDangerAction
										? DANGER_HOVER_TEXT
										: MENU_HOVER_TEXT
									: "#303133",
						}}
						onMouseEnter={() => setHoveredAction(action)}
						onMouseLeave={() =>
							setHoveredAction((current) => (current === action ? null : current))
						}
					>
						{label}
					</button>
				);
			})}
		</div>
	);
};

export default FloatingActionMenu;
