import type { DeploySolutionMatrixRow } from "#src/api/org-brain/deployment";

import type { DeploymentNodeData } from "#src/pages/org-brain/deployment/components/panel/deployment-graph/types";

import {
	buildDeploymentGraphData,
	findDeploymentRootNodeId,
} from "#src/pages/org-brain/deployment/components/panel/deployment-graph/graph-data";
import { describe, expect, it } from "vitest";

const matrix: DeploySolutionMatrixRow[] = [
	{
		departmentLine: "客服",
		authorizedJobId: "A001",
		authorizedJobName: "客服编制",
		jobCode: "J001",
		jobName: "客服",
		positionCode: "P001",
		positionName: "客服管家",
		positionLevel: "一星",
		staffCount: 2,
		staffConfigList: [],
	},
	{
		departmentLine: "客服",
		authorizedJobId: "A001",
		authorizedJobName: "客服编制",
		jobCode: "J002",
		jobName: "客服主管",
		positionCode: "P002",
		positionName: "客服主管",
		positionLevel: "二星",
		staffCount: 1,
		staffConfigList: [],
	},
];

describe("buildDeploymentGraphData", () => {
	it("按项目、条线、岗位构建图谱，并汇总条线人数", () => {
		const graphData = buildDeploymentGraphData({
			projectName: "测试项目",
			solutionNo: 2,
			matrix,
		});

		expect(findDeploymentRootNodeId(graphData)).toBe("deployment-root");
		expect(graphData.nodes).toHaveLength(4);
		expect(graphData.edges).toHaveLength(3);

		const lineNode = graphData.nodes?.find((node) => node.id === "line-客服");
		const lineData = lineNode?.data as DeploymentNodeData | undefined;
		expect(lineData?.kind).toBe("line");
		expect(lineData?.lineCount).toBe(3);

		const leafNode = graphData.nodes?.find((node) => node.id === "leaf-客服-P002");
		const leafData = leafNode?.data as DeploymentNodeData | undefined;
		expect(leafData).toMatchObject({
			kind: "leaf",
			solutionNo: 2,
			rowIndex: 1,
			positionName: "客服主管",
		});
	});
});
