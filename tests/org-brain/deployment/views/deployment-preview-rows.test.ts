import type {
	DeploymentPlanStaffPreviewDetailResponse,
	DeployPositionMatrixRow,
	DeploySolution,
} from "#src/api/org-brain/deployment";

import {
	buildDeploymentPreviewSnapshot,
	getActualMatrixRows,
	mapDeploymentPlanStaffPreviewDetailListToSchemePersonnelRows,
	parseDeploymentWorkExperienceString,
} from "#src/pages/org-brain/deployment/components/panel/views/deployment-preview-rows";

import { describe, expect, it } from "vitest";

const originProjectPositionMatrixList: DeployPositionMatrixRow[] = [
	{
		departmentLine: "项目业务支持岗",
		authorizedJobId: "122",
		authorizedJobName: "财务BP",
		jobCode: "565",
		jobName: "财务BP",
		positionCode: "4379",
		positionName: "财务BP专员",
		positionLevel: "2",
		budgetCount: 1,
	},
	{
		departmentLine: "安全",
		authorizedJobId: "115",
		authorizedJobName: "安全员",
		jobCode: "303",
		jobName: "安全",
		positionCode: "975",
		positionName: "安全员",
		positionLevel: "1",
		budgetCount: 5,
	},
	{
		departmentLine: "保洁",
		authorizedJobId: "112",
		authorizedJobName: "保洁",
		jobCode: "301",
		jobName: "保洁",
		positionCode: "985",
		positionName: "保洁员",
		positionLevel: "1",
		budgetCount: 8,
	},
	{
		departmentLine: "安全",
		authorizedJobId: "114",
		authorizedJobName: "安全班长",
		jobCode: "297",
		jobName: "安全管理",
		positionCode: "979",
		positionName: "安全班长",
		positionLevel: "2",
		budgetCount: 1,
	},
	{
		departmentLine: "安全",
		authorizedJobId: "116",
		authorizedJobName: "消监控员",
		jobCode: "303",
		jobName: "安全",
		positionCode: "976",
		positionName: "消监控员",
		positionLevel: "1",
		budgetCount: 3,
	},
	{
		departmentLine: "客服",
		authorizedJobId: "108",
		authorizedJobName: "客服管理",
		jobCode: "513",
		jobName: "客服主管（住宅）",
		positionCode: "3190",
		positionName: "客服主管",
		positionLevel: "3",
		budgetCount: 1,
	},
	{
		departmentLine: "项目管理",
		authorizedJobId: "100",
		authorizedJobName: "4岗项目管理",
		jobCode: "510",
		jobName: "项目管理（住宅）",
		positionCode: "3177",
		positionName: "项目经理",
		positionLevel: "4",
		budgetCount: 1,
	},
	{
		departmentLine: "工程",
		authorizedJobId: "106",
		authorizedJobName: "工程维修",
		jobCode: "300",
		jobName: "工程维修",
		positionCode: "1166",
		positionName: "综合维修技工",
		positionLevel: "2",
		budgetCount: 3,
	},
];

describe("deployment preview rows", () => {
	it("计算实际矩阵差异时使用 requiredCount - budgetCount", () => {
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
				requiredCount: 3,
				budgetCount: 1,
			},
			{
				departmentLine: "工程",
				jobName: "工程",
				positionName: "工程技工",
				positionLevel: "二星",
				budgetCount: 2,
			},
		];

		expect(getActualMatrixRows(matrix).map((row) => row._diff)).toEqual([2, -2]);
	});

	it("解析内部工作经历时按生效日期倒序展示，并以前一段开始日期作为结束日期", () => {
		const rows = parseDeploymentWorkExperienceString(
			"张三:2020-01-01:D001:客服一部:DP001:客服组:客户服务中心:客服管家;张三:2022-06-01:D002:客服二部:DP002:客服组:客户服务中心:客服主管",
		);

		expect(rows.map((row) => row.period)).toEqual([
			"2022-06-01至今",
			"2020-01-01 至 2022-06-01",
		]);
		expect(rows[0]?.orgName).toBe("客服二部");
		expect(rows[0]?.postName).toBe("客服主管");
	});

	it("按 origin 矩阵补齐未配置岗位，人数为 0 且差异为负编制人数", () => {
		const matrixConfig: DeployPositionMatrixRow[] = [
			{
				departmentLine: "项目管理",
				authorizedJobId: "100",
				authorizedJobName: "4岗项目管理",
				jobCode: "510",
				jobName: "项目管理（住宅）",
				positionCode: "3177",
				positionName: "项目经理",
				positionLevel: "4",
				budgetCount: 1,
			},
		];
		const selectedSolution: DeploySolution = {
			solutionNo: 2,
			matchScore: 100,
			staffCost: 0,
			choice: true,
			staffMatrixList: [
				{
					departmentLine: "项目管理",
					authorizedJobId: "100",
					authorizedJobName: "4岗项目管理",
					jobCode: "510",
					jobName: "项目管理（住宅）",
					positionCode: "3177",
					positionName: "项目经理",
					positionLevel: "4",
					staffCount: 1,
					staffConfigList: [],
				},
			],
		};

		const previewSnapshot = buildDeploymentPreviewSnapshot({
			matrixConfig,
			originMatrixList: originProjectPositionMatrixList,
			selectedSolution,
		});

		expect(previewSnapshot.matrixConfigRows).toHaveLength(1);
		expect(previewSnapshot.actualMatrixRows).toHaveLength(8);
		expect(previewSnapshot.actualMatrixRows[0]).toMatchObject({
			departmentLine: "项目管理",
			requiredCount: 1,
			budgetCount: 1,
			_diff: 0,
		});
		expect(previewSnapshot.actualMatrixRows.slice(1).map((row) => row.requiredCount)).toEqual([
			0, 0, 0, 0, 0, 0, 0,
		]);
		expect(previewSnapshot.actualMatrixRows.slice(1).map((row) => row._diff)).toEqual([
			-1, -5, -8, -1, -3, -1, -3,
		]);
	});

	it("预览人员行按同岗位维度统计人数", () => {
		const staffList: DeploymentPlanStaffPreviewDetailResponse[] = [
			{
				departmentLine: "客服",
				jobCode: "J001",
				jobName: "客服",
				positionCode: "P001",
				positionName: "客服管家",
				positionLevel: "一星",
				empCode: "E001",
				empName: "张三",
				cyear: "3",
				age: 28,
			},
			{
				departmentLine: "客服",
				jobCode: "J001",
				jobName: "客服",
				positionCode: "P001",
				positionName: "客服管家",
				positionLevel: "一星",
				empCode: "E002",
				empName: "李四",
				cyear: "5",
				age: 30,
			},
		];

		const rows = mapDeploymentPlanStaffPreviewDetailListToSchemePersonnelRows(staffList);

		expect(rows).toHaveLength(2);
		expect(rows.map((row) => row.staffCount)).toEqual([2, 2]);
		expect(rows.map((row) => row.empName)).toEqual(["张三", "李四"]);
	});
});
