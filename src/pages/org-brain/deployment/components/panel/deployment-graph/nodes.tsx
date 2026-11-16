import type { NodeData, NodeOptions } from "@antv/g6";
import type { DeploymentNodeData } from "./types";
import {
	DEPLOYMENT_TREE_NODE,
	registerDeploymentTreeNode,
	resolveDeploymentNodeSize,
} from "./deployment-tree-node";

/** G6 节点交互回调通过 ref 注入，避免写入 node.data 触发整图重渲染 */
export const deploymentGraphHandlersRef: {
	onLeafUpdate?: DeploymentNodeData["onLeafUpdate"];
	onOpenCandidateDrawer?: DeploymentNodeData["onOpenCandidateDrawer"];
} = {};

export function ensureDeploymentG6Extensions() {
	registerDeploymentTreeNode();
}

export function buildDeploymentNodeConfig(): NodeOptions {
	return {
		type: DEPLOYMENT_TREE_NODE,
		style: (datum: NodeData) => {
			const nodeData = (datum.data ?? {}) as unknown as DeploymentNodeData;
			return {
				size: resolveDeploymentNodeSize(nodeData),
				icon: false,
				badge: false,
				halo: false,
				cursor: nodeData.kind === "leaf" ? "pointer" : "default",
				ports: [{ placement: "top" as const }, { placement: "bottom" as const }],
			};
		},
	};
}
