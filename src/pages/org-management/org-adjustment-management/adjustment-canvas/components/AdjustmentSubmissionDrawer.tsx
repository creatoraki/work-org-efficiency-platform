import type {
	OrgAdjustmentTaskDateValue,
	OrgAdjustmentTaskOrgItem,
	UpdateOrgAdjustmentResultNewOrgListInfoItem,
} from "#src/api/org-management/org-adjustment-management/adjustment-canvas";
import type { GraphData, NodePortStyleProps } from "@antv/g6";
import type { AdjustmentActiveRecord } from "../context/types";
import type { ImpactMeasurementSubmitPayload } from "./ImpactMeasurementDrawer";
import type { PrecreateSupplementFormMap } from "./PrecreateSupplementDrawer";
import { updateOrgAdjustmentResult } from "#src/api/org-management/org-adjustment-management/adjustment-canvas";
import { commonDrawerProps } from "#src/pages/strategy/target-management/constants/base.js";
import { DownloadOutlined, MinusOutlined, PlusOutlined } from "@ant-design/icons";
import { Graph } from "@antv/g6";
import { App, Button, Drawer, Input } from "antd";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { normalizeCompareMeta } from "../utils";
import { ImpactMeasurementComparisonTable } from "./ImpactMeasurementDrawer";
import { registerOrgDiagramExtensions } from "./OrgDiagram/register";
import {
	isPrecreateSupplementValueComplete,
	PrecreateSupplementDrawer,
} from "./PrecreateSupplementDrawer";

const { TextArea } = Input;

interface AdjustmentSubmissionDrawerProps {
	open: boolean;
	onClose: () => void;
	taskId?: number | null;
	taskDetail?: {
		taskName?: string;
		remark?: string;
		orgList?: OrgAdjustmentTaskOrgItem[];
	} | null;
	txtVer?: string;
	adjustmentType?: string;
	operationRecords?: AdjustmentActiveRecord[];
	impactMeasurementPayload?: ImpactMeasurementSubmitPayload | null;
}

function cloneMeasurementResultsForSubmit(
	results: ImpactMeasurementSubmitPayload["measurementResults"] | undefined,
) {
	return Array.isArray(results) ? results.map((item) => ({ ...item })) : [];
}

const ACTION_LABEL_MAP: Record<string, string> = {
	move: "平移",
	merge: "合并",
	split: "拆分",
	precreate: "预创建",
	disable: "禁用",
	enable: "启用",
	stop: "停用组织",
	resume: "恢复组织",
	"batch-disable": "批量禁用下级",
	"batch-enable": "批量启用下级",
	snapshot: "调整保存",
};

function getAdjustmentTypeLabel(type?: string) {
	return ACTION_LABEL_MAP[type ?? ""] ?? (type || "平移");
}

function parseRecordPayload(record: AdjustmentActiveRecord) {
	try {
		return JSON.parse(record.activeBody || "{}")?.payload ?? {};
	} catch {
		return {} as Record<string, unknown>;
	}
}

function dedupeDescriptionLines(lines: string[]) {
	const seen = new Set<string>();
	return lines.filter((line) => {
		const normalizedLine = line.trim();
		if (!normalizedLine || seen.has(normalizedLine)) {
			return false;
		}

		seen.add(normalizedLine);
		return true;
	});
}

function inferAdjustmentTypeKeys(
	records: AdjustmentActiveRecord[] | undefined,
	orgList: OrgAdjustmentTaskOrgItem[] | undefined,
	fallbackType?: string,
) {
	const keys: string[] = [];
	const keySet = new Set<string>();
	const pushKey = (key: string | undefined) => {
		if (!key || keySet.has(key)) {
			return;
		}

		keySet.add(key);
		keys.push(key);
	};

	if (records?.length) {
		records.forEach((record) => {
			if (record.type === "snapshot") {
				return;
			}

			if (record.type === "split") {
				const payload = parseRecordPayload(record) as {
					payload?: {
						targets?: Array<{ mode?: string; childOrgIds?: string[] }>;
					};
					targets?: Array<{ mode?: string; childOrgIds?: string[] }>;
				};
				const splitPayload = (payload.payload ?? payload) as {
					targets?: Array<{ mode?: string; childOrgIds?: string[] }>;
				};
				const targets = Array.isArray(splitPayload.targets) ? splitPayload.targets : [];
				const hasPrecreate = targets.some((target) => target.mode === "precreate");
				const hasChildMoves = targets.some(
					(target) => Array.isArray(target.childOrgIds) && target.childOrgIds.length > 0,
				);

				if (hasPrecreate) {
					pushKey("precreate");
				}
				if (hasChildMoves) {
					pushKey("move");
				}
				if (!hasPrecreate) {
					pushKey("split");
				}
				return;
			}

			pushKey(record.type);
		});
	}

	if (!keys.length && orgList?.length) {
		if (orgList.some((item) => item.newOrg)) {
			pushKey("precreate");
		}
		if (orgList.some((item) => item.modified && !item.newOrg)) {
			pushKey("move");
		}
		if (orgList.some((item) => item.effective === false)) {
			pushKey("stop");
		}
	}

	if (!keys.length) {
		pushKey(fallbackType || "move");
	}

	return keys;
}

function inferAdjustmentTypeLabels(
	records: AdjustmentActiveRecord[] | undefined,
	orgList: OrgAdjustmentTaskOrgItem[] | undefined,
	fallbackType?: string,
) {
	return inferAdjustmentTypeKeys(records, orgList, fallbackType).map((key) =>
		getAdjustmentTypeLabel(key),
	);
}

interface ChangedGraphNode {
	id: string;
	name: string;
	parentId?: string;
	children: ChangedGraphNode[];
	depth: number;
	x: number;
	y: number;
	subtreeWidth: number;
}

const MINI_NODE_WIDTH = 132;
const MINI_NODE_HEIGHT = 40;
const MINI_HORIZONTAL_GAP = 32;
const MINI_VERTICAL_GAP = 72;
const MINI_CANVAS_PADDING_X = 24;
const MINI_CANVAS_PADDING_Y = 24;

