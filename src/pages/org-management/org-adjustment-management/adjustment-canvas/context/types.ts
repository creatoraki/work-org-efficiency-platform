import type {
	OrgAdjustmentTaskDetailData,
	OrgAdjustmentTaskOrgItem,
	OrgAdjustmentTaskSettings,
	OrgAdjustmentTaskVersionDetailData,
} from "#src/api/org-management/org-adjustment-management/adjustment-canvas";
import type { DataNode } from "antd/es/tree";
import type {
	AdjustmentOperationType,
	AdjustmentValidationIssue,
	CanvasData,
	MergeOrganizationPayload,
	SplitOrganizationPayload,
} from "../types";

export type TaskTreeNode = DataNode & {
	id: string;
	value: string;
	nodeLevel: number;
	treeLevel: number;
	parentOrgId: string;
	orgData: OrgAdjustmentTaskOrgItem;
	children?: TaskTreeNode[];
};

export interface TaskTreeMeta {
	node: TaskTreeNode;
	level: number;
	parentId: string | null;
}

export interface AdjustmentHistorySnapshot {
	orgList: OrgAdjustmentTaskOrgItem[];
	expandedNodeIds: string[];
	operationRecordCount: number;
}

export interface BatchMovePayload {
	sourceId: string;
	targetId: string;
	sourceParentId?: string;
	sourceParentName?: string;
}

export interface FocusTarget {
	nodeId: string;
	parentId: string;
}

export interface AdjustmentActiveRecord {
	type: string;
	activeBody: string;
}

/**
 * Context 状态接口
 */
export interface AdjustmentCanvasState {
	taskId: number | null;
	taskDetail: OrgAdjustmentTaskDetailData | null;
	canvasSettings: OrgAdjustmentTaskSettings;
	selectedTreeNodeId: string | null;
	displayLevel: 1 | 2 | 3;
	adjustmentType: AdjustmentOperationType;
	canvasData: CanvasData;
	loading: boolean;
	canUndo: boolean;
	hasPendingChanges: boolean;
	oepOrgTree: DataNode[];
	selectedCardIds: Set<string>;
	lastSelectedCardId: string | null;
	expandedNodeIds: Set<string>;
	operationRecords: AdjustmentActiveRecord[];
	validationIssues: AdjustmentValidationIssue[];
}

/**
 * Context 操作接口
 */
export interface AdjustmentCanvasActions {
	handleTreeNodeSelect: (nodeId: string) => void;
	setDisplayLevel: (level: 1 | 2 | 3) => void;
	setAdjustmentType: (type: AdjustmentOperationType) => void;
	clearSelection: () => void;
	refreshData: () => Promise<void>;
	applyVersionDetail: (versionDetail: OrgAdjustmentTaskVersionDetailData) => void;
	setValidationIssues: (issues: AdjustmentValidationIssue[]) => void;
	dismissValidationIssue: (issueKey: string) => void;
	revertIssueToOriginalParent: (issueKey: string) => boolean;
	clearValidationIssues: () => void;
	updateCanvasSettings: (patch: Partial<OrgAdjustmentTaskSettings>) => void;
	toggleCardSelection: (cardId: string) => void;
	clearCardSelection: () => void;
	expandNode: (nodeId: string) => void;
	toggleNodeDisable: (nodeId: string) => void;
	batchSetNodeDisable: (rootNodeId: string, disabled: boolean) => void;
	setNodeEffective: (nodeId: string, effective: boolean) => void;
	batchSetNodeEffective: (nodeIds: string[], effective: boolean) => void;
	batchSetCardSelection: (rootNodeId: string, selected: boolean) => void;
	moveNode: (sourceId: string, targetId: string) => void;
	batchMoveNodes: (moves: BatchMovePayload[]) => boolean;
	mergeNodes: (payload: MergeOrganizationPayload) => boolean;
	splitNodes: (payload: SplitOrganizationPayload) => boolean;
	undoLastOperation: () => FocusTarget | null;
	updateOrgListFields: (updates: Map<string, Partial<OrgAdjustmentTaskOrgItem>>) => void;
}

export type AdjustmentCanvasContextType = AdjustmentCanvasState & AdjustmentCanvasActions;

export type CompareFieldPropertyKey =
	| "saturatedRevenue"
	| "targetRevenue"
	| "targetProfit"
	| "employeeNum"
	| "childNodeNum"
	| "projectNum"
	| "planDeliveryProjectNum"
	| "expandDeliveryProjectNum";
