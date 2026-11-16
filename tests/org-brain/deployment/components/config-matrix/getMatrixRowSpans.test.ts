import type { DeployPositionMatrixRow } from "#src/api/org-brain/deployment";

import { groupMatrixRowsForMerge } from "#src/pages/org-brain/deployment/components/panel/config-matrix/getMatrixRowSpans";
import { describe, expect, it } from "vitest";

// 构造最小可用的矩阵行，requiredCount 等无关字段留空即可
function buildRow(
	rowKey: string,
	departmentLine: string,
	authorizedJobName?: string,
): DeployPositionMatrixRow {
	return {
		rowKey,
		departmentLine,
		authorizedJobName,
		jobName: "",
		positionName: "",
		positionLevel: "",
	};
}

describe("groupMatrixRowsForMerge", () => {
	it("将同一条线、编制的分散行拉到一起并保持组内相对顺序", () => {
		const rows = [
			buildRow("r1", "条线A", "项目经理"),
			buildRow("r2", "条线B", "开发"),
			buildRow("r3", "条线B", "测试"),
			buildRow("r4", "条线C", "产品"),
			buildRow("r5", "条线A", "开发"),
			buildRow("r6", "条线C", "运营"),
			buildRow("r7", "条线B", "测试"),
			buildRow("r8", "条线D", "分析"),
			buildRow("r9", "条线A", "项目经理"),
		];

		const grouped = groupMatrixRowsForMerge(rows);

		expect(grouped.map((row) => row.rowKey)).toEqual([
			"r1",
			"r9",
			"r2",
			"r3",
			"r7",
			"r4",
			"r5",
			"r6",
			"r8",
		]);
	});

	it("组间顺序按每组首个成员的原始出现位置决定", () => {
		const rows = [
			buildRow("r1", "条线B", "开发"),
			buildRow("r2", "条线A", "项目经理"),
			buildRow("r3", "条线B", "开发"),
		];

		const grouped = groupMatrixRowsForMerge(rows);

		expect(grouped.map((row) => row.rowKey)).toEqual(["r1", "r3", "r2"]);
	});

	it("已连续排列的数据保持幂等，不改变顺序", () => {
		const rows = [
			buildRow("r1", "条线A", "项目经理"),
			buildRow("r2", "条线A", "项目经理"),
			buildRow("r3", "条线B", "开发"),
		];

		expect(groupMatrixRowsForMerge(rows).map((row) => row.rowKey)).toEqual(["r1", "r2", "r3"]);
	});

	it("authorizedJobName 为空与非空视为不同分组，不会互相合并", () => {
		const rows = [
			buildRow("r1", "条线A", undefined),
			buildRow("r2", "条线A", "项目经理"),
			buildRow("r3", "条线A", undefined),
		];

		const grouped = groupMatrixRowsForMerge(rows);

		expect(grouped.map((row) => row.rowKey)).toEqual(["r1", "r3", "r2"]);
	});

	it("空数组输入返回空数组", () => {
		expect(groupMatrixRowsForMerge([])).toEqual([]);
	});
});