function createSimplePort(key: string, placement: [number, number]): NodePortStyleProps {
	return {
		key,
		placement,
		r: 5,
		fill: "#FFFFFF",
		stroke: "#C0C4CC",
		lineWidth: 1,
	};
}

function buildChangedOrgGraphData(orgList: OrgAdjustmentTaskOrgItem[] | undefined): GraphData {
	const fullOrgList = orgList ?? [];
	if (!fullOrgList.length) {
		return { nodes: [], edges: [] };
	}

	const orgMap = new Map(fullOrgList.map((item) => [String(item.orgId), item]));
	const changedIds = new Set(
		fullOrgList
			.filter((item) => item.modified || item.childrenModified)
			.map((item) => String(item.orgId)),
	);

	if (!changedIds.size) {
		return { nodes: [], edges: [] };
	}

	const getParentId = (nodeId: string) => {
		const parentId = orgMap.get(nodeId)?.parentOrgId;
		if (parentId === undefined || parentId === null) {
			return undefined;
		}
		const normalizedParentId = String(parentId);
		return orgMap.has(normalizedParentId) ? normalizedParentId : undefined;
	};

	const getAncestorChain = (nodeId: string) => {
		const chain: string[] = [];
		let currentId: string | undefined = nodeId;
		while (currentId) {
			chain.push(currentId);
			currentId = getParentId(currentId);
		}
		return chain;
	};

	const changedIdList = Array.from(changedIds);
	const ancestorChains = changedIdList.map(getAncestorChain);
	const firstChain = ancestorChains[0] ?? [];
	const commonAncestorId = firstChain.find((candidate) =>
		ancestorChains.every((chain) => chain.includes(candidate)),
	);

	const includedIds = new Set<string>(changedIdList);
	const anchorIdSet = new Set<string>();

	if (commonAncestorId) {
		anchorIdSet.add(commonAncestorId);
	} else {
		changedIdList.forEach((nodeId) => {
			const chain = getAncestorChain(nodeId);
			const topRootId = chain[chain.length - 1];
			if (topRootId) {
				anchorIdSet.add(topRootId);
			}
		});
	}

	changedIdList.forEach((nodeId) => {
		let currentId: string | undefined = nodeId;
		while (currentId) {
			includedIds.add(currentId);
			if (anchorIdSet.has(currentId)) {
				break;
			}
			currentId = getParentId(currentId);
		}
	});

	const renderedChildrenMap = new Map<string | undefined, OrgAdjustmentTaskOrgItem[]>();
	const resolveRenderedParentId = (nodeId: string) => {
		let currentParentId = getParentId(nodeId);
		while (currentParentId) {
			if (includedIds.has(currentParentId)) {
				return currentParentId;
			}
			currentParentId = getParentId(currentParentId);
		}
		return undefined;
	};

	fullOrgList.forEach((item) => {
		const nodeId = String(item.orgId);
		if (!includedIds.has(nodeId)) {
			return;
		}
		const parentKey = anchorIdSet.has(nodeId) ? undefined : resolveRenderedParentId(nodeId);
		const siblings = renderedChildrenMap.get(parentKey) ?? [];
		siblings.push(item);
		renderedChildrenMap.set(parentKey, siblings);
	});

	renderedChildrenMap.forEach((items) => {
		items.sort((left, right) => left.orgName.localeCompare(right.orgName, "zh-CN"));
	});

	const createNode = (item: OrgAdjustmentTaskOrgItem, depth: number): ChangedGraphNode => {
		const children = (renderedChildrenMap.get(String(item.orgId)) ?? []).map((child) =>
			createNode(child, depth + 1),
		);
		return {
			id: String(item.orgId),
			name: item.orgName || item.orgFullName || `组织${item.orgId}`,
			parentId: resolveRenderedParentId(String(item.orgId)),
			children,
			depth,
			x: 0,
			y: 0,
			subtreeWidth: 0,
		};
	};

	const roots = (renderedChildrenMap.get(undefined) ?? []).map((item) => createNode(item, 0));
	const flatNodes: ChangedGraphNode[] = [];
	let maxDepth = 0;

	const measure = (node: ChangedGraphNode): number => {
		maxDepth = Math.max(maxDepth, node.depth);
		flatNodes.push(node);
		if (!node.children.length) {
			node.subtreeWidth = MINI_NODE_WIDTH;
			return node.subtreeWidth;
		}

		const totalChildrenWidth = node.children.reduce((sum, child, index) => {
			const childWidth = measure(child);
			return sum + childWidth + (index > 0 ? MINI_HORIZONTAL_GAP : 0);
		}, 0);

		node.subtreeWidth = Math.max(MINI_NODE_WIDTH, totalChildrenWidth);
		return node.subtreeWidth;
	};

	roots.forEach((root) => measure(root));

	let currentX = MINI_CANVAS_PADDING_X;
	const position = (node: ChangedGraphNode, startX: number) => {
		node.x = startX + (node.subtreeWidth - MINI_NODE_WIDTH) / 2;
		node.y = MINI_CANVAS_PADDING_Y + node.depth * (MINI_NODE_HEIGHT + MINI_VERTICAL_GAP);

		let childStartX = startX;
		node.children.forEach((child) => {
			position(child, childStartX);
			childStartX += child.subtreeWidth + MINI_HORIZONTAL_GAP;
		});
	};

	roots.forEach((root, index) => {
		position(root, currentX);
		currentX += root.subtreeWidth + (index < roots.length - 1 ? MINI_HORIZONTAL_GAP : 0);
	});

	// const width = roots.length ? currentX + MINI_CANVAS_PADDING_X : 0;
	// const height = flatNodes.length
	// 	? MINI_CANVAS_PADDING_Y * 2 + (maxDepth + 1) * MINI_NODE_HEIGHT + maxDepth * MINI_VERTICAL_GAP
	// 	: 0;

	return {
		nodes: flatNodes.map((node) => ({
			id: node.id,
			data: {
				name: node.name,
				isChanged: changedIds.has(node.id),
				hasParent: Boolean(node.parentId),
				hasChildren: node.children.length > 0,
			},
			style: {
				x: node.x + MINI_NODE_WIDTH / 2,
				y: node.y + MINI_NODE_HEIGHT / 2,
			},
		})),
		edges: flatNodes
			.filter((node) => node.parentId)
			.map((node) => ({
				id: `edge-${node.parentId}-${node.id}`,
				source: node.parentId!,
				target: node.id,
				sourcePort: "bottom",
				targetPort: "top",
			})),
	};
}

