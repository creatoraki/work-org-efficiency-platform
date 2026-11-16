/**
 * 调整画布模块类型定义
 */

import type { EdgeData, Graph, GraphData, NodeData } from "@antv/g6";

export interface OrgNodeDisplayField {
	key: string;
	label: string;
	value: string;
	diffText?: string;
}

export type AdjustmentOperationType = "merge" | "split" | "move";

export type OrgNodeBatchAction =
	| "batch-enable"
	| "batch-disable"
	| "batch-select-children"
	| "batch-unselect-children";

export type MergeChildTransferMode = "all" | "partial";

export type SplitTargetMode = "existing" | "precreate";

export interface MergeOrganizationPayload {
	mergeOrgIds: string[];
	mergedOrgId: string;
	mergedOrgName: string;
	stoppedOrgIds: string[];
	childTransferMode: MergeChildTransferMode;
	partialChildOrgIds: string[];
}

export interface SplitTargetConfig {
	key: string;
	mode: SplitTargetMode;
	existingOrgId?: string;
	orgName: string;
	parentOrgId?: string;
	childOrgIds: string[];
	virtual?: boolean;
	orgLevel?: string;
	preEstablishTime?: string | null;
}

export interface SplitOrganizationPayload {
	sourceOrgId: string;
	targets: SplitTargetConfig[];
	stoppedOrgIds?: string[];
}

/**
 * 组织节点数据
 */
export interface OrgNode extends NodeData {
	id: string;
	name: string;
	newOrg?: boolean;
	projOrgStatus?: string;
	type: "department" | "position" | "person";
	parentId?: string;
	level: number;
	readOnly?: boolean;
	disable?: boolean;
	effective?: boolean;
	isStopped?: boolean;
	displayFields?: OrgNodeDisplayField[];
	isChanged?: boolean;
	childrenModified?: boolean;
	changeHighlightColor?: string;
	nodeHeight?: number;
	nodeWidth?: number;
	hiddenChildCount?: number;
	canExpandChildren?: boolean;
	employeeCount?: number;
	status: "active" | "inactive" | "stopped" | "pending";
	properties?: Record<string, any>;
}

/**
 * 组织关系边数据
 */
export interface OrgEdge extends EdgeData {
	id: string;
	source: string;
	target: string;
	type: "hierarchy" | "report" | "collaborate" | "orth-edge";
	label?: string;
	properties?: Record<string, any>;
}

/**
 * 画布数据
 */
export interface CanvasData extends GraphData {
	nodes: OrgNode[];
	edges: OrgEdge[];
}

/**
 * 组织调整任务详情中的画布配置结构。
 */
export interface AdjustmentCanvasSettings {
	nodes?: Array<Record<string, any>>;
	edges?: Array<Record<string, any>>;
}

/**
 * 画布实例引用
 */
export interface CanvasRef {
	graph: Graph | null;
	zoomIn: () => void;
	zoomOut: () => void;
	zoomFit: () => void;
	zoomReset: () => void;
	focusNode: (nodeId: string) => void;
	changeLayout: (layout: string) => void;
	exportImage: () => void;
	exportData: () => void;
	toggleFullscreen: () => void;
	toggleMinimap: () => void;
	setDragMode: (enabled: boolean) => void;
}

export interface AdjustmentValidationIssue {
	key: string;
	orgId: string;
	code: string;
	orgName: string;
	/** 任务建立时该节点的父组织 id；若不存在则该条无法自动处理 */
	originalParentOrgId?: string;
	/** 任务建立时该节点的父组织名称 */
	originalParentOrgName?: string;
	message: string;
}
