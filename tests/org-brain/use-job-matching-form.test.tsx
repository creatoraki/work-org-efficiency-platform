import type { OrganizationTreeNode } from "#src/api/common";
import type { JobMatchCandidateItem } from "#src/api/org-brain/candidate";
import type { JobMatchingDetail, JobMatchingItem } from "#src/api/org-brain/job-matching";
import type { FormInstance } from "antd";
import type { ReactNode } from "react";

import { useJobMatchingForm } from "#src/pages/org-brain/job-matching/components/job-matching-drawer/hooks/useJobMatchingForm";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { Form } from "antd";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

interface FormMock extends FormInstance {
	getStore: () => Record<string, unknown>;
}

function createQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: { retry: false },
			mutations: { retry: false },
		},
	});
}

function createWrapper(queryClient: QueryClient) {
	return function QueryWrapper({ children }: { children: ReactNode }) {
		return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
	};
}

function createFormMock(initialValues: Record<string, unknown> = {}): FormMock {
	const store = { ...initialValues };
	return {
		getFieldValue: vi.fn((name: string) => store[name]),
		getFieldsValue: vi.fn((names?: string[]) => {
			if (!names) {
				return { ...store };
			}
			return Object.fromEntries(names.map((name) => [name, store[name]]));
		}),
		setFieldsValue: vi.fn((values: Record<string, unknown>) => {
			Object.assign(store, values);
		}),
		setFieldValue: vi.fn((name: string, value: unknown) => {
			store[name] = value;
		}),
		setFields: vi.fn(),
		resetFields: vi.fn(() => {
			Object.keys(store).forEach((key) => {
				delete store[key];
			});
		}),
		validateFields: vi.fn(async () => ({ ...store })),
		getStore: () => ({ ...store }),
	} as unknown as FormMock;
}

const organizationTreeData: OrganizationTreeNode = {
	id: "1001",
	name: "绿城服务集团",
	code: "1001",
	ancestors: "绿城服务集团",
	fullname: "绿城服务集团",
	level: "GROUP",
	children: [],
};

const candidateA: JobMatchCandidateItem = {
	userId: 1,
	empCode: "EMP001",
	username: "黄丁",
	isSelected: true,
	matchScore: 88,
};

const candidateB: JobMatchCandidateItem = {
	userId: 2,
	empCode: "EMP002",
	username: "张建国",
	isSelected: false,
	matchScore: 76,
};

function buildPreviewData(): JobMatchingItem {
	return {
		id: "900041",
		taskName: "人岗匹配测试",
		orgCode: "1001",
		orgName: "绿城服务集团",
		orgFullPath: "绿城服务集团",
		orgFullName: "绿城服务集团",
		jobId: 2001,
		jobName: "经营管理",
		postId: 3001,
		postName: "副总经理",
		postgradeId: "6",
		postgradeName: "6",
		modelId: 55,
		modelName: "人岗匹配测试",
		modelSnapshot: '{"version":1}',
		modelSnapshotHash: "hash-preview",
		modelChanged: false,
		modelOnline: true,
		candidates: [candidateA, candidateB],
		candidateName: "黄丁",
		matchScore: 88,
		operatorAccount: "ruoyi",
		operatorName: "若依",
		createTime: "2026-07-10 09:00:00",
		updateTime: "2026-07-10 10:00:00",
	} as unknown as JobMatchingItem;
}

function buildDetailData(): JobMatchingDetail {
	const previewData = buildPreviewData();
	return {
		...previewData,
		jobId: String(previewData.jobId),
		postId: String(previewData.postId),
		postgradeId: previewData.postgradeId,
		selectedCandidate: candidateA,
		candidateList: [candidateA, candidateB],
	} as JobMatchingDetail;
}

describe("useJobMatchingForm", () => {
	beforeEach(() => {
		vi.spyOn(Form, "useWatch").mockImplementation((name, form) => {
			return (form as FormMock).getFieldValue(String(name));
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("新增态重置会恢复为空白表单", async () => {
		const form = createFormMock({
			taskName: "临时任务",
			orgCode: "1001",
			jobId: "2001",
			postId: "3001",
			postgradeId: "6",
			modelOption: {
				value: "55",
				label: "测试模型",
			},
		});
		const queryClient = createQueryClient();
		const wrapper = createWrapper(queryClient);

		const { result } = renderHook(
			() =>
				useJobMatchingForm({
					form,
					mode: "add",
					open: true,
					organizationTreeData,
				}),
			{ wrapper },
		);

		await act(async () => {
			result.current.handleReset();
		});

		expect(form.getStore()).toMatchObject({
			taskName: undefined,
			orgCode: undefined,
			jobId: undefined,
			postId: undefined,
			postgradeId: undefined,
			modelOption: undefined,
			modelSnapshot: undefined,
			modelSnapshotHash: undefined,
		});
		expect(result.current.candidates).toEqual([]);
		expect(result.current.hasMatched).toBe(false);
	});

	it("编辑态重置会恢复到详情 baseline，并恢复初始候选人状态", async () => {
		const detailData = buildDetailData();
		const form = createFormMock();
		const queryClient = createQueryClient();
		const wrapper = createWrapper(queryClient);

		const { result } = renderHook(
			() =>
				useJobMatchingForm({
					form,
					mode: "edit",
					open: true,
					canInitializeForm: true,
					canResetToInitialState: true,
					initialData: detailData,
					previewData: buildPreviewData(),
					organizationTreeData,
				}),
			{ wrapper },
		);

		await waitFor(() => {
			expect(result.current.isEditCandidateReady).toBe(true);
			expect(result.current.candidates).toHaveLength(2);
		});

		act(() => {
			form.setFieldsValue({
				taskName: "已修改任务名",
				modelOption: {
					value: "99",
					label: "其他模型",
				},
			});
			result.current.handleSelectCandidate(candidateB);
		});

		await act(async () => {
			result.current.handleReset();
		});

		expect(form.getStore()).toMatchObject({
			taskName: "人岗匹配测试",
			orgCode: "1001",
			jobId: "2001",
			postId: "3001",
			postgradeId: "6",
			modelOption: {
				value: "55",
				label: "人岗匹配测试",
			},
			modelSnapshot: '{"version":1}',
			modelSnapshotHash: "hash-preview",
		});
		expect(result.current.selectedCandidates).toEqual([candidateA]);
		expect(result.current.selectedCandidate).toEqual(candidateA);
		expect(result.current.hasMatched).toBe(true);
	});
});
