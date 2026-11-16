/**
 * OrgDiagram 画布状态
 * 用于跨 React Root 共享状态（G6 节点在独立的 React 树中）
 * - 缩放状态：通知 React 节点在缩放后重绘，解决文字模糊问题
 * - 选择状态：存储选中的卡片 ID 和切换回调
 */

import type { OrgNodeBatchAction, OrgNodeDisplayField } from "../../types";
import { create } from "zustand";

export interface DragPreviewNodeData {
	id: string;
	name: string;
	disable?: boolean;
	effective?: boolean;
	isStopped?: boolean;
	level?: number;
	parentId?: string;
	displayFields?: OrgNodeDisplayField[];
	hiddenChildCount?: number;
	canExpandChildren?: boolean;
	[key: string]: any;
}

interface DragPreviewState {
	pointerX: number;
	pointerY: number;
	offsetX: number;
	offsetY: number;
	width: number;
	height: number;
	nodeData: DragPreviewNodeData;
}

export interface SelectedEdgeState {
	edgeId: string;
	sourceId: string;
	targetId: string;
	sourceLevel: number;
	targetLevel: number;
	targetPortKey: string;
}

export interface NodeDropInfo {
	id: string;
	level?: number;
	parentId?: string;
}

interface ZoomStore {
	zoomTick: number;
	zoomPercent: number;
	notifyZoomChanged: () => void;
	setZoomPercent: (zoomPercent: number) => void;
	searchKeyword: string;
	setSearchKeyword: (searchKeyword: string) => void;
	// 卡片选择状态
	selectedCardIds: Set<string>;
	onCardToggle?: (cardId: string) => void;
	onNodeExpand?: (nodeId: string) => void;
	onNodeStatusToggle?: (nodeId: string) => void;
	onNodeBatchAction?: (nodeId: string, action: OrgNodeBatchAction) => void;
	onNodeCompare?: (nodeId: string) => void;
	onNodeDrop?: (sourceId: string, targetId: string) => void;
	canNodeDrop?: (source: NodeDropInfo, target: NodeDropInfo) => boolean;
	dragModeEnabled: boolean;
	draggingNodeId: string | null;
	draggingNodeLevel: number | null;
	dropTargetNodeId: string | null;
	dragPreview: DragPreviewState | null;
	selectedEdge: SelectedEdgeState | null;
	portDragActive: boolean;
	// 更新选择状态和回调
	setSelectionState: (
		selectedCardIds: Set<string>,
		onCardToggle?: (cardId: string) => void,
	) => void;
	setNodeExpandAction: (onNodeExpand?: (nodeId: string) => void) => void;
	setNodeStatusToggleAction: (onNodeStatusToggle?: (nodeId: string) => void) => void;
	setNodeBatchAction: (
		onNodeBatchAction?: (nodeId: string, action: OrgNodeBatchAction) => void,
	) => void;
	setNodeCompareAction: (onNodeCompare?: (nodeId: string) => void) => void;
	setNodeDropAction: (
		onNodeDrop?: (sourceId: string, targetId: string) => void,
		canNodeDrop?: (source: NodeDropInfo, target: NodeDropInfo) => boolean,
	) => void;
	setSelectedEdge: (selectedEdge: SelectedEdgeState | null) => void;
	setPortDragActive: (active: boolean) => void;
	setDragModeEnabled: (enabled: boolean) => void;
	startNodeDrag: (nodeId: string, nodeLevel: number, preview: DragPreviewState) => void;
	updateDragPreviewPosition: (pointerX: number, pointerY: number) => void;
	setDropTargetNodeId: (nodeId: string | null) => void;
	clearNodeDrag: () => void;
}

export const useZoomStore = create<ZoomStore>((set) => ({
	zoomTick: 0,
	zoomPercent: 100,
	notifyZoomChanged: () => set((state) => ({ zoomTick: state.zoomTick + 1 })),
	setZoomPercent: (zoomPercent) => set({ zoomPercent }),
	searchKeyword: "",
	setSearchKeyword: (searchKeyword) => set({ searchKeyword }),
	selectedCardIds: new Set<string>(),
	onCardToggle: undefined,
	onNodeExpand: undefined,
	onNodeStatusToggle: undefined,
	onNodeBatchAction: undefined,
	onNodeCompare: undefined,
	onNodeDrop: undefined,
	canNodeDrop: undefined,
	dragModeEnabled: true,
	draggingNodeId: null,
	draggingNodeLevel: null,
	dropTargetNodeId: null,
	dragPreview: null,
	selectedEdge: null,
	portDragActive: false,
	setSelectionState: (selectedCardIds, onCardToggle) => set({ selectedCardIds, onCardToggle }),
	setNodeExpandAction: (onNodeExpand) => set({ onNodeExpand }),
	setNodeStatusToggleAction: (onNodeStatusToggle) => set({ onNodeStatusToggle }),
	setNodeBatchAction: (onNodeBatchAction) => set({ onNodeBatchAction }),
	setNodeCompareAction: (onNodeCompare) => set({ onNodeCompare }),
	setNodeDropAction: (onNodeDrop, canNodeDrop) => set({ onNodeDrop, canNodeDrop }),
	setSelectedEdge: (selectedEdge) => set({ selectedEdge }),
	setPortDragActive: (portDragActive) => set({ portDragActive }),
	setDragModeEnabled: (enabled) => set({ dragModeEnabled: enabled }),
	startNodeDrag: (nodeId, nodeLevel, preview) =>
		set({
			draggingNodeId: nodeId,
			draggingNodeLevel: nodeLevel,
			dropTargetNodeId: null,
			dragPreview: preview,
		}),
	updateDragPreviewPosition: (pointerX, pointerY) =>
		set((state) =>
			state.dragPreview
				? {
						dragPreview: {
							...state.dragPreview,
							pointerX,
							pointerY,
						},
					}
				: state,
		),
	setDropTargetNodeId: (nodeId) => set({ dropTargetNodeId: nodeId }),
	clearNodeDrag: () =>
		set({
			draggingNodeId: null,
			draggingNodeLevel: null,
			dropTargetNodeId: null,
			dragPreview: null,
		}),
}));
