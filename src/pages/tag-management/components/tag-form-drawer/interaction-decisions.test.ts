import { describe, expect, it } from "vitest";
import { TAG_TYPE } from "../../config";
import { FORM_MODE, RULE_SOURCE_VALUES } from "./constants";
import {
	getDrawerCloseCleanupDecision,
	getRuleSourceSwitchDecision,
	getTagTypeSwitchDecision,
} from "./interaction-decisions";

/**
 * 标签抽屉交互决策单测。
 *
 * 仅覆盖切换与关闭时的业务判断，不依赖 Drawer、Form 或 antd 渲染，
 * 用于稳定验证智能标签与复合规则的清理策略。
 *
 * @author 王善能
 * @since 2026-07-06
 */
describe("tag-form-drawer interaction decisions", () => {
	describe("getTagTypeSwitchDecision", () => {
		it("智能标签切换到其他类型时，存在 AI 结果应要求确认并删除智能标签结果", () => {
			const result = getTagTypeSwitchDecision({
				mode: FORM_MODE.ADD,
				currentTagType: TAG_TYPE.INTELLIGENT,
				nextTagType: TAG_TYPE.SYSTEM,
				currentRuleSelectionType: RULE_SOURCE_VALUES.FROM_LIBRARY,
				values: {},
				aliTagCode: "",
				hasAiTagTaskResult: true,
			});

			expect(result.shouldIgnore).toBe(false);
			expect(result.shouldConfirm).toBe(true);
			expect(result.shouldDeleteSmartTagResult).toBe(true);
			expect(result.shouldDeleteRuleMeta).toBe(false);
		});

		it("系统标签从复合规则切换类型时，新增态应删除复合规则中间产物", () => {
			const result = getTagTypeSwitchDecision({
				mode: FORM_MODE.ADD,
				currentTagType: TAG_TYPE.SYSTEM,
				nextTagType: TAG_TYPE.MANUAL,
				currentRuleSelectionType: RULE_SOURCE_VALUES.CUSTOM_RULE,
				values: {},
				aliTagCode: "ali-tag-001",
				hasAiTagTaskResult: false,
			});

			expect(result.shouldConfirm).toBe(true);
			expect(result.shouldDeleteRuleMeta).toBe(true);
			expect(result.shouldDeleteSmartTagResult).toBe(false);
		});

		it("系统标签从规则库切换类型时，不应误删复合规则中间产物", () => {
			const result = getTagTypeSwitchDecision({
				mode: FORM_MODE.ADD,
				currentTagType: TAG_TYPE.SYSTEM,
				nextTagType: TAG_TYPE.MANUAL,
				currentRuleSelectionType: RULE_SOURCE_VALUES.FROM_LIBRARY,
				values: {},
				aliTagCode: "ali-tag-001",
				hasAiTagTaskResult: false,
			});

			expect(result.shouldDeleteRuleMeta).toBe(false);
		});

		it("编辑态即使存在 aliTagCode，也不应在标签类型切换时触发复合规则删除", () => {
			const result = getTagTypeSwitchDecision({
				mode: FORM_MODE.EDIT,
				currentTagType: TAG_TYPE.SYSTEM,
				nextTagType: TAG_TYPE.INTELLIGENT,
				currentRuleSelectionType: RULE_SOURCE_VALUES.CUSTOM_RULE,
				values: {},
				aliTagCode: "ali-tag-001",
				hasAiTagTaskResult: false,
			});

			expect(result.shouldDeleteRuleMeta).toBe(false);
		});

		it("首次切换且没有填写内容时，可以直接切换", () => {
			const result = getTagTypeSwitchDecision({
				mode: FORM_MODE.ADD,
				currentTagType: TAG_TYPE.MANUAL,
				nextTagType: TAG_TYPE.SYSTEM,
				currentRuleSelectionType: RULE_SOURCE_VALUES.FROM_LIBRARY,
				values: {},
				aliTagCode: "",
				hasAiTagTaskResult: false,
			});

			expect(result.shouldConfirm).toBe(false);
			expect(result.shouldDeleteRuleMeta).toBe(false);
			expect(result.shouldDeleteSmartTagResult).toBe(false);
		});
	});

	describe("getRuleSourceSwitchDecision", () => {
		it("从规则库切到复合规则时，即使表单为空也应二次确认", () => {
			const result = getRuleSourceSwitchDecision({
				currentRuleSelectionType: RULE_SOURCE_VALUES.FROM_LIBRARY,
				nextRuleSelectionType: RULE_SOURCE_VALUES.CUSTOM_RULE,
				values: {},
				aliTagCode: "",
			});

			expect(result.shouldConfirm).toBe(true);
			expect(result.shouldDeleteRuleMeta).toBe(false);
		});

		it("从复合规则切回规则库时，应删除复合规则中间产物并要求确认", () => {
			const result = getRuleSourceSwitchDecision({
				currentRuleSelectionType: RULE_SOURCE_VALUES.CUSTOM_RULE,
				nextRuleSelectionType: RULE_SOURCE_VALUES.FROM_LIBRARY,
				values: {
					tagName: "高潜人才",
				},
				aliTagCode: "ali-tag-001",
			});

			expect(result.shouldConfirm).toBe(true);
			expect(result.shouldDeleteRuleMeta).toBe(true);
		});

		it("从规则库切到规则库时，应直接忽略", () => {
			const result = getRuleSourceSwitchDecision({
				currentRuleSelectionType: RULE_SOURCE_VALUES.FROM_LIBRARY,
				nextRuleSelectionType: RULE_SOURCE_VALUES.FROM_LIBRARY,
				values: {
					tagName: "高潜人才",
				},
				aliTagCode: "",
			});

			expect(result.shouldIgnore).toBe(true);
			expect(result.shouldConfirm).toBe(false);
		});

		it("从规则库切换时只有普通内容但无复合规则产物，也应确认但不删除", () => {
			const result = getRuleSourceSwitchDecision({
				currentRuleSelectionType: RULE_SOURCE_VALUES.FROM_LIBRARY,
				nextRuleSelectionType: RULE_SOURCE_VALUES.CUSTOM_RULE,
				values: {
					tagName: "高潜人才",
					tagValue: "是",
				},
				aliTagCode: "",
			});

			expect(result.shouldConfirm).toBe(true);
			expect(result.shouldDeleteRuleMeta).toBe(false);
		});
	});

	describe("getDrawerCloseCleanupDecision", () => {
		it("新增态关闭智能标签抽屉时，只应删除智能标签结果", () => {
			const result = getDrawerCloseCleanupDecision({
				mode: FORM_MODE.ADD,
				currentTagType: TAG_TYPE.INTELLIGENT,
				currentRuleSelectionType: RULE_SOURCE_VALUES.FROM_LIBRARY,
				aliTagCode: "ali-tag-001",
				hasAiTagTaskResult: true,
			});

			expect(result.shouldDeleteSmartTagResult).toBe(true);
			expect(result.shouldDeleteRuleMeta).toBe(false);
		});

		it("新增态关闭系统标签复合规则抽屉时，只应删除复合规则中间产物", () => {
			const result = getDrawerCloseCleanupDecision({
				mode: FORM_MODE.ADD,
				currentTagType: TAG_TYPE.SYSTEM,
				currentRuleSelectionType: RULE_SOURCE_VALUES.CUSTOM_RULE,
				aliTagCode: "ali-tag-001",
				hasAiTagTaskResult: true,
			});

			expect(result.shouldDeleteRuleMeta).toBe(true);
			expect(result.shouldDeleteSmartTagResult).toBe(false);
		});

		it("编辑态关闭抽屉时，不应触发任何删除", () => {
			const result = getDrawerCloseCleanupDecision({
				mode: FORM_MODE.EDIT,
				currentTagType: TAG_TYPE.SYSTEM,
				currentRuleSelectionType: RULE_SOURCE_VALUES.CUSTOM_RULE,
				aliTagCode: "ali-tag-001",
				hasAiTagTaskResult: true,
			});

			expect(result.shouldDeleteRuleMeta).toBe(false);
			expect(result.shouldDeleteSmartTagResult).toBe(false);
		});
	});
});
