import { describe, expect, it } from "vitest";

import { formatOrganizationPath } from "./organization-path";

/**
 * 人员档案组织路径格式化规则单测。
 *
 * @author 王善能
 * @since 2026-07-15
 */
describe("formatOrganizationPath", () => {
	it("按英文逗号切分并使用大于号连接", () => {
		expect(
			formatOrganizationPath(
				"杭州区域公司,杭东地区,滨江项目群,浙江.杭州.杭州物联网产业园服务中心",
			),
		).toBe("杭州区域公司>杭东地区>滨江项目群>浙江.杭州.杭州物联网产业园服务中心");
	});

	it("去除层级两侧空格并过滤空层级", () => {
		expect(formatOrganizationPath("杭州区域公司, 杭东地区, ,滨江项目群")).toBe(
			"杭州区域公司>杭东地区>滨江项目群",
		);
	});

	it.each([undefined, "", " , "])("无有效组织路径时返回占位符", (organizationPath) => {
		expect(formatOrganizationPath(organizationPath)).toBe("/");
	});
});