function safelyApplyGraphZoom(graph: Graph | null | undefined, zoomPercent: number) {
	if (!graph || (graph as any).destroyed) {
		return;
	}

	try {
		// zoomTo 返回 Promise,内部访问 viewport.transform,若 graph 尚未 render 完成会抛错
		// 需要同时兜住同步抛出与 Promise rejection
		const result = graph.zoomTo(zoomPercent / 100) as unknown;
		if (result && typeof (result as Promise<unknown>).then === "function") {
			(result as Promise<unknown>).catch(() => {});
		}
	} catch {}
}

function SimpleChangedOrgGraph({
	graphData,
	zoomPercent,
	onAutoFitZoom,
}: {
	graphData: GraphData;
	zoomPercent: number;
	onAutoFitZoom?: (percent: number) => void;
}) {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const graphRef = useRef<Graph | null>(null);
	// graph.render() 完成前,viewport 的 transform 还未初始化,调用 zoomTo 会报错
	const graphReadyRef = useRef(false);
	// 首次 fitView 完成前不应用外部 zoomPercent，避免覆盖自适应缩放
	const initialFitDoneRef = useRef(false);
	const onAutoFitZoomRef = useRef(onAutoFitZoom);
	onAutoFitZoomRef.current = onAutoFitZoom;

	useEffect(() => {
		const container = containerRef.current;
		if (!container) {
			return;
		}

		registerOrgDiagramExtensions();

		const graph = new Graph({
			container,
			width: container.clientWidth,
			height: container.clientHeight,
			data: graphData,
			autoFit: "view",
			animation: false,
			node: {
				type: "rect",
				style: {
					size: [MINI_NODE_WIDTH, MINI_NODE_HEIGHT],
					radius: 4,
					fill: "#FFFFFF",
					stroke: (datum: any) => (datum.data?.isChanged ? "#FFB26B" : "#BFC6D4"),
					lineWidth: (datum: any) => (datum.data?.isChanged ? 2 : 1),
					shadowColor: "rgba(0, 0, 0, 0.06)",
					shadowBlur: 6,
					labelText: (datum: any) => datum.data?.name || "",
					labelFill: "#303133",
					labelFontSize: 12,
					labelFontFamily: "PingFang SC",
					labelPlacement: "center",
					labelTextAlign: "center",
					labelTextBaseline: "middle",
					labelWordWrap: true,
					labelMaxWidth: 108,
					ports: (datum: any) => {
						const ports: NodePortStyleProps[] = [];
						if (datum.data?.hasParent) {
							ports.push(createSimplePort("top", [0.5, 0]));
						}
						if (datum.data?.hasChildren) {
							ports.push(createSimplePort("bottom", [0.5, 1]));
						}
						return ports;
					},
				},
			},
			edge: {
				type: "rounded-orth-polyline",
				style: {
					stroke: "#C0C4CC",
					lineWidth: 1.5,
					radius: 12,
					router: {
						type: "orth",
					},
					endArrow: false,
				},
			},
			behaviors: [],
		});

		graphRef.current = graph;
		graphReadyRef.current = false;
		initialFitDoneRef.current = false;
		void graph.render().then(() => {
			if ((graph as any).destroyed) {
				return;
			}
			graphReadyRef.current = true;
			graph.fitView();
			// 读取自适应后的缩放比例同步给父组件，让缩放指示器与画布一致
			try {
				const fittedZoom = typeof graph.getZoom === "function" ? graph.getZoom() : 1;
				const percent = Math.max(1, Math.round(fittedZoom * 100));
				initialFitDoneRef.current = true;
				onAutoFitZoomRef.current?.(percent);
			} catch {
				initialFitDoneRef.current = true;
			}
		});

		const resizeObserver = new ResizeObserver((entries) => {
			const entry = entries[0];
			if (!entry || !graphRef.current || (graphRef.current as any).destroyed) {
				return;
			}
			graphRef.current.setSize(entry.contentRect.width, entry.contentRect.height);
			graphRef.current.fitView();
			if (initialFitDoneRef.current) {
				safelyApplyGraphZoom(graphRef.current, zoomPercent);
			}
		});
		resizeObserver.observe(container);

		return () => {
			resizeObserver.disconnect();
			graph.destroy();
			graphRef.current = null;
			graphReadyRef.current = false;
			initialFitDoneRef.current = false;
		};
	}, []);

	useEffect(() => {
		const graph = graphRef.current;
		if (!graph || (graph as any).destroyed) {
			return;
		}

		graphReadyRef.current = false;
		graph.setData(graphData);
		void graph.render().then(() => {
			if ((graph as any).destroyed) {
				return;
			}
			graphReadyRef.current = true;
			graph.fitView();
			if (initialFitDoneRef.current) {
				safelyApplyGraphZoom(graph, zoomPercent);
			}
		});
	}, [graphData]);

	useEffect(() => {
		// 首次 fitView 完成前跳过，避免覆盖自适应缩放
		if (!graphReadyRef.current || !initialFitDoneRef.current) {
			return;
		}
		safelyApplyGraphZoom(graphRef.current, zoomPercent);
	}, [zoomPercent]);

	if (!graphData.nodes?.length) {
		return <div className="py-10 text-center text-sm text-[#909399]">暂无变动组织</div>;
	}

	return <div ref={containerRef} className="h-full w-full bg-white" />;
}

