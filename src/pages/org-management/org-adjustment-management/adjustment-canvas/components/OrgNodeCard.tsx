/**
 * 组织节点卡片组件
 */

import type { OrgNodeBatchAction, OrgNodeDisplayField } from "../types";
import { DownOutlined } from "@ant-design/icons";
import { Checkbox } from "antd";
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useZoomStore } from "./OrgDiagram/store";

type OrgNodeCardData = NonNullable<OrgNodeCardProps["data"]>;

interface OrgNodeCardProps {
	data?: {
		id: string;
		name: string;
		readOnly?: boolean;
		disable?: boolean;
		effective?: boolean;
		projOrgStatus?: string;
		isStopped?: boolean;
		level?: number;
		parentId?: string;
		displayFields?: OrgNodeDisplayField[];
		hiddenChildCount?: number;
		canExpandChildren?: boolean;
		[key: string]: any;
	};
	width?: number;
	height?: number;
	onCardClick?: () => void;
}

function areNodeCardPropsEqual(prevProps: OrgNodeCardProps, nextProps: OrgNodeCardProps) {
	const prevData = prevProps.data;
	const nextData = nextProps.data;

	return (
		prevProps.width === nextProps.width &&
		prevProps.height === nextProps.height &&
		prevData?.id === nextData?.id &&
		prevData?.name === nextData?.name &&
		prevData?.newOrg === nextData?.newOrg &&
		prevData?.projOrgStatus === nextData?.projOrgStatus &&
		prevData?.disable === nextData?.disable &&
		prevData?.effective === nextData?.effective &&
		prevData?.isStopped === nextData?.isStopped &&
		prevData?.isChanged === nextData?.isChanged &&
		prevData?.childrenModified === nextData?.childrenModified &&
		prevData?.changeHighlightColor === nextData?.changeHighlightColor &&
		prevData?.level === nextData?.level &&
		prevData?.parentId === nextData?.parentId &&
		JSON.stringify(prevData?.displayFields ?? []) ===
			JSON.stringify(nextData?.displayFields ?? []) &&
		prevData?.hiddenChildCount === nextData?.hiddenChildCount &&
		prevData?.canExpandChildren === nextData?.canExpandChildren
	);
}

// 静态样式提升为模块级常量，避免每次 render 创建新对象
const fontSmoothing = {
	WebkitFontSmoothing: "antialiased" as const,
	MozOsxFontSmoothing: "grayscale" as const,
};

const wrapperBaseStyle: React.CSSProperties = {
	position: "relative",
	pointerEvents: "auto",
	transformOrigin: "center",
	transition: "transform 0.2s ease-out",
	display: "flex",
	flexDirection: "column",
	...fontSmoothing,
	textRendering: "geometricPrecision",
	backfaceVisibility: "visible",
	perspective: "none",
};

const topBarStyle: React.CSSProperties = {
	height: "20px",
	flexShrink: 0,
	display: "flex",
	alignItems: "center",
	justifyContent: "flex-end",
	padding: "0 6px 0 26px",
	gap: 4,
	fontWeight: 400,
	fontFamily: "PingFang SC",
	color: "rgba(96, 98, 102, 1)",
};

const dividerStyle: React.CSSProperties = {
	fontSize: 12,
	lineHeight: 1,
	color: "#ffffff",
	userSelect: "none",
};

const mutedCardTextColor = "rgba(144, 147, 153, 1)";

const stoppedBadgeStyle: React.CSSProperties = {
	position: "absolute",
	top: -20,
	right: 0,
	height: 24,
	padding: "0 8px",
	borderTopLeftRadius: 6,
	borderTopRightRadius: 6,
	borderBottomRightRadius: 0,
	borderBottomLeftRadius: 0,
	background: "rgba(235, 238, 245, 1)",
	color: "rgba(0, 0, 0, 1)",
	fontSize: 12,
	lineHeight: "18px",
	display: "inline-flex",
	alignItems: "flex-start",
	justifyContent: "center",
	paddingTop: 1,
	pointerEvents: "none",
	whiteSpace: "nowrap",
	zIndex: 0,
};

const nameAreaStyle: React.CSSProperties = {
	flex: 1,
	background: "#fff",
	borderRadius: "4px",
	margin: "1px 1px 1px 1px",
	// transform: "translateY(-1px)",
	fontWeight: 400,
	fontFamily: "PingFang SC",
	lineHeight: "18px",
	pointerEvents: "none",
	minHeight: "30px",
	display: "flex",
	flexDirection: "column",
	justifyContent: "center",
	alignItems: "flex-start",
	textAlign: "left",
	padding: "6px 8px",
	gap: 4,
};

