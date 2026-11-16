import type {
	DeploymentPlanStaffConfigItem,
	DeploymentStaffTreeNode,
	DeployPositionMatrixRow,
	DeploySolution,
} from "#src/api/org-brain/deployment/types";
import {
	applySolutionStaffMatrix,
	buildAiStaffRequestItems,
	buildDeploymentPersistPayload,
	buildSolutionsFromStaffTree,
} from "#src/api/org-brain/deployment/transforms";
import { describe, expect, it } from "vitest";

const matrix: DeployPositionMatrixRow[] = [
	{
		departmentLine: "客服",
		authorizedJobId: "A001",
		authorizedJobName: "客服编制",
		jobCode: "J001",
		jobName: "客服",
		positionCode: "P001",
		positionName: "客服管家",
		positionLevel: "一星",
		tagMatchModelId: 1,
		tagMatchModelName: "客服模型",
		requiredCount: 1,
	},
];

const solutions: DeploySolution[] = [
	{
		solutionNo: 1,
		matchScore: 81.25,
		staffCost: 0,
		choice: false,
		staffMatrixList: [],
	},
	{
		solutionNo: 2,
		matchScore: 92.5,
		staffCost: 0,
		choice: true,
		staffMatrixList: [],
	},
];

describe("buildDeploymentPersistPayload", () => {
	it("提交指定方案时在保存/提交 payload 顶层带上质量分", () => {
		const payload = buildDeploymentPersistPayload("1001", "2001", matrix, solutions, 1);

		expect(payload.matchScore).toBe(81.25);
	});

	it("未显式传 solutionNo 时回退使用当前选中方案质量分", () => {
		const payload = buildDeploymentPersistPayload("1001", "2001", matrix, solutions);

		expect(payload.matchScore).toBe(92.5);
	});

	it("未选择方案时不向保存接口提交质量分", () => {
		const payload = buildDeploymentPersistPayload(
			"1001",
			"2001",
			matrix,
			solutions.map((solution) => ({ ...solution, choice: false })),
		);

		expect(payload.solutionNo).toBeUndefined();
		expect(payload.matchScore).toBeUndefined();
	});
});

describe("buildAiStaffRequestItems", () => {
	it("组装 AI 排兵请求时保留岗位、职位、模型和人数", () => {
		expect(buildAiStaffRequestItems(matrix)).toEqual([
			{
				jobCode: "J001",
				positionCode: "P001",
				tagMatchModelId: 1,
				requiredCount: 1,
			},
		]);
	});
});

describe("buildSolutionsFromStaffTree", () => {
	const staffConfig1: DeploymentPlanStaffConfigItem = {
		departmentLine: "客服",
		jobCode: "J001",
		jobName: "客服",
		positionCode: "P001",
		positionName: "客服管家",
		positionLevel: "一星",
		empCode: "E001",
		empName: "张三",
		staffCost: 100,
	};
	const staffConfig2: DeploymentPlanStaffConfigItem = {
		...staffConfig1,
		empCode: "E002",
		empName: "李四",
		staffCost: 150,
	};
	const staffTree: DeploymentStaffTreeNode = {
		id: "root",
		name: "项目",
		children: [
			{
				id: "leaf",
				name: "客服管家",
				extra: {
					staffConfigs1: [staffConfig1],
					staffConfigs2: [staffConfig2],
				},
			},
		],
	};

	it("按方案号聚合人员树，并回填岗位矩阵元数据", () => {
		const result = buildSolutionsFromStaffTree(matrix, staffTree);

		expect(result).toHaveLength(2);
		expect(result[0]).toMatchObject({
			solutionNo: 1,
			staffCost: 100,
			choice: false,
		});
		expect(result[1]).toMatchObject({
			solutionNo: 2,
			staffCost: 150,
			choice: false,
		});
		expect(result[0]?.staffMatrixList[0]).toMatchObject({
			departmentLine: "客服",
			authorizedJobId: "A001",
			authorizedJobName: "客服编制",
			staffCount: 1,
		});
	});

	it("推送结果带 checked=1 时自动选中对应方案", () => {
		const checkedStaffTree: DeploymentStaffTreeNode = {
			id: "root",
			name: "项目",
			children: [
				{
					id: "leaf",
					name: "客服管家",
					extra: {
						staffConfigs1: [staffConfig1],
						staffConfigs2: [{ ...staffConfig2, checked: "1" }],
					},
				},
			],
		};

		const result = buildSolutionsFromStaffTree(matrix, checkedStaffTree);

		expect(result.find((solution) => solution.solutionNo === 1)?.choice).toBe(false);
		expect(result.find((solution) => solution.solutionNo === 2)?.choice).toBe(true);
	});

	it("人员替换后同步更新方案矩阵和质量分", () => {
		const [solution] = buildSolutionsFromStaffTree(matrix, staffTree);
		const nextSolution = applySolutionStaffMatrix(solution!, [
			{
				...solution!.staffMatrixList[0]!,
				staffConfigList: [staffConfig1, staffConfig2],
			},
		]);

		expect(nextSolution.staffMatrixList[0]?.staffConfigList).toHaveLength(2);
		expect(nextSolution.matchScore).toEqual(expect.any(Number));
	});
});
