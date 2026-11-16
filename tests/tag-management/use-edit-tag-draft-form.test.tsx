import type { JobPositionTreeNode } from "#src/api/tag-management/rule-library";
import type { TagCenterItem } from "#src/pages/tag-management/components/tag-form-drawer/types";
import type { FormInstance } from "antd";
import { validateUpdateTagValues } from "#src/pages/tag-management/components/tag-form-drawer/tag-form-schema";
import { toEditTagSubmitPayload } from "#src/pages/tag-management/components/tag-form-drawer/tag-form-submit";
import { useEditTagDraftForm } from "#src/pages/tag-management/components/tag-form-drawer/use-edit-tag-draft-form";
import { TAG_RULE_TYPE_DICT, TAG_TYPE } from "#src/pages/tag-management/config";
import { act, render, renderHook, waitFor } from "@testing-library/react";
import { Form, Input } from "antd";
import { useEffect } from "react";
import { describe, expect, it, vi } from "vitest";

function createFormMock(initialValues: Record<string, unknown> = {}) {
	const store = { ...initialValues };
	const form = {
		getFieldsValue: vi.fn(() => ({ ...store })),
		setFieldsValue: vi.fn((values: Record<string, unknown>) => {
			Object.assign(store, values);
		}),
	} as unknown as FormInstance & {
		getStore: () => Record<string, unknown>;
	};
	form.getStore = () => ({ ...store });
	return form;
}

function createVisiblePatchOnlyFormMock(initialValues: Record<string, unknown> = {}) {
	const store = { ...initialValues };
	const returnedFieldNames = new Set(["tagName", "auditor"]);
	const form = {
		getFieldsValue: vi.fn(() =>
			Object.fromEntries(
				Object.entries(store).filter(([fieldName]) => returnedFieldNames.has(fieldName)),
			),
		),
		setFieldsValue: vi.fn((values: Record<string, unknown>) => {
			Object.assign(store, values);
		}),
	} as unknown as FormInstance & {
		getStore: () => Record<string, unknown>;
	};
	form.getStore = () => ({ ...store });
	return form;
}

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

function buildIntelligentDetailPayload(overrides: Partial<TagCenterItem> = {}): TagCenterItem {
	return {
		id: "148",
		tagType: TAG_TYPE.INTELLIGENT,
		tagName: "工龄",
		tagValue: "无",
		tagDescription: "员工工作年限",
		aiSessionId: "session_1781764356498_cwlt2n078",
		aliTagCode: "hrbrain_import_label_base_kv.hrbrain_import_label_base_kv.years_of_service",
		businessCategory: "010101",
		isRequired: "1",
		sensitivityLevel: "1",
		existenceCycle: "2026-09-18",
		updateFrequency: "4",
		maintainer: undefined,
		auditor: "0",
		isAuditTagging: "1",
		isAttProofTagging: "1",
		attProofReqsTagging: undefined,
		isFtfInterview: "0",
		ftfInterviewUpdFreq: undefined,
		ftfInterviewer: undefined,
		ruleSelectionType: undefined,
		isDisplayInOrgBrain: true,
		tagVisibility: "1",
		tagDistributionModule: undefined,
		tagPositionList: [{ id: "0", type: "root" }],
		...overrides,
	};
}

interface EditDraftHarnessValue {
	form: FormInstance;
	hook: ReturnType<typeof useEditTagDraftForm>;
}

interface EditDraftHarnessProps {
	onReady: (value: EditDraftHarnessValue) => void;
}

function EditDraftHarness({ onReady }: EditDraftHarnessProps) {
	const [form] = Form.useForm();
	const hook = useEditTagDraftForm({
		form,
	});

	useEffect(() => {
		onReady({ form, hook });
	}, [form, hook, onReady]);

	return (
		<Form form={form}>
			<Form.Item name="tagName">
				<Input />
			</Form.Item>
			<Form.Item name="auditor">
				<Input />
			</Form.Item>
			<Form.Item name="aliTagCode" hidden>
				<Input />
			</Form.Item>
			<Form.Item name="aiSessionId" hidden>
				<Input />
			</Form.Item>
		</Form>
	);
}

