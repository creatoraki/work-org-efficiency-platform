/**
 * 画布构建工具集
 * 负责组织树构建、DataNode → OrgNode 转换、画布数据生成
 */

import type {
	OrgAdjustmentTaskOrgItem,
	OrgAdjustmentTaskSettings,
} from "#src/api/org-management/org-adjustment-management/adjustment-canvas";
import type { DataNode } from "antd/es/tree";
import type { CanvasData, OrgEdge, OrgNode } from "../types";
import type { CompareFieldPropertyKey, TaskTreeMeta, TaskTreeNode } from "./types";
import { DISPLAY_FIELD_CONFIG } from "../settings";
import { normalizeCompareMeta } from "../utils";
import { isOrgDisabled, isOrgStopped } from "./org-tree-utils";

// ===================== 展开/收起状态 =====================

const EXPANDED_NODE_KEY_PREFIX = "expand:";
const COLLAPSED_NODE_KEY_PREFIX = "collapse:";

function getExpandedNodeStateKey(nodeId: string) {
	return `${EXPANDED_NODE_KEY_PREFIX}${nodeId}`;
}

function getCollapsedNodeStateKey(nodeId: string) {
	return `${COLLAPSED_NODE_KEY_PREFIX}${nodeId}`;
}

export function isNodeChildrenVisible(
	nodeId: string,
	level: number,
	maxLevel: 1 | 2 | 3,
	expandedNodeIds: Set<string>,
) {
	const legacyExpanded = expandedNodeIds.has(nodeId);
	const explicitlyExpanded =
		legacyExpanded || expandedNodeIds.has(getExpandedNodeStateKey(nodeId));
	const explicitlyCollapsed = expandedNodeIds.has(getCollapsedNodeStateKey(nodeId));
	const defaultExpanded = level < maxLevel;

	if (explicitlyCollapsed) {
		return false;
	}

	if (explicitlyExpanded) {
		return true;
	}

	return defaultExpanded;
}

export function setNodeExpandedState(state: Set<string>, nodeId: string, expanded: boolean) {
	state.delete(nodeId);
	state.delete(getExpandedNodeStateKey(nodeId));
	state.delete(getCollapsedNodeStateKey(nodeId));
	state.add(expanded ? getExpandedNodeStateKey(nodeId) : getCollapsedNodeStateKey(nodeId));
}

// ===================== 显示字段计算 =====================

function normalizeDisplayUnit(unit: string | undefined) {
	const normalizedUnit = (unit || "").trim();
	return normalizedUnit || undefined;
}

function formatDisplayFieldValue(value: unknown, unit?: string) {
	if (value === null || value === undefined || value === "") {
		return "--";
	}
	return `${String(value)}${unit ?? ""}`;
}

function sumChildFieldValue(
	orgMap: Map<string, OrgAdjustmentTaskOrgItem>,
	childIds: string[],
	fieldKey: CompareFieldPropertyKey,
) {
	if (fieldKey === "childNodeNum") {
		return childIds.length;
	}

	return childIds.reduce((total, childId) => {
		const currentOrg = orgMap.get(String(childId));
		const currentValue = Number(currentOrg?.[fieldKey] ?? 0);
		return total + (Number.isFinite(currentValue) ? currentValue : 0);
	}, 0);
}

function formatDiffText(diffValue: number, unit?: string) {
	if (!diffValue) {
		return undefined;
	}

	const absValue = Math.abs(diffValue).toLocaleString("zh-CN");
	return `${diffValue > 0 ? "+" : "-"}${absValue}${unit ?? ""}`;
}

function getDisplayFieldUnit(
	fieldKey: CompareFieldPropertyKey,
	canvasSettings: OrgAdjustmentTaskSettings,
) {
	switch (fieldKey) {
		case "saturatedRevenue":
			return normalizeDisplayUnit(canvasSettings.saturatedRevenueUnit);
		case "employeeNum":
			return normalizeDisplayUnit(canvasSettings.employeeNumUnit);
		case "childNodeNum":
			return normalizeDisplayUnit(canvasSettings.childNodeNumUnit);
		case "targetRevenue":
			return normalizeDisplayUnit(canvasSettings.targetRevenueUnit);
		case "targetProfit":
			return normalizeDisplayUnit(canvasSettings.targetProfitUnit);
		case "projectNum":
		case "planDeliveryProjectNum":
		case "expandDeliveryProjectNum":
			return normalizeDisplayUnit(canvasSettings.projectNumUnit);
		default:
			return undefined;
	}
}

