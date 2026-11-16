/**
 * 组织树操作纯函数工具集
 * 负责组织节点的归一化、克隆、树结构计算、移动/合并/拆分等操作
 */

import type {
	OrgAdjustmentTaskDetailData,
	OrgAdjustmentTaskOrgItem,
	OrgAdjustmentTaskSettings,
} from "#src/api/org-management/org-adjustment-management/adjustment-canvas";
import type { AdjustmentActiveRecord, FocusTarget } from "./types";
import { DEFAULT_ORG_ADJUSTMENT_TASK_SETTINGS } from "../settings";
import { cloneCompareMeta, normalizeCompareMeta, normalizeOrgId } from "../utils";
import { buildTaskOrgTree, collectSubtreeNodeIds, findTaskTreeMeta } from "./canvas-builder";

// ===================== 基础工具 =====================

export function createActiveRecord(
	type: string,
	payload: Record<string, unknown>,
): AdjustmentActiveRecord {
	return {
		type,
		activeBody: JSON.stringify({
			type,
			createdAt: new Date().toISOString(),
			payload,
		}),
	};
}

export function isOrgDisabled(disable: boolean | null | undefined) {
	return disable !== false;
}

export function isOrgStopped(effective: boolean | null | undefined) {
	return effective === false;
}

export function cloneOrgItem(item: OrgAdjustmentTaskOrgItem): OrgAdjustmentTaskOrgItem {
	return {
		...item,
		orgId: normalizeOrgId(item.orgId),
		parentOrgId: normalizeOrgId(item.parentOrgId),
		effective: item.effective !== false,
		disable: item.disable !== false,
		kpiList: item.kpiList
			? item.kpiList.map((kpi) => ({ ...kpi, orgId: normalizeOrgId(kpi.orgId) }))
			: null,
		compareMeta: cloneCompareMeta(item.compareMeta),
		preEstablishTime: item.preEstablishTime ?? null,
	};
}

export function createBaselineOrgItem(item: OrgAdjustmentTaskOrgItem): OrgAdjustmentTaskOrgItem {
	return {
		...cloneOrgItem(item),
		modified: false,
		childrenModified: false,
		compareMeta: null,
	};
}

export function normalizeOrgName(name: string | null | undefined) {
	return String(name ?? "").trim();
}

// ===================== 归一化 =====================

function normalizeOrgItemDisableState(item: OrgAdjustmentTaskOrgItem): OrgAdjustmentTaskOrgItem {
	return {
		...item,
		orgId: normalizeOrgId(item.orgId),
		parentOrgId: normalizeOrgId(item.parentOrgId),
		compareMeta: normalizeCompareMeta(item.compareMeta),
		effective: item.effective !== false,
		disable: isOrgDisabled(item.disable),
	};
}

export function normalizeIncomingOrgList(orgList: OrgAdjustmentTaskOrgItem[]) {
	return recalculateChildNodeNum(orgList.map(normalizeOrgItemDisableState));
}

export function normalizeDetailViewLevel(viewLevel: number | undefined): 1 | 2 | 3 {
	if (viewLevel === 1 || viewLevel === 2 || viewLevel === 3) {
		return viewLevel;
	}
	return 3;
}

export function normalizeTaskDetailSettings(
	detailData: OrgAdjustmentTaskDetailData | null | undefined,
): OrgAdjustmentTaskSettings {
	const settings = detailData?.settings;
	const normalizedRootNodeId =
		normalizeOrgId(detailData?.rootNodeId ?? settings?.rootNodeId) || undefined;
	return {
		...DEFAULT_ORG_ADJUSTMENT_TASK_SETTINGS,
		...settings,
		rootNodeId: normalizedRootNodeId,
	};
}

export function buildSaveSettingsParams(settings: OrgAdjustmentTaskSettings) {
	return {
		showAdjustmentOnly: settings.showAdjustmentOnly,
		showMoreInfo: settings.showMoreInfo,
		showSaturatedRevenue: settings.showSaturatedRevenue,
		showEmployeeNum: settings.showEmployeeNum,
		showChildNodeNum: settings.showChildNodeNum,
		showProjectNum: settings.showProjectNum,
		showPlanDeliveryProjectNum: settings.showPlanDeliveryProjectNum,
		showExpandDeliveryProjectNum: settings.showExpandDeliveryProjectNum,
		showTargetRevenue: settings.showTargetRevenue,
		targetRevenueIndicator: settings.targetRevenueIndicator,
		showTargetProfit: settings.showTargetProfit,
		targetProfitIndicator: settings.targetProfitIndicator,
		projectNumUnit: settings.projectNumUnit,
		saturatedRevenueUnit: settings.saturatedRevenueUnit,
		employeeNumUnit: settings.employeeNumUnit,
		childNodeNumUnit: settings.childNodeNumUnit,
	};
}

