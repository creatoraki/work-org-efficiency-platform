import type { GraphData, GraphOptions, IElementEvent } from "@antv/g6";
import type { DeploymentNodeData } from "./types";
import type { ViewportAnchor } from "./viewport";
import { Graph, GraphEvent, NodeEvent } from "@antv/g6";
import { useCallback, useEffect, useRef, useState } from "react";
import { FIT_VIEW_PADDING, RESIZE_VIEWPORT_DEBOUNCE_MS } from "./constants";
import { resolveDeploymentNodeSize } from "./deployment-tree-node";
import { hasSameGraphStructure, isSameDeploymentGraphData } from "./graph-data";
import {
	buildDeploymentNodeConfig,
	deploymentGraphHandlersRef,
	ensureDeploymentG6Extensions,
} from "./nodes";
import { alignViewportToAnchor, captureViewportAnchor, fitInitialView } from "./viewport";

function bindDeploymentLeafClick(graph: Graph) {
	const onNodeClick = (event: IElementEvent) => {
		const nodeId = event.target?.id;
		if (!nodeId) {
			return;
		}
		const nodeData = graph.getNodeData(nodeId)?.data as DeploymentNodeData | undefined;
		if (nodeData?.kind !== "leaf") {
			return;
		}
		deploymentGraphHandlersRef.onOpenCandidateDrawer?.(nodeData);
	};
	graph.on(NodeEvent.CLICK, onNodeClick);
}

function buildZoomCanvasBehavior(width: number, height: number) {
	return {
		type: "zoom-canvas" as const,
		key: "zoom-canvas",
		origin: [width / 2, height / 2] as [number, number],
	};
}

function buildGraphOptions(
	container: HTMLElement,
	width: number,
	height: number,
	data: GraphData,
): GraphOptions {
	return {
		container,
		width,
		height,
		animation: false,
		padding: FIT_VIEW_PADDING,
		zoomRange: [0.01, 4],
		node: buildDeploymentNodeConfig(),
		edge: {
			type: "polyline",
			style: {
				stroke: "#BFC8D6",
				lineWidth: 1,
				radius: 12,
				router: { type: "orth" },
			},
		},
		layout: {
			type: "antv-dagre",
			rankdir: "TB",
			ranksep: 72,
			nodesep: 32,
			nodeSize: (node) => resolveDeploymentNodeSize((node.data ?? {}) as DeploymentNodeData),
		},
		behaviors: [
			{ type: "drag-canvas", key: "drag-canvas" },
			buildZoomCanvasBehavior(width, height),
		],
		data,
	};
}

function syncGraphSize(graph: Graph, width: number, height: number) {
	graph.resize(width, height);
	if (typeof graph.getBehaviors === "function" && typeof graph.setBehaviors === "function") {
		try {
			const behaviors = graph.getBehaviors().map((behavior) => {
				const behaviorType =
					typeof behavior === "string" ? behavior : (behavior as { type?: string }).type;
				return behaviorType === "zoom-canvas"
					? buildZoomCanvasBehavior(width, height)
					: behavior;
			});
			graph.setBehaviors(behaviors);
		} catch {
			// ignore
		}
	}
}

function hasSizeChanged(
	prev: { width: number; height: number } | null,
	width: number,
	height: number,
): boolean {
	if (!prev) {
		return true;
	}
	return Math.abs(prev.width - width) >= 2 || Math.abs(prev.height - height) >= 2;
}

export interface UseDeploymentGraphParams {
	graphData: GraphData;
	schemeKey: string;
}

