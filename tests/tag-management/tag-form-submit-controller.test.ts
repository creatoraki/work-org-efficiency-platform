import type { JobPositionTreeNode } from "#src/api/tag-management/rule-library";
import type { TagCenterItem } from "#src/pages/tag-management/components/tag-form-drawer/types";
import { FORM_MODE } from "#src/pages/tag-management/components/tag-form-drawer/constants";
import { submitSingleTagDraft } from "#src/pages/tag-management/components/tag-form-drawer/tag-form-submit-controller";
import { TAG_RULE_TYPE_DICT, TAG_TYPE } from "#src/pages/tag-management/config";
import { describe, expect, it, vi } from "vitest";

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

describe("tag-form-submit-controller", () => {
	it("编辑智能标签不改值提交时，应 await 父层并输出单对象 update payload，且不触发大脑下线", async () => {
		const onSubmit = vi.fn().mockResolvedValue(undefined);
		const onOfflineLifecycleCode = vi.fn().mockResolvedValue(undefined);

		const result = await submitSingleTagDraft({
			mode: FORM_MODE.EDIT,
			latestDraft: buildEditIntelligentDraft(),
			context: talentContext,
			onSubmit,
			onOfflineLifecycleCode,
		});

		expect(result.ok).toBe(true);
		if (!result.ok) {
			throw new Error("预期编辑提交通过");
		}

		expect(onOfflineLifecycleCode).not.toHaveBeenCalled();
		expect(onSubmit).toHaveBeenCalledTimes(1);
		expect(Array.isArray(onSubmit.mock.calls[0]?.[0])).toBe(false);
		expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({
			tagType: TAG_TYPE.INTELLIGENT,
			tagName: "工龄",
			aiSessionId: "session_1781764356498_cwlt2n078",
			aliTagCode:
				"hrbrain_import_label_base_kv.hrbrain_import_label_base_kv.years_of_service",
			auditor: "0",
			type: TAG_RULE_TYPE_DICT.TALENT,
		});
	});

	it("编辑智能标签只改可见字段时，仍应保留 lifecycle 字段并走 update 单对象语义，且不触发大脑下线", async () => {
		const onSubmit = vi.fn().mockResolvedValue(undefined);
		const onOfflineLifecycleCode = vi.fn().mockResolvedValue(undefined);

		const result = await submitSingleTagDraft({
			mode: FORM_MODE.EDIT,
			latestDraft: buildEditIntelligentDraft({
				tagName: "工龄（已修改）",
				auditor: "1",
			}),
			context: talentContext,
			onSubmit,
			onOfflineLifecycleCode,
		});

		expect(result.ok).toBe(true);
		if (!result.ok) {
			throw new Error("预期编辑提交通过");
		}

		expect(onOfflineLifecycleCode).not.toHaveBeenCalled();
		expect(onSubmit).toHaveBeenCalledTimes(1);
		expect(Array.isArray(onSubmit.mock.calls[0]?.[0])).toBe(false);
		expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({
			tagName: "工龄（已修改）",
			auditor: "1",
			aiSessionId: "session_1781764356498_cwlt2n078",
			aliTagCode:
				"hrbrain_import_label_base_kv.hrbrain_import_label_base_kv.years_of_service",
		});
	});

	it("新增智能标签提交时，应先下线大脑侧标签元数据再保存", async () => {
		const onSubmit = vi.fn().mockResolvedValue(undefined);
		const onOfflineLifecycleCode = vi.fn().mockResolvedValue(undefined);

		const result = await submitSingleTagDraft({
			mode: FORM_MODE.ADD,
			latestDraft: buildEditIntelligentDraft({ id: undefined, tagId: undefined }),
			context: talentContext,
			onSubmit,
			onOfflineLifecycleCode,
		});

		expect(result.ok).toBe(true);
		if (!result.ok) {
			throw new Error("预期新增提交通过");
		}

		expect(onOfflineLifecycleCode).toHaveBeenCalledWith(
			"hrbrain_import_label_base_kv.hrbrain_import_label_base_kv.years_of_service",
		);
		expect(onSubmit).toHaveBeenCalledTimes(1);
	});

	it("父层保存失败时，应把异常继续抛出，不能伪装为提交成功", async () => {
		const submitError = new Error("save failed");
		const onSubmit = vi.fn().mockRejectedValue(submitError);
		const onOfflineLifecycleCode = vi.fn().mockResolvedValue(undefined);

		await expect(
			submitSingleTagDraft({
				mode: FORM_MODE.EDIT,
				latestDraft: buildEditIntelligentDraft(),
				context: talentContext,
				onSubmit,
				onOfflineLifecycleCode,
			}),
		).rejects.toThrow("save failed");
	});
});