// ===================== 树结构计算 =====================

export function recalculateChildNodeNum(orgList: OrgAdjustmentTaskOrgItem[]) {
	const childCountMap = new Map<string, number>();
	orgList.forEach((item) => {
		childCountMap.set(String(item.orgId), 0);
	});
	orgList.forEach((item) => {
		if (!item.parentOrgId) {
			return;
		}
		const parentId = String(item.parentOrgId);
		childCountMap.set(parentId, (childCountMap.get(parentId) ?? 0) + 1);
	});

	return orgList.map((item) => ({
		...item,
		childNodeNum: childCountMap.get(String(item.orgId)) ?? 0,
	}));
}

export function recalculateNodeLevels(orgList: OrgAdjustmentTaskOrgItem[]) {
	const childMap = new Map<string, OrgAdjustmentTaskOrgItem[]>();
	const orgIdSet = new Set(orgList.map((item) => String(item.orgId)));
	const levelMap = new Map<string, number>();

	orgList.forEach((item) => {
		childMap.set(String(item.orgId), []);
	});

	orgList.forEach((item) => {
		const parentId = String(item.parentOrgId);
		if (parentId && orgIdSet.has(parentId)) {
			childMap.get(parentId)?.push(item);
		}
	});

	const rootNodes = orgList.filter(
		(item) => !item.parentOrgId || !orgIdSet.has(String(item.parentOrgId)),
	);
	const queue = rootNodes.map((item) => ({ orgId: String(item.orgId), level: 1 }));

	while (queue.length) {
		const current = queue.shift()!;
		levelMap.set(current.orgId, current.level);
		(childMap.get(current.orgId) ?? []).forEach((child) => {
			queue.push({ orgId: child.orgId, level: current.level + 1 });
		});
	}

	return orgList.map((item) => ({
		...item,
		nodeLevel: levelMap.get(item.orgId) ?? item.nodeLevel,
	}));
}

export function collectDirectChildIds(orgList: OrgAdjustmentTaskOrgItem[], parentId: string) {
	return orgList
		.filter((item) => String(item.parentOrgId) === parentId)
		.map((item) => String(item.orgId));
}

function normalizeChildIdList(childIds: string[]) {
	return Array.from(new Set(childIds)).sort((left, right) => left.localeCompare(right));
}

function isChildIdListEqual(left: string[], right: string[]) {
	if (left.length !== right.length) {
		return false;
	}
	return left.every((item, index) => item === right[index]);
}

// ===================== 子树操作 =====================

export function wouldCreateCycle(
	orgMap: Map<string, OrgAdjustmentTaskOrgItem>,
	sourceId: string,
	targetId: string,
) {
	let currentId = targetId;

	while (currentId) {
		if (currentId === sourceId) {
			return true;
		}

		const currentNode = orgMap.get(currentId);
		if (!currentNode?.parentOrgId) {
			return false;
		}

		currentId = String(currentNode.parentOrgId);
	}

	return false;
}

export function collectAncestorOrgIds(
	orgMap: Map<string, OrgAdjustmentTaskOrgItem>,
	nodeId: string,
) {
	const result: string[] = [];
	let currentId = nodeId;

	while (currentId) {
		result.push(currentId);
		const currentNode = orgMap.get(currentId);
		if (!currentNode?.parentOrgId) {
			break;
		}

		currentId = String(currentNode.parentOrgId);
	}

	return result;
}

export function moveSubtreeToTarget(
	orgList: OrgAdjustmentTaskOrgItem[],
	sourceId: string,
	targetId: string,
) {
	const taskTree = buildTaskOrgTree(orgList);
	const sourceMeta = findTaskTreeMeta(taskTree, sourceId);
	const targetMeta = findTaskTreeMeta(taskTree, targetId);

	if (!sourceMeta || !targetMeta) {
		return orgList;
	}

	const subtreeNodeIds = new Set(collectSubtreeNodeIds(sourceMeta.node));
	const levelDelta = targetMeta.level + 1 - sourceMeta.level;

	return orgList.map((item) => {
		const currentId = String(item.orgId);
		if (!subtreeNodeIds.has(currentId)) {
			return item;
		}

		return {
			...item,
			parentOrgId: currentId === sourceId ? targetId : item.parentOrgId,
			nodeLevel: item.nodeLevel + levelDelta,
			modified: currentId === sourceId ? true : item.modified,
		};
	});
}