function parseOperationRecord(
	record: AdjustmentActiveRecord,
	orgMap: Map<string, OrgAdjustmentTaskOrgItem>,
) {
	const payload = parseRecordPayload(record);

	const buildPrecreateLines = (
		sourceOrgId: string | undefined,
		targets: Array<{
			mode?: string;
			existingOrgId?: string;
			orgName?: string;
			parentOrgId?: string;
			childOrgIds?: string[];
		}>,
	) => {
		const sourceOrg = sourceOrgId ? orgMap.get(String(sourceOrgId)) : undefined;
		const precreateTargets = targets.filter((target) => target.mode === "precreate");
		if (!precreateTargets.length) {
			return [] as string[];
		}

		return precreateTargets.flatMap((target) => {
			const targetName = String(target.orgName ?? "新组织");
			const parentName = target.parentOrgId
				? (orgMap.get(String(target.parentOrgId))?.orgName ?? String(target.parentOrgId))
				: "目标组织";
			const childMoveLines = (
				Array.isArray(target.childOrgIds) ? target.childOrgIds : []
			).map((childOrgId) => {
				const childName = orgMap.get(String(childOrgId))?.orgName ?? String(childOrgId);
				return `将${childName}从${sourceOrg?.orgName ?? "原组织"}移至${targetName}。`;
			});

			return [`在${parentName}下预创建${targetName}。`, ...childMoveLines];
		});
	};

	if (record.type === "move") {
		const moves = Array.isArray(payload.moves)
			? (payload.moves as Array<{
					sourceId?: string;
					targetId?: string;
					sourceParentId?: string;
					sourceParentName?: string;
				}>)
			: [];
		return moves.map((move) => {
			const sourceName = move.sourceId
				? (orgMap.get(String(move.sourceId))?.orgName ?? move.sourceId)
				: "未知组织";
			const currentParentName = move.targetId
				? (orgMap.get(String(move.targetId))?.orgName ?? "未知组织")
				: "未知组织";
			const previousParent = Array.from(orgMap.values()).find((item) => {
				const compareMeta = normalizeCompareMeta(item.compareMeta);
				return (
					item.childrenModified &&
					(compareMeta?.beforeChildIds ?? []).includes(String(move.sourceId)) &&
					!(compareMeta?.afterChildIds ?? []).includes(String(move.sourceId))
				);
			});
			const previousParentId = move.sourceParentId ?? previousParent?.orgId;
			const previousParentName =
				move.sourceParentName ??
				(previousParentId
					? (orgMap.get(String(previousParentId))?.orgName ?? String(previousParentId))
					: "未知组织");
			return `将${sourceName}从${previousParentName}移至${currentParentName}。`;
		});
	}

	if (record.type === "merge") {
		const mergePayload = (payload.payload ?? payload) as {
			mergeOrgIds?: string[];
			mergedOrgId?: string;
		};
		const mergedOrgId = String(mergePayload.mergedOrgId ?? "");
		const mergedOrg = mergedOrgId ? orgMap.get(mergedOrgId) : undefined;
		const mergeOrgIds = Array.isArray(mergePayload.mergeOrgIds)
			? mergePayload.mergeOrgIds.map(String)
			: [];
		const mergeNames = mergeOrgIds.map((orgId) => orgMap.get(orgId)?.orgName ?? orgId);
		const mergedNameFromPayload = String(
			(payload.mergedOrgName as string | undefined) ?? "",
		).trim();
		const mergedName = mergedOrg?.orgName ?? (mergedNameFromPayload || "目标组织");
		const stoppedNames = mergeOrgIds
			.filter((orgId) => orgId !== mergedOrgId)
			.map((orgId) => orgMap.get(orgId)?.orgName ?? orgId);
		return [
			`将${mergeNames.join("、")}合并至${mergedName}，合并后有${formatProjectSummary(mergedOrg)}。${stoppedNames.length ? `停用${stoppedNames.join("、")}。` : ""}`,
		];
	}

	if (record.type === "split") {
		const splitPayload = (payload.payload ?? payload) as {
			sourceOrgId?: string;
			targets?: Array<{
				mode?: string;
				existingOrgId?: string;
				orgName?: string;
				parentOrgId?: string;
				childOrgIds?: string[];
			}>;
		};
		const sourceOrg = splitPayload.sourceOrgId
			? orgMap.get(String(splitPayload.sourceOrgId))
			: undefined;
		const targets = Array.isArray(splitPayload.targets) ? splitPayload.targets : [];
		const precreateLines = buildPrecreateLines(splitPayload.sourceOrgId, targets);
		if (precreateLines.length) {
			return precreateLines;
		}
		const targetNames = targets.map((target) => {
			if (target.mode === "existing" && target.existingOrgId) {
				return (
					orgMap.get(String(target.existingOrgId))?.orgName ??
					String(target.existingOrgId)
				);
			}
			return String(target.orgName ?? "新组织");
		});
		const precreateNames = targets
			.filter((target) => target.mode === "precreate")
			.map((target) => String(target.orgName ?? "新组织"));
		const targetSummaries = targets.map((target) => {
			const targetOrg =
				target.mode === "existing" && target.existingOrgId
					? orgMap.get(String(target.existingOrgId))
					: Array.from(orgMap.values()).find(
							(item) => item.newOrg && item.orgName === target.orgName,
						);
			const targetName =
				target.mode === "existing" && target.existingOrgId
					? (orgMap.get(String(target.existingOrgId))?.orgName ??
						String(target.existingOrgId))
					: String(target.orgName ?? "新组织");
			return `${targetName}有${formatProjectSummary(targetOrg)}。`;
		});
		return [
			`将${sourceOrg?.orgName ?? "原组织"}拆分成${[sourceOrg?.orgName, ...targetNames].filter(Boolean).join("、")}，${precreateNames.length ? `其中${precreateNames.join("、")}为预创建，` : ""}拆分后${sourceOrg?.orgName ?? "原组织"}有${formatProjectSummary(sourceOrg)}。${targetSummaries.join("")}`,
		];
	}

	if (record.type === "stop" || record.type === "resume") {
		const nodeIds = (
			Array.isArray(payload.nodeIds)
				? payload.nodeIds
				: payload.nodeId
					? [payload.nodeId]
					: []
		) as Array<string | number>;
		const actionLabel = record.type === "stop" ? "停用" : "恢复";
		if (nodeIds.length) {
			return nodeIds.map(
				(nodeId) =>
					`${actionLabel}${orgMap.get(String(nodeId))?.orgName ?? String(nodeId)}。`,
			);
		}
		return [`执行${actionLabel}组织状态调整。`];
	}

	return [`执行${ACTION_LABEL_MAP[record.type] ?? record.type}组织调整。`];
}

