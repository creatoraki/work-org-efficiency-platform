import { fetchDeploymentPositionMatrix } from "#src/api/org-brain/deployment";

import { request } from "#src/utils/axios-request";

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("#src/utils/axios-request", () => ({
	request: {
		get: vi.fn(),
		post: vi.fn(),
		put: vi.fn(),
	},
}));

describe("deployment api", () => {
	beforeEach(() => {
		vi.mocked(request.get).mockReset();
	});

	it("岗位矩阵详情保留后端返回的项目级质量分", async () => {
		vi.mocked(request.get).mockResolvedValue({
			id: 1001,
			projectCode: "P001",
			projectName: "测试项目",
			city: "杭州",
			planDeliveryDate: "2026-06-15",
			deliveryArea: 1000,
			projectTypeName: "住宅",
			propertyTypeName: "住宅",
			matchScore: 91.5,
			projectPositionMatrixList: [],
		});

		const detail = await fetchDeploymentPositionMatrix("1001");

		expect(request.get).toHaveBeenCalledWith("deploy/position/matrix/1001");
		expect(detail?.projectInfo.matchScore).toBe(91.5);
	});
});