describe("useEditTagDraftForm", () => {
	it("applyEditDraft 会写回 Form，并保留编辑真相源", () => {
		const form = createFormMock();
		const { result } = renderHook(() =>
			useEditTagDraftForm({
				form,
			}),
		);

		act(() => {
			result.current.applyEditDraft({
				id: "tag-1",
				tagName: "已存在标签",
				updateFrequency: 1 as unknown as string,
			});
		});

		expect(result.current.editDraft).toMatchObject({
			id: "tag-1",
			tagName: "已存在标签",
			updateFrequency: "1",
		});
		expect(form.setFieldsValue).toHaveBeenLastCalledWith(
			expect.objectContaining({
				updateFrequency: "1",
			}),
		);
	});

	it("syncEditDraftFromForm 只基于详情镜像和表单 patch 同步，不重新套默认模板", () => {
		const form = createFormMock({
			tagName: "编辑后的标签",
			auditor: 0,
		});
		const { result } = renderHook(() =>
			useEditTagDraftForm({
				form,
			}),
		);

		act(() => {
			result.current.applyEditDraft({
				id: "tag-1",
				tagType: TAG_TYPE.INTELLIGENT,
				isRequired: "0",
			});
		});

		let nextDraft: ReturnType<typeof result.current.syncEditDraftFromForm> | undefined;
		act(() => {
			nextDraft = result.current.syncEditDraftFromForm();
		});

		expect(nextDraft).toMatchObject({
			id: "tag-1",
			tagName: "编辑后的标签",
			auditor: "0",
			isRequired: "0",
		});
	});

	it("syncEditDraftFromForm 即使只拿到可见字段 patch，也不会丢掉智能标签生命周期字段", () => {
		const form = createVisiblePatchOnlyFormMock();
		const { result } = renderHook(() =>
			useEditTagDraftForm({
				form,
			}),
		);

		act(() => {
			result.current.applyEditDraft({
				id: "148",
				tagType: TAG_TYPE.INTELLIGENT,
				tagName: "工龄",
				aliTagCode:
					"hrbrain_import_label_base_kv.hrbrain_import_label_base_kv.years_of_service",
				aiSessionId: "session_1781764356498_cwlt2n078",
			});
		});

		act(() => {
			form.setFieldsValue({
				tagName: "工龄（已修改）",
				auditor: "0",
			});
		});

		let nextDraft: ReturnType<typeof result.current.syncEditDraftFromForm> | undefined;
		act(() => {
			nextDraft = result.current.syncEditDraftFromForm();
		});

		expect(nextDraft).toMatchObject({
			id: "148",
			aliTagCode:
				"hrbrain_import_label_base_kv.hrbrain_import_label_base_kv.years_of_service",
			aiSessionId: "session_1781764356498_cwlt2n078",
			tagName: "工龄（已修改）",
			auditor: "0",
		});
	});

	it("syncEditDraftFromForm 未挂载字段回传 undefined 时不覆盖 editDraft 已有值", () => {
		const form = createFormMock({
			tagName: "编辑后的标签",
			isAuditTagging: "0",
			isAttProofTagging: undefined,
		});
		const { result } = renderHook(() =>
			useEditTagDraftForm({
				form,
			}),
		);

		act(() => {
			result.current.applyEditDraft({
				id: "tag-141",
				tagType: TAG_TYPE.MANUAL,
				isAuditTagging: "0",
				isAttProofTagging: "1",
			});
		});

		let nextDraft: ReturnType<typeof result.current.syncEditDraftFromForm> | undefined;
		act(() => {
			nextDraft = result.current.syncEditDraftFromForm();
		});

		expect(nextDraft?.isAttProofTagging).toBe("1");
	});

	it("编辑智能标签不改任何值直接更新时，可沿真实链路通过校验并保留更新 payload 元信息", async () => {
		const detailPayload = buildIntelligentDetailPayload();
		let harnessValue: EditDraftHarnessValue | null = null;

		render(
			<EditDraftHarness
				onReady={(value) => {
					harnessValue = value;
				}}
			/>,
		);

		await waitFor(() => {
			expect(harnessValue).not.toBeNull();
		});

		if (!harnessValue) {
			throw new Error("EditDraftHarness 未能初始化");
		}

		const readyHarnessValue: EditDraftHarnessValue = harnessValue;

		act(() => {
			readyHarnessValue.hook.applyEditDraft(detailPayload);
		});

		let nextDraft: ReturnType<typeof readyHarnessValue.hook.syncEditDraftFromForm> | undefined;
		act(() => {
			nextDraft = readyHarnessValue.hook.syncEditDraftFromForm();
		});

		expect(nextDraft).toMatchObject({
			id: "148",
			tagType: TAG_TYPE.INTELLIGENT,
			tagName: "工龄",
			auditor: "0",
			aliTagCode: detailPayload.aliTagCode,
			aiSessionId: detailPayload.aiSessionId,
		});

		const validation = validateUpdateTagValues(nextDraft!, talentContext);
		expect(validation.valid).toBe(true);

		const payload = toEditTagSubmitPayload(nextDraft!, talentContext);
		expect(payload).toMatchObject({
			tagType: TAG_TYPE.INTELLIGENT,
			tagName: "工龄",
			auditor: "0",
			aliTagCode: detailPayload.aliTagCode,
			aiSessionId: detailPayload.aiSessionId,
		});
	});
});
