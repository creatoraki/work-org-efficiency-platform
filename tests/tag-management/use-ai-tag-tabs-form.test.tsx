import type { JobPositionTreeNode } from "#src/api/tag-management/rule-library";
import type { AiTagTabItem } from "#src/pages/tag-management/components/tag-form-drawer/types";
import type { FormInstance } from "antd";
import { INTELLIGENT_TAG_DUPLICATE_NAME_ERROR_MESSAGE } from "#src/pages/tag-management/components/tag-form-drawer/hooks";
import { useAiTagTabsForm } from "#src/pages/tag-management/components/tag-form-drawer/use-ai-tag-tabs-form";
import { TAG_RULE_TYPE_DICT } from "#src/pages/tag-management/config";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

function createFormMock(initialValues: Record<string, unknown> = {}) {
	const store = { ...initialValues };
	const form = {
		getFieldsValue: vi.fn(() => ({ ...store })),
		setFieldsValue: vi.fn((values: Record<string, unknown>) => {
			Object.assign(store, values);
		}),
		setFields: vi.fn(),
	} as unknown as FormInstance & {
		getStore: () => Record<string, unknown>;
	};
	form.getStore = () => ({ ...store });
	return form;
}

const jobPositionNodeMap = new Map<string, JobPositionTreeNode>();
const context = {
	tagLibraryType: TAG_RULE_TYPE_DICT.TALENT,
	jobPositionNodeMap,
};

function buildTab(overrides: Partial<AiTagTabItem> = {}): AiTagTabItem {
	return {
		tempId: "tab-1",
		tagId: "tag-1",
		tagName: "标签一",
		tagValue: "值一",
		businessCategory: "security",
		isRequired: "1",
		sensitivityLevel: "2",
		existenceCycle: "2026-12-31",
		updateFrequency: "1",
		auditor: "auditor-001",
		isDisplayInOrgBrain: true,
		tagVisibility: "1",
		isExisting: false,
		...overrides,
	};
}

