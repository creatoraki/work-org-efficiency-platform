import type { JobPositionTreeNode } from "#src/api/tag-management/rule-library";
import type { TagCenterItem } from "#src/pages/tag-management/components/tag-form-drawer/types";
import {
	toTagFormFieldErrors,
	validateCreateSingleTagValues,
	validateUpdateTagValues,
} from "#src/pages/tag-management/components/tag-form-drawer/tag-form-schema";
import { normalizeTagDraftValues } from "#src/pages/tag-management/components/tag-form-drawer/utils";
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

const orgContext = {
	tagLibraryType: TAG_RULE_TYPE_DICT.ORG,
	jobPositionNodeMap: new Map<string, JobPositionTreeNode>(),
};

function buildTalentManualValues(overrides: Partial<TagCenterItem> = {}): TagCenterItem {
	return {
		tagType: TAG_TYPE.MANUAL,
		tagName: "安全意识",
		tagValue: "高",
		tagDescription: "标签描述",
		businessCategory: ["talent", "security"],
		isRequired: "1",
		sensitivityLevel: "1",
		existenceCycle: "2026-12-31",
		updateFrequency: "1",
		useScope: ["position-100"],
		maintainer: "6",
		maintainerName: "集团本体负责人",
		maintainerType: "2",
		auditor: "0",
		isAuditTagging: "1",
		auditProcessTagging: [
			{
				step: 1,
				stepName: "步骤一",
				approver: "10001",
				type: "1",
				approverName: "张三",
			},
		],
		isAttProofTagging: "1",
		attProofReqsTagging: "请上传证明",
		isFtfInterview: "1",
		ftfInterviewUpdFreq: "1",
		ftfInterviewer: "6",
		isDisplayInOrgBrain: true,
		tagVisibility: "1",
		...overrides,
	};
}

