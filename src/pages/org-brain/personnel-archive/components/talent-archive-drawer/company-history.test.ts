import type { TalentArchiveCompanyHistoryItem } from "#src/api/org-brain/personnel-archive";
import { describe, expect, it } from "vitest";

import {
	getCompanyHistoryDepartment,
	getCompanyHistoryJob,
	getCompanyHistoryPosition,
	getCompanyHistoryPrimaryDepartment,
	getCompanyHistoryTransferDepartment,
	getCompanyHistoryTypeLabel,
} from "./company-history";

/**
 * 创建公司经历测试数据。
 *
 * @param overrides - 需要覆盖的经历字段。
 * @returns 满足接口约束的公司经历项。
 *
 * @author 王善能
 * @since 2026-07-17
 */
function createCompanyHistoryItem(
	overrides: Partial<TalentArchiveCompanyHistoryItem> = {},
): TalentArchiveCompanyHistoryItem {
	return {
		beginDate: "2025-01-01",
		type: "TRANSFER",
		...overrides,
	};
}

describe("company-history", () => {
	it("优先使用接口返回的经历类型文案", () => {
		expect(
			getCompanyHistoryTypeLabel(createCompanyHistoryItem({ typeLabel: "内部调动" })),
		).toBe("内部调动");
		expect(getCompanyHistoryTypeLabel(createCompanyHistoryItem({ type: "CONCURRENT" }))).toBe(
			"兼岗",
		);
	});

	it("组合公司与部门并在无数据时返回占位符", () => {
		expect(
			getCompanyHistoryDepartment(
				createCompanyHistoryItem({ cityCompanyName: "杭州公司", deptName: "研发部" }),
			),
		).toBe("杭州公司 - 研发部");
		expect(getCompanyHistoryDepartment(createCompanyHistoryItem())).toBe("/");
	});

	it("主岗部门优先展示一级部门，缺失时回退到部门", () => {
		expect(
			getCompanyHistoryPrimaryDepartment(
				createCompanyHistoryItem({
					cityCompanyName: "杭州公司",
					firstDeptName: "技术中心",
					deptName: "研发部",
				}),
			),
		).toBe("杭州公司 - 技术中心");
		expect(
			getCompanyHistoryPrimaryDepartment(createCompanyHistoryItem({ deptName: "研发部" })),
		).toBe("研发部");
	});

	it("调岗部门仅在部门与一级部门不同时追加部门", () => {
		expect(
			getCompanyHistoryTransferDepartment(
				createCompanyHistoryItem({
					cityCompanyName: "杭州公司",
					firstDeptName: "技术中心",
					deptName: "研发部",
				}),
			),
		).toBe("杭州公司 - 技术中心 - 研发部");
		expect(
			getCompanyHistoryTransferDepartment(
				createCompanyHistoryItem({ firstDeptName: "研发部", deptName: "研发部" }),
			),
		).toBe("研发部");
	});

	it("格式化岗位、职位和职级并处理空值", () => {
		const item = createCompanyHistoryItem({
			jobName: "开发岗",
			postName: "工程师",
			postgradeName: "P6",
		});
		expect(getCompanyHistoryJob(item)).toBe("开发岗");
		expect(getCompanyHistoryPosition(item)).toBe("工程师-P6");
		expect(getCompanyHistoryJob(createCompanyHistoryItem())).toBe("/");
		expect(getCompanyHistoryPosition(createCompanyHistoryItem())).toBe("/");
	});
});
