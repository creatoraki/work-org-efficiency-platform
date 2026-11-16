import type { DeploymentDetail } from "#src/api/org-brain/deployment";

import { buildDeploymentDetailMatrixHydrationKey } from "#src/pages/org-brain/deployment/components/panel/views/deployment-detail-hydration";

import { describe, expect, it } from "vitest";

const baseDetail: DeploymentDetail = {
	id: "detail-1",
	projectCode: "P001",
	projectName: "测试项目",
	projectInfo: {
		city: "杭州",
		planDeliveryDate: "2026-06-15",
		deliveryArea: 1000,
		projectTypeCode: "1",
		propertyTypeName: "住宅",
	},
	projectPositionMatrixList: [
		{
			rowKey: "row-1",
			departmentLine: "客服",
			authorizedJobId: "A001",
			authorizedJobName: "客服编制",
			jobCode: "J001",
			jobName: "客服",
			positionCode: "P001",
			positionName: "客服管家",
			positionLevel: "一星",
			tagMatchModelId: 100,
			requiredCount: 2,
			budgetCount: 1,
		},
	],
};

describe("buildDeploymentDetailMatrixHydrationKey", () => {
	it("详情从空到有数据时生成稳定的矩阵灌入 key", () => {
		const emptyKey = buildDeploymentDetailMatrixHydrationKey("project-1", null);
		const detailKey = buildDeploymentDetailMatrixHydrationKey("project-1", baseDetail);

		expect(emptyKey).not.toBe(detailKey);
		expect(buildDeploymentDetailMatrixHydrationKey("project-1", baseDetail)).toBe(detailKey);
	});

	it("切换项目或矩阵关键字段变化时触发重新灌入", () => {
		const originKey = buildDeploymentDetailMatrixHydrationKey("project-1", baseDetail);
		const projectChangedKey = buildDeploymentDetailMatrixHydrationKey("project-2", baseDetail);
		const matrixChangedKey = buildDeploymentDetailMatrixHydrationKey("project-1", {
			...baseDetail,
			projectPositionMatrixList: [
				{
					...baseDetail.projectPositionMatrixList[0]!,
					requiredCount: 3,
				},
			],
		});

		expect(projectChangedKey).not.toBe(originKey);
		expect(matrixChangedKey).not.toBe(originKey);
	});
});