describe("tag-form-schema", () => {
	it("新增单标签缺少维护人和人员范围时会被 schema 拦截", () => {
		const result = validateCreateSingleTagValues(
			buildTalentManualValues({
				maintainer: undefined,
				useScope: [],
				tagPositionList: [],
			}),
			talentContext,
		);

		expect(result.valid).toBe(false);
		if (!result.valid) {
			expect(result.errors.maintainer).toEqual(["请选择维护人"]);
			expect(result.errors.useScope).toEqual(["请选择人员范围"]);
			expect(result.firstError.message).toBe("请选择人员范围");
		}
	});

	it("新增系统标签自定义复合规则缺少 aliTagCode 时返回明确提示", () => {
		const result = validateCreateSingleTagValues(
			{
				tagType: TAG_TYPE.SYSTEM,
				ruleSelectionType: "1",
				tagName: "系统标签",
				tagValue: "自动值",
				businessCategory: "010101",
				isRequired: "1",
				sensitivityLevel: "1",
				existenceCycle: "2026-12-31",
				updateFrequency: "1",
				auditor: "0",
			},
			orgContext,
		);

		expect(result.valid).toBe(false);
		if (!result.valid) {
			expect(result.errors.aliTagCode).toEqual(["请先新建复合规则"]);
			expect(result.firstError.message).toBe("请先新建复合规则");
		}
	});

	it("编辑单标签会沿用同一套业务校验，并允许 auditor='0'", () => {
		const result = validateUpdateTagValues(
			buildTalentManualValues({
				id: "tag-1",
				auditor: "0",
				updateFrequency: "0",
			}),
			talentContext,
		);

		expect(result.valid).toBe(true);
		if (result.valid) {
			expect(result.errors).toEqual({});
		}
	});

	it("人才手工标签不需要审核时，不要求填写附件证明", () => {
		const result = validateUpdateTagValues(
			buildTalentManualValues({
				id: "tag-141",
				isAuditTagging: "0",
				auditProcessTagging: undefined,
				isAttProofTagging: undefined,
				attProofReqsTagging: undefined,
			}),
			talentContext,
		);

		expect(result.valid).toBe(true);
	});

	it("人才手工标签启用面谈时，缺少面谈字段会被拦截", () => {
		const result = validateUpdateTagValues(
			buildTalentManualValues({
				ftfInterviewUpdFreq: undefined,
				ftfInterviewer: undefined,
			}),
			talentContext,
		);

		expect(result.valid).toBe(false);
		if (!result.valid) {
			expect(result.errors.ftfInterviewUpdFreq).toEqual(["请选择面谈更新频次"]);
			expect(result.errors.ftfInterviewer).toEqual(["请选择面谈人"]);
		}
	});

	it("编辑智能标签：接口详情含 aiSessionId/aliTagCode，不修改直接更新时 schema 校验通过", () => {
		// 对齐 GET /tagmanage/tag/148 真实响应：智能标签不适用字段均为 null
		const result = validateUpdateTagValues(
			normalizeTagDraftValues({
				id: "148",
				tagType: "3",
				tagName: "工龄",
				tagRulesId: null,
				tagValue: "无",
				tagDescription: "员工工作年限",
				aiSessionId: "session_1781764356498_cwlt2n078",
				aliTagCode:
					"hrbrain_import_label_base_kv.hrbrain_import_label_base_kv.years_of_service",
				businessCategory: "010101",
				isRequired: "1",
				sensitivityLevel: "1",
				existenceCycle: "2026-09-18",
				updateFrequency: "4",
				maintainer: null,
				auditor: "0",
				isAuditTagging: "1",
				isAttProofTagging: "1",
				attProofReqsTagging: null,
				isFtfInterview: "0",
				ftfInterviewUpdFreq: null,
				ftfInterviewer: null,
				ruleSelectionType: null,
				isDisplayInOrgBrain: true,
				tagVisibility: "1",
				tagDistributionModule: null,
				tagPositionList: [{ id: "0", type: "root" }],
			} as unknown as TagCenterItem),
			talentContext,
		);

		expect(result.valid).toBe(true);
	});

	it("编辑智能标签若生命周期字段在 form patch 链路中丢失，会被 schema 明确拦截", () => {
		const result = validateUpdateTagValues(
			normalizeTagDraftValues({
				id: "148",
				tagType: "3",
				tagName: "工龄",
				tagValue: "无",
				tagDescription: "员工工作年限",
				aiSessionId: undefined,
				aliTagCode: undefined,
				businessCategory: "010101",
				isRequired: "1",
				sensitivityLevel: "1",
				existenceCycle: "2026-09-18",
				updateFrequency: "4",
				maintainer: null,
				auditor: "0",
				isAuditTagging: "1",
				isAttProofTagging: "1",
				attProofReqsTagging: null,
				isFtfInterview: "0",
				ftfInterviewUpdFreq: null,
				ftfInterviewer: null,
				ruleSelectionType: null,
				isDisplayInOrgBrain: true,
				tagVisibility: "1",
				tagDistributionModule: null,
				tagPositionList: [{ id: "0", type: "root" }],
			} as unknown as TagCenterItem),
			talentContext,
		);

		expect(result.valid).toBe(false);
		if (!result.valid) {
			expect(result.errors.aiSessionId).toEqual([
				"智能标签缺少 AI 会话信息，请重新向 AI 描述标签",
			]);
			expect(result.errors.aliTagCode).toEqual([
				"智能标签缺少阿里标签编码，请重新向 AI 描述标签",
			]);
		}
	});

	it("schema 错误可稳定映射为 antd Form 字段错误结构", () => {
		const fields = toTagFormFieldErrors({
			auditor: ["请选择审核人"],
			useScope: ["请选择人员范围"],
		});

		expect(fields).toEqual(
			expect.arrayContaining([
				{ name: "auditor", errors: ["请选择审核人"] },
				{ name: "useScope", errors: ["请选择人员范围"] },
			]),
		);
	});
});