function getDisplayFields(
	orgData: OrgAdjustmentTaskOrgItem | undefined,
	canvasSettings: OrgAdjustmentTaskSettings,
	orgList: OrgAdjustmentTaskOrgItem[],
) {
	if (!orgData || !canvasSettings.showMoreInfo || orgData.newOrg) {
		return [];
	}

	const orgMap = new Map(orgList.map((item) => [String(item.orgId), item]));
	const compareMeta = normalizeCompareMeta(orgData.compareMeta);
	const beforeChildIds =
		compareMeta?.beforeEffectiveChildIds ?? compareMeta?.beforeChildIds ?? [];
	const afterChildIds = compareMeta?.afterEffectiveChildIds ?? compareMeta?.afterChildIds ?? [];

	return DISPLAY_FIELD_CONFIG.filter((item) => canvasSettings[item.settingKey]).map((item) => {
		const propertyKey = item.propertyKey as CompareFieldPropertyKey;
		const displayUnit = getDisplayFieldUnit(propertyKey, canvasSettings);
		const currentValue = orgData.childrenModified
			? sumChildFieldValue(orgMap, afterChildIds, propertyKey)
			: (orgData as any)[item.propertyKey];
		const diffText = orgData.childrenModified
			? formatDiffText(
					sumChildFieldValue(orgMap, afterChildIds, propertyKey) -
						sumChildFieldValue(orgMap, beforeChildIds, propertyKey),
					displayUnit,
				)
			: undefined;

		return {
			key: item.settingKey,
			label: item.label,
			value: formatDisplayFieldValue(currentValue, displayUnit),
			diffText,
		};
	});
}

function getNodeHeight(
	nodeName: string,
	displayFields: Array<{ label: string; value: string }>,
	hasTagRow = false,
) {
	const estimatedNameLineCount = Math.max(1, Math.ceil(String(nodeName || "").length / 11));
	return (
		53 + (estimatedNameLineCount - 1) * 20 + displayFields.length * 18 + (hasTagRow ? 24 : 0)
	);
}

// ===================== 树构建 =====================

export function buildTaskOrgTree(orgList: OrgAdjustmentTaskOrgItem[]): DataNode[] {
	if (!orgList.length) {
		return [];
	}

	const nodeMap = new Map<string, TaskTreeNode>();
	const orgIds = new Set(orgList.map((item) => String(item.orgId)));

	for (const item of orgList) {
		const nodeId = String(item.orgId);
		nodeMap.set(nodeId, {
			id: nodeId,
			key: nodeId,
			value: nodeId,
			title: item.orgName,
			nodeLevel: Number(item.nodeLevel ?? 0),
			treeLevel: 0,
			parentOrgId: String(item.parentOrgId ?? ""),
			orgData: item,
			children: [],
		});
	}

	const roots: TaskTreeNode[] = [];

	for (const item of orgList) {
		const nodeId = String(item.orgId);
		const parentId = String(item.parentOrgId);
		const currentNode = nodeMap.get(nodeId)!;

		if (parentId && orgIds.has(parentId)) {
			nodeMap.get(parentId)?.children?.push(currentNode);
		} else {
			roots.push(currentNode);
		}
	}

	const applyTreeLevel = (nodes: TaskTreeNode[], level: number) => {
		nodes.forEach((node) => {
			node.treeLevel = level;
			if (node.children?.length) {
				applyTreeLevel(node.children, level + 1);
			}
		});
	};

	applyTreeLevel(roots, 1);

	return roots;
}

export function findTaskTreeMeta(
	tree: DataNode[],
	nodeId: string,
	level = 1,
	parentId: string | null = null,
): TaskTreeMeta | null {
	for (const currentNode of tree as TaskTreeNode[]) {
		if (currentNode.id === nodeId || String(currentNode.key) === nodeId) {
			return { node: currentNode, level, parentId };
		}

		if (currentNode.children?.length) {
			const matched = findTaskTreeMeta(
				currentNode.children,
				nodeId,
				level + 1,
				currentNode.id,
			);
			if (matched) {
				return matched;
			}
		}
	}

	return null;
}

export function containsTaskTreeNode(root: TaskTreeNode, targetId: string): boolean {
	if (root.id === targetId || String(root.key) === targetId) {
		return true;
	}

	return ((root.children as TaskTreeNode[] | undefined) ?? []).some((child) =>
		containsTaskTreeNode(child, targetId),
	);
}

export function collectSubtreeNodeIds(root: TaskTreeNode): string[] {
	const ids = [root.id];
	((root.children as TaskTreeNode[] | undefined) ?? []).forEach((child) => {
		ids.push(...collectSubtreeNodeIds(child));
	});
	return ids;
}

export function collectSelfAndDirectChildIds(tree: DataNode[], rootId: string): string[] {
	const rootMeta = findTaskTreeMeta(tree, rootId);
	if (!rootMeta) {
		return [];
	}

	const ids = [rootMeta.node.id];
	((rootMeta.node.children as TaskTreeNode[] | undefined) ?? []).forEach((child) =>
		ids.push(child.id),
	);
	return ids;
}

// ===================== 画布数据转换 =====================

