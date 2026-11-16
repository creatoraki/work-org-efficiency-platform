import type { JobPositionTreeNode } from "#src/api/tag-management/rule-library";
import type { AiTagValidationContext } from "#src/pages/tag-management/components/tag-form-drawer/ai-tag-form-schema";
import type {
	AiTagTabState,
	TagCenterItem,
} from "#src/pages/tag-management/components/tag-form-drawer/types";
import { checkDuplicateName } from "#src/api/tag-management/tag-center";
import {
	toAiTagSubmitPayload,
	validateAiTagFormValues,
	validateAllAiTagTabs,
} from "#src/pages/tag-management/components/tag-form-drawer/ai-tag-form-schema";
import {
	getIntelligentTagDuplicateValidationMessage,
	INTELLIGENT_SINGLE_TAG_DUPLICATE_NAME_ERROR_MESSAGE,
	INTELLIGENT_TAG_DUPLICATE_NAME_ERROR_MESSAGE,
	validateIntelligentTagDuplicateNames,
} from "#src/pages/tag-management/components/tag-form-drawer/hooks";
import {
	buildAiTagDraftTabs,
	getAiTaskInstructionText,
	normalizeTagDraftValues,
} from "#src/pages/tag-management/components/tag-form-drawer/utils";
import { TAG_RULE_TYPE_DICT, TAG_TYPE } from "#src/pages/tag-management/config";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("#src/api/tag-management/tag-center", () => ({
	checkDuplicateName: vi.fn(),
}));

const jobPositionNodeMap = new Map<string, JobPositionTreeNode>([
	[
		"position-100",
		{
			id: "100",
			parentId: "0",
			parentLabel: "全部人员",
			label: "客服主管",
			postGrade: 1,
			postGradeName: "P1",
			type: "position",
		},
	],
]);

const context: AiTagValidationContext = {
	tagLibraryType: TAG_RULE_TYPE_DICT.TALENT,
	jobPositionNodeMap,
};
const mockCheckDuplicateName = vi.mocked(checkDuplicateName);

function buildValues(overrides: Partial<TagCenterItem> = {}): TagCenterItem {
	return {
		tagName: "安全意识",
		tagValue: "高",
		tagDescription: "AI 识别出的安全意识标签",
		aiSessionId: "session-001",
		aliTagCode: "hrbrain.tag.001",
		businessCategory: ["talent", "security"],
		isRequired: "1",
		sensitivityLevel: "2",
		existenceCycle: "2026-12-31",
		updateFrequency: "1",
		auditor: "auditor-001",
		maintainer: "maintainer-001",
		maintainerName: "维护人",
		maintainerType: "1",
		isDisplayInOrgBrain: true,
		tagVisibility: "1",
		useScope: ["position-100"],
		...overrides,
	};
}

function buildTab(
	tempId: string,
	overrides: Partial<AiTagTabState> = {},
	valueOverrides: Partial<TagCenterItem> = {},
): AiTagTabState {
	return {
		tempId,
		tagId: `${tempId}-tag-id`,
		existingTagId: overrides.isExisting ? `${tempId}-existing-id` : undefined,
		isExisting: false,
		values: buildValues(valueOverrides),
		errors: {},
		dirty: false,
		...overrides,
	};
}