function formatProjectSummary(org: OrgAdjustmentTaskOrgItem | undefined) {
	const projectNum = Math.max(Number(org?.projectNum ?? 0), 0);
	const planDeliveryProjectNum = Math.max(Number(org?.planDeliveryProjectNum ?? 0), 0);
	const expandDeliveryProjectNum = Math.max(Number(org?.expandDeliveryProjectNum ?? 0), 0);
	return `${projectNum}个项目（${projectNum}在管、${planDeliveryProjectNum}计划交付、${expandDeliveryProjectNum}当拓当交）`;
}

function formatOrgNames(orgIds: string[], orgMap: Map<string, OrgAdjustmentTaskOrgItem>) {
	if (!orgIds.length) {
		return "无";
	}

	return orgIds.map((orgId) => orgMap.get(String(orgId))?.orgName ?? String(orgId)).join("、");
}

function resolveMoveParentNames(
	org: OrgAdjustmentTaskOrgItem,
	orgMap: Map<string, OrgAdjustmentTaskOrgItem>,
) {
	const previousParent = Array.from(orgMap.values()).find((item) => {
		const compareMeta = normalizeCompareMeta(item.compareMeta);
		return (
			item.childrenModified &&
			(compareMeta?.beforeChildIds ?? []).includes(String(org.orgId)) &&
			!(compareMeta?.afterChildIds ?? []).includes(String(org.orgId))
		);
	});
	const currentParent = org.parentOrgId ? orgMap.get(String(org.parentOrgId)) : undefined;
	return {
		previousParentName: previousParent?.orgName ?? "未知组织",
		currentParentName: currentParent?.orgName ?? "未知组织",
	};
}

function formatPreEstablishTime(value: OrgAdjustmentTaskDateValue | undefined) {
	return typeof value === "string" && value ? value : "--";
}

function buildCompareMetaPayload(compareMeta: ReturnType<typeof normalizeCompareMeta>) {
	if (!compareMeta) {
		return undefined;
	}

	return {
		beforeChildIds: compareMeta.beforeChildIds,
		afterChildIds: compareMeta.afterChildIds,
	};
}

// 校验预创建组织补充信息是否完善（与 PrecreateSupplementDrawer 内部校验规则保持一致）
function isPrecreateSupplementComplete(
	precreateOrgList: OrgAdjustmentTaskOrgItem[],
	precreateSupplementMap: PrecreateSupplementFormMap,
): boolean {
	return precreateOrgList.every((org) =>
		isPrecreateSupplementValueComplete(precreateSupplementMap[String(org.orgId)]),
	);
}

function buildNewOrgListInfo(
	precreateOrgList: OrgAdjustmentTaskOrgItem[],
	precreateSupplementMap: PrecreateSupplementFormMap,
): UpdateOrgAdjustmentResultNewOrgListInfoItem[] {
	return precreateOrgList.map((org) => {
		const formValue = precreateSupplementMap[String(org.orgId)];
		const normalizedCompareMeta = normalizeCompareMeta(org.compareMeta);
		const normalizedOrgName = formValue?.orgName?.trim() || org.orgName || "";

		return {
			orgId: String(org.orgId ?? ""),
			orgName: normalizedOrgName,
			orgFullName: org.orgFullName || normalizedOrgName,
			code: org.code || "",
			parentOrgId: formValue?.parentOrgId
				? String(formValue.parentOrgId)
				: String(org.parentOrgId ?? ""),
			effective: Boolean(org.effective),
			ehrOrgId: Number(org.ehrOrgId ?? 0),
			nodeLevel: Number(org.nodeLevel ?? 0),
			saturatedRevenue: Number(org.saturatedRevenue ?? 0),
			nodeSaturatedRevenue: Number(org.nodeSaturatedRevenue ?? 0),
			targetRevenue: Number(org.targetRevenue ?? 0),
			targetProfit: Number(org.targetProfit ?? 0),
			employeeNum: Number(org.employeeNum ?? 0),
			nodeEmployeeNum: Number(org.nodeEmployeeNum ?? 0),
			childNodeNum: Number(org.childNodeNum ?? 0),
			projectNum: Number(org.projectNum ?? 0),
			nodeProjectNum: Number(org.nodeProjectNum ?? 0),
			planDeliveryProjectNum: Number(org.planDeliveryProjectNum ?? 0),
			nodePlanDeliveryProjectNum: Number(org.nodePlanDeliveryProjectNum ?? 0),
			expandDeliveryProjectNum: Number(org.expandDeliveryProjectNum ?? 0),
			nodeExpandDeliveryProjectNum: Number(org.nodeExpandDeliveryProjectNum ?? 0),
			longitude: org.longitude ?? "",
			latitude: org.latitude ?? "",
			disable: Boolean(org.disable),
			kpiList: (org.kpiList ?? []).map((item) => ({
				orgId: String(item.orgId ?? ""),
				orgName: item.orgName ?? "",
				kpiName: item.kpiName ?? "",
				kpiValue: item.kpiValue ?? "",
			})),
			modified: Boolean(org.modified),
			childrenModified: Boolean(org.childrenModified),
			compareMeta: buildCompareMetaPayload(normalizedCompareMeta),
			projCode: org.projCode || "",
			projOrgStatus: org.projOrgStatus || "",
			orgLevel: formValue?.orgLevel?.trim() || org.orgLevel || 0,
			preEstablishTime: formValue?.preEstablishDate
				? formValue.preEstablishDate.format("YYYY-MM-DD")
				: (org.preEstablishTime ?? null),
			belongGroup: formValue?.groupName?.trim() || "",
			orgNature: formValue?.orgNature?.trim() || "",
			companyAddress: formValue?.companyAddress?.trim() || "",
			managerId: formValue?.principalId?.trim() || "",
			managerName: formValue?.principal?.trim() || "",
			workProvince: formValue?.workProvince?.trim() || "",
			workCity: formValue?.workCity?.trim() || "",
			workDistrict: formValue?.workDistrict?.trim() || "",
			virtual: formValue ? formValue.isVirtual : Boolean(org.virtual),
			newOrg: Boolean(org.newOrg),
		};
	});
}