export function useDeploymentGraph(
	containerRef: React.RefObject<HTMLDivElement | null>,
	{ graphData, schemeKey }: UseDeploymentGraphParams,
) {
	const graphRef = useRef<Graph | null>(null);
	const latestDataRef = useRef<GraphData>(graphData);
	const prevDataRef = useRef<GraphData>(graphData);
	const prevSchemeKeyRef = useRef(schemeKey);
	const initialViewReadyRef = useRef(false);
	const containerSizeRef = useRef<{ width: number; height: number } | null>(null);
	const resizeAnchorRef = useRef<ViewportAnchor | null>(null);
	const resizeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const pendingResizeRef = useRef<{ width: number; height: number } | null>(null);

	const [zoomPercent, setZoomPercent] = useState(100);
	const [isDragOnly, setIsDragOnly] = useState(false);
	const [isSchemeSwitching, setIsSchemeSwitching] = useState(false);

	const updateZoomDisplay = useCallback(() => {
		const graph = graphRef.current;
		if (!graph) {
			return;
		}
		try {
			const zoom = graph.getZoom();
			const ratio = typeof zoom === "number" && zoom > 0 ? zoom : 1;
			setZoomPercent(Math.round(ratio * 100));
		} catch {
			setZoomPercent(100);
		}
	}, []);

	const commitContainerSize = useCallback((width: number, height: number) => {
		containerSizeRef.current = { width, height };
	}, []);

	const flushResizeAnchor = useCallback(async () => {
		const graph = graphRef.current;
		const anchor = resizeAnchorRef.current;
		const pending = pendingResizeRef.current;
		resizeAnchorRef.current = null;
		pendingResizeRef.current = null;
		if (!graph || !anchor || !pending) {
			return;
		}
		try {
			await alignViewportToAnchor(graph, anchor, pending.width, pending.height);
			updateZoomDisplay();
			commitContainerSize(pending.width, pending.height);
		} catch {
			// 锚点恢复失败时保留当前图状态
		}
	}, [commitContainerSize, updateZoomDisplay]);

	const scheduleResizeAnchorFlush = useCallback(() => {
		if (resizeTimerRef.current) {
			clearTimeout(resizeTimerRef.current);
		}
		resizeTimerRef.current = setTimeout(() => {
			resizeTimerRef.current = null;
			void flushResizeAnchor();
		}, RESIZE_VIEWPORT_DEBOUNCE_MS);
	}, [flushResizeAnchor]);

	const handleContainerResize = useCallback(
		(width: number, height: number) => {
			const graph = graphRef.current;
			if (!graph) {
				return;
			}
			if (!initialViewReadyRef.current) {
				syncGraphSize(graph, width, height);
				return;
			}
			if (!hasSizeChanged(containerSizeRef.current, width, height)) {
				syncGraphSize(graph, width, height);
				return;
			}
			if (!resizeAnchorRef.current) {
				resizeAnchorRef.current = captureViewportAnchor(graph);
			}
			pendingResizeRef.current = { width, height };
			syncGraphSize(graph, width, height);
			scheduleResizeAnchorFlush();
		},
		[scheduleResizeAnchorFlush],
	);

	const renderInitialGraph = useCallback(
		async (graph: Graph, data: GraphData) => {
			graph.setData(data);
			await graph.render();
			await fitInitialView(graph);
			initialViewReadyRef.current = true;
			updateZoomDisplay();
			commitContainerSize(graph.getSize()[0], graph.getSize()[1]);
		},
		[commitContainerSize, updateZoomDisplay],
	);

	const switchSchemeGraph = useCallback(
		async (graph: Graph, nextData: GraphData) => {
			const zoomBefore = graph.getZoom();
			setIsSchemeSwitching(true);
			try {
				graph.setData(nextData);
				await graph.draw();
				if (Number.isFinite(zoomBefore) && zoomBefore > 0) {
					await graph.zoomTo(zoomBefore, false);
				}
				updateZoomDisplay();
			} finally {
				window.setTimeout(() => setIsSchemeSwitching(false), 180);
			}
		},
		[updateZoomDisplay],
	);

	const updateGraphStructure = useCallback(
		async (graph: Graph, nextData: GraphData) => {
			graph.setData(nextData);
			await graph.render();
			updateZoomDisplay();
		},
		[updateZoomDisplay],
	);

	useEffect(() => {
		latestDataRef.current = graphData;
		const graph = graphRef.current;
		if (!graph) {
			return;
		}
		if (isSameDeploymentGraphData(prevDataRef.current, graphData)) {
			return;
		}
		const prevData = prevDataRef.current;
		const schemeChanged = prevSchemeKeyRef.current !== schemeKey;
		prevDataRef.current = graphData;
		prevSchemeKeyRef.current = schemeKey;
		if (schemeChanged && hasSameGraphStructure(prevData, graphData)) {
			void switchSchemeGraph(graph, graphData);
			return;
		}
		void updateGraphStructure(graph, graphData);
	}, [graphData, schemeKey, switchSchemeGraph, updateGraphStructure]);

	useEffect(() => {
		ensureDeploymentG6Extensions();
		const container = containerRef.current;
		if (!container) {
			return;
		}

		const mountGraph = (width: number, height: number) => {
			if (width <= 0 || height <= 0 || graphRef.current) {
				return;
			}
			const graph = new Graph(
				buildGraphOptions(container, width, height, latestDataRef.current),
			);
			graphRef.current = graph;
			prevDataRef.current = latestDataRef.current;
			prevSchemeKeyRef.current = schemeKey;
			graph.on(GraphEvent.AFTER_RENDER, updateZoomDisplay);
			bindDeploymentLeafClick(graph);
			void renderInitialGraph(graph, latestDataRef.current);
		};

		let bootstrapRafId = 0;
		const bootstrap = () => {
			const width = container.clientWidth;
			const height = container.clientHeight;
			if (width > 0 && height > 0) {
				mountGraph(width, height);
				return;
			}
			bootstrapRafId = requestAnimationFrame(bootstrap);
		};
		bootstrap();

		const resizeObserver = new ResizeObserver((entries) => {
			for (const entry of entries) {
				const { width, height } = entry.contentRect;
				if (width <= 0 || height <= 0) {
					continue;
				}
				if (!graphRef.current) {
					mountGraph(width, height);
					continue;
				}
				handleContainerResize(width, height);
			}
		});
		resizeObserver.observe(container);

		return () => {
			cancelAnimationFrame(bootstrapRafId);
			resizeObserver.disconnect();
		};
	}, [containerRef, handleContainerResize, renderInitialGraph, schemeKey, updateZoomDisplay]);

	useEffect(() => {
		const graph = graphRef.current;
		if (!graph || typeof graph.updateBehavior !== "function") {
			return;
		}
		try {
			graph.updateBehavior({ key: "zoom-canvas", enable: !isDragOnly });
		} catch {
			// ignore
		}
	}, [isDragOnly]);

	useEffect(() => {
		return () => {
			if (resizeTimerRef.current) {
				clearTimeout(resizeTimerRef.current);
				resizeTimerRef.current = null;
			}
			graphRef.current?.destroy();
			graphRef.current = null;
		};
	}, []);

	const handleZoomIn = useCallback(() => {
		const graph = graphRef.current;
		if (!graph) {
			return;
		}
		try {
			const current = graph.getZoom();
			const next = (typeof current === "number" ? current : 1) * 1.2;
			graph.zoomTo(next);
			setZoomPercent(Math.round(next * 100));
		} catch {
			setZoomPercent(100);
		}
	}, []);

	const handleZoomOut = useCallback(() => {
		const graph = graphRef.current;
		if (!graph) {
			return;
		}
		try {
			const current = graph.getZoom();
			const next = Math.max(0.2, (typeof current === "number" ? current : 1) / 1.2);
			graph.zoomTo(next);
			setZoomPercent(Math.round(next * 100));
		} catch {
			setZoomPercent(100);
		}
	}, []);

	return {
		zoomPercent,
		isDragOnly,
		setIsDragOnly,
		isSchemeSwitching,
		handleZoomIn,
		handleZoomOut,
		graphRef,
	};
}
