import type { JobPositionTreeNode } from "#src/api/tag-management/rule-library";
import type {
	AiTagTabState,
	TagCenterItem,
} from "#src/pages/tag-management/components/tag-form-drawer/types";
import { FORM_MODE } from "#src/pages/tag-management/components/tag-form-drawer/constants";
import {
	collectAiTagLifecycleCodesToOffline,
	resolveSingleTagSubmitResult,
} from "#src/pages/tag-management/components/tag-form-drawer/tag-form-submit-flow";
import { TAG_RULE_TYPE_DICT, TAG_TYPE } from "#src/pages/tag-management/config";
import { describe, expect, it } from "vitest";

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

const talentContext = {
	tagLibraryType: TAG_RULE_TYPE_DICT.TALENT,
	jobPositionNodeMap,
};

function buildEditIntelligentDraft(overrides: Partial<TagCenterItem> = {}): TagCenterItem {
	return {
		id: "148",
		tagType: TAG_TYPE.INTELLIGENT,
		tagName: "工龄",
		tagValue: "无",
		tagDescription: "员工工作年限",
		aiSessionId: "session_1781764356498_cwlt2n078",
		aliTagCode: "hrbrain_import_label_base_kv.hrbrain_import_label_base_kv.years_of_service",
		tagId: "hrbrain_import_label_base_kv.hrbrain_import_label_base_kv.years_of_service",
		businessCategory: "010101",
		isRequired: "1",
		sensitivityLevel: "1",
		existenceCycle: "2026-09-18",
		updateFrequency: "4",
		auditor: "0",
		isAuditTagging: "1",
		isAttProofTagging: "1",
		isFtfInterview: "0",
		isDisplayInOrgBrain: true,
		tagVisibility: "1",
		tagPositionList: [{ id: "0", type: "root" }],
		type: TAG_RULE_TYPE_DICT.TALENT,
		...overrides,
	};
}

function buildAiTagTabState(overrides: Partial<AiTagTabState> = {}): AiTagTabState {
	return {
		tempId: "tab-1",
		tagId: "hrbrain_import_label_base_kv.hrbrain_import_label_base_kv.years_of_service",
		existingTagId: undefined,
		isExisting: false,
		values: buildEditIntelligentDraft(),
		errors: {},
		dirty: false,
		...overrides,
	};
}

describe("tag-form-submit-flow", () => {
	it("编辑智能标签不改值时，应直接产出 update payload，且不返回待下线 code", () => {
		const result = resolveSingleTagSubmitResult({
			mode: FORM_MODE.EDIT,
			latestDraft: buildEditIntelligentDraft(),
			context: talentContext,
		});

		expect(result.ok).toBe(true);
		if (!result.ok) {
			throw new Error("预期编辑智能标签提交编排通过");
		}

		expect(result.lifecycleCodeToOffline).toBeUndefined();
		if (Array.isArray(result.payload)) {
			throw new TypeError("编辑模式不应返回数组 payload");
		}

		expect(result.payload).toMatchObject({
			tagType: TAG_TYPE.INTELLIGENT,
			tagName: "工龄",
			aiSessionId: "session_1781764356498_cwlt2n078",
			aliTagCode:
				"hrbrain_import_label_base_kv.hrbrain_import_label_base_kv.years_of_service",
			auditor: "0",
			type: TAG_RULE_TYPE_DICT.TALENT,
		});
	});

	it("编辑智能标签只有 aliTagCode 没有 tagId 时，不应返回待下线 code", () => {
		const result = resolveSingleTagSubmitResult({
			mode: FORM_MODE.EDIT,
			latestDraft: buildEditIntelligentDraft({
				tagId: undefined,
			}),
			context: talentContext,
		});

		expect(result.ok).toBe(true);
		if (!result.ok) {
			throw new Error("预期编辑智能标签提交编排通过");
		}

		expect(result.lifecycleCodeToOffline).toBeUndefined();
	});

	it("编辑智能标签若生命周期字段丢失，应在提交编排阶段被拦截", () => {
		const result = resolveSingleTagSubmitResult({
			mode: FORM_MODE.EDIT,
			latestDraft: buildEditIntelligentDraft({
				aiSessionId: undefined,
				aliTagCode: undefined,
			}),
			context: talentContext,
		});

		expect(result.ok).toBe(false);
		if (result.ok) {
			throw new Error("预期生命周期字段缺失时提交编排失败");
		}

		expect(result.validation.errors.aiSessionId).toEqual([
			"智能标签缺少 AI 会话信息，请重新向 AI 描述标签",
		]);
		expect(result.validation.errors.aliTagCode).toEqual([
			"智能标签缺少阿里标签编码，请重新向 AI 描述标签",
		]);
	});

	it("批量智能标签收集下线 code 时，应与 single flow 一样优先使用 aliTagCode", () => {
		const codes = collectAiTagLifecycleCodesToOffline([
			buildAiTagTabState({
				tagId: undefined,
				values: buildEditIntelligentDraft({
					aliTagCode:
						"hrbrain_import_label_base_kv.hrbrain_import_label_base_kv.years_of_service",
				}),
			}),
			buildAiTagTabState({
				tempId: "tab-2",
				tagId: "hrbrain_import_label_base_kv.security_department",
				values: buildEditIntelligentDraft({
					aliTagCode: undefined,
					tagId: undefined,
					tagName: "安全部门",
				}),
			}),
		]);

		expect(codes).toEqual([
			"hrbrain_import_label_base_kv.hrbrain_import_label_base_kv.years_of_service",
			"hrbrain_import_label_base_kv.security_department",
		]);
	});

	it("新增单标签应统一生成数组 body，保持 create 契约稳定", () => {
		const result = resolveSingleTagSubmitResult({
			mode: FORM_MODE.ADD,
			latestDraft: buildEditIntelligentDraft({
				id: undefined,
				tagId: undefined,
			}),
			context: talentContext,
		});

		expect(result.ok).toBe(true);
		if (!result.ok) {
			throw new Error("预期新增单标签提交编排通过");
		}

		expect(result.lifecycleCodeToOffline).toBe(
			"hrbrain_import_label_base_kv.hrbrain_import_label_base_kv.years_of_service",
		);
		expect(Array.isArray(result.payload)).toBe(true);
		if (!Array.isArray(result.payload)) {
			throw new TypeError("新增模式应返回数组 payload");
		}

		expect(result.payload).toHaveLength(1);
		expect(result.payload[0]).toMatchObject({
			tagType: TAG_TYPE.INTELLIGENT,
			tagName: "工龄",
			aiSessionId: "session_1781764356498_cwlt2n078",
			aliTagCode:
				"hrbrain_import_label_base_kv.hrbrain_import_label_base_kv.years_of_service",
		});
	});
});
