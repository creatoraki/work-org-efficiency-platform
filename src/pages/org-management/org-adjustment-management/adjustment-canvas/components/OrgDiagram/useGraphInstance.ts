/**
 * Graph 实例生命周期管理 Hook
 * 首次挂载用实际数据创建实例，后续只更新数据，避免重复销毁重建
 */

import type { GraphData } from "@antv/g6";
import type { OrgNodeBatchAction } from "../../types";
import { CanvasEvent, CommonEvent, EdgeEvent, Graph, NodeEvent } from "@antv/g6";
import { useEffect, useRef } from "react";
import { buildGraphOptions } from "./config";
import { registerOrgDiagramExtensions } from "./register";
import { useZoomStore } from "./store";

const VIEWPORT_PADDING = [80, 120, 320, 120] as const;
const PREFERRED_INITIAL_ZOOM = 1.2;
const MIN_VIEWPORT_ZOOM = 0.35;
const MAX_VIEWPORT_ZOOM = 1.2;
const ROOT_FOCUS_TARGET_Y_RATIO = 0.28;
const ROOT_FOCUS_MIN_Y = 180;
const LEVEL_2_SIDE_BASE_OFFSET = 200;
const LEVEL_2_SIDE_GAP = 300;
const DIRECTORY_CHILD_X_OFFSET = 30;
const DIRECTORY_CHILD_Y_OFFSET = 110;
const DIRECTORY_CHILD_Y_GAP = 56;
const DEFAULT_NODE_WIDTH = 154;
const DEFAULT_NODE_HEIGHT = 53;
const DIRECTORY_PARENT_CHILD_GAP = DIRECTORY_CHILD_Y_OFFSET - DEFAULT_NODE_HEIGHT;
const EDGE_RADIUS = 16;
const EDGE_VERTICAL_DROP = 40;
const LEVEL_1_TO_2_TARGET_APPROACH = 36;
const LEVEL_1_TO_2_EDGE_RADIUS = 14;
const ACTIVE_EDGE_COLOR = "rgba(0, 117, 255, 1)";

const PORT_RADIUS = 10;
const ASSIST_NODE_ID = "__adjustment-port-drag-assist-node__";
const ASSIST_EDGE_ID = "__adjustment-port-drag-assist-edge__";

interface SelectedEdgeInfo {
	edgeId: string;
	sourceId: string;
	targetId: string;
	sourceLevel: number;
	targetLevel: number;
	targetPortKey: string;
}

interface PortDragSession {
	movingNodeId: string;
	movingNodeLevel: number;
	movingNodeParentId?: string;
	targetPortKey: string;
	restoreCanvasDrag: boolean;
}

interface HoveredNodeInfo {
	nodeId: string;
	nodeLevel?: number;
	nodeParentId?: string;
}

function getGraphDataArray<T>(items: T[] | undefined): T[] {
	return Array.isArray(items) ? items : [];
}

function isSameGraphItem(left: any, right: any): boolean {
	return JSON.stringify(left) === JSON.stringify(right);
}

function isIncrementalStructureChange(prevData: GraphData, nextData: GraphData): boolean {
	const prevNodes = getGraphDataArray(prevData.nodes);
	const nextNodes = getGraphDataArray(nextData.nodes);
	const prevEdges = getGraphDataArray(prevData.edges);
	const nextEdges = getGraphDataArray(nextData.edges);

	if (prevNodes.length === 0 || nextNodes.length === 0) {
		return false;
	}

	if (prevNodes.length === nextNodes.length && prevEdges.length === nextEdges.length) {
		return false;
	}

	const prevNodeIds = new Set(prevNodes.map((node: any) => String(node.id)));
	const nextNodeIds = new Set(nextNodes.map((node: any) => String(node.id)));
	const prevEdgeIds = new Set(prevEdges.map((edge: any) => String(edge.id)));
	const nextEdgeIds = new Set(nextEdges.map((edge: any) => String(edge.id)));

	const isExpand =
		prevNodes.every((node: any) => nextNodeIds.has(String(node.id))) &&
		prevEdges.every((edge: any) => nextEdgeIds.has(String(edge.id)));
	const isCollapse =
		nextNodes.every((node: any) => prevNodeIds.has(String(node.id))) &&
		nextEdges.every((edge: any) => prevEdgeIds.has(String(edge.id)));

	return isExpand || isCollapse;
}

function hasSameGraphStructure(prevData: GraphData, nextData: GraphData): boolean {
	const prevNodes = getGraphDataArray(prevData.nodes);
	const nextNodes = getGraphDataArray(nextData.nodes);
	const prevEdges = getGraphDataArray(prevData.edges);
	const nextEdges = getGraphDataArray(nextData.edges);

	if (prevNodes.length !== nextNodes.length || prevEdges.length !== nextEdges.length) {
		return false;
	}

	const prevNodeIds = new Set(prevNodes.map((node: any) => String(node.id)));
	const prevEdgeIds = new Set(prevEdges.map((edge: any) => String(edge.id)));

	return (
		nextNodes.every((node: any) => prevNodeIds.has(String(node.id))) &&
		nextEdges.every((edge: any) => prevEdgeIds.has(String(edge.id)))
	);
}

function canSyncGraphIncrementally(prevData: GraphData, nextData: GraphData): boolean {
	if (
		isIncrementalStructureChange(prevData, nextData) ||
		hasSameGraphStructure(prevData, nextData)
	) {
		return true;
	}

	const prevNodes = getGraphDataArray(prevData.nodes);
	const nextNodes = getGraphDataArray(nextData.nodes);
	const prevEdges = getGraphDataArray(prevData.edges);
	const nextEdges = getGraphDataArray(nextData.edges);

	if (
		prevNodes.length === 0 ||
		prevNodes.length !== nextNodes.length ||
		prevEdges.length !== nextEdges.length
	) {
		return false;
	}

	const prevNodeIds = new Set(prevNodes.map((node: any) => String(node.id)));
	return nextNodes.every((node: any) => prevNodeIds.has(String(node.id)));
}