const precreatedTagStyle: React.CSSProperties = {
	alignSelf: "flex-start",
	padding: "0 6px",
	borderRadius: 4,
	background: "rgba(235, 238, 245, 1)",
	color: "rgba(50, 50, 51, 1)",
	fontSize: 12,
	lineHeight: "20px",
	fontWeight: 400,
	whiteSpace: "nowrap",
	maxWidth: "100%",
};

const projOrgStatusTagStyle: React.CSSProperties = {
	...precreatedTagStyle,
	background: "rgba(219, 234, 254, 1)",
	color: "rgba(32, 119, 255, 1)",
};

const tagRowStyle: React.CSSProperties = {
	alignSelf: "stretch",
	display: "flex",
	alignItems: "center",
	gap: 4,
	flexWrap: "wrap",
};

const fieldTextStyle: React.CSSProperties = {
	fontSize: 10,
	lineHeight: "18px",
	color: "rgba(96, 98, 102, 1)",
	textAlign: "left",
	alignSelf: "stretch",
	display: "inline-flex",
	alignItems: "center",
	gap: 4,
	flexWrap: "wrap",
};

const fieldDiffTextStyle: React.CSSProperties = {
	color: "rgba(245, 108, 108, 1)",
	fontWeight: 500,
};

const fieldDividerStyle: React.CSSProperties = {
	width: "100%",
	height: 1,
	background: "rgba(220, 223, 230, 1)",
	alignSelf: "stretch",
};

const searchHighlightTextStyle: React.CSSProperties = {
	background: "rgba(255, 214, 102, 0.85)",
	borderRadius: 2,
	padding: "0 1px",
	boxDecorationBreak: "clone",
	WebkitBoxDecorationBreak: "clone",
};

const menuWrapperStyle: React.CSSProperties = {
	display: "inline-flex",
	alignItems: "center",
	gap: 0,
	fontSize: 12,
	lineHeight: "16px",
	fontWeight: 400,
	fontFamily: "PingFang SC",
	cursor: "pointer",
	pointerEvents: "auto",
	color: "rgba(96, 98, 102, 1)",
};

const menuLabelStyle: React.CSSProperties = {
	fontSize: 12,
	lineHeight: "16px",
	fontWeight: 400,
	fontFamily: "PingFang SC",
	userSelect: "none",
	position: "relative",
	top: -1,
};

const menuIconStyle: React.CSSProperties = {
	fontSize: 10,
	marginLeft: 1,
	display: "inline-flex",
	alignItems: "center",
	justifyContent: "center",
	position: "relative",
	top: -1,
};

const dropdownPanelStyle: React.CSSProperties = {
	position: "fixed",
	background: "#ffffff",
	borderRadius: 8,
	boxShadow: "0 6px 18px rgba(0, 0, 0, 0.16)",
	padding: "6px",
	minWidth: 132,
	zIndex: 9999,
	pointerEvents: "auto",
	border: "1px solid rgba(0, 0, 0, 0.08)",
};

const dropdownMenuItemStyle: React.CSSProperties = {
	padding: "8px 14px",
	lineHeight: "22px",
	fontSize: 12,
	color: "rgba(96, 98, 102, 1)",
	cursor: "pointer",
	userSelect: "none",
	whiteSpace: "nowrap",
	borderRadius: 6,
	transition: "background-color 0.2s ease, color 0.2s ease",
};

const MENU_HOVER_BACKGROUND = "rgba(22, 119, 255, 0.08)";
const MENU_HOVER_TEXT = "rgba(22, 119, 255, 1)";

const BATCH_MENU_OPTIONS: Array<{ key: OrgNodeBatchAction; label: string }> = [
	{ key: "batch-enable", label: "批量启用下级" },
	{ key: "batch-disable", label: "批量禁用下级" },
	{ key: "batch-select-children", label: "批量勾选下级" },
	{ key: "batch-unselect-children", label: "批量取消勾选下级" },
];

const PORT_RADIUS = 10;
const SELECTED_EDGE_HIGHLIGHT = "rgba(0, 117, 255, 1)";

const expandBadgeBaseStyle: React.CSSProperties = {
	position: "absolute",
	minWidth: 12,
	height: 20,
	padding: "0 1px",
	background: "transparent",
	color: "#000000",
	fontSize: 11,
	lineHeight: "20px",
	fontWeight: 600,
	fontVariantNumeric: "tabular-nums",
	textAlign: "center",
	cursor: "pointer",
	pointerEvents: "auto",
	userSelect: "none",
	zIndex: 0,
	display: "inline-flex",
	alignItems: "center",
	justifyContent: "center",
	whiteSpace: "nowrap",
	textShadow: "0 0 2px #ffffff, 0 0 2px #ffffff",
};

