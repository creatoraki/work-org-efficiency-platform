import type { DeploymentPersistContext } from "./deployment-persist-payload";

import { describe, expect, it } from "vitest";
import { buildDeploymentSavePayload } from "./deployment-persist-payload";

describe("buildDeploymentSavePayload", () => {
	it("暂存时透传标杆项目 ID", () => {
		const context: DeploymentPersistContext = {
			matrix: [],
			solutions: [],
			requestId: "1001",
			benchmarkProjectId: "2001",
		};

		expect(buildDeploymentSavePayload("3001", context)).toMatchObject({
			projectId: 3001,
			benchmarkProjectId: 2001,
			requestId: 1001,
		});
	});
});