function hasNodeSizeChanged(prevData: GraphData, nextData: GraphData): boolean {
	const prevNodes = getGraphDataArray(prevData.nodes) as any[];
	const nextNodes = getGraphDataArray(nextData.nodes) as any[];

	if (prevNodes.length !== nextNodes.length) {
		return true;
	}

	const prevNodeMap = new Map(prevNodes.map((node) => [String(node.id), node]));

	return nextNodes.some((node) => {
		const previousNode = prevNodeMap.get(String(node.id));
		if (!previousNode) {
			return true;
		}

		const prevSize = getNodeSize(previousNode);
		const nextSize = getNodeSize(node);
		return prevSize.width !== nextSize.width || prevSize.height !== nextSize.height;
	});
}

async function syncGraphDataIncrementally(graph: Graph, prevData: GraphData, nextData: GraphData) {
	const prevNodes = getGraphDataArray(prevData.nodes) as any[];
	const nextNodes = getGraphDataArray(nextData.nodes) as any[];
	const prevEdges = getGraphDataArray(prevData.edges) as any[];
	const nextEdges = getGraphDataArray(nextData.edges) as any[];
	let hasVisualChanges = false;

	const prevNodeMap = new Map(prevNodes.map((node) => [String(node.id), node]));
	const nextNodeMap = new Map(nextNodes.map((node) => [String(node.id), node]));
	const prevEdgeMap = new Map(prevEdges.map((edge) => [String(edge.id), edge]));
	const nextEdgeMap = new Map(nextEdges.map((edge) => [String(edge.id), edge]));

	const addedNodes = nextNodes.filter((node) => !prevNodeMap.has(String(node.id)));
	const updatedNodes = nextNodes.filter((node) => {
		const previousNode = prevNodeMap.get(String(node.id));
		return previousNode && !isSameGraphItem(previousNode, node);
	});
	const removedNodeIds = prevNodes
		.filter((node) => !nextNodeMap.has(String(node.id)))
		.map((node) => String(node.id));

	const addedEdges = nextEdges.filter((edge) => !prevEdgeMap.has(String(edge.id)));
	const updatedEdges = nextEdges.filter((edge) => {
		const previousEdge = prevEdgeMap.get(String(edge.id));
		return previousEdge && !isSameGraphItem(previousEdge, edge);
	});
	const removedEdgeIds = prevEdges
		.filter((edge) => !nextEdgeMap.has(String(edge.id)))
		.map((edge) => String(edge.id));

	if (removedEdgeIds.length) {
		graph.removeEdgeData(removedEdgeIds);
		hasVisualChanges = true;
	}

	if (removedNodeIds.length) {
		graph.removeNodeData(removedNodeIds);
		hasVisualChanges = true;
	}

	if (addedNodes.length) {
		graph.addNodeData(addedNodes);
		hasVisualChanges = true;
	}

	if (addedEdges.length) {
		graph.addEdgeData(addedEdges);
		hasVisualChanges = true;
	}

	if (updatedNodes.length) {
		graph.updateNodeData(updatedNodes);
		hasVisualChanges = true;
	}

	if (updatedEdges.length) {
		graph.updateEdgeData(updatedEdges);
		hasVisualChanges = true;
	}

	if (hasVisualChanges) {
		await graph.draw();
	}
}

function getNodePosition(node: any) {
	const x = Number(node?.style?.x ?? node?.x ?? 0);
	const y = Number(node?.style?.y ?? node?.y ?? 0);
	return { x, y };
}

function getNodeSize(node: any) {
	return {
		width: Number(node?.data?.nodeWidth ?? DEFAULT_NODE_WIDTH),
		height: Number(node?.data?.nodeHeight ?? DEFAULT_NODE_HEIGHT),
	};
}

function getPortPosition(node: any, portKey: string) {
	const { x, y } = getNodePosition(node);
	const { width, height } = getNodeSize(node);

	if (portKey === "top") {
		return {
			x,
			y: y - height / 2 - PORT_RADIUS,
		};
	}

	return {
		x: x - width / 2 - PORT_RADIUS,
		y,
	};
}

function getParentSourcePortKey(parentLevel: number | undefined) {
	return Number(parentLevel ?? 0) === 1 ? "bottom" : "left";
}

function hasPositionChanged(node: any, nextX: number, nextY: number): boolean {
	const { x, y } = getNodePosition(node);
	return Math.abs(x - nextX) > 0.001 || Math.abs(y - nextY) > 0.001;
}

function getNodeLevel(node: any): number {
	return Number(node?.data?.level ?? 0);
}

function getNodeParentId(node: any): string | undefined {
	const parentId = node?.data?.parentId ?? node?.parentId;
	return parentId === undefined || parentId === null ? undefined : String(parentId);
}

function getEdgeTargetPortKey(edge: any): string {
	return String(
		edge?.targetPort ||
			edge?.style?.targetPort ||
			(Number(edge?.data?.targetLevel ?? 0) === 2 ? "top" : "left"),
	);
}

function getSelectedEdgeInfo(graph: Graph, edgeId: string): SelectedEdgeInfo | null {
	if (!graph.hasEdge(edgeId)) {
		return null;
	}

	const edge = graph.getEdgeData(edgeId) as any;
	const sourceNode = graph.getNodeData(String(edge.source)) as any;
	const targetNode = graph.getNodeData(String(edge.target)) as any;
	return {
		edgeId,
		sourceId: String(edge.source),
		targetId: String(edge.target),
		sourceLevel: getNodeLevel(sourceNode),
		targetLevel: getNodeLevel(targetNode),
		targetPortKey: getEdgeTargetPortKey(edge),
	};
}

function isPortHit(originalTarget: any, portKey: string): boolean {
	const className = String(originalTarget?.className ?? "");
	return className.includes(`port-${portKey}`);
}

function canDropNode(
	sourceNodeId: string,
	sourceLevel: number,
	sourceParentId: string | undefined,
	targetNodeId: string | null,
	targetNodeLevel: number | undefined,
	targetNodeParentId: string | undefined,
) {
	if (!targetNodeId || sourceNodeId === targetNodeId) {
		return false;
	}

	const customCanDrop = useZoomStore.getState().canNodeDrop;
	if (customCanDrop) {
		return customCanDrop(
			{ id: sourceNodeId, level: sourceLevel, parentId: sourceParentId },
			{ id: targetNodeId, level: targetNodeLevel, parentId: targetNodeParentId },
		);
	}

	return sourceLevel > 1;
}