function escapeRegExp(value: string) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function renderHighlightedText(text: string, keyword: string, textColor: string) {
	const normalizedKeyword = keyword.trim().toLowerCase();
	if (!normalizedKeyword) {
		return text;
	}

	if (!text.toLowerCase().includes(normalizedKeyword)) {
		return text;
	}

	const matcher = new RegExp(`(${escapeRegExp(keyword)})`, "gi");
	const segments = text.split(matcher).filter(Boolean);

	return segments.map((segment, index) => {
		const isMatched = segment.toLowerCase() === normalizedKeyword;
		if (!isMatched) {
			return <React.Fragment key={`${segment}-${index}`}>{segment}</React.Fragment>;
		}

		return (
			<span
				key={`${segment}-${index}`}
				style={{ ...searchHighlightTextStyle, color: textColor }}
			>
				{segment}
			</span>
		);
	});
}

interface OrgNodeCardVisualProps {
	data: OrgNodeCardData;
	width: number;
	height: number;
	isDropTarget?: boolean;
	interactive?: boolean;
}

export const OrgNodeCardVisual: React.FC<OrgNodeCardVisualProps> = ({
	data,
	width,
	height,
	isDropTarget = false,
	interactive = true,
}) => {
	const selectedCardIds = useZoomStore((s) => s.selectedCardIds);
	const selectedEdge = useZoomStore((s) => s.selectedEdge);
	const searchKeyword = useZoomStore((s) => s.searchKeyword);
	const toggleCardSelection = useZoomStore((s) => s.onCardToggle);
	const expandNode = useZoomStore((s) => s.onNodeExpand);
	const toggleNodeStatus = useZoomStore((s) => s.onNodeStatusToggle);
	const triggerBatchAction = useZoomStore((s) => s.onNodeBatchAction);
	const triggerNodeCompare = useZoomStore((s) => s.onNodeCompare);
	const isSelected = selectedCardIds.has(data.id);
	const isSelectedEdgeTarget = selectedEdge?.targetId === data.id;
	const isDisabled = data.disable !== false;
	const isStopped = data.isStopped ?? data.effective === false;
	const useMutedTextColor = isDisabled || isStopped;
	const isChanged = Boolean(data.isChanged);
	const childrenModified = Boolean(data.childrenModified);
	const isReadOnly = Boolean(data.readOnly);
	const showStatusAction = !isReadOnly && (isStopped || (!isChanged && !childrenModified));
	const showCompareAction = !isReadOnly && childrenModified && !isStopped;
	const enableText = isDisabled ? "启用" : "禁用";
	const statusActionText = isStopped ? "取消停用" : enableText;
	const cardBackgroundColor = childrenModified
		? String(data.changeHighlightColor ?? "rgba(255, 213, 173, 1)")
		: isChanged
			? String(data.changeHighlightColor ?? "rgba(255, 213, 173, 1)")
			: isDisabled
				? "rgba(192, 196, 204, 1)"
				: "#add3ff";
	const resolvedCardBackgroundColor = isStopped ? "rgba(198, 203, 211, 1)" : cardBackgroundColor;
	const resolvedNameAreaBackground = isStopped ? "rgba(243, 244, 246, 1)" : "#fff";
	const resolvedTextColor = useMutedTextColor ? mutedCardTextColor : "rgba(96, 98, 102, 1)";
	const resolvedTitleColor = useMutedTextColor ? mutedCardTextColor : "rgba(0, 0, 0, 1)";
	const resolvedMenuLabelStyle = { ...menuLabelStyle, color: resolvedTextColor };
	const displayFields = data.displayFields ?? [];
	const isPrecreated = Boolean(data.newOrg ?? data.properties?.newOrg);
	const projOrgStatus = String(data.projOrgStatus ?? data.properties?.projOrgStatus ?? "").trim();
	const hasTagRow = isPrecreated || Boolean(projOrgStatus);
	const highlightedName = renderHighlightedText(
		String(data.name ?? ""),
		searchKeyword,
		resolvedTitleColor,
	);
	const childNodeCount = Math.max(Number(data.hiddenChildCount ?? 0), 0);
	const isRootNode = Number(data.level ?? 0) === 1;
	const canExpandChildren = Boolean(
		!isReadOnly && !isRootNode && data.canExpandChildren && childNodeCount > 0,
	);
	const showChildCountBadge = !isReadOnly && Number.isFinite(childNodeCount);
	const [menuOpen, setMenuOpen] = useState(false);
	const [hoveredMenuAction, setHoveredMenuAction] = useState<OrgNodeBatchAction | null>(null);
	const menuTriggerRef = useRef<HTMLDivElement | null>(null);
	const menuPanelRef = useRef<HTMLDivElement | null>(null);
	const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
	const expandBadgeStyle =
		Number(data.level ?? 0) === 1
			? {
					...expandBadgeBaseStyle,
					left: width / 2,
					top: height + PORT_RADIUS - 1,
					transform: "translate(-50%, -50%)",
				}
			: {
					...expandBadgeBaseStyle,
					left: -PORT_RADIUS,
					top: height / 2 - 1,
					transform: "translate(-50%, -50%)",
				};

	const handleCheckboxChange = (e: any) => {
		e.stopPropagation();
		if (interactive && !isDisabled && toggleCardSelection) {
			toggleCardSelection(data.id);
		}
	};

	const triggerMenuAction = (
		action: OrgNodeBatchAction,
		event?: React.SyntheticEvent<HTMLElement>,
	) => {
		event?.preventDefault();
		event?.stopPropagation();
		if (!interactive) {
			return;
		}

		setHoveredMenuAction(null);
		setMenuOpen(false);
		triggerBatchAction?.(data.id, action);
	};

	const updateMenuPosition = () => {
		const triggerElement = menuTriggerRef.current;
		if (!triggerElement) {
			return;
		}

		const rect = triggerElement.getBoundingClientRect();
		const estimatedWidth = 132;
		const viewportPadding = 8;
		const nextLeft = Math.min(
			Math.max(viewportPadding, rect.right + 6),
			window.innerWidth - estimatedWidth - viewportPadding,
		);
		const nextTop = Math.min(rect.bottom + 6, window.innerHeight - 8);

		setMenuPosition({
			top: nextTop,
			left: nextLeft,
		});
	};

	useEffect(() => {
		if (!menuOpen) {
			return;
		}

		updateMenuPosition();

		const handleDocumentPointerDown = (event: PointerEvent) => {
			const target = event.target as Node | null;
			if (
				target &&
				(menuTriggerRef.current?.contains(target) || menuPanelRef.current?.contains(target))
			) {
				return;
			}

			setHoveredMenuAction(null);
			setMenuOpen(false);
		};

		const handleViewportChange = () => {
			updateMenuPosition();
		};

		document.addEventListener("pointerdown", handleDocumentPointerDown);
		window.addEventListener("resize", handleViewportChange);
		window.addEventListener("scroll", handleViewportChange, true);

		return () => {
			document.removeEventListener("pointerdown", handleDocumentPointerDown);
			window.removeEventListener("resize", handleViewportChange);
			window.removeEventListener("scroll", handleViewportChange, true);
		};
	}, [menuOpen]);

	const handleMenuToggle = (event: React.SyntheticEvent<HTMLDivElement>) => {
		event.preventDefault();
		event.stopPropagation();
		if (!interactive) {
			return;
		}

		setHoveredMenuAction(null);
		updateMenuPosition();
		setMenuOpen((prev) => !prev);
	};

	const handleExpandClick = (event: React.MouseEvent<HTMLDivElement>) => {
		event.stopPropagation();
		if (interactive && canExpandChildren && expandNode) {
			expandNode(data.id);
		}
	};

	const handleStatusClick = (event: React.MouseEvent<HTMLSpanElement>) => {
		event.stopPropagation();
		if (interactive && toggleNodeStatus && showStatusAction) {
			toggleNodeStatus(data.id);
		}
	};

	const handleCompareClick = (event: React.MouseEvent<HTMLSpanElement>) => {
		event.stopPropagation();
		if (interactive && showCompareAction) {
			triggerNodeCompare?.(data.id);
		}
	};

	return (
		<>
			{isStopped && <div style={stoppedBadgeStyle}>停用</div>}
			{showChildCountBadge && (
				<div
					data-drag-ignore="true"
					style={{
						...expandBadgeStyle,
						cursor: interactive && canExpandChildren ? "pointer" : "default",
						pointerEvents: interactive ? "auto" : "none",
					}}
					onMouseDown={interactive ? (e) => e.stopPropagation() : undefined}
					onClick={interactive ? handleExpandClick : undefined}
				>
					{childNodeCount}
				</div>
			)}
			<div
				className="overflow-hidden rounded bg-white"
				style={{
					width,
					background: resolvedCardBackgroundColor,
					display: "flex",
					flexDirection: "column",
					...fontSmoothing,
					position: "relative",
					zIndex: 1,
					padding: "1px",
					pointerEvents: interactive ? "auto" : "none",
					boxShadow: isDropTarget
						? "0 0 0 2px rgba(22, 119, 255, 0.9), 0 8px 18px rgba(22, 119, 255, 0.18)"
						: isSelectedEdgeTarget
							? `0 0 0 2px ${SELECTED_EDGE_HIGHLIGHT}, 0 6px 14px rgba(0, 117, 255, 0.18)`
							: undefined,
				}}
			>
				{!isStopped && !isReadOnly && (
					<div
						data-drag-ignore="true"
						style={{
							position: "absolute",
							top: "0px",
							left: "1px",
							zIndex: 1000,
							pointerEvents: interactive ? "auto" : "none",
						}}
						draggable={false}
						onMouseDown={interactive ? (e) => e.stopPropagation() : undefined}
						onMouseUp={interactive ? (e) => e.stopPropagation() : undefined}
						onMouseMove={interactive ? (e) => e.stopPropagation() : undefined}
						onTouchStart={interactive ? (e) => e.stopPropagation() : undefined}
						onTouchEnd={interactive ? (e) => e.stopPropagation() : undefined}
						onClick={interactive ? (e) => e.stopPropagation() : undefined}
					>
						<Checkbox
							checked={isSelected}
							disabled={isDisabled}
							onChange={handleCheckboxChange}
							onClick={interactive ? (e) => e.stopPropagation() : undefined}
							className={
								(isChanged || childrenModified) && !isStopped
									? "org-card-checkbox-orange"
									: undefined
							}
						/>
					</div>
				)}

				{!isReadOnly && (
					<div style={{ ...topBarStyle, color: resolvedTextColor }}>
						{showCompareAction && (
							<>
								<span
									data-drag-ignore="true"
									className="cursor-pointer select-none text-xs"
									draggable={false}
									onClick={interactive ? handleCompareClick : undefined}
									onMouseDown={
										interactive ? (e) => e.stopPropagation() : undefined
									}
								>
									对比
								</span>
								<span style={{ ...dividerStyle, color: resolvedTextColor }}>|</span>
							</>
						)}
						{showStatusAction && (
							<>
								<span
									data-drag-ignore="true"
									className="cursor-pointer select-none text-xs"
									draggable={false}
									onClick={interactive ? handleStatusClick : undefined}
									onMouseDown={
										interactive ? (e) => e.stopPropagation() : undefined
									}
								>
									{statusActionText}
								</span>
								<span style={{ ...dividerStyle, color: resolvedTextColor }}>|</span>
							</>
						)}
						<div
							ref={menuTriggerRef}
							data-drag-ignore="true"
							style={{
								position: "relative",
								pointerEvents: interactive ? "auto" : "none",
							}}
							onMouseDown={interactive ? (e) => e.stopPropagation() : undefined}
						>
							<div
								style={menuWrapperStyle}
								draggable={false}
								onPointerDown={interactive ? handleMenuToggle : undefined}
								onMouseDown={interactive ? handleMenuToggle : undefined}
								onClick={interactive ? (e) => e.preventDefault() : undefined}
							>
								<span style={resolvedMenuLabelStyle}>批量</span>
								<DownOutlined
									style={{
										...menuIconStyle,
										color: resolvedTextColor,
										transform: menuOpen ? "rotate(180deg)" : undefined,
										transition: "transform 0.2s ease",
									}}
								/>
							</div>
						</div>
					</div>
				)}

				<div
					className="flex items-center justify-between px-2"
					style={{ ...nameAreaStyle, background: resolvedNameAreaBackground }}
				>
					<span
						className="break-words text-xs font-medium"
						style={{ color: resolvedTitleColor }}
					>
						{highlightedName}
					</span>
					{hasTagRow && (
						<span style={tagRowStyle}>
							{isPrecreated && <span style={precreatedTagStyle}>预创建</span>}
							{projOrgStatus && (
								<span style={projOrgStatusTagStyle}>{projOrgStatus}</span>
							)}
						</span>
					)}
					{displayFields.length > 0 && <span style={fieldDividerStyle} />}
					{displayFields.map((field) => (
						<span
							key={field.key}
							style={{ ...fieldTextStyle, color: resolvedTextColor }}
						>
							<span>{field.label}</span>
							<span>{field.value}</span>
							{field.diffText && (
								<span
									style={
										useMutedTextColor
											? { ...fieldDiffTextStyle, color: mutedCardTextColor }
											: fieldDiffTextStyle
									}
								>
									{field.diffText}
								</span>
							)}
						</span>
					))}
				</div>
			</div>
			{menuOpen &&
				menuPosition &&
				typeof document !== "undefined" &&
				createPortal(
					<div
						ref={menuPanelRef}
						style={{
							...dropdownPanelStyle,
							top: menuPosition.top,
							left: menuPosition.left,
						}}
						onPointerDown={(e) => e.stopPropagation()}
						onMouseDown={(e) => e.stopPropagation()}
						onClick={(e) => e.stopPropagation()}
					>
						{BATCH_MENU_OPTIONS.map((option) => (
							<div
								key={option.key}
								style={{
									...dropdownMenuItemStyle,
									background:
										hoveredMenuAction === option.key
											? MENU_HOVER_BACKGROUND
											: "transparent",
									color:
										hoveredMenuAction === option.key
											? MENU_HOVER_TEXT
											: String(dropdownMenuItemStyle.color),
								}}
								onMouseEnter={() => setHoveredMenuAction(option.key)}
								onMouseLeave={() =>
									setHoveredMenuAction((current) =>
										current === option.key ? null : current,
									)
								}
								onPointerDown={(event) => triggerMenuAction(option.key, event)}
								onMouseDown={(event) => triggerMenuAction(option.key, event)}
							>
								{option.label}
							</div>
						))}
					</div>,
					document.body,
				)}
		</>
	);
};

