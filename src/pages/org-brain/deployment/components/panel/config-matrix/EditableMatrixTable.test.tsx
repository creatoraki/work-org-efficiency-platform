import type { DeployPositionMatrixRow } from "#src/api/org-brain/deployment";
import type { EditableMatrixTableHandle } from "./EditableMatrixTable";
import type { EditableMatrixStateRow } from "./matrixJobPositionUtils";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import { EditableMatrixTable } from "./EditableMatrixTable";

vi.mock("#src/api/tag-management/tag-matching/model", () => ({
	fetchMatchingModelList: vi.fn().mockResolvedValue({
		list: [
			{
				id: "model-1",
				name: "王小智",
				orgId: "org-1",
				orgLevel: "SYS",
				status: "1",
			},
		],
	}),
}));

vi.mock("#src/pages/tag-management/tag-matching/model/components/MatchingModelViewDrawer", () => ({
	default: () => null,
}));

vi.mock("#src/pages/tag-management/tag-matching/model/components/MatchingModelFormDrawer", () => ({
	default: () => null,
}));

const baseRow: DeployPositionMatrixRow = {
	rowKey: "row-1",
	departmentLine: "客服",
	authorizedJobId: "auth-1",
	authorizedJobName: "客服管理",
	jobCode: "job-1",
	jobName: "客服主管（住宅）",
	positionCode: "post-1",
	positionName: "客服经理",
	positionLevel: "6",
};

/**
 * 为岗位矩阵测试提供隔离的 React Query 上下文。
 *
 * @param ui - 待渲染的岗位矩阵组件。
 * @returns Testing Library 渲染结果。
 *
 * @author 王善能
 * @since 2026-08-10
 */