function getClientPoint(event: any): [number, number] | null {
	const candidates = [
		event?.client,
		event?.originalEvent,
		event?.nativeEvent,
		event?.srcEvent,
		event?.originalTarget,
	];

	for (const candidate of candidates) {
		const clientX = Number(candidate?.x ?? candidate?.clientX);
		const clientY = Number(candidate?.y ?? candidate?.clientY);
		if (Number.isFinite(clientX) && Number.isFinite(clientY)) {
			return [clientX, clientY];
		}
	}

	return null;
}

function getHoveredNodeByClientPoint(clientX: number, clientY: number): HoveredNodeInfo | null {
	const targetElement = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
	const nodeElement = targetElement?.closest("[data-org-node-id]") as HTMLElement | null;
	if (!nodeElement?.dataset.orgNodeId) {
		return null;
	}

	return {
		nodeId: nodeElement.dataset.orgNodeId,
		nodeLevel: nodeElement.dataset.orgNodeLevel
			? Number(nodeElement.dataset.orgNodeLevel)
			: undefined,
		nodeParentId: nodeElement.dataset.orgNodeParentId,
	};
}

function getPointerCanvasPosition(
	graph: Graph,
	event: any,
	fallbackPointer?: [number, number] | null,
): [number, number] {
	const canvasX = Number(event?.canvas?.x);
	const canvasY = Number(event?.canvas?.y);
	if (Number.isFinite(canvasX) && Number.isFinite(canvasY)) {
		return [canvasX, canvasY];
	}

	const clientPoint = getClientPoint(event);
	if (clientPoint) {
		return graph.getCanvasByClient(clientPoint) as [number, number];
	}

	return fallbackPointer ?? [0, 0];
}

function setCanvasDragBehaviorEnabled(graph: Graph, enabled: boolean) {
	const behaviors = graph.getBehaviors();
	const nextBehaviors = enabled
		? behaviors.some(
				(behavior: any) =>
					(typeof behavior === "string" ? behavior : behavior.type) === "drag-canvas",
			)
			? behaviors
			: [...behaviors, "drag-canvas"]
		: behaviors.filter(
				(behavior: any) =>
					(typeof behavior === "string" ? behavior : behavior.type) !== "drag-canvas",
			);
	graph.setBehaviors(nextBehaviors);
}

async function clearAssistElements(graph: Graph) {
	if (graph.hasEdge(ASSIST_EDGE_ID)) {
		graph.removeEdgeData([ASSIST_EDGE_ID]);
	}
	if (graph.hasNode(ASSIST_NODE_ID)) {
		graph.removeNodeData([ASSIST_NODE_ID]);
	}
	await graph.draw();
}

async function ensureAssistElements(
	graph: Graph,
	pointer: [number, number],
	movingNodeId: string,
	targetPortKey: string,
	hoveredNode?: HoveredNodeInfo | null,
) {
	let [x, y] = pointer;
	const movingNode = graph.getNodeData(movingNodeId) as any;
	if (!movingNode) {
		return;
	}

	let assistSourcePortKey = "center";
	if (hoveredNode?.nodeId && hoveredNode.nodeId !== movingNodeId) {
		const hoveredGraphNode = graph.getNodeData(hoveredNode.nodeId) as any;
		if (hoveredGraphNode) {
			assistSourcePortKey = getParentSourcePortKey(hoveredNode.nodeLevel);
			const snappedPort = getPortPosition(hoveredGraphNode, assistSourcePortKey);
			x = snappedPort.x;
			y = snappedPort.y;
		}
	}

	const targetPort = getPortPosition(movingNode, targetPortKey);
	const isTopPort = targetPortKey === "top";
	const controlPoints: Array<[number, number]> = isTopPort
		? [
				[x, Math.max(y + 24, targetPort.y - LEVEL_1_TO_2_TARGET_APPROACH)],
				[targetPort.x, Math.max(y + 24, targetPort.y - LEVEL_1_TO_2_TARGET_APPROACH)],
			]
		: [
				[x, targetPort.y],
				[targetPort.x, targetPort.y],
			];
	const radius = isTopPort ? LEVEL_1_TO_2_EDGE_RADIUS : EDGE_RADIUS;

	if (!graph.hasNode(ASSIST_NODE_ID)) {
		graph.addNodeData([
			{
				id: ASSIST_NODE_ID,
				type: "circle",
				style: {
					x,
					y,
					size: 1,
					visibility: "hidden",
					ports: [
						{ key: "center", placement: [0.5, 0.5] },
						{ key: "bottom", placement: [0.5, 0.5] },
						{ key: "left", placement: [0.5, 0.5] },
					],
				},
			},
		]);
	} else {
		graph.updateNodeData([{ id: ASSIST_NODE_ID, style: { x, y } }]);
	}

	if (!graph.hasEdge(ASSIST_EDGE_ID)) {
		graph.addEdgeData([
			{
				id: ASSIST_EDGE_ID,
				type: "rounded-orth-polyline",
				source: ASSIST_NODE_ID,
				target: movingNodeId,
				sourcePort: assistSourcePortKey,
				targetPort: targetPortKey,
				radius,
				style: {
					sourcePort: assistSourcePortKey,
					targetPort: targetPortKey,
					router: false,
					radius,
					controlPoints,
					stroke: ACTIVE_EDGE_COLOR,
					lineWidth: 2,
					pointerEvents: "none",
					zIndex: 99,
				},
			},
		]);
	} else {
		graph.updateEdgeData([
			{
				id: ASSIST_EDGE_ID,
				target: movingNodeId,
				sourcePort: assistSourcePortKey,
				targetPort: targetPortKey,
				radius,
				style: {
					router: false,
					radius,
					controlPoints,
					sourcePort: assistSourcePortKey,
					targetPort: targetPortKey,
					stroke: ACTIVE_EDGE_COLOR,
					lineWidth: 2,
				},
			},
		]);
	}

	graph.frontElement([ASSIST_EDGE_ID, movingNodeId]);
	await graph.draw();
}

