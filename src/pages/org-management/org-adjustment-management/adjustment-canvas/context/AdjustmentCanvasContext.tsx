/**
 * 调整画布 Context
 * 管理树节点选择、任务详情和画布数据的联动
 */

import type {
	OrgAdjustmentTaskDetailData,
	OrgAdjustmentTaskOrgItem,
	OrgAdjustmentTaskSettings,
	OrgAdjustmentTaskVersionDetailData,
} from "#src/api/org-management/org-adjustment-management/adjustment-canvas";
import type {
	AdjustmentOperationType,
	AdjustmentValidationIssue,
	CanvasData,
	MergeOrganizationPayload,
	SplitOrganizationPayload,
} from "../types";
import type {
	AdjustmentActiveRecord,
	AdjustmentCanvasContextType,
	AdjustmentHistorySnapshot,
	BatchMovePayload,
} from "./types";
import {
	fetchOrgAdjustmentTaskDetail,
	saveSettings,
} from "#src/api/org-management/org-adjustment-management/adjustment-canvas";
import { message } from "antd";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createTempOrgId, normalizeOrgId } from "../utils";
import {
	buildCanvasDataFromTree,
	buildTaskOrgTree,
	collectSelfAndDirectChildIds,
	collectSubtreeNodeIds,
	containsTaskTreeNode,
	findNodeInTree,
	findTaskTreeMeta,
	isNodeChildrenVisible,
	setNodeExpandedState,
} from "./canvas-builder";
import {
	annotateChildrenModifiedState,
	buildSaveSettingsParams,
	cloneOrgItem,
	collectAncestorOrgIds,
	collectDirectChildIds,
	createActiveRecord,
	deriveUndoFocusTarget,
	hasOrgPositionChanged,
	isOrgDisabled,
	moveSubtreeToTarget,
	normalizeDetailViewLevel,
	normalizeIncomingOrgList,
	normalizeOrgName,
	normalizeTaskDetailSettings,
	recalculateChildNodeNum,
	recalculateNodeLevels,
	wouldCreateCycle,
} from "./org-tree-utils";

const EMPTY_CANVAS_DATA: CanvasData = { nodes: [], edges: [] };

const AdjustmentCanvasContext = createContext<AdjustmentCanvasContextType | null>(null);

// ===================== 统一状态提交 =====================

interface CommitChangeParams {
	nextOrgList: OrgAdjustmentTaskOrgItem[];
	nextExpandedNodeIds?: Set<string>;
	record?: AdjustmentActiveRecord;
}

/**
 * Provider 组件
 */
