import type { DeploymentDetail, DeployPositionMatrixRow } from "#src/api/org-brain/deployment";

import {
	buildDeploymentPersistDebugPayloads,
	buildDeploymentSavePayload,
	resolveDeploymentPersistContext,
} from "#src/pages/org-brain/deployment/components/panel/views/deployment-persist-payload";

import { describe, expect, it } from "vitest";

const matrixFromDetail: DeployPositionMatrixRow[] = [
	{
		rowKey: "detail-row",
		departmentLine: "客服",
		authorizedJobId: "A001",
		authorizedJobName: "客服编制",
		jobCode: "J001",
		jobName: "客服",
		positionCode: "P001",
		positionName: "客服管家",
		positionLevel: "一星",
		tagMatchModelId: 100,
		tagMatchModelName: "客服模型",
		requiredCount: 2,
	},
];

const selectedSolutionStaff = {
	projectId: 1,
	requestId: 20,
	solutionNo: 2,
	departmentLine: "客服",
	jobCode: "J001",
	jobName: "客服",
	positionCode: "P001",
	positionName: "客服管家",
	positionLevel: "一星",
	empCode: "E001",
	empName: "张三",
	cyear: "3",
	education: "本科",
	graduationSchool: "测试大学",
	workExperience: "",
	checked: "1",
};

const detail: DeploymentDetail = {
	id: "detail-1",
	requestId: "20",
	projectCode: "P001",
	projectName: "测试项目",
	projectInfo: {
		city: "杭州",
		planDeliveryDate: "2026-06-15",
		deliveryArea: 1000,
		projectTypeCode: "1",
		propertyTypeName: "住宅",
	},
	projectPositionMatrixList: matrixFromDetail,
	solutions: [
		{
			solutionNo: 1,
			matchScore: 80,
			staffCost: 0,
			choice: false,
			staffMatrixList: [],
		},
		{
			solutionNo: 2,
			matchScore: 91.5,
			staffCost: 0,
			choice: true,
			staffMatrixList: [
				{
					departmentLine: "客服",
					authorizedJobId: "A001",
					authorizedJobName: "客服编制",
					jobCode: "J001",
					jobName: "客服",
					positionCode: "P001",
					positionName: "客服管家",
					positionLevel: "一星",
					staffCount: 1,
					staffConfigList: [selectedSolutionStaff],
				},
			],
		},
	],
};

describe("deployment persist payload", () => {
	it("本地矩阵为空时，暂存上下文回退使用详情矩阵", () => {
		const context = resolveDeploymentPersistContext([], detail);

		expect(context.matrix).toBe(matrixFromDetail);
		expect(context.requestId).toBe("20");
		expect(context.selectedSolution?.solutionNo).toBe(2);
	});

	it("暂存 payload 带上当前选中方案质量分和人员配置", () => {
		const context = resolveDeploymentPersistContext([], detail);
		const payload = buildDeploymentSavePayload(
			"1001",
			context,
			context.selectedSolution?.solutionNo,
		);

		expect(payload.matchScore).toBe(91.5);
		expect(payload.solutionNo).toBe(2);
		expect(payload.staffConfigSaveForm?.staffConfig2).toEqual(["E001"]);
		expect(payload.positionMatrixList).toHaveLength(1);
	});

	it("调试 payload 未选方案时不构建 commit 请求体", () => {
		const debugPayloads = buildDeploymentPersistDebugPayloads("1001", [], {
			...detail,
			solutions: detail.solutions?.map((solution) => ({ ...solution, choice: false })),
		});

		expect(debugPayloads.stash.matchScore).toBeUndefined();
		expect(debugPayloads.commit).toBeNull();
	});
});