function buildFallbackChangeDescriptionLines(
	orgList: OrgAdjustmentTaskOrgItem[] | undefined,
	adjustmentType?: string,
) {
	const currentOrgList = orgList ?? [];
	if (!currentOrgList.length) {
		return ["[调整保存] 当前暂无可展示的变更内容"];
	}

	const orgMap = new Map(currentOrgList.map((item) => [String(item.orgId), item]));
	if (adjustmentType === "move") {
		const precreateLines = currentOrgList
			.filter((item) => item.newOrg)
			.flatMap((item) => {
				const parentName = item.parentOrgId
					? (orgMap.get(String(item.parentOrgId))?.orgName ?? String(item.parentOrgId))
					: "目标组织";
				const childMoveLines = currentOrgList
					.filter((child) => String(child.parentOrgId) === String(item.orgId))
					.map(
						(child) =>
							`将${child.orgName}从${resolveMoveParentNames(child, orgMap).previousParentName}移至${item.orgName}。`,
					);
				return [`在${parentName}下预创建${item.orgName}。`, ...childMoveLines];
			});

		const movedLines = currentOrgList
			.filter((item) => item.modified && !item.newOrg)
			.map((item) => {
				const { previousParentName, currentParentName } = resolveMoveParentNames(
					item,
					orgMap,
				);
				return `将${item.orgName}从${previousParentName}移至${currentParentName}。`;
			});
		const lines = [...precreateLines, ...movedLines];
		return lines.length ? lines : ["[调整保存] 当前暂无可展示的变更内容"];
	}

	if (adjustmentType === "merge") {
		const stoppedOrgs = currentOrgList.filter((item) => item.effective === false);
		const mergedTarget =
			currentOrgList.find((item) => item.modified && item.effective !== false) ??
			currentOrgList.find((item) => item.childrenModified && item.effective !== false);
		if (mergedTarget) {
			const mergeNames = [mergedTarget.orgName, ...stoppedOrgs.map((item) => item.orgName)];
			const stoppedNames = stoppedOrgs.map((item) => item.orgName);
			return [
				`将${mergeNames.join("、")}合并至${mergedTarget.orgName}，合并后有${formatProjectSummary(mergedTarget)}。${stoppedNames.length ? `停用${stoppedNames.join("、")}。` : ""}`,
			];
		}
	}

	if (adjustmentType === "split") {
		const sourceOrg =
			currentOrgList.find((item) => item.childrenModified && !item.newOrg) ??
			currentOrgList.find((item) => item.modified && !item.newOrg);
		const precreateOrgs = currentOrgList.filter((item) => item.newOrg);
		const otherTargets = currentOrgList.filter(
			(item) => item.modified && item.orgId !== sourceOrg?.orgId && !item.newOrg,
		);
		if (sourceOrg) {
			const allTargets = [...otherTargets, ...precreateOrgs];
			const resultNames = [sourceOrg.orgName, ...allTargets.map((item) => item.orgName)];
			const precreateNames = precreateOrgs.map((item) => item.orgName);
			const targetSummaries = allTargets
				.map((item) => `${item.orgName}有${formatProjectSummary(item)}。`)
				.join("");
			return [
				`将${sourceOrg.orgName}拆分成${resultNames.join("、")}，${precreateNames.length ? `其中${precreateNames.join("、")}为预创建，` : ""}拆分后${sourceOrg.orgName}有${formatProjectSummary(sourceOrg)}。${targetSummaries}`,
			];
		}
	}

	if (adjustmentType === "stop") {
		const stoppedLines = currentOrgList
			.filter((item) => item.effective === false)
			.map((item) => `停用${item.orgName}。`);
		return stoppedLines.length ? stoppedLines : ["[调整保存] 当前暂无可展示的变更内容"];
	}

	const precreateLines = currentOrgList
		.filter((item) => item.newOrg)
		.map((item) => {
			const parentName = item.parentOrgId
				? (orgMap.get(String(item.parentOrgId))?.orgName ?? "--")
				: "--";
			const childOrgNames = currentOrgList
				.filter((child) => String(child.parentOrgId) === String(item.orgId))
				.map((child) => child.orgName);
			return `组织类型：--；组织名称：${item.orgName}；上级组织：${parentName}；是否虚拟：${item.virtual ? "是" : "否"}；组织定级：${item.orgLevel ?? "--"}；预计成立日期：${formatPreEstablishTime(item.preEstablishTime)}；下级组织：${childOrgNames.length ? childOrgNames.join("、") : "无"}；`;
		});
	if (precreateLines.length) {
		return precreateLines;
	}

	const compareLines = currentOrgList
		.filter((item) => item.childrenModified)
		.map((item) => {
			const compareMeta = normalizeCompareMeta(item.compareMeta);
			const beforeChildIds =
				compareMeta?.beforeEffectiveChildIds ?? compareMeta?.beforeChildIds ?? [];
			const afterChildIds =
				compareMeta?.afterEffectiveChildIds ?? compareMeta?.afterChildIds ?? [];
			return `${item.orgName}子节点由${formatOrgNames(beforeChildIds, orgMap)}调整为${formatOrgNames(afterChildIds, orgMap)}。`;
		});
	return compareLines.length ? compareLines : ["[调整保存] 当前暂无可展示的变更内容"];
}

function buildChangeDescriptionLines(
	records: AdjustmentActiveRecord[] | undefined,
	orgList: OrgAdjustmentTaskOrgItem[] | undefined,
	adjustmentType?: string,
) {
	if (!records?.length) {
		return dedupeDescriptionLines(buildFallbackChangeDescriptionLines(orgList, adjustmentType));
	}

	const orgMap = new Map((orgList ?? []).map((item) => [String(item.orgId), item]));
	return dedupeDescriptionLines(
		records.flatMap((record) => parseOperationRecord(record, orgMap)),
	);
}

function formatOrderLabel(index: number) {
	const numerals = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩"];
	return numerals[index] ?? `${index + 1}.`;
}

function SectionHeader({ title, extra }: { title: string; extra?: React.ReactNode }) {
	return (
		<div className="mb-3 flex items-center justify-between">
			<div className="flex items-center gap-2">
				<span className="inline-block h-3 w-1 rounded-sm bg-[#1677FF]" />
				<span className="text-sm font-medium text-[#303133]">{title}</span>
			</div>
			{extra}
		</div>
	);
}