function renderMatrixTable(ui: React.ReactElement) {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { gcTime: 0, retry: false },
		},
	});
	return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("editableMatrixTable", () => {
	it("填写人数后应即时清除人数字段错误", async () => {
		let tableRef: EditableMatrixTableHandle | null = null;
		const onChange = vi.fn();
		const { container } = renderMatrixTable(
			<EditableMatrixTable
				ref={(instance) => {
					tableRef = instance;
				}}
				matrix={[baseRow]}
				meta={[]}
				orgMatchId="org-1"
				onChange={onChange}
			/>,
		);

		await act(async () => {
			expect(await tableRef?.validate()).toBe(false);
		});

		expect(container.querySelector(".ant-input-number-status-error")).toBeInTheDocument();
		expect(container.querySelector(".ant-select-status-error")).toBeInTheDocument();

		const requiredCountInput = screen.getByPlaceholderText("请输入人数");
		fireEvent.change(requiredCountInput, {
			target: { value: "3" },
		});

		await waitFor(() => {
			expect(
				container.querySelector(".ant-input-number-status-error"),
			).not.toBeInTheDocument();
		});
		expect(container.querySelector(".ant-select-status-error")).toBeInTheDocument();
	});

	it("下一步校验在字段补齐后应通过", async () => {
		let tableRef: EditableMatrixTableHandle | null = null;
		const onChange = vi.fn();
		const { container } = renderMatrixTable(
			<EditableMatrixTable
				ref={(instance) => {
					tableRef = instance;
				}}
				matrix={[
					{
						...baseRow,
						tagMatchModelId: "model-1",
						tagMatchModelName: "王小智",
					},
				]}
				meta={[]}
				orgMatchId="org-1"
				onChange={onChange}
			/>,
		);

		await act(async () => {
			expect(await tableRef?.validate()).toBe(false);
		});

		const requiredCountInput = screen.getByPlaceholderText("请输入人数");
		fireEvent.change(requiredCountInput, {
			target: { value: "3" },
		});

		await waitFor(() => {
			expect(
				container.querySelector(".ant-input-number-status-error"),
			).not.toBeInTheDocument();
		});

		await act(async () => {
			expect(await tableRef?.validate()).toBe(true);
		});
	});

	it("空矩阵可新增一行供用户自行配置", async () => {
		const onChange = vi.fn();
		renderMatrixTable(
			<EditableMatrixTable matrix={[]} meta={[]} orgMatchId="org-1" onChange={onChange} />,
		);

		fireEvent.click(screen.getByRole("button", { name: "新增" }));

		await waitFor(() => {
			expect(onChange.mock.lastCall?.[0]).toHaveLength(1);
		});

		expect(onChange.mock.lastCall?.[0][0]).toMatchObject({
			editMode: "full",
			groupSource: "draft",
			departmentLine: undefined,
			authorizedJobId: undefined,
		});
	});

	it("初始行组内新增时应继承当前行的条线与编制岗位，并并回初始分组", async () => {
		const onChange = vi.fn();
		const { container } = renderMatrixTable(
			<EditableMatrixTable
				matrix={[baseRow]}
				meta={[]}
				orgMatchId="org-1"
				onChange={onChange}
			/>,
		);

		const getAddRowButtons = () =>
			Array.from(container.querySelectorAll("button")).filter((button) =>
				button.querySelector(".anticon-plus"),
			);

		expect(getAddRowButtons()).toHaveLength(1);

		fireEvent.click(getAddRowButtons()[0]!);
		await waitFor(() => {
			expect(onChange.mock.lastCall?.[0]).toHaveLength(2);
		});

		const latestMatrix = onChange.mock.lastCall?.[0] as EditableMatrixStateRow[];

		expect(latestMatrix).toHaveLength(2);
		expect(latestMatrix[1]).toMatchObject({
			departmentLine: baseRow.departmentLine,
			authorizedJobId: baseRow.authorizedJobId,
			authorizedJobName: baseRow.authorizedJobName,
			jobCode: undefined,
			positionCode: undefined,
			requiredCount: undefined,
			tagMatchModelId: undefined,
			editMode: "row",
			isAuthorizedJobLocked: true,
			isHierarchyCellMergeReady: true,
			mergeGroupId: `initial::${baseRow.departmentLine}`,
		});
	});

	it("外新增行组内新增时应继承当前草稿组，不串到其他组", async () => {
		const onChange = vi.fn();
		const draftGroupRow: EditableMatrixStateRow = {
			...baseRow,
			rowKey: "draft-row-1",
			groupSource: "draft",
			mergeGroupId: "draft::group-1",
			editMode: "full",
			isGroupCellMergeReady: false,
			isHierarchyCellMergeReady: false,
			tagMatchModelId: undefined,
			tagMatchModelName: "",
			requiredCount: undefined,
		};

		const { container } = renderMatrixTable(
			<EditableMatrixTable
				matrix={[draftGroupRow]}
				meta={[]}
				orgMatchId="org-1"
				onChange={onChange}
			/>,
		);

		const getAddRowButtons = () =>
			Array.from(container.querySelectorAll("button")).filter((button) =>
				button.querySelector(".anticon-plus"),
			);

		fireEvent.click(getAddRowButtons()[0]!);

		await waitFor(() => {
			expect(onChange.mock.lastCall?.[0]).toHaveLength(2);
		});

		const latestMatrix = onChange.mock.lastCall?.[0] as EditableMatrixStateRow[];

		expect(latestMatrix[1]).toMatchObject({
			groupSource: "draft",
			mergeGroupId: "draft::group-1",
			departmentLine: draftGroupRow.departmentLine,
			authorizedJobId: draftGroupRow.authorizedJobId,
			authorizedJobName: draftGroupRow.authorizedJobName,
			jobCode: undefined,
			positionCode: undefined,
			requiredCount: undefined,
			tagMatchModelId: undefined,
			editMode: "full",
			isAuthorizedJobLocked: false,
			isGroupCellMergeReady: false,
			isHierarchyCellMergeReady: false,
		});
	});
});
