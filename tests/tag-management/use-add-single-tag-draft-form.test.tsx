import type { FormInstance } from "antd";
import { useAddSingleTagDraftForm } from "#src/pages/tag-management/components/tag-form-drawer/use-add-single-tag-draft-form";
import { TAG_RULE_TYPE_DICT, TAG_TYPE } from "#src/pages/tag-management/config";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

function createFormMock(initialValues: Record<string, unknown> = {}) {
	const store = { ...initialValues };
	const form = {
		getFieldValue: vi.fn((name: string) => store[name]),
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

describe("useAddSingleTagDraftForm", () => {
	it("applySingleDraft 会写回 Form，并保留新增 single 真相源", () => {
		const form = createFormMock();
		const { result } = renderHook(() =>
			useAddSingleTagDraftForm({
				form,
				tagLibraryType: TAG_RULE_TYPE_DICT.TALENT,
				initialTagType: TAG_TYPE.MANUAL,
			}),
		);

		act(() => {
			result.current.applySingleDraft({
				tagType: TAG_TYPE.INTELLIGENT,
				tagName: "安全意识",
				updateFrequency: 1 as unknown as string,
			});
		});

		expect(result.current.singleDraft).toMatchObject({
			tagType: TAG_TYPE.INTELLIGENT,
			tagName: "安全意识",
			updateFrequency: "1",
		});
		expect(form.setFieldsValue).toHaveBeenLastCalledWith(
			expect.objectContaining({
				updateFrequency: "1",
			}),
		);
	});

	it("syncSingleDraftFromForm 会基于当前 Form 值与默认值生成完整新增草稿", () => {
		const form = createFormMock({
			tagType: TAG_TYPE.INTELLIGENT,
			tagName: "AI 标签",
			auditor: 0,
		});
		const { result } = renderHook(() =>
			useAddSingleTagDraftForm({
				form,
				tagLibraryType: TAG_RULE_TYPE_DICT.TALENT,
				initialTagType: TAG_TYPE.MANUAL,
			}),
		);

		let nextDraft: ReturnType<typeof result.current.syncSingleDraftFromForm> | undefined;
		act(() => {
			nextDraft = result.current.syncSingleDraftFromForm();
		});

		expect(nextDraft).toMatchObject({
			tagType: TAG_TYPE.INTELLIGENT,
			auditor: "0",
			isRequired: "1",
			isAuditTagging: "1",
			isAttProofTagging: "1",
			isFtfInterview: "0",
			isDisplayInOrgBrain: true,
			tagVisibility: "1",
		});
	});
});
