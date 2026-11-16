/**
 * 调整画布主页面
 */

import type { CanvasRef, OrgNodeBatchAction } from "./types";
import { App, Modal, Spin } from "antd";
import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { CanvasSettingsDrawer } from "./components/CanvasSettingsDrawer";
import { CanvasToolbar } from "./components/CanvasToolbar";
import { ChildrenChangeCompareModal } from "./components/ChildrenChangeCompareModal";
import { FloatingActionMenu } from "./components/FloatingActionMenu";
import { MergeOrganizationDrawer } from "./components/MergeOrganizationDrawer";
import { MoveOrganizationDrawer } from "./components/MoveOrganizationDrawer";
import { OrganizationAdjustmentForm } from "./components/OrganizationAdjustmentForm";
import { PrecreateOrganizationDrawer } from "./components/PrecreateOrganizationDrawer";
import { ProjectDistributionMapModal } from "./components/ProjectDistributionMapModal";
import { SplitOrganizationDrawer } from "./components/SplitOrganizationDrawer";
import { ValidationIssuePanel } from "./components/ValidationIssuePanel";
import { AdjustmentCanvasProvider, useAdjustmentCanvas } from "./context";
import { createTempOrgId } from "./utils";

// G6 重量级库动态加载，避免阻塞首屏渲染
const OrgDiagram = React.lazy(() => import("./components/OrgDiagram"));

/**
 * 将 Context 的组织数据转换为 G6 GraphData 格式
 */
function buildGraphData(canvasData: { nodes: any[]; edges: any[] }) {
	const nodeMap = new Map(canvasData.nodes.map((node: any) => [String(node.id), node]));

	const nodes = canvasData.nodes.map((node: any) => ({
		id: node.id,
		data: {
			name: node.name,
			newOrg: node.newOrg,
			disable: node.disable,
			effective: node.effective,
			isStopped: node.isStopped,
			isChanged: node.isChanged,
			childrenModified: node.childrenModified,
			changeHighlightColor: node.childrenModified
				? "rgba(255, 213, 173, 1)"
				: node.isChanged
					? "rgba(255, 213, 173, 1)"
					: undefined,
			level: node.level,
			parentId: node.parentId,
			properties: node.properties,
			displayFields: node.displayFields,
			nodeHeight: node.nodeHeight,
			nodeWidth: node.nodeWidth,
			hiddenChildCount: node.hiddenChildCount,
			canExpandChildren: node.canExpandChildren,
		},
	}));

	const edges = canvasData.edges.map((edge: any) => {
		const sourceNode = nodeMap.get(String(edge.source));
		const targetNode = nodeMap.get(String(edge.target));
		const sourceLevel = Number(sourceNode?.level ?? 0);
		const targetLevel = Number(targetNode?.level ?? 0);

		let edgeType = "polyline";
		let sourcePort = "bottom";
		let targetPort = "top";
		let edgeStyle: Record<string, any> = {
			router: false,
			radius: 16,
		};

		if (sourceLevel === 1 && targetLevel === 2) {
			edgeType = "rounded-orth-polyline";
			edgeStyle = {
				router: false,
				radius: 14,
			};
		}

		if (sourceLevel >= 2 && targetLevel === sourceLevel + 1) {
			edgeType = "polyline";
			sourcePort = "left";
			targetPort = "left";
			edgeStyle = {
				router: false,
				radius: 16,
			};
		}

		return {
			id: edge.id,
			type: edgeType,
			source: edge.source,
			target: edge.target,
			sourcePort,
			targetPort,
			style: edgeStyle,
			data: {
				text: edge.label || "",
				type: edge.type,
				sourceLevel,
				targetLevel,
			},
		};
	});

	return { nodes, edges };
}