interface AdjustmentReportContentProps {
	taskDetail?: {
		taskName?: string;
		remark?: string;
		orgList?: OrgAdjustmentTaskOrgItem[];
	} | null;
	txtVer?: string;
	adjustmentType?: string;
	operationRecords?: AdjustmentActiveRecord[];
	impactMeasurementPayload?: ImpactMeasurementSubmitPayload | null;
	/** 后端提供的变更内容原始文本（多行）；提供时直接渲染，不再自动生成 */
	changeContent?: string;
	/** 只读模式：用于第三方报告页，隐藏导出/预创建/编辑控件 */
	readonly?: boolean;
	/** 编辑模式：变动说明输入值 */
	remarkValue?: string;
	onRemarkChange?: (value: string) => void;
	/** 编辑模式：影响范围测算可编辑结果 */
	editedMeasurementResults?: ImpactMeasurementSubmitPayload["measurementResults"];
	onMeasurementResultsChange?: (
		results: ImpactMeasurementSubmitPayload["measurementResults"],
	) => void;
	/** 编辑模式：预创建组织数量与打开补充弹窗的回调 */
	precreateOrgListSize?: number;
	onOpenPrecreate?: () => void;
}

/**
 * @zh 组织调整提交内容（信息卡 + 变动组织 + 变更内容 + 影响范围测算 + 变动说明）
 * 同时被提交抽屉与第三方只读报告页复用。
 */
export const AdjustmentReportContent: React.FC<AdjustmentReportContentProps> = ({
	taskDetail,
	txtVer,
	adjustmentType,
	operationRecords,
	impactMeasurementPayload,
	changeContent,
	readonly = false,
	remarkValue,
	onRemarkChange,
	editedMeasurementResults,
	onMeasurementResultsChange,
	precreateOrgListSize = 0,
	onOpenPrecreate,
}) => {
	const [zoomPercent, setZoomPercent] = useState(100);

	const changedOrgGraphData = useMemo(
		() => buildChangedOrgGraphData(taskDetail?.orgList),
		[taskDetail?.orgList],
	);
	const changeDescriptionLines = useMemo(
		() => buildChangeDescriptionLines(operationRecords, taskDetail?.orgList, adjustmentType),
		[adjustmentType, operationRecords, taskDetail?.orgList],
	);
	const resolvedAdjustmentTypeText = useMemo(
		() =>
			inferAdjustmentTypeLabels(operationRecords, taskDetail?.orgList, adjustmentType).join(
				"、",
			),
		[adjustmentType, operationRecords, taskDetail?.orgList],
	);

	const measurementResultsToShow = readonly
		? (impactMeasurementPayload?.measurementResults ?? [])
		: (editedMeasurementResults ?? []);

	const handleZoomIn = () => setZoomPercent((prev) => Math.min(200, prev + 10));
	const handleZoomOut = () => setZoomPercent((prev) => Math.max(50, prev - 10));

	const exportButton = readonly ? null : (
		<Button icon={<DownloadOutlined />} disabled>
			导出
		</Button>
	);

	return (
		<div className="space-y-4">
			<div className="grid grid-cols-3 gap-4 rounded border border-[#EBEEF5] bg-white px-5 py-4 text-sm text-[#606266]">
				<div className="flex items-center gap-2">
					<span className="text-[#909399]">组织调整任务名称</span>
					<span className="text-[#303133]">{taskDetail?.taskName || "-"}</span>
				</div>
				<div className="flex items-center gap-2">
					<span className="text-[#909399]">版本号</span>
					<span className="text-[#303133]">{txtVer || "-"}</span>
				</div>
				<div className="flex items-center gap-2">
					<span className="text-[#909399]">调整类型</span>
					<span className="text-[#303133]">
						{resolvedAdjustmentTypeText || getAdjustmentTypeLabel(adjustmentType)}
					</span>
					{!readonly && precreateOrgListSize > 0 ? (
						<Button type="link" className="!px-0" onClick={onOpenPrecreate}>
							预创建组织信息补充
						</Button>
					) : null}
				</div>
			</div>

			<div>
				<SectionHeader title="变动组织" extra={exportButton} />
				<div className="rounded border border-[#EBEEF5] bg-white">
					<div className="flex items-center justify-end gap-3 border-b border-[#EBEEF5] px-4 py-2">
						<Button type="text" icon={<MinusOutlined />} onClick={handleZoomOut} />
						<span className="w-[52px] text-center text-sm text-[#606266]">
							{zoomPercent}%
						</span>
						<Button type="text" icon={<PlusOutlined />} onClick={handleZoomIn} />
					</div>
					<div className="h-[280px] bg-white">
						<SimpleChangedOrgGraph
							graphData={changedOrgGraphData}
							zoomPercent={zoomPercent}
							onAutoFitZoom={setZoomPercent}
						/>
					</div>
				</div>
			</div>

			<div>
				<SectionHeader title="变更内容" />
				<div className="rounded border border-[#EBEEF5] bg-white px-4 py-3 text-sm leading-7 text-[#303133]">
					{changeContent && changeContent.trim()
						? changeContent
								.split(/\r?\n/)
								.filter((line) => line.trim())
								.map((line, index) => (
									<div key={`${index}-${line}`}>
										{formatOrderLabel(index)}
										{line}
									</div>
								))
						: changeDescriptionLines.map((line, index) => (
								<div key={`${index}-${line}`}>
									{formatOrderLabel(index)}
									{line}
								</div>
							))}
				</div>
			</div>

			<div>
				<SectionHeader title="影响范围测算" extra={exportButton} />
				<div className="overflow-auto rounded border border-[#EBEEF5] bg-white">
					{measurementResultsToShow.length ? (
						<div className="min-w-max pr-4">
							<ImpactMeasurementComparisonTable
								measurementResults={measurementResultsToShow}
								selectedOrgList={impactMeasurementPayload?.selectedOrgList ?? []}
								allOrgList={taskDetail?.orgList ?? []}
								editableCurrentYearAfter={!readonly}
								onMeasurementResultsChange={
									readonly ? undefined : onMeasurementResultsChange
								}
							/>
						</div>
					) : (
						<div className="py-10 text-center text-sm text-[#909399]">暂无测算结果</div>
					)}
				</div>
			</div>

			<div>
				<SectionHeader title="变动说明" extra={exportButton} />
				<div className="rounded border border-[#EBEEF5] bg-white p-4">
					{readonly ? (
						<div className="min-h-[96px] whitespace-pre-wrap text-sm leading-6 text-[#303133]">
							{taskDetail?.remark ? (
								taskDetail.remark
							) : (
								<span className="text-[#909399]">无</span>
							)}
						</div>
					) : (
						<TextArea
							value={remarkValue}
							onChange={(event) => onRemarkChange?.(event.target.value)}
							placeholder="请输入"
							maxLength={500}
							showCount
							autoSize={{ minRows: 4, maxRows: 6 }}
						/>
					)}
				</div>
			</div>
		</div>
	);
};