async function applyDirectoryEdgeLayout(graph: Graph) {
	const nodes = graph.getNodeData() as any[];
	const edges = graph.getEdgeData() as any[];
	const nodeMap = new Map(nodes.map((node) => [String(node.id), node]));
	const level2ChildrenGroup = new Map<string, any[]>();
	const directoryChildrenGroup = new Map<string, any[]>();
	const plannedPositionMap = new Map<string, { x: number; y: number }>();

	const getPlannedNodePosition = (nodeId: string, node: any) => {
		return plannedPositionMap.get(nodeId) ?? getNodePosition(node);
	};

	for (const node of nodes) {
		if (Number(node?.data?.level) === 2 && node?.data?.parentId) {
			const parentId = String(node.data.parentId);
			const parentNode = nodeMap.get(parentId);
			if (parentNode && Number(parentNode?.data?.level) === 1) {
				const siblings = level2ChildrenGroup.get(parentId) ?? [];
				siblings.push(node);
				level2ChildrenGroup.set(parentId, siblings);
			}
		}

		if (!node?.data?.parentId) {
			continue;
		}

		const parentId = String(node.data.parentId);
		const parentNode = nodeMap.get(parentId);
		const nodeLevel = Number(node?.data?.level ?? 0);
		const parentLevel = Number(parentNode?.data?.level ?? 0);
		if (!parentNode || nodeLevel < 3 || parentLevel < 2 || nodeLevel !== parentLevel + 1) {
			continue;
		}

		const siblings = directoryChildrenGroup.get(parentId) ?? [];
		siblings.push(node);
		directoryChildrenGroup.set(parentId, siblings);
	}

	const nodeUpdates: any[] = [];

	for (const [parentId, children] of level2ChildrenGroup.entries()) {
		const parentNode = nodeMap.get(parentId);
		if (!parentNode) {
			continue;
		}

		const { x: parentX } = getNodePosition(parentNode);
		const targetY =
			children.reduce((sum, child) => sum + getNodePosition(child).y, 0) / children.length;
		const sortedChildren = children
			.slice()
			.sort((left, right) => getNodePosition(left).x - getNodePosition(right).x);
		const leftCount = Math.floor(sortedChildren.length / 2);
		const leftChildren = sortedChildren.slice(0, leftCount);
		const rightChildren = sortedChildren.slice(leftCount);

		leftChildren.forEach((child, index) => {
			const distanceIndex = leftChildren.length - index;
			const childCenterX =
				parentX - LEVEL_2_SIDE_BASE_OFFSET - (distanceIndex - 1) * LEVEL_2_SIDE_GAP;
			plannedPositionMap.set(String(child.id), { x: childCenterX, y: targetY });
			if (hasPositionChanged(child, childCenterX, targetY)) {
				nodeUpdates.push({
					id: child.id,
					style: {
						x: childCenterX,
						y: targetY,
					},
				});
			}
		});

		rightChildren.forEach((child, index) => {
			const childCenterX = parentX + LEVEL_2_SIDE_BASE_OFFSET + index * LEVEL_2_SIDE_GAP;
			plannedPositionMap.set(String(child.id), { x: childCenterX, y: targetY });
			if (hasPositionChanged(child, childCenterX, targetY)) {
				nodeUpdates.push({
					id: child.id,
					style: {
						x: childCenterX,
						y: targetY,
					},
				});
			}
		});
	}

	const layoutDirectoryBranch = (parentId: string): number => {
		const parentNode = nodeMap.get(parentId);
		const children = directoryChildrenGroup.get(parentId);
		if (!parentNode || !children?.length) {
			const { y: parentY } = getPlannedNodePosition(parentId, parentNode);
			const { height: parentHeight } = getNodeSize(parentNode);
			return parentY + parentHeight / 2;
		}

		const { x: parentX, y: parentY } = getPlannedNodePosition(parentId, parentNode);
		const childCenterX = parentX + DIRECTORY_CHILD_X_OFFSET;
		const sortedChildren = children
			.slice()
			.sort((left, right) => getNodePosition(left).y - getNodePosition(right).y);

		let previousSubtreeBottomY: number | null = null;
		let branchBottomY = parentY + getNodeSize(parentNode).height / 2;

		for (let index = 0; index < sortedChildren.length; index += 1) {
			const child = sortedChildren[index];
			const childId = String(child.id);
			const { height: childHeight } = getNodeSize(child);
			const { height: parentHeight } = getNodeSize(parentNode);
			const childCenterY =
				previousSubtreeBottomY === null
					? parentY + parentHeight / 2 + DIRECTORY_PARENT_CHILD_GAP + childHeight / 2
					: previousSubtreeBottomY + DIRECTORY_CHILD_Y_GAP + childHeight / 2;
			plannedPositionMap.set(childId, { x: childCenterX, y: childCenterY });

			if (hasPositionChanged(child, childCenterX, childCenterY)) {
				nodeUpdates.push({
					id: child.id,
					style: {
						x: childCenterX,
						y: childCenterY,
					},
				});
			}

			const childSubtreeBottomY = layoutDirectoryBranch(childId);
			const ownBottomY = childCenterY + childHeight / 2;
			const subtreeBottomY = Math.max(childSubtreeBottomY, ownBottomY);
			branchBottomY = Math.max(branchBottomY, subtreeBottomY);
			previousSubtreeBottomY = subtreeBottomY;
		}

		return branchBottomY;
	};

	for (const parentId of directoryChildrenGroup.keys()) {
		const parentNode = nodeMap.get(parentId);
		const parentLevel = Number(parentNode?.data?.level ?? 0);
		if (parentLevel === 2) {
			layoutDirectoryBranch(parentId);
		}
	}

	if (nodeUpdates.length) {
		graph.updateNodeData(nodeUpdates);
	}

	const level2SharedApproachYMap = new Map<string, number>();

	for (const [parentId, children] of level2ChildrenGroup.entries()) {
		const parentNode = nodeMap.get(parentId);
		if (!parentNode || !children.length) {
			continue;
		}

		const { y: sourceY } = getNodePosition(parentNode);
		const { height: sourceHeight } = getNodeSize(parentNode);
		const sourceBottomPortY = sourceY + sourceHeight / 2 + PORT_RADIUS;
		const targetApproachLimitY = children.reduce((minY, child) => {
			const childId = String(child.id);
			const { y: childY } = getPlannedNodePosition(childId, child);
			const { height: childHeight } = getNodeSize(child);
			const targetTopPortY = childY - childHeight / 2 - PORT_RADIUS;
			return Math.min(minY, targetTopPortY - LEVEL_1_TO_2_TARGET_APPROACH);
		}, Number.POSITIVE_INFINITY);

		level2SharedApproachYMap.set(
			parentId,
			Math.max(sourceBottomPortY + 24, targetApproachLimitY),
		);
	}

	const edgeUpdates: any[] = [];

	for (const edge of edges) {
		const sourceId = String(edge.source);
		const targetId = String(edge.target);
		const sourceNode = nodeMap.get(sourceId);
		const targetNode = nodeMap.get(targetId);
		const sourceLevel = Number(sourceNode?.data?.level ?? 0);
		const targetLevel = Number(targetNode?.data?.level ?? 0);

		if (sourceLevel === 1 && targetLevel === 2) {
			const { x: sourceX, y: sourceY } = getNodePosition(sourceNode);
			const { x: targetX, y: targetY } = getPlannedNodePosition(targetId, targetNode);
			const { height: sourceHeight } = getNodeSize(sourceNode);
			const { height: targetHeight } = getNodeSize(targetNode);
			const sourceBottomPort = {
				x: sourceX,
				y: sourceY + sourceHeight / 2 + PORT_RADIUS,
			};
			const targetTopPort = {
				x: targetX,
				y: targetY - targetHeight / 2 - PORT_RADIUS,
			};
			const approachY =
				level2SharedApproachYMap.get(sourceId) ??
				Math.max(sourceBottomPort.y + 24, targetTopPort.y - LEVEL_1_TO_2_TARGET_APPROACH);
			const controlPoints: Array<[number, number]> = [
				[sourceBottomPort.x, approachY],
				[targetTopPort.x, approachY],
			];

			const nextEdgeUpdate = {
				id: edge.id,
				sourcePort: "bottom",
				targetPort: "top",
				radius: LEVEL_1_TO_2_EDGE_RADIUS,
				style: {
					sourcePort: "bottom",
					targetPort: "top",
					router: false,
					radius: LEVEL_1_TO_2_EDGE_RADIUS,
					controlPoints,
				},
			};

			if (!isSameGraphItem(edge, { ...edge, ...nextEdgeUpdate })) {
				edgeUpdates.push(nextEdgeUpdate);
			}
		}

		if (sourceLevel >= 2 && targetLevel === sourceLevel + 1) {
			const { x: sourceX, y: sourceY } = getPlannedNodePosition(sourceId, sourceNode);
			const targetPosition = plannedPositionMap.get(targetId) ?? getNodePosition(targetNode);
			if (!targetPosition) {
				continue;
			}
			const { width: sourceWidth } = getNodeSize(sourceNode);
			const { width: targetWidth } = getNodeSize(targetNode);
			const sourceLeftPort = {
				x: sourceX - sourceWidth / 2 - PORT_RADIUS,
				y: sourceY,
			};
			const targetLeftPort = {
				x: targetPosition.x - targetWidth / 2 - PORT_RADIUS,
				y: targetPosition.y,
			};

			const verticalTurnY = Math.min(
				targetLeftPort.y - 24,
				sourceLeftPort.y + EDGE_VERTICAL_DROP,
			);
			const nextEdgeUpdate = {
				id: edge.id,
				sourcePort: "left",
				targetPort: "left",
				style: {
					sourcePort: "left",
					targetPort: "left",
					router: false,
					radius: EDGE_RADIUS,
					controlPoints: [
						[sourceLeftPort.x, verticalTurnY],
						[sourceLeftPort.x, targetLeftPort.y],
						[targetLeftPort.x, targetLeftPort.y],
					],
				},
			};

			if (!isSameGraphItem(edge, { ...edge, ...nextEdgeUpdate })) {
				edgeUpdates.push(nextEdgeUpdate);
			}
		}
	}

	if (edgeUpdates.length) {
		graph.updateEdgeData(edgeUpdates);
	}

	if (nodeUpdates.length || edgeUpdates.length) {
		await graph.draw();
	}
}

