import type { JobPositionTreeNode } from "#src/api/tag-management/rule-library";
import type {
	AiTagTabState,
	TagCenterItem,
} from "#src/pages/tag-management/components/tag-form-drawer/types";
import {
	toCreateTagSubmitPayloads,
	toEditTagSubmitPayload,
	toSingleTagSubmitPayload,
} from "#src/pages/tag-management/components/tag-form-drawer/tag-form-submit";
import { TAG_RULE_TYPE_DICT, TAG_TYPE } from "#src/pages/tag-management/config";
import { describe, expect, it } from "vitest";

const TAG_ADD_FORM_ALLOWED_KEYS = new Set([
	"tagType",
	"tagName",
	"tagRulesId",
	"tagValue",
	"tagDescription",
	"aiSessionId",
	"aliTagCode",
	"businessCategory",
	"isRequired",
	"sensitivityLevel",
	"existenceCycle",
	"updateFrequency",
	"maintainer",
	"maintainerName",
	"maintainerType",
	"submitter",
	"submitterName",
	"auditor",
	"auditorName",
	"auditStatus",
	"auditComment",
	"status",
	"isAuditTagging",
	"auditProcessTagging",
	"isAttProofTagging",
	"attProofReqsTagging",
	"isFtfInterview",
	"ftfInterviewUpdFreq",
	"ftfInterviewer",
	"type",
	"ruleSelectionType",
	"tagPositionList",
	"isDisplayInOrgBrain",
	"tagVisibility",
	"tagDistributionModule",
]);

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

const context = {
	tagLibraryType: TAG_RULE_TYPE_DICT.TALENT,
	jobPositionNodeMap,
};

function buildSingleDraft(overrides: Partial<TagCenterItem> = {}): TagCenterItem {
	return {
		tagType: TAG_TYPE.MANUAL,
		tagName: "安全意识",
		tagValue: "高",
		businessCategory: ["talent", "security"],
		useScope: ["position-100"],
		updateFrequency: "1",
		auditor: "0",
		...overrides,
	};
}

function buildBatchTab(tempId: string, overrides: Partial<AiTagTabState> = {}): AiTagTabState {
	return {
		tempId,
		tagId: `${tempId}-tag-id`,
		existingTagId: undefined,
		isExisting: false,
		values: buildSingleDraft({
			tagType: TAG_TYPE.INTELLIGENT,
			tagName: `${tempId}-标签`,
		}),
		errors: {},
		dirty: false,
		...overrides,
	};
}

describe("tag-form-submit", () => {
	it("single 模式创建 payload 会统一转成数组 body", () => {
		const payload = toCreateTagSubmitPayloads({
			formMode: "single",
			singleDraft: buildSingleDraft(),
			batchTabs: [],
			context,
		});

		expect(payload).toEqual([
			expect.objectContaining({
				tagName: "安全意识",
				businessCategory: "security",
				type: TAG_RULE_TYPE_DICT.TALENT,
				tagPositionList: [{ id: "100", type: "position" }],
			}),
		]);
		expect(payload[0]).not.toHaveProperty("useScope");
	});

	it("batch 模式创建 payload 会保留多标签数组结构", () => {
		const payload = toCreateTagSubmitPayloads({
			formMode: "batch",
			singleDraft: null,
			batchTabs: [buildBatchTab("tab-1"), buildBatchTab("tab-2")],
			context,
		});

		expect(payload).toHaveLength(2);
		expect(payload[0]).toMatchObject({
			tagType: TAG_TYPE.INTELLIGENT,
			tagName: "tab-1-标签",
		});
		expect(payload[1]).toMatchObject({
			tagType: TAG_TYPE.INTELLIGENT,
			tagName: "tab-2-标签",
		});
	});

	it("single 智能标签提交不会泄漏 AI 生命周期元信息到创建接口", () => {
		const payload = toSingleTagSubmitPayload(
			buildSingleDraft({
				tagType: TAG_TYPE.INTELLIGENT,
				aiSessionId: "session-001",
				aliTagCode: "hrbrain.tag.001",
				tagId: "ai-tag-code-1",
				existingTagId: "existing-tag-code-1",
				isExisting: true,
			}),
			context,
		);

		expect(payload).toMatchObject({
			tagType: TAG_TYPE.INTELLIGENT,
			aiSessionId: "session-001",
			aliTagCode: "hrbrain.tag.001",
		});
		expect(payload).not.toHaveProperty("tagId");
		expect(payload).not.toHaveProperty("existingTagId");
		expect(payload).not.toHaveProperty("isExisting");
	});

	it("创建 payload 会将审核流程数组转成 JSON 字符串，并格式化到期时间", () => {
		const payload = toSingleTagSubmitPayload(
			buildSingleDraft({
				auditProcessTagging: [
					{
						step: 1,
						stepName: "一级审核",
						approver: "10001",
						type: "user",
						approverName: "张三",
					},
				],
				existenceCycle: "2026-06-17T08:11:31.000Z",
			}),
			context,
		);

		expect(payload).toMatchObject({
			existenceCycle: "2026-06-17",
			auditProcessTagging:
				'[{"step":1,"stepName":"一级审核","approver":"10001","type":"user","approverName":"张三"}]',
		});
		expect(payload).not.toHaveProperty("useScope");
	});

	it("创建 payload 字段集合与后端 TagAddForm 保持一致", () => {
		const payload = toSingleTagSubmitPayload(
			buildSingleDraft({
				tagDescription: "标签描述",
				maintainer: "maintainer-1",
				maintainerName: "维护人",
				maintainerType: "2",
				isAuditTagging: "1",
				auditProcessTagging: [],
				isAttProofTagging: "1",
				attProofReqsTagging: "附件要求",
				isFtfInterview: "1",
				ftfInterviewUpdFreq: "1",
				ftfInterviewer: "6",
				isDisplayInOrgBrain: true,
				tagVisibility: "1",
				tagDistributionModule: "1",
				ruleSelectionType: "0",
			}),
			context,
		);

		expect(Object.keys(payload).every((key) => TAG_ADD_FORM_ALLOWED_KEYS.has(key))).toBe(true);
	});

	it("系统标签的 tagRulesId 提交前会统一转为 number", () => {
		const payload = toSingleTagSubmitPayload(
			buildSingleDraft({
				tagType: TAG_TYPE.SYSTEM,
				tagRulesId: "123",
				ruleSelectionType: "0",
			}),
			context,
		);

		expect(payload.tagRulesId).toBe(123);
	});

	it("编辑 payload 保持单对象语义，并沿用同一套字段规范化规则", () => {
		const payload = toEditTagSubmitPayload(
			buildSingleDraft({
				id: "tag-1",
				tagType: TAG_TYPE.SYSTEM,
				tagRulesId: "456",
				ruleSelectionType: "0",
			}),
			context,
		);

		expect(payload.tagRulesId).toBe(456);
		expect(payload.tagType).toBe(TAG_TYPE.SYSTEM);
		expect(Array.isArray(payload)).toBe(false);
	});
});