const OrgNodeCardInner: React.FC<OrgNodeCardProps> = ({
	data = { id: "1", name: "杭西地区", disable: true, effective: true, isStopped: false },
	width = 154,
	height = 53,
}) => {
	const [isHovered, setIsHovered] = useState(false);
	const zoomTick = useZoomStore((s) => s.zoomTick);
	const dragModeEnabled = useZoomStore((s) => s.dragModeEnabled);
	const draggingNodeId = useZoomStore((s) => s.draggingNodeId);
	const draggingNodeLevel = useZoomStore((s) => s.draggingNodeLevel);
	const dropTargetNodeId = useZoomStore((s) => s.dropTargetNodeId);
	const startNodeDrag = useZoomStore((s) => s.startNodeDrag);
	const updateDragPreviewPosition = useZoomStore((s) => s.updateDragPreviewPosition);
	const setDropTargetNodeId = useZoomStore((s) => s.setDropTargetNodeId);
	const clearNodeDrag = useZoomStore((s) => s.clearNodeDrag);
	const canNodeDropByRule = useZoomStore((s) => s.canNodeDrop);
	const dragCleanupRef = useRef<(() => void) | null>(null);
	const frameRef = useRef<number | null>(null);
	const pendingPointRef = useRef<{ x: number; y: number } | null>(null);
	const activeDragKeyRef = useRef<string | null>(null);

	const isReadOnly = Boolean(data.readOnly);

	// hover 时 scale(1.01)，缩放后交替微调 scale 强制浏览器重新光栅化文字
	const scale = isReadOnly ? 1 : isHovered ? 1.01 : 1 + (zoomTick % 2) * 0.001;

	const isDraggingSelf = draggingNodeId === data.id;
	const isDropTarget = dropTargetNodeId === data.id;
	const isDisabled = data.disable !== false;
	const isStopped = data.isStopped ?? data.effective === false;

	const canDropNode = (
		sourceNodeId: string | null,
		sourceLevel: number | undefined,
		sourceParentId: string | undefined,
		targetNodeId: string | null,
		targetNodeLevel: number | undefined,
		targetNodeParentId: string | undefined,
	) => {
		if (!sourceNodeId || !targetNodeId || sourceNodeId === targetNodeId) {
			return false;
		}

		if (canNodeDropByRule) {
			return canNodeDropByRule(
				{ id: sourceNodeId, level: sourceLevel, parentId: sourceParentId },
				{ id: targetNodeId, level: targetNodeLevel, parentId: targetNodeParentId },
			);
		}

		const normalizedSourceLevel = Number(sourceLevel ?? 0);
		return normalizedSourceLevel > 1;
	};

	const updatePointerPosition = (pointerX: number, pointerY: number) => {
		pendingPointRef.current = { x: pointerX, y: pointerY };
		if (frameRef.current !== null) {
			return;
		}

		frameRef.current = window.requestAnimationFrame(() => {
			frameRef.current = null;
			const point = pendingPointRef.current;
			if (!point) {
				return;
			}

			updateDragPreviewPosition(point.x, point.y);

			const targetElement = document.elementFromPoint(point.x, point.y) as HTMLElement | null;
			const nodeElement = targetElement?.closest("[data-org-node-id]") as HTMLElement | null;
			const targetNodeId = nodeElement?.dataset.orgNodeId ?? null;
			const targetNodeLevel = nodeElement?.dataset.orgNodeLevel
				? Number(nodeElement.dataset.orgNodeLevel)
				: undefined;
			const targetNodeParentId = nodeElement?.dataset.orgNodeParentId;
			setDropTargetNodeId(
				canDropNode(
					data.id,
					Number(data.level ?? 0),
					String(data.parentId ?? ""),
					targetNodeId,
					targetNodeLevel,
					targetNodeParentId,
				)
					? targetNodeId
					: null,
			);
		});
	};

	const updateDropTargetByCurrentNode = () => {
		setDropTargetNodeId(
			canDropNode(
				draggingNodeId,
				draggingNodeLevel ?? undefined,
				undefined,
				data.id,
				Number(data.level ?? 0),
				String(data.parentId ?? ""),
			)
				? data.id
				: null,
		);
	};

	const clearDropTargetByCurrentNode = () => {
		if (dropTargetNodeId === data.id) {
			setDropTargetNodeId(null);
		}
	};

	const handlePointerUpLike = (pointerX: number, pointerY: number) => {
		const targetElement = document.elementFromPoint(pointerX, pointerY) as HTMLElement | null;
		const nodeElement = targetElement?.closest("[data-org-node-id]") as HTMLElement | null;
		const targetNodeId = nodeElement?.dataset.orgNodeId ?? null;
		const targetNodeLevel = nodeElement?.dataset.orgNodeLevel
			? Number(nodeElement.dataset.orgNodeLevel)
			: undefined;
		const targetNodeParentId = nodeElement?.dataset.orgNodeParentId;

		if (
			canDropNode(
				data.id,
				Number(data.level ?? 0),
				String(data.parentId ?? ""),
				targetNodeId,
				targetNodeLevel,
				targetNodeParentId,
			) &&
			targetNodeId
		) {
			useZoomStore.getState().onNodeDrop?.(data.id, targetNodeId);
		}

		pendingPointRef.current = null;
		setDropTargetNodeId(null);
		clearNodeDrag();
	};

	const beginManualDrag = (
		clientX: number,
		clientY: number,
		currentTarget: HTMLDivElement,
		bindListeners: (handlers: {
			onMove: (event: Event) => void;
			onEnd: (event: Event) => void;
			onCancel: (event: Event) => void;
		}) => () => void,
		activeDragKey: string,
	) => {
		dragCleanupRef.current?.();
		if (frameRef.current !== null) {
			window.cancelAnimationFrame(frameRef.current);
			frameRef.current = null;
		}
		pendingPointRef.current = null;
		activeDragKeyRef.current = null;
		setDropTargetNodeId(null);
		clearNodeDrag();
		activeDragKeyRef.current = activeDragKey;

		const rect = currentTarget.getBoundingClientRect();
		startNodeDrag(data.id, Number(data.level ?? 0), {
			pointerX: clientX,
			pointerY: clientY,
			offsetX: clientX - rect.left,
			offsetY: clientY - rect.top,
			width,
			height,
			nodeData: data as OrgNodeCardData,
		});

		updatePointerPosition(clientX, clientY);

		const cleanup = bindListeners({
			onMove: (rawEvent: Event) => {
				if (activeDragKeyRef.current !== activeDragKey) {
					return;
				}

				const moveEvent = rawEvent as PointerEvent | MouseEvent;
				if ("preventDefault" in moveEvent) {
					moveEvent.preventDefault();
				}
				updatePointerPosition(moveEvent.clientX, moveEvent.clientY);
			},
			onEnd: (rawEvent: Event) => {
				if (activeDragKeyRef.current !== activeDragKey) {
					return;
				}

				const upEvent = rawEvent as PointerEvent | MouseEvent;
				handlePointerUpLike(upEvent.clientX, upEvent.clientY);
				dragCleanupRef.current?.();
			},
			onCancel: () => {
				if (activeDragKeyRef.current !== activeDragKey) {
					return;
				}

				setDropTargetNodeId(null);
				clearNodeDrag();
				dragCleanupRef.current?.();
			},
		});

		dragCleanupRef.current = () => {
			cleanup();
			pendingPointRef.current = null;
			if (frameRef.current !== null) {
				window.cancelAnimationFrame(frameRef.current);
				frameRef.current = null;
			}
			activeDragKeyRef.current = null;
		};
	};

	const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
		if (
			!dragModeEnabled ||
			isDisabled ||
			isStopped ||
			event.button !== 0 ||
			event.pointerType === "mouse"
		) {
			return;
		}

		const eventTarget = event.target as HTMLElement | null;
		if (eventTarget?.closest("[data-drag-ignore='true']")) {
			return;
		}

		event.preventDefault();
		event.stopPropagation();
		const pointerId = event.pointerId;

		beginManualDrag(
			event.clientX,
			event.clientY,
			event.currentTarget,
			({ onMove, onEnd, onCancel }) => {
				const handlePointerMove = (moveEvent: PointerEvent) => {
					if (moveEvent.pointerId === pointerId) {
						onMove(moveEvent);
					}
				};
				const handlePointerUp = (upEvent: PointerEvent) => {
					if (upEvent.pointerId === pointerId) {
						onEnd(upEvent);
					}
				};
				const handlePointerCancel = (cancelEvent: PointerEvent) => {
					if (cancelEvent.pointerId === pointerId) {
						onCancel(cancelEvent);
					}
				};

				window.addEventListener("pointermove", handlePointerMove, { passive: false });
				window.addEventListener("pointerup", handlePointerUp);
				window.addEventListener("pointercancel", handlePointerCancel);

				return () => {
					window.removeEventListener("pointermove", handlePointerMove);
					window.removeEventListener("pointerup", handlePointerUp);
					window.removeEventListener("pointercancel", handlePointerCancel);
				};
			},
			`pointer-${pointerId}`,
		);
	};

	const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
		if (!dragModeEnabled || isDisabled || event.button !== 0 || activeDragKeyRef.current) {
			return;
		}

		const eventTarget = event.target as HTMLElement | null;
		if (eventTarget?.closest("[data-drag-ignore='true']")) {
			return;
		}

		event.preventDefault();
		event.stopPropagation();

		beginManualDrag(
			event.clientX,
			event.clientY,
			event.currentTarget,
			({ onMove, onEnd }) => {
				const handleMouseMove = (moveEvent: MouseEvent) => {
					onMove(moveEvent);
				};
				const handleMouseUp = (upEvent: MouseEvent) => {
					onEnd(upEvent);
				};

				window.addEventListener("mousemove", handleMouseMove, { passive: false });
				window.addEventListener("mouseup", handleMouseUp);

				return () => {
					window.removeEventListener("mousemove", handleMouseMove);
					window.removeEventListener("mouseup", handleMouseUp);
				};
			},
			"mouse",
		);
	};

	const handleMouseEnter = () => {
		if (!dragModeEnabled || !draggingNodeId || isDraggingSelf) {
			return;
		}

		updateDropTargetByCurrentNode();
	};

	const handleMouseLeave = () => {
		if (!dragModeEnabled || !draggingNodeId) {
			return;
		}

		clearDropTargetByCurrentNode();
	};

	useEffect(() => {
		return () => {
			dragCleanupRef.current?.();
			activeDragKeyRef.current = null;
			if (frameRef.current !== null) {
				window.cancelAnimationFrame(frameRef.current);
				frameRef.current = null;
			}
		};
	}, []);

	return (
		<div
			data-org-node-id={data.id}
			data-org-node-level={String(data.level ?? 0)}
			data-org-node-parent-id={String(data.parentId ?? "")}
			style={{
				...wrapperBaseStyle,
				width,
				transform: `scale(${scale})`,
			}}
			onPointerDown={isReadOnly ? undefined : handlePointerDown}
			onMouseDown={isReadOnly ? undefined : handleMouseDown}
			onMouseEnter={() => {
				if (isReadOnly) {
					return;
				}
				setIsHovered(true);
				handleMouseEnter();
			}}
			onMouseLeave={() => {
				if (isReadOnly) {
					return;
				}
				setIsHovered(false);
				handleMouseLeave();
			}}
		>
			{isDraggingSelf ? (
				<div
					style={{
						width,
						height,
						background: "rgba(235, 238, 245, 1)",
						borderRadius: 4,
						border: "1px solid rgba(220, 223, 230, 1)",
						boxSizing: "border-box",
					}}
				/>
			) : (
				<OrgNodeCardVisual
					data={data as OrgNodeCardData}
					width={width}
					height={height}
					isDropTarget={isDropTarget}
					interactive={!isReadOnly}
				/>
			)}
		</div>
	);
};

export const OrgNodeCard = React.memo(OrgNodeCardInner, areNodeCardPropsEqual);

OrgNodeCard.displayName = "OrgNodeCard";

export default OrgNodeCard;