describe("aI 智能标签表单 schema", () => {
	beforeEach(() => {
		mockCheckDuplicateName.mockReset();
		mockCheckDuplicateName.mockResolvedValue(false);
	});

	it("两个 tab 只填完整一个时，全量校验会拦截未完成 tab", () => {
		const tabs = [
			buildTab("tab-1"),
			buildTab("tab-2", {}, { auditor: undefined, existenceCycle: undefined }),
		];

		const validation = validateAllAiTagTabs(tabs, context);

		expect(validation.results[0]).toMatchObject({ tempId: "tab-1", valid: true, errors: {} });
		expect(validation.results[1]?.valid).toBe(false);
		expect(validation.firstInvalidTabId).toBe("tab-2");
		expect(["请选择到期时间", "请选择审核人"]).toContain(validation.firstError?.message);
		expect(Object.values(validation.results[1]?.errors || {})).toContainEqual(["请选择审核人"]);
	});

	it("所有 tab 必填项完整时，提交 payload 包含全部 tab 并保留后端元信息", () => {
		const tabs = [
			buildTab("tab-1", { tagId: "new-tag-code" }),
			buildTab("tab-2", {
				tagId: "existing-tag-code",
				existingTagId: "origin-tag-code",
				isExisting: true,
			}),
		];

		const validation = validateAllAiTagTabs(tabs, context);
		const payloads = tabs.map((tab) => toAiTagSubmitPayload(tab, context));

		expect(validation.results.every((result) => result.valid)).toBe(true);
		expect(payloads).toHaveLength(2);
		expect(payloads[0]).toMatchObject({
			tagType: TAG_TYPE.INTELLIGENT,
			type: TAG_RULE_TYPE_DICT.TALENT,
			businessCategory: "security",
			tagPositionList: [{ id: "100", type: "position" }],
		});
		expect(payloads[0]).not.toHaveProperty("useScope");
		expect(payloads[0]).not.toHaveProperty("tagId");
		expect(payloads[0]).not.toHaveProperty("existingTagId");
		expect(payloads[0]).not.toHaveProperty("isExisting");
	});

	it("当前 tab 修改后的最新值会参与校验与提交转换", () => {
		const tab = buildTab("tab-1", {}, { tagName: " 最新标签名 ", tagValue: "最新标签值" });

		const result = validateAiTagFormValues(tab.values, context);
		const payload = toAiTagSubmitPayload(tab, context);

		expect(result.valid).toBe(true);
		expect(payload).toMatchObject({
			tagName: " 最新标签名 ",
			tagValue: "最新标签值",
		});
	});

	it("删除一个 tab 后，剩余 tab 继续按完整数据通过校验", () => {
		const tabs = [
			buildTab("tab-1", {}, { tagName: undefined }),
			buildTab("tab-2", {}, { tagName: "剩余标签" }),
		];
		const remainingTabs = tabs.filter((tab) => tab.tempId !== "tab-1");

		const validation = validateAllAiTagTabs(remainingTabs, context);

		expect(validation.results).toHaveLength(1);
		expect(validation.results[0]).toMatchObject({ tempId: "tab-2", valid: true });
	});

	it("组织大脑隐性展示时要求选择标签分布模块", () => {
		const result = validateAiTagFormValues(
			buildValues({
				isDisplayInOrgBrain: true,
				tagVisibility: "0",
				tagDistributionModule: undefined,
			}),
			context,
		);

		expect(result.valid).toBe(false);
		if (!result.valid) {
			expect(result.errors.tagDistributionModule).toEqual(["请选择标签分布模块"]);
		}
	});

	it("业务类别为空时返回中文业务提示，不展示 zod 默认英文错误", () => {
		const result = validateAiTagFormValues(
			buildValues({
				businessCategory: undefined,
			}),
			context,
		);

		expect(result.valid).toBe(false);
		if (!result.valid) {
			expect(result.errors.businessCategory).toEqual(["请选择业务类别"]);
			expect(result.firstError.message).toBe("请选择业务类别");
		}
	});

	it("ai 多 tab 初始化会补齐默认草稿，并统一字典字段为字符串", () => {
		const tabs = buildAiTagDraftTabs({
			tags: [
				{
					tempId: "ai-1",
					tagName: "安全意识",
					tagValue: "高",
					tagDescription: "AI 识别标签",
					businessCategory: "security",
					sensitivityLevel: "2",
					isExisting: false,
					tagId: "tag-code-1",
				},
			],
			tagLibraryType: TAG_RULE_TYPE_DICT.TALENT,
			sessionId: "session-ai-1",
			currentFormValues: normalizeTagDraftValues({
				auditor: 0 as unknown as string,
				updateFrequency: 2 as unknown as string,
			}),
		});

		expect(tabs[0]).toMatchObject({
			tagType: TAG_TYPE.INTELLIGENT,
			aliTagCode: "tag-code-1",
			aiSessionId: "session-ai-1",
			isRequired: "1",
			auditor: "0",
			updateFrequency: "2",
			isAuditTagging: "1",
			isAttProofTagging: "1",
			isFtfInterview: "0",
			isDisplayInOrgBrain: true,
			tagVisibility: "1",
		});
	});

	it("智能标签创建 payload 与后端 TagAddForm 合同一致", () => {
		const payload = toAiTagSubmitPayload(
			buildTab(
				"tab-contract",
				{ isExisting: true, existingTagId: "origin-tag-code" },
				{
					auditProcessTagging: [
						{
							step: 1,
							stepName: "一级审核",
							approver: "10001",
							type: "user",
						},
					],
					existenceCycle: "2026-06-17T08:11:31.000Z",
				},
			),
			context,
		);

		expect(payload).toMatchObject({
			tagType: TAG_TYPE.INTELLIGENT,
			aiSessionId: "session-001",
			aliTagCode: "hrbrain.tag.001",
			type: TAG_RULE_TYPE_DICT.TALENT,
			existenceCycle: "2026-06-17",
		});
		expect(typeof payload.auditProcessTagging).toBe("string");
		expect(Array.isArray(payload.auditProcessTagging)).toBe(false);
		expect(Array.isArray(payload.tagPositionList)).toBe(true);
		expect(payload).not.toHaveProperty("useScope");
		expect(payload).not.toHaveProperty("tagId");
		expect(payload).not.toHaveProperty("existingTagId");
		expect(payload).not.toHaveProperty("isExisting");
	});

	it("智能标签缺少 aliTagCode 时会被校验拦截", () => {
		const result = validateAiTagFormValues(
			buildValues({
				tagType: TAG_TYPE.INTELLIGENT,
				aliTagCode: undefined,
			}),
			context,
		);

		expect(result.valid).toBe(false);
		if (!result.valid) {
			expect(result.errors.aliTagCode).toEqual([
				"智能标签缺少阿里标签编码，请重新向 AI 描述标签",
			]);
		}
	});

	it("智能标签已存在项不做中文名重名校验", async () => {
		const validation = await validateIntelligentTagDuplicateNames(
			[
				buildTab(
					"tab-existing",
					{
						isExisting: true,
						existingTagId: "existing-tag-code",
					},
					{
						tagType: TAG_TYPE.INTELLIGENT,
						tagName: "已存在标签",
					},
				),
			],
			TAG_RULE_TYPE_DICT.TALENT,
		);

		expect(mockCheckDuplicateName).not.toHaveBeenCalled();
		expect(validation.results).toEqual([
			{
				tempId: "tab-existing",
				valid: true,
				errors: {},
			},
		]);
		expect(validation.firstInvalid).toBeUndefined();
	});

	it("智能标签非已存在项命中中文名重名时，仅提示删除 tab item 处理", async () => {
		mockCheckDuplicateName.mockResolvedValue(true);

		const validation = await validateIntelligentTagDuplicateNames(
			[
				buildTab(
					"tab-new",
					{
						isExisting: false,
					},
					{
						tagType: TAG_TYPE.INTELLIGENT,
						tagName: "重复标签",
					},
				),
			],
			TAG_RULE_TYPE_DICT.TALENT,
		);

		expect(mockCheckDuplicateName).toHaveBeenCalledWith({
			id: undefined,
			name: "重复标签",
			type: TAG_RULE_TYPE_DICT.TALENT,
		});
		expect(validation.results[0]).toEqual({
			tempId: "tab-new",
			valid: false,
			errors: {
				tagName: [INTELLIGENT_TAG_DUPLICATE_NAME_ERROR_MESSAGE],
			},
		});
		expect(validation.firstInvalid).toEqual({
			tempId: "tab-new",
			field: "tagName",
			message: INTELLIGENT_TAG_DUPLICATE_NAME_ERROR_MESSAGE,
		});
	});

	it("智能标签批量任务说明文案不再表达已有标签最新结果更新", () => {
		const instructionText = getAiTaskInstructionText({ isBatchTask: true });

		expect(instructionText).toContain("点击标签右侧删除按钮处理");
		expect(instructionText).toContain("不参与提交");
		expect(instructionText).not.toContain("已有标签最新结果更新");
		expect(instructionText).not.toContain("更新已有标签");
	});

	it("单标签智能标签重名提示不再错误引导删除 tab item", () => {
		expect(getIntelligentTagDuplicateValidationMessage({ isBatchTask: false })).toBe(
			INTELLIGENT_SINGLE_TAG_DUPLICATE_NAME_ERROR_MESSAGE,
		);
		expect(getIntelligentTagDuplicateValidationMessage({ isBatchTask: false })).not.toContain(
			"标签右侧删除按钮",
		);
		expect(getIntelligentTagDuplicateValidationMessage({ isBatchTask: true })).toBe(
			INTELLIGENT_TAG_DUPLICATE_NAME_ERROR_MESSAGE,
		);
	});
});