async function applyPreferredViewport(graph: Graph) {
	const { setZoomPercent } = useZoomStore.getState();
	try {
		await graph.fitView({ padding: VIEWPORT_PADDING } as any, false);
	} catch {
		await graph.fitView(undefined, false);
	}

	try {
		const currentZoom = graph.getZoom();
		if (typeof currentZoom !== "number") {
			return;
		}

		const targetZoom = Math.min(
			MAX_VIEWPORT_ZOOM,
			Math.max(MIN_VIEWPORT_ZOOM, PREFERRED_INITIAL_ZOOM),
		);
		await graph.zoomTo(targetZoom, false);
		setZoomPercent(100);
	} catch {
		// 视口调整失败时保留当前图状态，避免影响主流程。
	}
}

function getRootNodeId(graphData: GraphData): string | null {
	const nodes = getGraphDataArray(graphData.nodes) as any[];
	if (!nodes.length) {
		return null;
	}

	const nodeWithoutParent = nodes.find((node) => {
		const parentId = node?.data?.parentId ?? node?.parentId;
		return parentId === undefined || parentId === null || parentId === "";
	});
	if (nodeWithoutParent?.id) {
		return String(nodeWithoutParent.id);
	}

	const levelOneNode = nodes.find((node) => Number(node?.data?.level ?? node?.level) === 1);
	if (levelOneNode?.id) {
		return String(levelOneNode.id);
	}

	return nodes[0]?.id ? String(nodes[0].id) : null;
}

async function focusRootNodeToPreferredPosition(
	graph: Graph,
	rootNodeId: string,
	container: HTMLDivElement,
) {
	const rootBounds = graph.getElementRenderBounds(rootNodeId);
	if (!rootBounds) {
		return;
	}

	const [rootViewportX, rootViewportY] = graph.getViewportByCanvas(rootBounds.center);
	const targetViewportX = container.clientWidth / 2;
	const targetViewportY = Math.max(
		container.clientHeight * ROOT_FOCUS_TARGET_Y_RATIO,
		ROOT_FOCUS_MIN_Y,
	);
	const deltaX = targetViewportX - rootViewportX;
	const deltaY = targetViewportY - rootViewportY;

	if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) {
		return;
	}

	await graph.translateBy([deltaX, deltaY], false);
}

