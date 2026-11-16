import { describe, expect, it } from "vitest";
import {
	buildAiTagFormFieldStatesForTab,
	buildAiTagFormValuesForTab,
} from "./use-ai-tag-tabs-form";

/**
 * AI 多标签切页表单快照单测。
 *
 * 重点防止提交时程序性切换 tab，把上一个 tab 未清空的审核人、
 * 维护人等字段残留到下一个 tab。
 *
 * @author 王善能
 * @since 2026-07-06
 */
describe("buildAiTagFormValuesForTab", () => {
	it("目标 tab 未填写的字段应显式清空，避免残留上一个 tab 的值", () => {
		const nextValues = buildAiTagFormValuesForTab({
			tempId: "tab-2",
			isExisting: false,
			values: {
				tagName: "高学历人才",
				tagValue: "是",
				tagDescription: "AI 识别员工是否属于高学历人才",
				businessCategory: ["1", "11"],
			},
			errors: {},
			dirty: false,
		});

		expect(nextValues.tagName).toBe("高学历人才");
		expect(nextValues.tagValue).toBe("是");
		expect(nextValues.auditor).toBeUndefined();
		expect(nextValues.maintainer).toBeUndefined();
		expect(nextValues.maintainerName).toBeUndefined();
		expect(nextValues.maintainerType).toBeUndefined();
	});

	it("无目标 tab 时应返回全量空快照", () => {
		const nextValues = buildAiTagFormValuesForTab();

		expect(nextValues.tagName).toBeUndefined();
		expect(nextValues.auditor).toBeUndefined();
		expect(nextValues.maintainer).toBeUndefined();
		expect(nextValues.isExisting).toBeUndefined();
	});

	it("报错 tab 的所有错误字段都应标记为 touched，保证组件展示完整错误文案", () => {
		const fieldStates = buildAiTagFormFieldStatesForTab({
			tempId: "tab-2",
			isExisting: false,
			values: {},
			errors: {
				existenceCycle: ["请选择到期时间"],
				auditor: ["请选择审核人"],
			},
			dirty: false,
		});

		const existenceCycleState = fieldStates.find((item) => item.name === "existenceCycle");
		const auditorState = fieldStates.find((item) => item.name === "auditor");
		const updateFrequencyState = fieldStates.find((item) => item.name === "updateFrequency");

		expect(existenceCycleState?.errors).toEqual(["请选择到期时间"]);
		expect(existenceCycleState?.touched).toBe(true);
		expect(auditorState?.errors).toEqual(["请选择审核人"]);
		expect(auditorState?.touched).toBe(true);
		expect(updateFrequencyState?.errors).toEqual([]);
		expect(updateFrequencyState?.touched).toBe(false);
	});
});