export const AdjustmentSubmissionDrawer: React.FC<AdjustmentSubmissionDrawerProps> = ({
	open,
	onClose,
	taskId,
	taskDetail,
	txtVer,
	adjustmentType,
	operationRecords,
	impactMeasurementPayload,
}) => {
	const { message } = App.useApp();
	const [changeRemark, setChangeRemark] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [precreateSupplementOpen, setPrecreateSupplementOpen] = useState(false);
	const [precreateSupplementMap, setPrecreateSupplementMap] =
		useState<PrecreateSupplementFormMap>({});
	const [editedMeasurementResults, setEditedMeasurementResults] = useState<
		ImpactMeasurementSubmitPayload["measurementResults"]
	>(cloneMeasurementResultsForSubmit(impactMeasurementPayload?.measurementResults));

	const changeDescriptionLines = useMemo(
		() => buildChangeDescriptionLines(operationRecords, taskDetail?.orgList, adjustmentType),
		[adjustmentType, operationRecords, taskDetail?.orgList],
	);
	const precreateOrgList = useMemo(
		() => (taskDetail?.orgList ?? []).filter((item) => item.newOrg),
		[taskDetail?.orgList],
	);

	useEffect(() => {
		if (!open) {
			return;
		}

		setChangeRemark(taskDetail?.remark ?? "");
	}, [open, taskDetail?.remark]);

	useEffect(() => {
		if (!open) {
			return;
		}

		setEditedMeasurementResults(
			cloneMeasurementResultsForSubmit(impactMeasurementPayload?.measurementResults),
		);
	}, [impactMeasurementPayload?.measurementResults, open]);

	useEffect(() => {
		setPrecreateSupplementMap((prev) => {
			const validOrgIdSet = new Set(precreateOrgList.map((item) => String(item.orgId)));
			const nextEntries = Object.entries(prev).filter(([orgId]) => validOrgIdSet.has(orgId));
			if (nextEntries.length === Object.keys(prev).length) {
				return prev;
			}

			return Object.fromEntries(nextEntries);
		});
	}, [precreateOrgList]);

	const handleSubmit = async () => {
		const normalizedTxtVer = txtVer?.trim();
		const normalizedRemark = changeRemark.trim();
		const newOrgListInfo = buildNewOrgListInfo(precreateOrgList, precreateSupplementMap);

		if (!taskId || !normalizedTxtVer) {
			message.warning("当前任务信息不完整，无法提交");
			return;
		}

		if (!normalizedRemark) {
			message.warning("请输入变动说明");
			return;
		}

		if (
			precreateOrgList.length > 0 &&
			!isPrecreateSupplementComplete(precreateOrgList, precreateSupplementMap)
		) {
			message.warning("请先完善预创建组织信息");
			setPrecreateSupplementOpen(true);
			return;
		}

		setSubmitting(true);
		try {
			const response = await updateOrgAdjustmentResult({
				taskId,
				txtVer: normalizedTxtVer,
				adjustmentType: JSON.stringify(
					inferAdjustmentTypeKeys(operationRecords, taskDetail?.orgList, adjustmentType),
				),
				changeContent: changeDescriptionLines.join("\n"),
				calculationOfInfluenceScopeList: editedMeasurementResults,
				remark: normalizedRemark,
				newOrgListInfo,
			});

			if (response.code !== 200) {
				message.error(response.msg || "提交失败");
				return;
			}

			message.success(response.data || "组织调整已提交");
			onClose();
		} catch {
			message.error("提交失败，请稍后重试");
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Drawer
			open={open}
			placement="right"
			width={1240}
			title="组织调整"
			destroyOnHidden
			footer={
				<div className="flex items-center justify-end gap-3 px-1">
					<Button onClick={onClose} disabled={submitting}>
						取消
					</Button>
					<Button type="primary" onClick={handleSubmit} loading={submitting}>
						提交
					</Button>
				</div>
			}
			styles={{
				header: { padding: "16px 20px", borderBottom: "1px solid #F0F2F5" },
				body: { padding: "16px 20px 20px" },
				footer: { padding: "12px 20px", borderTop: "1px solid #F0F2F5" },
			}}
			{...commonDrawerProps(onClose)}
		>
			<AdjustmentReportContent
				taskDetail={taskDetail}
				txtVer={txtVer}
				adjustmentType={adjustmentType}
				operationRecords={operationRecords}
				impactMeasurementPayload={impactMeasurementPayload}
				remarkValue={changeRemark}
				onRemarkChange={setChangeRemark}
				editedMeasurementResults={editedMeasurementResults}
				onMeasurementResultsChange={setEditedMeasurementResults}
				precreateOrgListSize={precreateOrgList.length}
				onOpenPrecreate={() => setPrecreateSupplementOpen(true)}
			/>
			<PrecreateSupplementDrawer
				open={precreateSupplementOpen}
				onClose={() => setPrecreateSupplementOpen(false)}
				precreateOrgs={precreateOrgList}
				orgList={taskDetail?.orgList ?? []}
				valueMap={precreateSupplementMap}
				onSave={setPrecreateSupplementMap}
			/>
		</Drawer>
	);
};

export default AdjustmentSubmissionDrawer;