function getNodeViewportCenter(graph: Graph, nodeId: string): [number, number] | null {
	if (!graph.hasNode(nodeId)) {
		return null;
	}

	const nodeBounds = graph.getElementRenderBounds(nodeId);
	if (!nodeBounds) {
		return null;
	}

	return graph.getViewportByCanvas(nodeBounds.center) as [number, number];
}

async function restoreNodeViewportPosition(
	graph: Graph,
	nodeId: string,
	targetViewportCenter: [number, number] | null,
) {
	if (!targetViewportCenter) {
		return;
	}

	const currentViewportCenter = getNodeViewportCenter(graph, nodeId);
	if (!currentViewportCenter) {
		return;
	}

	const deltaX = targetViewportCenter[0] - currentViewportCenter[0];
	const deltaY = targetViewportCenter[1] - currentViewportCenter[1];
	if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) {
		return;
	}

	await graph.translateBy([deltaX, deltaY], false);
}

export function useGraphInstance(
	containerRef: React.RefObject<HTMLDivElement>,
	orgData?: GraphData,
	selectedCardIds?: Set<string>,
	onCardToggle?: (cardId: string) => void,
	onNodeExpand?: (nodeId: string) => void,
	onNodeStatusToggle?: (nodeId: string) => void,
	onNodeBatchAction?: (nodeId: string, action: OrgNodeBatchAction) => void,
	onNodeCompare?: (nodeId: string) => void,
) {
	const graphRef = useRef<Graph | null>(null);
	const zoomTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const fitViewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const rootFocusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const resizeObserverRef = useRef<ResizeObserver | null>(null);
	const latestDataRef = useRef<GraphData>({ nodes: [], edges: [] });
	const prevDataRef = useRef<GraphData>({ nodes: [], edges: [] });
	const pendingRootFocusIdRef = useRef<string | null>(null);
	const pendingViewportAnchorNodeIdRef = useRef<string | null>(null);
	const focusedRootIdRef = useRef<string | null>(null);
	const lastGraphSizeRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 });
	const lastPointerCanvasPositionRef = useRef<[number, number] | null>(null);
	const lastPointerClientPositionRef = useRef<[number, number] | null>(null);
	const selectedEdgeRef = useRef<SelectedEdgeInfo | null>(null);
	const portDragSessionRef = useRef<PortDragSession | null>(null);
	const removePortDragWindowListenersRef = useRef<(() => void) | null>(null);

	// 创建或更新 Graph
	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const data =
			orgData && (orgData.nodes?.length || 0) > 0 ? orgData : { nodes: [], edges: [] };
		latestDataRef.current = data;
		if ((data.nodes?.length || 0) === 0) {
			pendingRootFocusIdRef.current = null;
			focusedRootIdRef.current = null;
		}
		const nextRootNodeId = getRootNodeId(data);
		if (nextRootNodeId !== focusedRootIdRef.current) {
			pendingRootFocusIdRef.current = nextRootNodeId;
		}

		const scheduleFitView = (graph: Graph) => {
			if (fitViewTimerRef.current) clearTimeout(fitViewTimerRef.current);

			fitViewTimerRef.current = setTimeout(() => {
				if (graphRef.current !== graph) return;
				if ((latestDataRef.current.nodes?.length || 0) === 0) return;
				const currentContainer = containerRef.current;
				if (!currentContainer) return;

				currentContainer.style.visibility = "hidden";
				const revealContainer = () => {
					requestAnimationFrame(() => {
						if (containerRef.current === currentContainer) {
							currentContainer.style.visibility = "visible";
						}
					});
				};

				void applyPreferredViewport(graph)
					.then(async () => {
						const pendingRootNodeId = pendingRootFocusIdRef.current;
						if (!pendingRootNodeId || containerRef.current !== currentContainer) {
							return;
						}
						if (rootFocusTimerRef.current) {
							clearTimeout(rootFocusTimerRef.current);
						}

						await new Promise<void>((resolve) => {
							rootFocusTimerRef.current = setTimeout(() => {
								rootFocusTimerRef.current = null;
								resolve();
							}, 80);
						});

						if (
							graphRef.current !== graph ||
							containerRef.current !== currentContainer
						) {
							return;
						}

						await focusRootNodeToPreferredPosition(
							graph,
							pendingRootNodeId,
							currentContainer,
						);
						focusedRootIdRef.current = pendingRootNodeId;
						pendingRootFocusIdRef.current = null;
					})
					.finally(revealContainer);
			}, 0);
		};

		const renderAndFitView = (graph: Graph) => {
			container.style.visibility = "hidden";
			Promise.resolve(graph.render())
				.then(async () => {
					await applyDirectoryEdgeLayout(graph);
					scheduleFitView(graph);
				})
				.catch(() => {
					// 初始化阶段图内部状态未就绪时，忽略本次自动定位，避免中断页面渲染。
					container.style.visibility = "visible";
				});
		};

		const syncGraphSize = (graph: Graph, width: number, height: number) => {
			lastGraphSizeRef.current = { width, height };
			graph.setSize(width, height);
			const behaviors = graph.getBehaviors();
			graph.setBehaviors(
				behaviors.map((b: any) =>
					typeof b === "object" && b.type === "zoom-canvas"
						? { ...b, origin: [width / 2, height / 2] }
						: b,
				),
			);
		};

		const ensureGraph = (width: number, height: number) => {
			if (width <= 0 || height <= 0) {
				return;
			}

			if (graphRef.current) {
				const previousData = prevDataRef.current;
				const nextData = latestDataRef.current;
				const sizeChanged =
					lastGraphSizeRef.current.width !== width ||
					lastGraphSizeRef.current.height !== height;

				if (sizeChanged) {
					syncGraphSize(graphRef.current, width, height);
				}

				if (previousData === nextData && !sizeChanged) {
					return;
				}

				if (canSyncGraphIncrementally(previousData, nextData)) {
					const structureChanged = isIncrementalStructureChange(previousData, nextData);
					const shouldRelayout =
						!structureChanged && hasNodeSizeChanged(previousData, nextData);
					const viewportAnchorNodeId = pendingViewportAnchorNodeIdRef.current;
					const viewportAnchorCenter = viewportAnchorNodeId
						? getNodeViewportCenter(graphRef.current, viewportAnchorNodeId)
						: null;
					void syncGraphDataIncrementally(graphRef.current, previousData, nextData)
						.then(async () => {
							if (shouldRelayout) {
								await graphRef.current!.layout();
							}
							await applyDirectoryEdgeLayout(graphRef.current!);
							if (viewportAnchorNodeId) {
								await restoreNodeViewportPosition(
									graphRef.current!,
									viewportAnchorNodeId,
									viewportAnchorCenter,
								);
							}
						})
						.finally(() => {
							pendingViewportAnchorNodeIdRef.current = null;
						});
				} else {
					pendingViewportAnchorNodeIdRef.current = null;
					graphRef.current.setData(nextData);
					renderAndFitView(graphRef.current);
				}
				prevDataRef.current = nextData;
				return;
			}

			registerOrgDiagramExtensions();

			const graph = new Graph({
				...buildGraphOptions(container),
				width,
				height,
				data: latestDataRef.current,
			});

			graphRef.current = graph;
			prevDataRef.current = latestDataRef.current;
			lastGraphSizeRef.current = { width, height };
			renderAndFitView(graph);

			const {
				notifyZoomChanged,
				setZoomPercent,
				setSelectedEdge,
				setDropTargetNodeId,
				setPortDragActive,
			} = useZoomStore.getState();

			const detachPortDragWindowListeners = () => {
				removePortDragWindowListenersRef.current?.();
				removePortDragWindowListenersRef.current = null;
			};

			const attachPortDragWindowListeners = () => {
				detachPortDragWindowListeners();

				const handleWindowPointerMove = (nativeEvent: PointerEvent) => {
					const session = portDragSessionRef.current;
					if (!session || graphRef.current !== graph) {
						return;
					}

					const clientPoint: [number, number] = [
						nativeEvent.clientX,
						nativeEvent.clientY,
					];
					const hoveredNode = getHoveredNodeByClientPoint(
						nativeEvent.clientX,
						nativeEvent.clientY,
					);
					lastPointerClientPositionRef.current = clientPoint;
					const canvasPoint = graph.getCanvasByClient(clientPoint) as [number, number];
					lastPointerCanvasPositionRef.current = canvasPoint;
					setDropTargetNodeId(
						canDropNode(
							session.movingNodeId,
							session.movingNodeLevel,
							session.movingNodeParentId,
							hoveredNode?.nodeId ?? null,
							hoveredNode?.nodeLevel,
							hoveredNode?.nodeParentId,
						)
							? hoveredNode!.nodeId
							: null,
					);
					void ensureAssistElements(
						graph,
						canvasPoint,
						session.movingNodeId,
						session.targetPortKey,
						canDropNode(
							session.movingNodeId,
							session.movingNodeLevel,
							session.movingNodeParentId,
							hoveredNode?.nodeId ?? null,
							hoveredNode?.nodeLevel,
							hoveredNode?.nodeParentId,
						)
							? hoveredNode
							: null,
					);
				};

				const handleWindowPointerUp = (nativeEvent: PointerEvent) => {
					if (!portDragSessionRef.current || graphRef.current !== graph) {
						return;
					}
					const hoveredNode = getHoveredNodeByClientPoint(
						nativeEvent.clientX,
						nativeEvent.clientY,
					);
					const dropTargetId = canDropNode(
						portDragSessionRef.current.movingNodeId,
						portDragSessionRef.current.movingNodeLevel,
						portDragSessionRef.current.movingNodeParentId,
						hoveredNode?.nodeId ?? null,
						hoveredNode?.nodeLevel,
						hoveredNode?.nodeParentId,
					)
						? hoveredNode!.nodeId
						: null;

					void finishPortDrag(dropTargetId, hoveredNode?.nodeLevel);
				};

				window.addEventListener("pointermove", handleWindowPointerMove, true);
				window.addEventListener("pointerup", handleWindowPointerUp, true);
				removePortDragWindowListenersRef.current = () => {
					window.removeEventListener("pointermove", handleWindowPointerMove, true);
					window.removeEventListener("pointerup", handleWindowPointerUp, true);
				};
			};

			const clearSelectedEdgeState = async () => {
				if (
					selectedEdgeRef.current?.edgeId &&
					graph.hasEdge(selectedEdgeRef.current.edgeId)
				) {
					await graph.setElementState(selectedEdgeRef.current.edgeId, [], false);
				}
				selectedEdgeRef.current = null;
				setSelectedEdge(null);
			};

			const finishPortDrag = async (
				dropTargetId: string | null = null,
				dropTargetLevel?: number,
			) => {
				const session = portDragSessionRef.current;
				portDragSessionRef.current = null;
				detachPortDragWindowListeners();
				lastPointerCanvasPositionRef.current = null;
				lastPointerClientPositionRef.current = null;
				setPortDragActive(false);
				setDropTargetNodeId(null);
				await clearAssistElements(graph);
				if (session?.restoreCanvasDrag && useZoomStore.getState().dragModeEnabled) {
					setCanvasDragBehaviorEnabled(graph, true);
				}

				if (
					session &&
					canDropNode(
						session.movingNodeId,
						session.movingNodeLevel,
						session.movingNodeParentId,
						dropTargetId,
						dropTargetLevel,
						dropTargetId ? getNodeParentId(graph.getNodeData(dropTargetId)) : undefined,
					)
				) {
					useZoomStore.getState().onNodeDrop?.(session.movingNodeId, dropTargetId!);
					await clearSelectedEdgeState();
				}
			};

			const selectEdge = async (edgeId: string | null) => {
				if (!edgeId) {
					await clearSelectedEdgeState();
					return;
				}

				const nextSelectedEdge = getSelectedEdgeInfo(graph, edgeId);
				if (!nextSelectedEdge) {
					await clearSelectedEdgeState();
					return;
				}

				if (selectedEdgeRef.current?.edgeId === edgeId) {
					await clearSelectedEdgeState();
					return;
				}

				await clearSelectedEdgeState();
				await graph.setElementState(edgeId, ["selected"], false);
				selectedEdgeRef.current = nextSelectedEdge;
				setSelectedEdge(nextSelectedEdge);
			};

			graph.on(EdgeEvent.CLICK, (event: any) => {
				if (portDragSessionRef.current) {
					return;
				}
				void selectEdge(String(event.target.id));
			});

			graph.on(CanvasEvent.CLICK, () => {
				if (portDragSessionRef.current) {
					return;
				}
				void selectEdge(null);
			});

			graph.on(NodeEvent.POINTER_DOWN, (event: any) => {
				if (!useZoomStore.getState().dragModeEnabled || portDragSessionRef.current) {
					return;
				}

				const selectedEdge = selectedEdgeRef.current;
				if (!selectedEdge || String(event.target.id) !== selectedEdge.targetId) {
					return;
				}

				if (!isPortHit(event.originalTarget, selectedEdge.targetPortKey)) {
					return;
				}

				event.preventDefault?.();
				event.stopPropagation?.();

				const restoreCanvasDrag = graph
					.getBehaviors()
					.some(
						(behavior: any) =>
							(typeof behavior === "string" ? behavior : behavior.type) ===
							"drag-canvas",
					);
				if (restoreCanvasDrag) {
					setCanvasDragBehaviorEnabled(graph, false);
				}

				portDragSessionRef.current = {
					movingNodeId: selectedEdge.targetId,
					movingNodeLevel: selectedEdge.targetLevel,
					movingNodeParentId: getNodeParentId(graph.getNodeData(selectedEdge.targetId)),
					targetPortKey: selectedEdge.targetPortKey,
					restoreCanvasDrag,
				};
				attachPortDragWindowListeners();
				setPortDragActive(true);

				const pointer = getPointerCanvasPosition(
					graph,
					event,
					lastPointerCanvasPositionRef.current,
				);
				const clientPoint = getClientPoint(event);
				if (clientPoint) {
					lastPointerClientPositionRef.current = clientPoint;
				}
				lastPointerCanvasPositionRef.current = pointer;
				void ensureAssistElements(
					graph,
					pointer,
					selectedEdge.targetId,
					selectedEdge.targetPortKey,
				);
			});

			graph.on(CommonEvent.POINTER_MOVE, (event: any) => {
				const session = portDragSessionRef.current;
				if (!session) {
					return;
				}

				const targetNodeId = event.targetType === "node" ? String(event.target.id) : null;
				const targetNodeLevel = targetNodeId
					? getNodeLevel(graph.getNodeData(targetNodeId))
					: undefined;
				setDropTargetNodeId(
					canDropNode(
						session.movingNodeId,
						session.movingNodeLevel,
						session.movingNodeParentId,
						targetNodeId,
						targetNodeLevel,
						targetNodeId ? getNodeParentId(graph.getNodeData(targetNodeId)) : undefined,
					)
						? targetNodeId
						: null,
				);
			});

			graph.on(CommonEvent.POINTER_UP, (event: any) => {
				const session = portDragSessionRef.current;
				if (!session) {
					return;
				}

				const dropTargetId = event.targetType === "node" ? String(event.target.id) : null;
				const dropTargetLevel = dropTargetId
					? getNodeLevel(graph.getNodeData(dropTargetId))
					: undefined;
				void finishPortDrag(dropTargetId, dropTargetLevel);
			});

			let lastZoom = 1;

			graph.on("aftertransform", () => {
				if (!graphRef.current || graphRef.current !== graph) return;
				let currentZoom: number | undefined;
				try {
					currentZoom = graph.getZoom();
				} catch {
					return;
				}
				if (typeof currentZoom !== "number") return;
				if (Math.abs(currentZoom - lastZoom) < 0.001) return;
				lastZoom = currentZoom;

				if (zoomTimerRef.current) clearTimeout(zoomTimerRef.current);
				zoomTimerRef.current = setTimeout(() => {
					const zoomPercent = Math.max(
						1,
						Math.round((currentZoom / PREFERRED_INITIAL_ZOOM) * 100),
					);
					setZoomPercent(zoomPercent);
					notifyZoomChanged();
				}, 300);
			});
		};

		// Graph 已存在，只更新数据
		ensureGraph(container.clientWidth, container.clientHeight);

		const resizeObserver = new ResizeObserver((entries) => {
			for (const entry of entries) {
				const { width, height } = entry.contentRect;
				ensureGraph(width, height);
			}
		});
		resizeObserver.observe(container);
		resizeObserverRef.current = resizeObserver;

		return () => {
			resizeObserver.disconnect();
			if (resizeObserverRef.current === resizeObserver) {
				resizeObserverRef.current = null;
			}
		};
	}, [orgData]);

	// 当 selectedCardIds 或 onCardToggle 变化时，更新 store 并重新渲染节点
	useEffect(() => {
		const {
			setSelectionState,
			setNodeExpandAction,
			setNodeStatusToggleAction,
			setNodeBatchAction,
			setNodeCompareAction,
		} = useZoomStore.getState();
		setSelectionState(selectedCardIds || new Set(), onCardToggle);
		setNodeExpandAction(
			onNodeExpand
				? (nodeId: string) => {
						pendingViewportAnchorNodeIdRef.current = nodeId;
						onNodeExpand(nodeId);
					}
				: undefined,
		);
		setNodeStatusToggleAction(onNodeStatusToggle);
		setNodeBatchAction(onNodeBatchAction);
		setNodeCompareAction(onNodeCompare);
	}, [
		selectedCardIds,
		onCardToggle,
		onNodeExpand,
		onNodeStatusToggle,
		onNodeBatchAction,
		onNodeCompare,
	]);

	// 仅在组件卸载时销毁 Graph 和清理资源
	useEffect(() => {
		return () => {
			if (zoomTimerRef.current) clearTimeout(zoomTimerRef.current);
			if (fitViewTimerRef.current) clearTimeout(fitViewTimerRef.current);
			if (rootFocusTimerRef.current) clearTimeout(rootFocusTimerRef.current);
			pendingRootFocusIdRef.current = null;
			focusedRootIdRef.current = null;
			resizeObserverRef.current?.disconnect();
			removePortDragWindowListenersRef.current?.();
			removePortDragWindowListenersRef.current = null;
			useZoomStore.getState().setSelectedEdge(null);
			useZoomStore.getState().setPortDragActive(false);
			useZoomStore.getState().setDropTargetNodeId(null);
			if (graphRef.current) {
				graphRef.current.destroy();
				graphRef.current = null;
			}
		};
	}, []);

	return graphRef;
}