function collectDescendantIds(
	orgList: Array<{ orgId: string; parentOrgId: string }>,
	rootId: string,
) {
	const childrenMap = new Map<string, string[]>();
	orgList.forEach((item) => {
		const parentId = item.parentOrgId ? String(item.parentOrgId) : "";
		if (!childrenMap.has(parentId)) {
			childrenMap.set(parentId, []);
		}
		childrenMap.get(parentId)!.push(String(item.orgId));
	});

	const result = new Set<string>();
	const queue = [rootId];
	while (queue.length) {
		const currentId = queue.shift()!;
		result.add(currentId);
		(childrenMap.get(currentId) ?? []).forEach((childId) => {
			if (!result.has(childId)) {
				queue.push(childId);
			}
		});
	}

	return result;
}

function isOrgDisabled(disable: boolean | null | undefined) {
	return disable !== false;
}

function isOrgStopped(effective: boolean | null | undefined) {
	return effective === false;
}

function AdjustmentCanvasContent() {
	const canvasRef = useRef<CanvasRef>(null);
	const [settingsOpen, setSettingsOpen] = useState(false);
	const [isDragMode, setIsDragMode] = useState(true);
	const [moveDrawerOpen, setMoveDrawerOpen] = useState(false);
	const [mergeDrawerOpen, setMergeDrawerOpen] = useState(false);
	const [splitDrawerOpen, setSplitDrawerOpen] = useState(false);
	const [precreateDrawerOpen, setPrecreateDrawerOpen] = useState(false);
	const [projectMapOpen, setProjectMapOpen] = useState(false);
	const [compareNodeId, setCompareNodeId] = useState<string | null>(null);
	const [pendingFocusTarget, setPendingFocusTarget] = useState<{
		nodeId: string;
		parentId: string;
	} | null>(null);
	const [mergeSeed, setMergeSeed] = useState<{
		selectedOrgIds: string[];
		mergedOrgId?: string | null;
		stoppedOrgId?: string | null;
	}>({ selectedOrgIds: [] });
	const { message } = App.useApp();

	const {
		loading,
		taskDetail,
		oepOrgTree,
		canvasData,
		refreshData,
		selectedCardIds,
		lastSelectedCardId,
		adjustmentType,
		toggleCardSelection,
		expandNode,
		toggleNodeDisable,
		batchSetNodeDisable,
		batchSetCardSelection,
		batchMoveNodes,
		mergeNodes,
		splitNodes,
		setNodeEffective,
		batchSetNodeEffective,
		canUndo,
		undoLastOperation,
		validationIssues,
		revertIssueToOriginalParent,
		clearValidationIssues,
	} = useAdjustmentCanvas();

	useEffect(() => {
		refreshData();
	}, [refreshData]);

	useEffect(() => {
		if (!pendingFocusTarget) {
			return;
		}

		const matchedNode = (canvasData.nodes ?? []).find(
			(node) => String(node.id) === pendingFocusTarget.nodeId,
		);
		if (!matchedNode || String(matchedNode.parentId ?? "") !== pendingFocusTarget.parentId) {
			return;
		}

		const timer = window.setTimeout(() => {
			canvasRef.current?.focusNode(pendingFocusTarget.nodeId);
			setPendingFocusTarget(null);
		}, 0);

		return () => {
			window.clearTimeout(timer);
		};
	}, [canvasData.nodes, pendingFocusTarget]);

	const orgData = useMemo(() => buildGraphData(canvasData), [adjustmentType, canvasData]);
	const selectedOrgIds = useMemo(() => Array.from(selectedCardIds), [selectedCardIds]);
	const currentOrgList = taskDetail?.orgList ?? [];
	const canOperateByDrag =
		isDragMode && (adjustmentType === "move" || adjustmentType === "merge");
	const orgMetaMap = useMemo(
		() => new Map(currentOrgList.map((item) => [String(item.orgId), item])),
		[currentOrgList],
	);
	const operableSelectedOrgIds = useMemo(
		() =>
			selectedOrgIds.filter(
				(id) =>
					!isOrgDisabled(orgMetaMap.get(id)?.disable) &&
					!isOrgStopped(orgMetaMap.get(id)?.effective),
			),
		[orgMetaMap, selectedOrgIds],
	);
	const lastOperableSelectedCardId = useMemo(() => {
		if (
			lastSelectedCardId &&
			!isOrgDisabled(orgMetaMap.get(lastSelectedCardId)?.disable) &&
			!isOrgStopped(orgMetaMap.get(lastSelectedCardId)?.effective)
		) {
			return lastSelectedCardId;
		}

		for (let index = selectedOrgIds.length - 1; index >= 0; index -= 1) {
			const nodeId = selectedOrgIds[index];
			if (
				!isOrgDisabled(orgMetaMap.get(nodeId)?.disable) &&
				!isOrgStopped(orgMetaMap.get(nodeId)?.effective)
			) {
				return nodeId;
			}
		}

		return null;
	}, [lastSelectedCardId, orgMetaMap, selectedOrgIds]);
	const lastSelectedOrg = useMemo(
		() => (lastOperableSelectedCardId ? orgMetaMap.get(lastOperableSelectedCardId) : undefined),
		[lastOperableSelectedCardId, orgMetaMap],
	);
	const compareTargetOrg = useMemo(
		() => (compareNodeId ? orgMetaMap.get(compareNodeId) : undefined),
		[compareNodeId, orgMetaMap],
	);
	const selectedOrgNames = useMemo(
		() =>
			operableSelectedOrgIds
				.map((id) => orgMetaMap.get(id)?.orgName)
				.filter(Boolean) as string[],
		[operableSelectedOrgIds, orgMetaMap],
	);
	const showDisableAction = operableSelectedOrgIds.length > 0;
	// 勾选节点直属子节点中的项目类节点（用于"项目分布地图"展示）
	const projectMapChildItems = useMemo(() => {
		if (!operableSelectedOrgIds.length) {
			return [];
		}
		const selectedIdSet = new Set(operableSelectedOrgIds);
		return currentOrgList.filter(
			(item) =>
				selectedIdSet.has(String(item.parentOrgId)) &&
				String(item.projOrgStatus ?? "").trim() !== "",
		);
	}, [operableSelectedOrgIds, currentOrgList]);
	const showProjectMapAction = projectMapChildItems.length > 0;
	// 拼装项目地图点位数据（仅保留经纬度有效的项目）
	const projectMapPoints = useMemo(() => {
		return projectMapChildItems
			.map((item) => {
				const lng = Number(item.longitude);
				const lat = Number(item.latitude);
				if (!Number.isFinite(lng) || !Number.isFinite(lat) || (lng === 0 && lat === 0)) {
					return null;
				}
				return {
					id: String(item.orgId),
					name: item.orgName,
					orgName: orgMetaMap.get(String(item.parentOrgId))?.orgName ?? "",
					lng,
					lat,
				};
			})
			.filter(
				(
					point,
				): point is {
					id: string;
					name: string;
					orgName: string;
					lng: number;
					lat: number;
				} => point !== null,
			);
	}, [projectMapChildItems, orgMetaMap]);
	const splitSourceOrgIds = useMemo(
		() => (lastOperableSelectedCardId ? [lastOperableSelectedCardId] : []),
		[lastOperableSelectedCardId],
	);

	const canNodeDrop = useMemo(() => {
		return (
			source: { id: string; level?: number; parentId?: string },
			target: { id: string; level?: number; parentId?: string },
		) => {
			const sourceOrg = orgMetaMap.get(source.id);
			const targetOrg = orgMetaMap.get(target.id);
			if (!sourceOrg || !targetOrg || source.id === target.id) {
				return false;
			}

			if (
				isOrgDisabled(sourceOrg.disable) ||
				isOrgDisabled(targetOrg.disable) ||
				isOrgStopped(sourceOrg.effective) ||
				isOrgStopped(targetOrg.effective)
			) {
				return false;
			}

			if (adjustmentType === "merge") {
				return (
					Number(source.level ?? sourceOrg.nodeLevel) ===
						Number(target.level ?? targetOrg.nodeLevel) &&
					String(source.parentId ?? sourceOrg.parentOrgId ?? "") ===
						String(target.parentId ?? targetOrg.parentOrgId ?? "")
				);
			}

			if (adjustmentType === "move") {
				if (String(sourceOrg.parentOrgId) === target.id) {
					return false;
				}
				return !collectDescendantIds(currentOrgList, source.id).has(target.id);
			}

			return false;
		};
	}, [adjustmentType, currentOrgList, orgMetaMap]);

	const openMergeDrawer = (
		nextSelectedOrgIds: string[],
		mergedOrgId?: string | null,
		stoppedOrgId?: string | null,
	) => {
		setMergeSeed({
			selectedOrgIds: Array.from(new Set(nextSelectedOrgIds)),
			mergedOrgId,
			stoppedOrgId,
		});
		setMergeDrawerOpen(true);
	};

	const handleNodeDrop = (sourceId: string, targetId: string) => {
		if (adjustmentType === "move") {
			const moved = batchMoveNodes([{ sourceId, targetId }]);
			if (moved) {
				setPendingFocusTarget({ nodeId: sourceId, parentId: targetId });
			}
			return;
		}

		if (adjustmentType === "merge") {
			const baseSelectedIds = selectedCardIds.has(sourceId)
				? Array.from(selectedCardIds).filter(
						(id) =>
							!isOrgDisabled(orgMetaMap.get(id)?.disable) &&
							!isOrgStopped(orgMetaMap.get(id)?.effective),
					)
				: [sourceId];
			openMergeDrawer([...baseSelectedIds, targetId], targetId, sourceId);
		}
	};

	const handleNodeBatchAction = (nodeId: string, action: OrgNodeBatchAction) => {
		if (action === "batch-enable") {
			batchSetNodeDisable(nodeId, false);
			return;
		}

		if (action === "batch-disable") {
			batchSetNodeDisable(nodeId, true);
			return;
		}

		if (action === "batch-select-children") {
			batchSetCardSelection(nodeId, true);
			return;
		}

		if (action === "batch-unselect-children") {
			batchSetCardSelection(nodeId, false);
		}
	};

	const handleNodeCompare = (nodeId: string) => {
		const targetOrg = orgMetaMap.get(nodeId);
		if (!targetOrg?.childrenModified) {
			return;
		}

		setCompareNodeId(nodeId);
	};

	const handleNodeStatusToggle = (nodeId: string) => {
		const targetOrg = orgMetaMap.get(nodeId);
		if (!targetOrg) {
			return;
		}

		if (isOrgStopped(targetOrg.effective)) {
			const orgName = targetOrg.orgName ?? "当前组织";
			Modal.confirm({
				title: "确认取消停用",
				content: `确认要取消停用“${orgName}”吗？`,
				okText: "确认取消",
				cancelText: "取消",
				onOk: () => {
					setNodeEffective(nodeId, true);
					message.success(`已取消停用组织：${orgName}`);
				},
			});
			return;
		}

		toggleNodeDisable(nodeId);
	};

	const handleDisableOrganization = () => {
		const stopTargetIds = operableSelectedOrgIds.filter(
			(id) => !isOrgStopped(orgMetaMap.get(id)?.effective),
		);
		if (!stopTargetIds.length) {
			return;
		}

		const stopTargetOrgs = stopTargetIds.map((id) => orgMetaMap.get(id)).filter(Boolean);
		const isBatchStop = stopTargetIds.length > 1;
		const orgName = stopTargetOrgs[0]?.orgName ?? lastSelectedOrg?.orgName ?? "当前组织";
		const summaryNames = stopTargetOrgs
			.slice(0, 3)
			.map((item) => item?.orgName ?? "")
			.filter(Boolean)
			.join("、");
		const content = isBatchStop
			? `确认要批量停用已勾选的 ${stopTargetIds.length} 个组织吗？${summaryNames ? `\n涉及组织：${summaryNames}${stopTargetIds.length > 3 ? " 等" : ""}` : ""}`
			: `确认要停用“${orgName}”吗？`;

		Modal.confirm({
			title: "确认停用组织",
			content,
			okText: "确认停用",
			cancelText: "取消",
			okButtonProps: { danger: true },
			onOk: () => {
				if (isBatchStop) {
					batchSetNodeEffective(stopTargetIds, false);
					message.success(`已批量停用 ${stopTargetIds.length} 个组织`);
					return;
				}

				setNodeEffective(stopTargetIds[0], false);
				message.success(`已停用组织：${orgName}`);
			},
		});
	};

	const handleConfirmMoves = (moves: Array<{ sourceId: string; targetId: string }>) => {
		const moved = batchMoveNodes(moves);
		if (moved) {
			const lastMove = moves[moves.length - 1];
			setPendingFocusTarget(
				lastMove ? { nodeId: lastMove.sourceId, parentId: lastMove.targetId } : null,
			);
		}
		return moved;
	};

	const handleConfirmPrecreate = (payload: Parameters<typeof splitNodes>[0]) => {
		const precreateTarget = payload.targets.find((target) => target.mode === "precreate");
		const predictedNodeId = precreateTarget
			? createTempOrgId(currentOrgList.map((item) => item.orgId))
			: null;
		const confirmed = splitNodes(payload);

		if (confirmed && predictedNodeId && precreateTarget?.parentOrgId) {
			setPendingFocusTarget({
				nodeId: predictedNodeId,
				parentId: String(precreateTarget.parentOrgId),
			});
		}

		return confirmed;
	};

	const handleUndo = () => {
		const focusTarget = undoLastOperation();
		if (focusTarget) {
			setPendingFocusTarget(focusTarget);
		}
	};

	useEffect(() => {
		canvasRef.current?.setDragMode(isDragMode);
	}, [isDragMode]);

	const handleRevertToOriginal = (issue: (typeof validationIssues)[number]) => {
		const success = revertIssueToOriginalParent(issue.key);
		if (!success) {
			message.error("移回失败，原父组织不存在或当前无法挂载到该组织下");
			return;
		}

		message.success(`已移回${issue.originalParentOrgName || "原父组织"}`);
	};

	return (
		<div className="relative w-full overflow-hidden" style={{ height: "calc(100vh - 86px)" }}>
			{/* 全屏画布背景 */}
			<div className="absolute inset-0">
				<Spin spinning={loading}>
					<div style={{ width: "100%", height: "calc(100vh - 86px)" }}>
						<Suspense
							fallback={
								<div className="flex h-full w-full items-center justify-center text-gray-500">
									加载画布组件中...
								</div>
							}
						>
							<OrgDiagram
								ref={canvasRef}
								className="h-full w-full"
								orgData={orgData}
								selectedCardIds={selectedCardIds}
								onCardToggle={toggleCardSelection}
								onNodeExpand={expandNode}
								onNodeStatusToggle={handleNodeStatusToggle}
								onNodeBatchAction={handleNodeBatchAction}
								onNodeCompare={handleNodeCompare}
								onNodeDrop={canOperateByDrag ? handleNodeDrop : undefined}
								canNodeDrop={canOperateByDrag ? canNodeDrop : undefined}
								isDragMode={isDragMode}
								dropDragEnabled={canOperateByDrag}
							/>
						</Suspense>
					</div>
				</Spin>
			</div>

			{/* 顶部筛选面板 - 悬浮 */}
			<div
				className="absolute left-4 right-4 top-4 z-20"
				style={{
					height: "121px",
					background: "rgba(255, 255, 255, 1)",
					border: "1px solid rgba(0, 0, 0, 0.12)",
					boxShadow: "0 0 4px 0 rgba(0, 0, 0, 0.12)",
					borderRadius: "8px",
				}}
			>
				<OrganizationAdjustmentForm canvasRef={canvasRef} />
			</div>

			{/* 右下角工具栏 */}
			<div className="absolute bottom-4 right-4 z-20">
				<CanvasToolbar
					canvasRef={canvasRef}
					onOpenSettings={() => setSettingsOpen(true)}
					isDragMode={isDragMode}
					onToggleDragMode={() => setIsDragMode((prev) => !prev)}
					canUndo={canUndo}
					onUndo={handleUndo}
				/>
			</div>

			{validationIssues.length > 0 && (
				<div className="absolute bottom-4 left-4 right-24 z-20">
					<ValidationIssuePanel
						issues={validationIssues}
						onClose={clearValidationIssues}
						onRevertToOriginal={handleRevertToOriginal}
					/>
				</div>
			)}

			<FloatingActionMenu
				anchorNodeId={lastOperableSelectedCardId}
				operationType={adjustmentType}
				visible={operableSelectedOrgIds.length > 0 && Boolean(lastOperableSelectedCardId)}
				showDisableAction={showDisableAction}
				showProjectMapAction={showProjectMapAction}
				onActionClick={(operation) => {
					if (!operableSelectedOrgIds.length) {
						return;
					}

					if (operation === "move") {
						setMoveDrawerOpen(true);
					}
					if (operation === "merge") {
						openMergeDrawer(operableSelectedOrgIds);
					}
					if (operation === "split") {
						setSplitDrawerOpen(true);
					}
					if (operation === "precreate") {
						setPrecreateDrawerOpen(true);
					}
					if (operation === "projectMap") {
						setProjectMapOpen(true);
					}
					if (operation === "stop") {
						handleDisableOrganization();
					}
				}}
			/>

			<CanvasSettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
			<MoveOrganizationDrawer
				open={moveDrawerOpen}
				onClose={() => setMoveDrawerOpen(false)}
				operationType={adjustmentType}
				selectedOrgIds={operableSelectedOrgIds}
				orgList={taskDetail?.orgList ?? []}
				orgTree={oepOrgTree}
				visibleNodeIds={(canvasData.nodes ?? []).map((node) => String(node.id))}
				onConfirmMoves={handleConfirmMoves}
			/>
			<MergeOrganizationDrawer
				open={mergeDrawerOpen}
				onClose={() => setMergeDrawerOpen(false)}
				selectedOrgIds={mergeSeed.selectedOrgIds}
				initialMergedOrgId={mergeSeed.mergedOrgId}
				initialStoppedOrgId={mergeSeed.stoppedOrgId}
				orgList={currentOrgList}
				orgTree={oepOrgTree}
				visibleNodeIds={(canvasData.nodes ?? []).map((node) => String(node.id))}
				onConfirmMerge={mergeNodes}
			/>
			<SplitOrganizationDrawer
				open={splitDrawerOpen}
				onClose={() => setSplitDrawerOpen(false)}
				selectedOrgIds={splitSourceOrgIds}
				orgList={currentOrgList}
				orgTree={oepOrgTree}
				onConfirmSplit={splitNodes}
			/>
			<PrecreateOrganizationDrawer
				open={precreateDrawerOpen}
				onClose={() => setPrecreateDrawerOpen(false)}
				sourceOrgId={lastOperableSelectedCardId}
				orgList={currentOrgList}
				orgTree={oepOrgTree}
				onConfirmSplit={handleConfirmPrecreate}
			/>
			<ChildrenChangeCompareModal
				open={Boolean(compareNodeId)}
				onClose={() => setCompareNodeId(null)}
				org={compareTargetOrg}
				orgList={currentOrgList}
				settings={taskDetail?.settings}
			/>
			<ProjectDistributionMapModal
				open={projectMapOpen}
				onClose={() => setProjectMapOpen(false)}
				selectedOrgNames={selectedOrgNames}
				projects={projectMapPoints}
			/>
		</div>
	);
}

export default function AdjustmentCanvas() {
	const [searchParams] = useSearchParams();
	const taskId = useMemo(() => {
		const rawId = searchParams.get("id");
		if (!rawId) {
			return null;
		}

		const parsedId = Number(rawId);
		return Number.isFinite(parsedId) ? parsedId : null;
	}, [searchParams]);

	return (
		<AdjustmentCanvasProvider taskId={taskId}>
			<style>
				{`
				.org-card-checkbox-orange .ant-checkbox-checked .ant-checkbox-inner {
					background-color: rgba(255, 125, 0, 1) !important;
					border-color: rgba(255, 125, 0, 1) !important;
				}
				.org-card-checkbox-orange .ant-checkbox-checked::after {
					border-color: rgba(255, 125, 0, 1) !important;
				}
			`}
			</style>
			<AdjustmentCanvasContent />
		</AdjustmentCanvasProvider>
	);
}