function convertDataNodeToOrgNode(
	node: DataNode,
	level: number,
	canvasSettings: OrgAdjustmentTaskSettings,
	orgList: OrgAdjustmentTaskOrgItem[],
	changedOrgIds: Set<string>,
	parentId?: string,
): OrgNode {
	const orgData = (node as any).orgData as OrgAdjustmentTaskOrgItem | undefined;
	const nodeId = (node as any).id || String(node.key);
	const orgName = orgData?.orgName ?? String(node.title);
	const displayFields = getDisplayFields(orgData, canvasSettings, orgList);
	const hasTagRow = Boolean(orgData?.newOrg || String(orgData?.projOrgStatus ?? "").trim());
	const nodeHeight = getNodeHeight(orgName, displayFields, hasTagRow);

	return {
		id: nodeId,
		name: orgName,
		newOrg: orgData?.newOrg,
		projOrgStatus: orgData?.projOrgStatus,
		type: "department",
		level,
		parentId,
		disable: isOrgDisabled(orgData?.disable),
		effective: orgData?.effective !== false,
		isStopped: isOrgStopped(orgData?.effective),
		isChanged: Boolean(orgData?.modified) || changedOrgIds.has(nodeId),
		childrenModified: Boolean(orgData?.childrenModified),
		displayFields,
		nodeHeight,
		nodeWidth: 154,
		hiddenChildCount: 0,
		canExpandChildren: false,
		status: isOrgStopped(orgData?.effective)
			? "stopped"
			: isOrgDisabled(orgData?.disable)
				? "inactive"
				: "active",
		employeeCount: orgData?.employeeNum ?? undefined,
		properties: {
			orgId: orgData?.orgId,
			parentOrgId: orgData?.parentOrgId,
			effective: orgData?.effective,
			disable: orgData?.disable,
			orgFullName: orgData?.orgFullName,
			saturatedRevenue: orgData?.saturatedRevenue,
			targetRevenue: orgData?.targetRevenue,
			targetProfit: orgData?.targetProfit,
			childNodeNum: orgData?.childNodeNum,
			projectNum: orgData?.projectNum,
			planDeliveryProjectNum: orgData?.planDeliveryProjectNum,
			expandDeliveryProjectNum: orgData?.expandDeliveryProjectNum,
			longitude: orgData?.longitude,
			latitude: orgData?.latitude,
			orgLevel: orgData?.orgLevel,
			preEstablishTime: orgData?.preEstablishTime,
			kpiList: orgData?.kpiList,
			projOrgStatus: orgData?.projOrgStatus,
			virtual: orgData?.virtual,
			newOrg: orgData?.newOrg,
			employeeNum: orgData?.employeeNum,
		},
	};
}

export function buildCanvasDataFromTree(
	nodes: DataNode[],
	maxLevel: 1 | 2 | 3,
	canvasSettings: OrgAdjustmentTaskSettings,
	orgList: OrgAdjustmentTaskOrgItem[],
	changedOrgIds: Set<string>,
	expandedNodeIds: Set<string>,
	level = 1,
	parentId?: string,
): CanvasData {
	const canvasNodes: OrgNode[] = [];
	const canvasEdges: OrgEdge[] = [];

	for (const node of nodes) {
		const orgNode = convertDataNodeToOrgNode(
			node,
			level,
			canvasSettings,
			orgList,
			changedOrgIds,
			parentId,
		);
		const nodeId = orgNode.id;
		const directChildren = node.children ?? [];
		const hasDirectChildren = directChildren.length > 0;
		const totalChildCount = directChildren.length;
		const shouldRenderChildren = isNodeChildrenVisible(
			nodeId,
			level,
			maxLevel,
			expandedNodeIds,
		);

		orgNode.hiddenChildCount = totalChildCount;
		orgNode.canExpandChildren = totalChildCount > 0;
		canvasNodes.push(orgNode);

		if (parentId) {
			canvasEdges.push({
				id: `edge-${parentId}-${orgNode.id}`,
				source: parentId,
				target: orgNode.id,
				type: "orth-edge",
			});
		}

		if (hasDirectChildren && shouldRenderChildren) {
			const childCanvasData = buildCanvasDataFromTree(
				directChildren,
				maxLevel,
				canvasSettings,
				orgList,
				changedOrgIds,
				expandedNodeIds,
				level + 1,
				orgNode.id,
			);
			canvasNodes.push(...childCanvasData.nodes);
			canvasEdges.push(...childCanvasData.edges);
		}
	}

	return { nodes: canvasNodes, edges: canvasEdges };
}

export function findNodeInTree(tree: DataNode[], nodeId: string): DataNode | null {
	for (const node of tree) {
		if ((node as any).id === nodeId || String(node.key) === nodeId) {
			return node;
		}
		if (node.children) {
			const found = findNodeInTree(node.children, nodeId);
			if (found) return found;
		}
	}
	return null;
}