describe("useAiTagTabsForm", () => {
	it("初始化 AI tabs 后回填首个 tab 到当前 Form", () => {
		const form = createFormMock();
		const { result } = renderHook(() => useAiTagTabsForm(form));

		act(() => {
			result.current.initializeTabs([
				buildTab({ tempId: "tab-1", tagName: "第一个标签" }),
				buildTab({ tempId: "tab-2", tagName: "第二个标签" }),
			]);
		});

		expect(result.current.activeTabKey).toBe("tab-1");
		expect(result.current.tabs).toHaveLength(2);
		expect(form.setFieldsValue).toHaveBeenLastCalledWith(
			expect.objectContaining({
				tagName: "第一个标签",
				isExisting: false,
			}),
		);
	});

	it("切换 tab 前会保存当前 Form 最新值，避免当前 tab 修改丢失", () => {
		const form = createFormMock();
		const { result } = renderHook(() => useAiTagTabsForm(form));

		act(() => {
			result.current.initializeTabs([
				buildTab({ tempId: "tab-1", tagName: "第一个标签" }),
				buildTab({ tempId: "tab-2", tagName: "第二个标签" }),
			]);
		});
		act(() => {
			form.setFieldsValue({ tagName: "第一个标签已修改", aiSessionId: "session-001" });
			result.current.switchTab("tab-2");
		});

		expect(result.current.tabs.find((tab) => tab.tempId === "tab-1")?.values).toMatchObject({
			tagName: "第一个标签已修改",
		});
		expect(
			result.current.tabs.find((tab) => tab.tempId === "tab-1")?.values,
		).not.toHaveProperty("aiSessionId");
		expect(result.current.activeTabKey).toBe("tab-2");
	});

	it("提交前全量校验会更新每个 tab 的 errors，并返回首个错误 tab", () => {
		const form = createFormMock();
		const { result } = renderHook(() => useAiTagTabsForm(form));

		act(() => {
			result.current.initializeTabs([
				buildTab({ tempId: "tab-1" }),
				buildTab({ tempId: "tab-2", auditor: undefined }),
			]);
		});
		act(() => {
			result.current.switchTab("tab-2");
			form.setFieldsValue({ auditor: undefined });
		});

		let validation: ReturnType<typeof result.current.validateAllTabs> | undefined;
		act(() => {
			validation = result.current.validateAllTabs(context);
		});

		expect(validation?.firstInvalid).toMatchObject({
			tempId: "tab-2",
			firstError: { message: "请选择审核人" },
		});
		expect(validation?.results[1]).toMatchObject({
			tempId: "tab-2",
			errors: {
				auditor: ["请选择审核人"],
			},
		});
		expect(result.current.tabs.find((tab) => tab.tempId === "tab-2")?.errors).toMatchObject({
			auditor: ["请选择审核人"],
		});
	});

	it("字段改动后会立即同步当前 tab 值，并清理该字段旧错误", () => {
		const form = createFormMock();
		const { result } = renderHook(() => useAiTagTabsForm(form));

		act(() => {
			result.current.initializeTabs([
				buildTab({ tempId: "tab-1", auditor: undefined, updateFrequency: undefined }),
			]);
		});

		act(() => {
			result.current.validateAllTabs(context);
		});

		expect(result.current.tabs[0]?.errors).toMatchObject({
			auditor: ["请选择审核人"],
			updateFrequency: ["请选择更新频次"],
		});

		act(() => {
			result.current.handleFormValuesChange({
				auditor: "0",
				updateFrequency: "0",
			});
		});

		expect(result.current.tabs[0]?.values).toMatchObject({
			auditor: "0",
			updateFrequency: "0",
		});
		expect(result.current.tabs[0]?.errors).not.toHaveProperty("auditor");
		expect(result.current.tabs[0]?.errors).not.toHaveProperty("updateFrequency");
	});

	it("定位错误 tab 时使用校验后的 tabs，并把字段错误回填给 Form", () => {
		const form = createFormMock();
		const { result } = renderHook(() => useAiTagTabsForm(form));

		act(() => {
			result.current.initializeTabs([
				buildTab({ tempId: "tab-1" }),
				buildTab({ tempId: "tab-2", auditor: undefined }),
			]);
		});

		let validation: ReturnType<typeof result.current.validateAllTabs> | undefined;
		act(() => {
			validation = result.current.validateAllTabs(context);
			if (validation?.firstInvalid) {
				result.current.activateTab(validation.firstInvalid.tempId, validation.tabs);
			}
		});

		expect(result.current.activeTabKey).toBe("tab-2");
		expect(form.setFields).toHaveBeenLastCalledWith(
			expect.arrayContaining([
				expect.objectContaining({
					name: "auditor",
					errors: ["请选择审核人"],
				}),
			]),
		);
	});

	it("删除当前 tab 后会切换到剩余 tab，删除最后一个 tab 时会清空 Form", () => {
		const form = createFormMock();
		const { result } = renderHook(() => useAiTagTabsForm(form));

		act(() => {
			result.current.initializeTabs([
				buildTab({ tempId: "tab-1", tagName: "第一个标签" }),
				buildTab({ tempId: "tab-2", tagName: "第二个标签" }),
			]);
		});
		act(() => {
			result.current.removeTab("tab-1");
		});

		expect(result.current.activeTabKey).toBe("tab-2");
		expect(form.setFieldsValue).toHaveBeenLastCalledWith(
			expect.objectContaining({ tagName: "第二个标签" }),
		);

		act(() => {
			result.current.removeTab("tab-2");
		});

		expect(result.current.activeTabKey).toBe("");
		expect(form.setFieldsValue).toHaveBeenLastCalledWith(
			expect.objectContaining({
				aliTagCode: undefined,
				aiSessionId: undefined,
				tagName: undefined,
				tagValue: undefined,
				isExisting: undefined,
			}),
		);
	});

	it("replaceTabs 后激活命中重名的 tab，会把删除导向错误回填到当前 Form", () => {
		const form = createFormMock();
		const { result } = renderHook(() => useAiTagTabsForm(form));

		act(() => {
			result.current.initializeTabs([
				buildTab({ tempId: "tab-1", tagName: "正常标签" }),
				buildTab({ tempId: "tab-2", tagName: "重复标签" }),
			]);
		});

		const duplicatedTabs = result.current.tabs.map((tab) =>
			tab.tempId === "tab-2"
				? {
						...tab,
						errors: {
							tagName: [INTELLIGENT_TAG_DUPLICATE_NAME_ERROR_MESSAGE],
						},
					}
				: tab,
		);

		act(() => {
			result.current.replaceTabs(duplicatedTabs);
			result.current.activateTab("tab-2", duplicatedTabs);
		});

		expect(result.current.tabs.find((tab) => tab.tempId === "tab-2")?.errors).toMatchObject({
			tagName: [INTELLIGENT_TAG_DUPLICATE_NAME_ERROR_MESSAGE],
		});
		expect(form.setFields).toHaveBeenLastCalledWith(
			expect.arrayContaining([
				expect.objectContaining({
					name: "tagName",
					errors: [INTELLIGENT_TAG_DUPLICATE_NAME_ERROR_MESSAGE],
				}),
			]),
		);
	});
});
