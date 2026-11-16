import type { DeploySolutionMatrixRow } from "#src/api/org-brain/deployment";
import type { GraphData } from "@antv/g6";
import type { DeploymentNodeData } from "./types";

const DEPLOYMENT_ROOT_ID = "deployment-root";

function resolveMatrixLineKey(row: DeploySolutionMatrixRow, index: number): string {
	return row.departmentLine?.trim() || row.jobCode || row.jobName || `row-${index}`;
}

export function findDeploymentRootNodeId(data: GraphData): string | null {
	const rootNode = data.nodes?.find(
		(node) => (node.data as DeploymentNodeData | undefined)?.kind === "root",
	);
	return rootNode?.id ?? DEPLOYMENT_ROOT_ID;
}

export function isSameDeploymentGraphData(prevData: GraphData, nextData: GraphData): boolean {
	return JSON.stringify(prevData) === JSON.stringify(nextData);
}

export function hasSameGraphStructure(prevData: GraphData, nextData: GraphData): boolean {
	return (
		(prevData.nodes?.length ?? 0) === (nextData.nodes?.length ?? 0) &&
		(prevData.edges?.length ?? 0) === (nextData.edges?.length ?? 0)
	);
}

/**
 * 构建排兵布阵 G6 图数据。
 * 节点 id 跨方案保持稳定，方案切换时仅更新 data 字段，避免整图销毁重建。
 */
export function buildDeploymentGraphData(params: {
	projectName: string;
	solutionNo: number;
	matrix: DeploySolutionMatrixRow[];
}): GraphData {
	const { projectName, solutionNo, matrix } = params;

	const lineCountMap = new Map<string, number>();
	matrix.forEach((row, index) => {
		const lineKey = resolveMatrixLineKey(row, index);
		lineCountMap.set(lineKey, (lineCountMap.get(lineKey) ?? 0) + row.staffCount);
	});

	const nodes: GraphData["nodes"] = [
		{
			id: DEPLOYMENT_ROOT_ID,
			data: {
				kind: "root",
				name: projectName,
			} satisfies DeploymentNodeData,
		},
	];
	const edges: GraphData["edges"] = [];
	const lineMap = new Map<string, string>();

	matrix.forEach((row, index) => {
		const lineKey = resolveMatrixLineKey(row, index);
		const lineId = lineMap.get(lineKey) ?? `line-${lineKey}`;
		if (!lineMap.has(lineKey)) {
			lineMap.set(lineKey, lineId);
			nodes.push({
				id: lineId,
				data: {
					kind: "line",
					name: row.departmentLine?.trim() || row.jobName || "未分组",
					lineCount: lineCountMap.get(lineKey),
				} satisfies DeploymentNodeData,
			});
			edges.push({ source: DEPLOYMENT_ROOT_ID, target: lineId });
		}

		const leafId = `leaf-${lineKey}-${row.positionCode || index}`;
		nodes.push({
			id: leafId,
			data: {
				kind: "leaf",
				name: row.positionName,
				departmentLine: row.departmentLine,
				positionCode: row.positionCode,
				positionName: row.positionName,
				positionLevel: row.positionLevel,
				staffCount: row.staffCount,
				staffConfigList: row.staffConfigList,
				solutionNo,
				rowIndex: index,
			} satisfies DeploymentNodeData,
		});
		edges.push({ source: lineId, target: leafId });
	});

	return { nodes, edges };
}