export const AdjustmentCanvasProvider: React.FC<{
	children: React.ReactNode;
	taskId?: number | null;
}> = ({ children, taskId = null }) => {
	const [taskDetail, setTaskDetail] = useState<OrgAdjustmentTaskDetailData | null>(null);
	const [canvasSettings, setCanvasSettings] = useState<OrgAdjustmentTaskSettings>(
		{} as OrgAdjustmentTaskSettings,
	);
	const [selectedTreeNodeId, setSelectedTreeNodeId] = useState<string | null>(null);
	const [displayLevel, setDisplayLevel] = useState<1 | 2 | 3>(3);
	const [adjustmentType, setAdjustmentTypeState] = useState<AdjustmentOperationType>("move");
	const [loading, setLoading] = useState(false);
	const [selectedCardIds, setSelectedCardIds] = useState<Set<string>>(new Set());
	const [lastSelectedCardId, setLastSelectedCardId] = useState<string | null>(null);
	const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(new Set());
	const [historySnapshots, setHistorySnapshots] = useState<AdjustmentHistorySnapshot[]>([]);
	const [initialOrgList, setInitialOrgList] = useState<OrgAdjustmentTaskOrgItem[]>([]);
	const [operationRecords, setOperationRecords] = useState<AdjustmentActiveRecord[]>([]);
	const [validationIssues, setValidationIssues] = useState<AdjustmentValidationIssue[]>([]);

	const oepOrgTree = useMemo(
		() => buildTaskOrgTree(taskDetail?.orgList ?? []),
		[taskDetail?.orgList],
	);
	const canUndo = historySnapshots.length > 0;

	const hasPendingChanges = useMemo(() => {
		const currentOrgList = taskDetail?.orgList ?? [];
		if (!currentOrgList.length) {
			return false;
		}
		if (currentOrgList.length !== initialOrgList.length) {
			return true;
		}
		const initialOrgMap = new Map(initialOrgList.map((item) => [String(item.orgId), item]));
		return currentOrgList.some((item) => {
			const initialOrg = initialOrgMap.get(String(item.orgId));
			if (!initialOrg) {
				return true;
			}
			return (
				item.parentOrgId !== initialOrg.parentOrgId ||
				item.nodeLevel !== initialOrg.nodeLevel ||
				item.effective !== initialOrg.effective ||
				item.orgName !== initialOrg.orgName ||
				item.modified ||
				item.childrenModified
			);
		});
	}, [initialOrgList, taskDetail?.orgList]);

	const changedOrgIds = useMemo(() => {
		const initialOrgMap = new Map(initialOrgList.map((item) => [String(item.orgId), item]));
		return new Set(
			(taskDetail?.orgList ?? [])
				.filter((item) =>
					hasOrgPositionChanged(initialOrgMap.get(String(item.orgId)), item),
				)
				.map((item) => String(item.orgId)),
		);
	}, [initialOrgList, taskDetail?.orgList]);

	// 统一的状态提交方法：快照 → 更新 orgList → 更新展开状态 → 清空选中 → 追加记录
	const commitChange = useCallback(
		({ nextOrgList, nextExpandedNodeIds, record }: CommitChangeParams) => {
			if (!taskDetail) {
				return;
			}

			setHistorySnapshots((prev) => [
				...prev,
				{
					orgList: taskDetail.orgList.map((item) => ({ ...item })),
					expandedNodeIds: Array.from(expandedNodeIds),
					operationRecordCount: operationRecords.length,
				},
			]);
			setTaskDetail((prev) => (prev ? { ...prev, orgList: nextOrgList } : prev));
			if (nextExpandedNodeIds) {
				setExpandedNodeIds(nextExpandedNodeIds);
			}
			setSelectedCardIds(new Set());
			setLastSelectedCardId(null);
			if (record) {
				setOperationRecords((prev) => [...prev, record]);
			}
		},
		[expandedNodeIds, operationRecords.length, taskDetail],
	);

	// 重置全部状态的方法
	const resetAllTransientState = useCallback(() => {
		setExpandedNodeIds(new Set());
		setHistorySnapshots([]);
		setOperationRecords([]);
		setValidationIssues([]);
		setSelectedCardIds(new Set());
		setLastSelectedCardId(null);
	}, []);

	// ===================== 调整类型 =====================

	const setAdjustmentType = useCallback(
		(type: AdjustmentOperationType) => {
			setAdjustmentTypeState(type);
			if (type !== "split") {
				return;
			}

			setSelectedCardIds((prev) => {
				if (prev.size <= 1) {
					return prev;
				}

				const preservedId =
					lastSelectedCardId && prev.has(lastSelectedCardId)
						? lastSelectedCardId
						: (Array.from(prev).pop() ?? null);

				setLastSelectedCardId(preservedId);
				return preservedId ? new Set([preservedId]) : new Set<string>();
			});
		},
		[lastSelectedCardId],
	);

	// ===================== 树节点自动选中 =====================

	useEffect(() => {
		if (!oepOrgTree.length) {
			setSelectedTreeNodeId(null);
			return;
		}

		if (!selectedTreeNodeId || !findNodeInTree(oepOrgTree, selectedTreeNodeId)) {
			const rootNode = oepOrgTree[0];
			setSelectedTreeNodeId((rootNode as any).id || String(rootNode.key));
		}
	}, [oepOrgTree, selectedTreeNodeId]);

	// ===================== 画布数据 =====================

	const canvasData = useMemo(() => {
		if (!oepOrgTree.length) {
			return EMPTY_CANVAS_DATA;
		}

		const currentOrgList = taskDetail?.orgList ?? [];
		const fallbackRootNode = oepOrgTree[0] ?? null;
		const selectedNode = selectedTreeNodeId
			? findNodeInTree(oepOrgTree, selectedTreeNodeId)
			: fallbackRootNode;
		const resolvedRootNode = selectedNode ?? fallbackRootNode;
		if (!resolvedRootNode) {
			return EMPTY_CANVAS_DATA;
		}

		return buildCanvasDataFromTree(
			[resolvedRootNode],
			displayLevel,
			canvasSettings,
			currentOrgList,
			changedOrgIds,
			expandedNodeIds,
		);
	}, [
		selectedTreeNodeId,
		oepOrgTree,
		displayLevel,
		canvasSettings,
		changedOrgIds,
		expandedNodeIds,
		taskDetail?.orgList,
	]);

	// ===================== 设置 =====================

	const updateCanvasSettings = useCallback(
		(patch: Partial<OrgAdjustmentTaskSettings>) => {
			const nextSettings = { ...canvasSettings, ...patch };
			setCanvasSettings(nextSettings);
			setTaskDetail((prev) =>
				prev ? { ...prev, settings: { ...prev.settings, ...patch } } : prev,
			);

			if (!taskId) {
				return;
			}

			void saveSettings(taskId, buildSaveSettingsParams(nextSettings))
				.then((resp) => {
					if (resp.code !== 200) {
						message.error(resp.msg || "设置保存失败，请稍后重试");
					}
				})
				.catch(() => {
					message.error("设置保存失败，请稍后重试");
				});
		},
		[canvasSettings, taskId],
	);

	// ===================== 增量更新 orgList 字段 =====================

	const updateOrgListFields = useCallback(
		(updates: Map<string, Partial<OrgAdjustmentTaskOrgItem>>) => {
			if (updates.size === 0) return;
			setTaskDetail((prev) => {
				if (!prev) return prev;
				const nextOrgList = prev.orgList.map((item) => {
					const patch = updates.get(item.code);
					if (!patch) return item;
					return { ...item, ...patch };
				});
				return { ...prev, orgList: nextOrgList };
			});
		},
		[],
	);

	// ===================== 校验问题 =====================

	const clearValidationIssues = useCallback(() => {
		setValidationIssues([]);
	}, []);

	const dismissValidationIssue = useCallback((issueKey: string) => {
		setValidationIssues((prev) => prev.filter((item) => item.key !== issueKey));
	}, []);

	// ===================== 版本 & rebase =====================

	const applyVersionDetail = useCallback(
		(versionDetail: OrgAdjustmentTaskVersionDetailData) => {
			const normalizedOrgList = normalizeIncomingOrgList(versionDetail.orgList ?? []);
			const normalizedRootNodeId = normalizeOrgId(versionDetail.rootNodeId);
			setTaskDetail((prev) => {
				if (!prev) {
					return null;
				}
				return {
					...prev,
					remark: versionDetail.remark,
					rootNodeId: normalizedRootNodeId,
					viewLevel: versionDetail.viewLevel,
					orgList: normalizedOrgList,
				};
			});
			setInitialOrgList(normalizedOrgList.map(cloneOrgItem));
			setDisplayLevel(normalizeDetailViewLevel(versionDetail.viewLevel));
			setSelectedTreeNodeId(normalizedRootNodeId || null);
			resetAllTransientState();
			if (
				versionDetail.adjustmentType === "move" ||
				versionDetail.adjustmentType === "merge" ||
				versionDetail.adjustmentType === "split"
			) {
				setAdjustmentType(versionDetail.adjustmentType);
			}
		},
		[resetAllTransientState, setAdjustmentType],
	);

	const revertIssueToOriginalParent = useCallback(
		(issueKey: string) => {
			if (!taskDetail) {
				return false;
			}

			const issue = validationIssues.find((item) => item.key === issueKey);
			if (!issue || !issue.originalParentOrgId) {
				return false;
			}

			const sourceId = String(issue.orgId);
			const targetId = String(issue.originalParentOrgId);
			const orgMap = new Map(taskDetail.orgList.map((item) => [String(item.orgId), item]));
			if (!orgMap.has(sourceId) || !orgMap.has(targetId)) {
				return false;
			}

			if (sourceId === targetId || wouldCreateCycle(orgMap, sourceId, targetId)) {
				return false;
			}

			const nextExpandedNodeIds = new Set(expandedNodeIds);
			setNodeExpandedState(nextExpandedNodeIds, targetId, true);
			const nextOrgList = annotateChildrenModifiedState(
				recalculateChildNodeNum(
					recalculateNodeLevels(
						moveSubtreeToTarget(
							taskDetail.orgList.map((item) => cloneOrgItem(item)),
							sourceId,
							targetId,
						),
					),
				),
				initialOrgList,
			);

			commitChange({ nextOrgList, nextExpandedNodeIds });
			setValidationIssues((prev) => prev.filter((item) => item.key !== issueKey));
			return true;
		},
		[commitChange, expandedNodeIds, initialOrgList, taskDetail, validationIssues],
	);

	// ===================== 树节点选择 =====================

	const handleTreeNodeSelect = useCallback((nodeId: string) => {
		setSelectedTreeNodeId(nodeId);
		setExpandedNodeIds(new Set());
	}, []);

	const clearSelection = useCallback(() => {
		setSelectedTreeNodeId(null);
		setExpandedNodeIds(new Set());
	}, []);

	// ===================== 展开/收起 =====================

	const expandNode = useCallback(
		(nodeId: string) => {
			setExpandedNodeIds((prev) => {
				const currentNode = canvasData.nodes.find((node) => String(node.id) === nodeId);
				const nodeLevel = Number(currentNode?.level ?? displayLevel + 1);
				if (nodeLevel <= 1) {
					return prev;
				}
				const currentlyVisible = isNodeChildrenVisible(
					nodeId,
					nodeLevel,
					displayLevel,
					prev,
				);
				const next = new Set(prev);
				setNodeExpandedState(next, nodeId, !currentlyVisible);
				return next;
			});
		},
		[canvasData.nodes, displayLevel],
	);

	// ===================== 禁用/启用 =====================

	const batchSetNodeDisable = useCallback(
		(rootNodeId: string, disabled: boolean) => {
			if (!taskDetail) {
				return;
			}

			const subtreeNodeIds = new Set(collectSelfAndDirectChildIds(oepOrgTree, rootNodeId));
			if (!subtreeNodeIds.size) {
				return;
			}

			let hasChanged = false;
			const nextOrgList = taskDetail.orgList.map((item) => {
				if (!subtreeNodeIds.has(String(item.orgId))) {
					return item;
				}

				if (disabled && (item.modified || item.childrenModified)) {
					return item;
				}

				if (isOrgDisabled(item.disable) === disabled) {
					return item;
				}

				hasChanged = true;
				return {
					...item,
					disable: disabled,
				};
			});

			if (!hasChanged) {
				return;
			}

			setTaskDetail((prev) => (prev ? { ...prev, orgList: nextOrgList } : prev));
		},
		[oepOrgTree, taskDetail],
	);

	const toggleNodeDisable = useCallback(
		(nodeId: string) => {
			if (!taskDetail) {
				return;
			}

			const targetOrg = taskDetail.orgList.find((item) => String(item.orgId) === nodeId);
			if (!targetOrg || targetOrg.modified || targetOrg.childrenModified) {
				return;
			}

			const nextDisabled = !isOrgDisabled(targetOrg.disable);
			const nextOrgList = taskDetail.orgList.map((item) =>
				String(item.orgId) === nodeId ? { ...item, disable: nextDisabled } : item,
			);

			setTaskDetail((prev) => (prev ? { ...prev, orgList: nextOrgList } : prev));
		},
		[taskDetail],
	);

	// ===================== 停用/恢复 =====================

	const setNodeEffective = useCallback(
		(nodeId: string, effective: boolean) => {
			if (!taskDetail) {
				return;
			}

			const targetOrg = taskDetail.orgList.find((item) => String(item.orgId) === nodeId);
			if (!targetOrg || targetOrg.effective === effective) {
				return;
			}

			const nextOrgList = annotateChildrenModifiedState(
				taskDetail.orgList.map((item) =>
					String(item.orgId) === nodeId ? { ...item, effective } : item,
				),
				initialOrgList,
			);

			commitChange({
				nextOrgList,
				record: createActiveRecord(effective ? "resume" : "stop", { nodeId }),
			});
			setSelectedCardIds((prev) => {
				const next = new Set(prev);
				next.delete(nodeId);
				return next;
			});
			setLastSelectedCardId((prev) => (prev === nodeId ? null : prev));
		},
		[commitChange, initialOrgList, taskDetail],
	);

	const batchSetNodeEffective = useCallback(
		(nodeIds: string[], effective: boolean) => {
			if (!taskDetail) {
				return;
			}

			const targetNodeIdSet = new Set(nodeIds.filter(Boolean));
			if (!targetNodeIdSet.size) {
				return;
			}

			const changedNodeIds = taskDetail.orgList
				.filter(
					(item) =>
						targetNodeIdSet.has(String(item.orgId)) && item.effective !== effective,
				)
				.map((item) => String(item.orgId));

			if (!changedNodeIds.length) {
				return;
			}

			const changedNodeIdSet = new Set(changedNodeIds);
			const nextOrgList = annotateChildrenModifiedState(
				taskDetail.orgList.map((item) =>
					changedNodeIdSet.has(String(item.orgId)) ? { ...item, effective } : item,
				),
				initialOrgList,
			);

			commitChange({
				nextOrgList,
				record: createActiveRecord(effective ? "resume" : "stop", {
					nodeIds: changedNodeIds,
				}),
			});
		},
		[commitChange, initialOrgList, taskDetail],
	);

	// ===================== 卡片选择 =====================

	const batchSetCardSelection = useCallback(
		(rootNodeId: string, selected: boolean) => {
			const subtreeNodeIds = collectSelfAndDirectChildIds(oepOrgTree, rootNodeId);
			if (!subtreeNodeIds.length) {
				return;
			}

			const disabledNodeIdSet = new Set(
				(taskDetail?.orgList ?? [])
					.filter((item) => isOrgDisabled(item.disable))
					.map((item) => String(item.orgId)),
			);
			const subtreeNodeIdSet = new Set(subtreeNodeIds);
			setSelectedCardIds((prev) => {
				const next = new Set(prev);

				if (selected) {
					const selectableNodeIds = subtreeNodeIds.filter(
						(nodeId) => !disabledNodeIdSet.has(nodeId),
					);
					selectableNodeIds.forEach((nodeId) => next.add(nodeId));
					setLastSelectedCardId(
						selectableNodeIds.length > 0
							? selectableNodeIds.includes(rootNodeId)
								? rootNodeId
								: selectableNodeIds[selectableNodeIds.length - 1]
							: null,
					);
					return next;
				}

				subtreeNodeIds.forEach((nodeId) => next.delete(nodeId));
				if (lastSelectedCardId && subtreeNodeIdSet.has(lastSelectedCardId)) {
					setLastSelectedCardId(next.size > 0 ? (Array.from(next).pop() ?? null) : null);
				}
				return next;
			});
		},
		[lastSelectedCardId, oepOrgTree, taskDetail?.orgList],
	);

	const toggleCardSelection = useCallback(
		(cardId: string) => {
			const targetOrg = taskDetail?.orgList.find((item) => String(item.orgId) === cardId);
			if (targetOrg && isOrgDisabled(targetOrg.disable)) {
				return;
			}

			setSelectedCardIds((prev) => {
				if (adjustmentType === "split") {
					if (prev.has(cardId)) {
						setLastSelectedCardId(null);
						return new Set<string>();
					}
					setLastSelectedCardId(cardId);
					return new Set([cardId]);
				}

				const newSet = new Set(prev);
				if (newSet.has(cardId)) {
					newSet.delete(cardId);
					if (cardId === lastSelectedCardId) {
						setLastSelectedCardId(newSet.size > 0 ? Array.from(newSet).pop()! : null);
					}
				} else {
					newSet.add(cardId);
					setLastSelectedCardId(cardId);
				}
				return newSet;
			});
		},
		[adjustmentType, lastSelectedCardId, taskDetail?.orgList],
	);

	const clearCardSelection = useCallback(() => {
		setSelectedCardIds(new Set());
		setLastSelectedCardId(null);
	}, []);

	// ===================== 移动 =====================

	const batchMoveNodes = useCallback(
		(moves: BatchMovePayload[]) => {
			if (!taskDetail) {
				return false;
			}

			const normalizedMoves = moves.filter((move) => move.sourceId && move.targetId);
			if (!normalizedMoves.length) {
				return false;
			}

			let workingOrgList = taskDetail.orgList.map((item) => ({ ...item }));
			const nextExpandedNodeIds = new Set(expandedNodeIds);
			let hasEffectiveChange = false;
			const moveRecords: Array<BatchMovePayload> = [];

			for (const move of normalizedMoves) {
				const { sourceId, targetId } = move;
				if (sourceId === targetId) {
					continue;
				}

				const taskTree = buildTaskOrgTree(workingOrgList);
				const sourceMeta = findTaskTreeMeta(taskTree, sourceId);
				const targetMeta = findTaskTreeMeta(taskTree, targetId);

				if (!sourceMeta || !targetMeta) {
					message.warning("未找到可调整的节点");
					return false;
				}

				if (sourceMeta.parentId === targetId) {
					continue;
				}

				if (containsTaskTreeNode(sourceMeta.node, targetId)) {
					message.warning("不能拖放到自己的子节点下");
					return false;
				}

				const subtreeNodeIds = new Set(collectSubtreeNodeIds(sourceMeta.node));
				const levelDelta = targetMeta.level + 1 - sourceMeta.level;
				const previousParentId = sourceMeta.parentId;
				const previousParentName = previousParentId
					? (workingOrgList.find((item) => String(item.orgId) === previousParentId)
							?.orgName ?? move.sourceParentName)
					: move.sourceParentName;

				moveRecords.push({
					sourceId,
					targetId,
					sourceParentId: previousParentId ?? move.sourceParentId,
					sourceParentName: previousParentName,
				});

				workingOrgList = workingOrgList.map((item) => {
					const currentId = String(item.orgId);
					if (currentId === previousParentId) {
						return {
							...item,
							childNodeNum:
								typeof item.childNodeNum === "number"
									? Math.max(0, item.childNodeNum - 1)
									: item.childNodeNum,
						};
					}

					if (currentId === targetId) {
						return {
							...item,
							childNodeNum:
								typeof item.childNodeNum === "number"
									? item.childNodeNum + 1
									: item.childNodeNum,
						};
					}

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

				setNodeExpandedState(nextExpandedNodeIds, targetId, true);
				hasEffectiveChange = true;
			}

			if (!hasEffectiveChange) {
				return true;
			}

			const nextOrgList = annotateChildrenModifiedState(workingOrgList, initialOrgList);
			commitChange({
				nextOrgList,
				nextExpandedNodeIds,
				record: createActiveRecord("move", { moves: moveRecords }),
			});
			return true;
		},
		[commitChange, expandedNodeIds, initialOrgList, taskDetail],
	);

	const moveNode = useCallback(
		(sourceId: string, targetId: string) => {
			batchMoveNodes([{ sourceId, targetId }]);
		},
		[batchMoveNodes],
	);

	// ===================== 合并 =====================

	const mergeNodes = useCallback(
		(payload: MergeOrganizationPayload) => {
			if (!taskDetail) {
				return false;
			}

			const mergeOrgIds = Array.from(new Set(payload.mergeOrgIds.filter(Boolean)));
			if (mergeOrgIds.length < 2) {
				message.warning("至少选择两个组织进行合并");
				return false;
			}

			const stoppedOrgIds = Array.from(new Set(payload.stoppedOrgIds.filter(Boolean)));
			if (
				!mergeOrgIds.includes(payload.mergedOrgId) ||
				stoppedOrgIds.some((id) => !mergeOrgIds.includes(id) || id === payload.mergedOrgId)
			) {
				message.warning("请正确选择合并后组织和停用组织");
				return false;
			}

			const orgMap = new Map(taskDetail.orgList.map((item) => [String(item.orgId), item]));
			const mergeOrgs = mergeOrgIds
				.map((id) => orgMap.get(id))
				.filter(Boolean) as OrgAdjustmentTaskOrgItem[];
			if (mergeOrgs.length !== mergeOrgIds.length) {
				message.warning("存在无效的合并组织");
				return false;
			}

			const parentIdSet = new Set(mergeOrgs.map((item) => String(item.parentOrgId ?? "")));
			const levelSet = new Set(mergeOrgs.map((item) => Number(item.nodeLevel ?? 0)));
			if (parentIdSet.size > 1 || levelSet.size > 1) {
				message.warning("仅支持同级且同一上级组织下的节点进行合并");
				return false;
			}

			const mergedOrg = orgMap.get(payload.mergedOrgId);
			if (!mergedOrg) {
				message.warning("未找到合并后的组织");
				return false;
			}

			const mergeAwayOrgIds = mergeOrgIds.filter((id) => id !== payload.mergedOrgId);
			if (stoppedOrgIds.length === 0) {
				message.warning("请至少选择一个停用组织");
				return false;
			}
			const movableChildIds = new Set(
				mergeAwayOrgIds.flatMap((id) => collectDirectChildIds(taskDetail.orgList, id)),
			);
			const partialChildOrgIds = Array.from(
				new Set(payload.partialChildOrgIds.filter((id) => movableChildIds.has(id))),
			);

			if (
				payload.childTransferMode === "partial" &&
				movableChildIds.size > 0 &&
				partialChildOrgIds.length === 0
			) {
				message.warning("部分平移时请选择下级节点组织");
				return false;
			}

			const childIdsToMove =
				payload.childTransferMode === "all" ? movableChildIds : new Set(partialChildOrgIds);

			const mergedOrgName = payload.mergedOrgName.trim() || mergedOrg.orgName;
			const nextOrgList = annotateChildrenModifiedState(
				recalculateChildNodeNum(
					taskDetail.orgList.map((item) => {
						const currentId = String(item.orgId);

						if (currentId === payload.mergedOrgId) {
							return {
								...item,
								orgName: mergedOrgName,
								effective: true,
							};
						}

						if (mergeAwayOrgIds.includes(currentId)) {
							return {
								...item,
								effective: stoppedOrgIds.includes(currentId)
									? false
									: item.effective,
							};
						}

						if (childIdsToMove.has(currentId)) {
							return {
								...item,
								parentOrgId: payload.mergedOrgId,
								modified: true,
							};
						}

						return item;
					}),
				),
				initialOrgList,
			);

			const nextExpandedNodeIds = new Set(expandedNodeIds);
			nextExpandedNodeIds.add(payload.mergedOrgId);
			commitChange({
				nextOrgList,
				nextExpandedNodeIds,
				record: createActiveRecord("merge", { payload, mergedOrgName }),
			});
			return true;
		},
		[commitChange, expandedNodeIds, initialOrgList, taskDetail],
	);

	// ===================== 拆分 =====================

	const splitNodes = useCallback(
		(payload: SplitOrganizationPayload) => {
			if (!taskDetail) {
				return false;
			}

			const sourceOrg = taskDetail.orgList.find(
				(item) => String(item.orgId) === payload.sourceOrgId,
			);
			if (!sourceOrg) {
				message.warning("未找到拆分组织");
				return false;
			}

			if (payload.targets.length < 2) {
				message.warning("至少配置两个拆分组织");
				return false;
			}

			const directChildIds = collectDirectChildIds(taskDetail.orgList, payload.sourceOrgId);
			const assignedChildIds = payload.targets.flatMap((target) => target.childOrgIds);
			const duplicateChildIds = assignedChildIds.filter(
				(childId, index) => assignedChildIds.indexOf(childId) !== index,
			);
			if (duplicateChildIds.length) {
				message.warning("同一个下级组织不能被分配到多个拆分组织中");
				return false;
			}

			if (assignedChildIds.some((childId) => !directChildIds.includes(childId))) {
				message.warning("仅支持选择拆分组织的直属下级节点");
				return false;
			}

			let workingOrgList = taskDetail.orgList.map((item) => ({ ...item }));
			const targetOrgIdMap = new Map<string, string>();

			for (const target of payload.targets) {
				if (!target.orgName.trim()) {
					message.warning("请完善拆分后组织名称");
					return false;
				}

				if (target.mode === "existing") {
					if (!target.existingOrgId) {
						message.warning("请选择原有组织");
						return false;
					}
					targetOrgIdMap.set(target.key, target.existingOrgId);
					continue;
				}

				if (!target.parentOrgId) {
					message.warning("请选择上级组织");
					return false;
				}

				const targetOrgName = normalizeOrgName(target.orgName);
				const parentOrg = workingOrgList.find(
					(item) => String(item.orgId) === target.parentOrgId,
				);
				if (!parentOrg) {
					message.warning("未找到预创建组织的上级组织");
					return false;
				}

				const duplicatedSibling = workingOrgList.some(
					(item) =>
						String(item.parentOrgId ?? "") === target.parentOrgId &&
						normalizeOrgName(item.orgName) === targetOrgName,
				);
				if (duplicatedSibling) {
					message.warning(`同一上级组织下已存在名为"${targetOrgName}"的组织`);
					return false;
				}

				const newOrgId = createTempOrgId(workingOrgList.map((item) => item.orgId));
				workingOrgList.push({
					orgId: newOrgId,
					code: "",
					parentOrgId: target.parentOrgId,
					effective: true,
					ehrOrgId: 0,
					nodeLevel: Number(parentOrg.nodeLevel ?? 0) + 1,
					orgName: targetOrgName,
					orgFullName: targetOrgName,
					saturatedRevenue: null,
					targetRevenue: null,
					targetProfit: null,
					childNodeNum: 0,
					projectNum: null,
					planDeliveryProjectNum: null,
					expandDeliveryProjectNum: null,
					longitude: null,
					latitude: null,
					orgLevel: target.orgLevel ? String(target.orgLevel) : null,
					preEstablishTime: target.preEstablishTime ?? null,
					disable: false,
					kpiList: null,
					modified: true,
					childrenModified: false,
					compareMeta: null,
					projCode: "",
					projOrgStatus: "",
					virtual: Boolean(target.virtual),
					newOrg: true,
					employeeNum: null,
				});
				targetOrgIdMap.set(target.key, newOrgId);
			}

			for (const target of payload.targets) {
				const targetOrgId = targetOrgIdMap.get(target.key);
				if (!targetOrgId) {
					continue;
				}

				for (const childOrgId of target.childOrgIds) {
					workingOrgList = moveSubtreeToTarget(workingOrgList, childOrgId, targetOrgId);
				}
			}

			const nextOrgList = annotateChildrenModifiedState(
				recalculateChildNodeNum(workingOrgList),
				initialOrgList,
			);

			const nextExpandedNodeIds = new Set(expandedNodeIds);
			const nextOrgMap = new Map(nextOrgList.map((item) => [String(item.orgId), item]));
			const expandNodeIdSet = new Set<string>([payload.sourceOrgId]);

			payload.targets.forEach((target) => {
				const targetOrgId = targetOrgIdMap.get(target.key);
				const anchorNodeId = targetOrgId || target.parentOrgId;
				if (!anchorNodeId) {
					return;
				}
				collectAncestorOrgIds(nextOrgMap, String(anchorNodeId)).forEach((nodeId) =>
					expandNodeIdSet.add(nodeId),
				);
			});

			expandNodeIdSet.forEach((nodeId) =>
				setNodeExpandedState(nextExpandedNodeIds, nodeId, true),
			);
			commitChange({
				nextOrgList,
				nextExpandedNodeIds,
				record: createActiveRecord("split", { payload }),
			});
			return true;
		},
		[commitChange, expandedNodeIds, initialOrgList, taskDetail],
	);

	// ===================== 撤销 =====================

	const undoLastOperation = useCallback(() => {
		if (!historySnapshots.length) {
			return null;
		}

		const lastSnapshot = historySnapshots[historySnapshots.length - 1];
		const undoFocusTarget = deriveUndoFocusTarget(
			lastSnapshot.orgList,
			taskDetail?.orgList ?? [],
		);
		setTaskDetail((prev) =>
			prev ? { ...prev, orgList: lastSnapshot.orgList.map((item) => ({ ...item })) } : prev,
		);
		setExpandedNodeIds(new Set(lastSnapshot.expandedNodeIds));
		setOperationRecords((prev) => prev.slice(0, lastSnapshot.operationRecordCount));
		setHistorySnapshots((prev) => prev.slice(0, -1));
		return undoFocusTarget;
	}, [historySnapshots, taskDetail?.orgList]);

	// ===================== 数据加载 =====================

	const refreshData = useCallback(async () => {
		setLoading(true);
		try {
			const detailResponse = taskId ? await fetchOrgAdjustmentTaskDetail(taskId) : null;
			const detailData = detailResponse?.data ?? null;
			const normalizedOrgList = normalizeIncomingOrgList(detailData?.orgList ?? []);
			const normalizedSettings = normalizeTaskDetailSettings(detailData);
			const normalizedRootNodeId = normalizeOrgId(
				detailData?.rootNodeId ?? normalizedSettings.rootNodeId,
			);
			setTaskDetail(
				detailData
					? {
							...detailData,
							rootNodeId: normalizedRootNodeId,
							orgList: normalizedOrgList,
							settings: normalizedSettings,
						}
					: null,
			);
			setInitialOrgList(normalizedOrgList.map(cloneOrgItem));
			setCanvasSettings(normalizedSettings);
			setDisplayLevel(normalizeDetailViewLevel(detailData?.viewLevel));
			setSelectedTreeNodeId(normalizedRootNodeId || null);
			resetAllTransientState();
		} finally {
			setLoading(false);
		}
	}, [resetAllTransientState, taskId]);

	// ===================== Context Value =====================

	const contextValue: AdjustmentCanvasContextType = {
		taskId,
		taskDetail,
		canvasSettings,
		selectedTreeNodeId,
		displayLevel,
		adjustmentType,
		canvasData,
		loading,
		canUndo,
		hasPendingChanges,
		oepOrgTree,
		selectedCardIds,
		lastSelectedCardId,
		expandedNodeIds,
		operationRecords,
		validationIssues,
		handleTreeNodeSelect,
		setDisplayLevel,
		setAdjustmentType,
		clearSelection,
		refreshData,
		applyVersionDetail,
		setValidationIssues,
		dismissValidationIssue,
		revertIssueToOriginalParent,
		clearValidationIssues,
		updateCanvasSettings,
		toggleCardSelection,
		clearCardSelection,
		expandNode,
		toggleNodeDisable,
		batchSetNodeDisable,
		setNodeEffective,
		batchSetNodeEffective,
		batchSetCardSelection,
		moveNode,
		batchMoveNodes,
		mergeNodes,
		splitNodes,
		undoLastOperation,
		updateOrgListFields,
	};

	return (
		<AdjustmentCanvasContext.Provider value={contextValue}>
			{children}
		</AdjustmentCanvasContext.Provider>
	);
};

/**
 * 自定义 Hook 用于使用 Context
 */
export function useAdjustmentCanvas(): AdjustmentCanvasContextType {
	const context = useContext(AdjustmentCanvasContext);
	if (!context) {
		throw new Error("useAdjustmentCanvas must be used within AdjustmentCanvasProvider");
	}
	return context;
}

export default AdjustmentCanvasContext;
