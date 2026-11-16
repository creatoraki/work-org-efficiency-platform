import { describe, expect, it } from "vitest";
import { getPersonnelArchiveTagDisplayName } from "./tag-display";

/**
 * 人员档案标签展示规则单测。
 *
 * 验证接口返回人员实际标签值后，布尔值与普通值使用正确的展示文案。
 *
 * @author 王善能
 * @since 2026-07-13
 */
describe("getPersonnelArchiveTagDisplayName", () => {
	it.each(["是", "否", " 是 "])("实际值为 %s 时展示标签名称", (tagValue) => {
		expect(
			getPersonnelArchiveTagDisplayName({
				tagName: "高潜人才",
				tagValue,
			}),
		).toBe("高潜人才");
	});

	it("普通实际值优先展示标签值", () => {
		expect(
			getPersonnelArchiveTagDisplayName({
				tagName: "人才等级",
				tagValue: "A级",
			}),
		).toBe("A级");
	});

	it("候选值集合不再按人员布尔值处理", () => {
		expect(
			getPersonnelArchiveTagDisplayName({
				tagName: "高潜人才",
				tagValue: "是,否",
			}),
		).toBe("是,否");
	});
});