export function hasOrgPositionChanged(
	originalOrg: OrgAdjustmentTaskOrgItem | undefined,
	currentOrg: OrgAdjustmentTaskOrgItem,
) {
	if (!originalOrg) {
		return true;
	}
	return originalOrg.parentOrgId !== currentOrg.parentOrgId;
}

// ===================== 子节点变更标注 =====================

function buildDirectChildMap(orgList: OrgAdjustmentTaskOrgItem[]) {
	const directChildMap = new Map<string, string[]>();
	orgList.forEach((item) => {
		directChildMap.set(String(item.orgId), []);
	});
	orgList.forEach((item) => {
		if (!item.parentOrgId) {
			return;
		}

		const parentId = String(item.parentOrgId);
		if (!directChildMap.has(parentId)) {
			directChildMap.set(parentId, []);
		}
		directChildMap.get(parentId)!.push(String(item.orgId));
	});

	directChildMap.forEach((childIds, nodeId) => {
		directChildMap.set(nodeId, normalizeChildIdList(childIds));
	});

	return directChildMap;
}

function buildEffectiveDirectChildMap(orgList: OrgAdjustmentTaskOrgItem[]) {
	return buildDirectChildMap(orgList.filter((item) => item.effective !== false));
}

export function annotateChildrenModifiedState(
	orgList: OrgAdjustmentTaskOrgItem[],
	baselineOrgList: OrgAdjustmentTaskOrgItem[],
) {
	const baselineChildMap = buildDirectChildMap(baselineOrgList);
	const currentChildMap = buildDirectChildMap(orgList);
	const baselineEffectiveChildMap = buildEffectiveDirectChildMap(baselineOrgList);
	const currentEffectiveChildMap = buildEffectiveDirectChildMap(orgList);

	return orgList.map((item) => {
		const nodeId = String(item.orgId);
		const beforeChildIds = baselineChildMap.get(nodeId) ?? [];
		const afterChildIds = currentChildMap.get(nodeId) ?? [];
		const beforeEffectiveChildIds = baselineEffectiveChildMap.get(nodeId) ?? [];
		const afterEffectiveChildIds = currentEffectiveChildMap.get(nodeId) ?? [];
		const childStructureChanged = !isChildIdListEqual(beforeChildIds, afterChildIds);
		const effectiveChildChanged = !isChildIdListEqual(
			beforeEffectiveChildIds,
			afterEffectiveChildIds,
		);
		const locallyChanged = childStructureChanged || effectiveChildChanged;

		if (!locallyChanged) {
			return {
				...item,
				childrenModified: false,
				compareMeta: null,
			};
		}

		return {
			...item,
			childrenModified: true,
			compareMeta: {
				beforeChildIds,
				afterChildIds,
				beforeEffectiveChildIds,
				afterEffectiveChildIds,
			},
		};
	});
}

// ===================== 撤销聚焦 =====================

export function deriveUndoFocusTarget(
	nextOrgList: OrgAdjustmentTaskOrgItem[],
	currentOrgList: OrgAdjustmentTaskOrgItem[],
) {
	const currentOrgMap = new Map(currentOrgList.map((item) => [String(item.orgId), item]));
	const changedParentCandidates: OrgAdjustmentTaskOrgItem[] = [];
	const changedStateCandidates: OrgAdjustmentTaskOrgItem[] = [];
	const restoredCandidates: OrgAdjustmentTaskOrgItem[] = [];

	nextOrgList.forEach((item) => {
		const nodeId = String(item.orgId);
		const currentItem = currentOrgMap.get(nodeId);

		if (!currentItem) {
			restoredCandidates.push(item);
			return;
		}

		if (String(currentItem.parentOrgId ?? "") !== String(item.parentOrgId ?? "")) {
			changedParentCandidates.push(item);
			return;
		}

		if (
			currentItem.effective !== item.effective ||
			currentItem.disable !== item.disable ||
			currentItem.orgName !== item.orgName
		) {
			changedStateCandidates.push(item);
		}
	});

	const pickCandidate = (candidates: OrgAdjustmentTaskOrgItem[]) => {
		if (!candidates.length) {
			return null;
		}

		return [...candidates].sort(
			(left, right) => Number(right.nodeLevel ?? 0) - Number(left.nodeLevel ?? 0),
		)[0];
	};

	const target =
		pickCandidate(changedParentCandidates) ??
		pickCandidate(restoredCandidates) ??
		pickCandidate(changedStateCandidates);

	if (!target) {
		return null;
	}

	return {
		nodeId: String(target.orgId),
		parentId: String(target.parentOrgId ?? ""),
	} satisfies FocusTarget;
}
