import type {
	DeployPositionMatrixRow,
	PositionMatrixMetaItem,
} from "#src/api/org-brain/deployment";
import type { EditableMatrixTableHandle } from "#src/pages/org-brain/deployment/components/panel/config-matrix/EditableMatrixTable";
import type { EditableMatrixStateRow } from "#src/pages/org-brain/deployment/components/panel/config-matrix/matrixJobPositionUtils";
import type { ComponentProps } from "react";

import { EditableMatrixTable } from "#src/pages/org-brain/deployment/components/panel/config-matrix/EditableMatrixTable";
import { getMatrixRowSpans } from "#src/pages/org-brain/deployment/components/panel/config-matrix/getMatrixRowSpans";
import {
	normalizeEditableMatrixRows,
	resolveGroupCellMergeReady,
	resolveHierarchyCellMergeReady,
} from "#src/pages/org-brain/deployment/components/panel/config-matrix/matrixJobPositionUtils";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { useEffect, useRef, useState } from "react";

import { describe, expect, it, vi } from "vitest";

const { fetchMatchingModelListMock } = vi.hoisted(() => ({
	fetchMatchingModelListMock: vi.fn().mockResolvedValue({ list: [] }),
}));

const { matchingModelDrawerPropsMock } = vi.hoisted(() => ({
	matchingModelDrawerPropsMock: vi.fn(),
}));

vi.mock("#src/api/tag-management/tag-matching/model", () => ({
	fetchMatchingModelList: fetchMatchingModelListMock,
}));

vi.mock("#src/pages/tag-management/tag-matching/model/components/MatchingModelViewDrawer", () => ({
	default: () => null,
}));

vi.mock("#src/pages/tag-management/tag-matching/model/components/MatchingModelFormDrawer", () => ({
	default: ({
		open,
		onSuccess,
		...restProps
	}: {
		open: boolean;
		onSuccess?: (result?: { modelId?: string; modelName?: string }) => void;
	}) =>
		open
			? (matchingModelDrawerPropsMock(restProps),
				(
					<button
						type="button"
						onClick={() =>
							onSuccess?.({
								modelId: "900",
								modelName: "排兵布阵-test",
							})
						}
					>
						触发新增模型成功
					</button>
				))
			: null,
}));

const meta: PositionMatrixMetaItem[] = [
	{
		jobTypeName: "客服",
		authorizedJobId: "A001",
		authorizedJobName: "客服编制",
		jobCode: "J001",
		jobName: "客服",
		postCode: "P001",
		postName: "客服管家",
		positionLevel: "一星",
	},
];

function renderWithTableRef(props: ComponentProps<typeof EditableMatrixTable>) {
	let tableRef: EditableMatrixTableHandle | null = null;

	function RefHarness() {
		const innerRef = useRef<EditableMatrixTableHandle>(null);
		useEffect(() => {
			tableRef = innerRef.current;
		});
		return <EditableMatrixTable ref={innerRef} {...props} />;
	}

	return {
		...render(<RefHarness />),
		getTableRef: () => tableRef,
	};
}

describe("editableMatrixTable", () => {
	beforeEach(() => {
		matchingModelDrawerPropsMock.mockClear();
	});

	it("新增模型成功后，即使列表未及时刷新也会回填选中值并补齐下拉选项", async () => {
		fetchMatchingModelListMock.mockResolvedValue({ list: [] });
		const matrix: DeployPositionMatrixRow[] = [
			{
				rowKey: "row-1",
				departmentLine: "客服",
				authorizedJobId: "A001",
				authorizedJobName: "客服编制",
				jobCode: "J001",
				jobName: "客服",
				positionCode: "P001",
				positionName: "客服管家",
				positionLevel: "一星",
				requiredCount: 1,
			},
		];

		render(
			<EditableMatrixTable
				matrix={matrix}
				meta={meta}
				bodyScrollY={500}
				onChange={vi.fn()}
				orgMatchId="GSXX1181"
				orgMatchName="滨湖项目群"
			/>,
		);

		const addModelButtons = await screen.findAllByRole("button");
		const addModelButton = addModelButtons.find((button) =>
			button.getAttribute("class")?.includes("!bg-[#ecf5ff]"),
		);

		expect(addModelButton).toBeTruthy();
		fireEvent.click(addModelButton!);

		fireEvent.click(await screen.findByRole("button", { name: "触发新增模型成功" }));

		await waitFor(() => {
			expect(fetchMatchingModelListMock).toHaveBeenCalledWith({
				pageNum: 1,
				pageSize: 500,
				status: "1",
				orgMatchId: "GSXX1181",
				jobIds: ["J001"],
			});
		});

		expect(await screen.findByText("排兵布阵-test")).toBeInTheDocument();

		const matchingModelComboBox = document.getElementById("rows_0_tagMatchModelId");
		expect(matchingModelComboBox).not.toBeNull();
		if (!matchingModelComboBox) {
			throw new Error("未找到匹配模型下拉输入框");
		}
		fireEvent.mouseDown(matchingModelComboBox);

		expect(await screen.findByTitle("排兵布阵-test")).toBeInTheDocument();
	});

	it("暂存回显不完整行时，条线和编制岗位仍保持可编辑", async () => {
		const matrix: DeployPositionMatrixRow[] = [
			{
				rowKey: "stashed-only-count",
				departmentLine: "",
				authorizedJobId: "",
				authorizedJobName: "",
				jobCode: "",
				jobName: "",
				positionCode: "",
				positionName: "",
				positionLevel: "",
				requiredCount: 3,
			},
		];

		render(
			<EditableMatrixTable
				matrix={matrix}
				meta={meta}
				bodyScrollY={500}
				onChange={vi.fn()}
			/>,
		);

		await waitFor(() => {
			expect(screen.getAllByRole("combobox")).toHaveLength(4);
		});

		const row = screen.getByRole("row", { name: /请选择匹配模型/ });
		const editableFields = within(row).getAllByRole("combobox");

		expect(editableFields).toHaveLength(4);
		expect(editableFields.slice(0, 4).map((field) => field.id)).toEqual([
			"rows_0_departmentLine",
			"rows_0_authorizedJobId",
			"rows_0_jobPositionTreeValue",
			"rows_0_tagMatchModelId",
		]);
		expect(within(row).queryByText("/")).not.toBeInTheDocument();
	});

	it("只读模式下使用组合文案展示岗位-职位-职级", () => {
		const matrix: DeployPositionMatrixRow[] = [
			{
				rowKey: "readonly-row",
				departmentLine: "客服",
				authorizedJobId: "A001",
				authorizedJobName: "客服编制",
				jobCode: "J001",
				jobName: "客服",
				positionCode: "P001",
				positionName: "客服管家",
				positionLevel: "一星",
				requiredCount: 1,
			},
		];

		render(
			<EditableMatrixTable
				matrix={matrix}
				meta={meta}
				bodyScrollY={500}
				onChange={vi.fn()}
				readonly
			/>,
		);

		expect(screen.getByText("客服-客服管家-一星")).toBeInTheDocument();
	});

	it("当前值不在候选树里时，编辑态仍按组合文案回显", async () => {
		const matrix: DeployPositionMatrixRow[] = [
			{
				rowKey: "editable-fallback-row",
				departmentLine: "客服",
				authorizedJobId: "A001",
				authorizedJobName: "客服编制",
				jobCode: "J001",
				jobName: "客服",
				positionCode: "P999",
				positionName: "客服主管",
				positionLevel: "二星",
				requiredCount: 1,
			},
		];

		render(
			<EditableMatrixTable
				matrix={matrix}
				meta={meta}
				bodyScrollY={500}
				onChange={vi.fn()}
			/>,
		);

		await waitFor(() => {
			expect(screen.getByText("客服-客服主管-二星")).toBeInTheDocument();
		});
	});

	it("保存校验时，岗位-职位-职级作为必填项参与拦截", async () => {
		const matrix: DeployPositionMatrixRow[] = [
			{
				rowKey: "missing-job-position",
				departmentLine: "客服",
				authorizedJobId: "A001",
				authorizedJobName: "客服编制",
				jobCode: "",
				jobName: "",
				positionCode: "",
				positionName: "",
				positionLevel: "",
				tagMatchModelId: "900",
				tagMatchModelName: "排兵布阵-test",
				requiredCount: 1,
			},
		];

		const { getTableRef } = renderWithTableRef({
			matrix,
			meta,
			bodyScrollY: 500,
			onChange: vi.fn(),
		});

		await waitFor(() => {
			expect(getTableRef()).not.toBeNull();
		});

		let validateResult = true;
		await act(async () => {
			validateResult = await getTableRef()!.validate();
		});
		expect(validateResult).toBe(false);
	});

	it("下拉变更后紧接 blur 提交时，保留本次最新选择而不是回退到旧值", async () => {
		const handleChange = vi.fn();
		const matrix: DeployPositionMatrixRow[] = [
			{
				rowKey: "editing-authorized-job",
				departmentLine: "客服",
				authorizedJobId: "",
				authorizedJobName: "",
				jobCode: "",
				jobName: "",
				positionCode: "",
				positionName: "",
				positionLevel: "",
				requiredCount: 1,
			},
		];
		const editableMeta: PositionMatrixMetaItem[] = [
			{
				jobTypeName: "客服",
				authorizedJobId: "A001",
				authorizedJobName: "客服编制A",
				jobCode: "J001",
				jobName: "客服",
				postCode: "P001",
				postName: "客服管家",
				positionLevel: "一星",
			},
			{
				jobTypeName: "客服",
				authorizedJobId: "A002",
				authorizedJobName: "客服编制B",
				jobCode: "J002",
				jobName: "客服主管",
				postCode: "P002",
				postName: "客服主管",
				positionLevel: "二星",
			},
		];

		render(
			<EditableMatrixTable
				matrix={matrix}
				meta={editableMeta}
				bodyScrollY={500}
				onChange={handleChange}
			/>,
		);

		const authorizedSelect = document.getElementById("rows_0_authorizedJobId");
		expect(authorizedSelect).not.toBeNull();
		if (!authorizedSelect) {
			throw new Error("未找到编制岗位下拉框");
		}

		fireEvent.mouseDown(authorizedSelect);
		fireEvent.click(await screen.findByTitle("客服编制B"));
		fireEvent.blur(authorizedSelect);

		await waitFor(() => {
			expect(handleChange).toHaveBeenCalled();
		});

		const latestMatrix = handleChange.mock.calls.at(-1)?.[0] as
			| DeployPositionMatrixRow[]
			| undefined;
		expect(latestMatrix?.[0]).toMatchObject({
			departmentLine: "客服",
			authorizedJobId: "A002",
			authorizedJobName: "客服编制B",
		});
	});

	it("切换编制岗位时，会联动清空岗位-职位-职级和匹配模型", async () => {
		const handleChange = vi.fn();
		const matrix: EditableMatrixStateRow[] = [
			{
				rowKey: "reset-dependent-fields",
				departmentLine: "客服",
				authorizedJobId: "A001",
				authorizedJobName: "客服编制A",
				jobCode: "J001",
				jobName: "客服",
				positionCode: "P001",
				positionName: "客服管家",
				positionLevel: "一星",
				tagMatchModelId: "900",
				tagMatchModelName: "排兵布阵-test",
				requiredCount: 1,
				editMode: "row" as const,
				isGroupCellMergeReady: true,
				isHierarchyCellMergeReady: true,
				isMatchModelConfirmed: true,
			},
		];
		const editableMeta: PositionMatrixMetaItem[] = [
			{
				jobTypeName: "客服",
				authorizedJobId: "A001",
				authorizedJobName: "客服编制A",
				jobCode: "J001",
				jobName: "客服",
				postCode: "P001",
				postName: "客服管家",
				positionLevel: "一星",
			},
			{
				jobTypeName: "客服",
				authorizedJobId: "A002",
				authorizedJobName: "客服编制B",
				jobCode: "J002",
				jobName: "客服主管",
				postCode: "P002",
				postName: "客服主管",
				positionLevel: "二星",
			},
		];

		render(
			<EditableMatrixTable
				matrix={matrix}
				meta={editableMeta}
				bodyScrollY={500}
				onChange={handleChange}
				orgMatchId="GSXX1181"
			/>,
		);

		const authorizedSelect = document.getElementById("rows_0_authorizedJobId");
		expect(authorizedSelect).not.toBeNull();
		if (!authorizedSelect) {
			throw new Error("未找到编制岗位下拉框");
		}

		fireEvent.mouseDown(authorizedSelect);
		fireEvent.click(await screen.findByTitle("客服编制B"));
		fireEvent.blur(authorizedSelect);

		await waitFor(() => {
			expect(handleChange).toHaveBeenCalled();
		});

		const latestMatrix = handleChange.mock.calls.at(-1)?.[0] as
			| DeployPositionMatrixRow[]
			| undefined;
		expect(latestMatrix?.[0]).toMatchObject({
			authorizedJobId: "A002",
			authorizedJobName: "客服编制B",
			jobCode: undefined,
			jobName: "",
			positionCode: undefined,
			positionName: "",
			positionLevel: undefined,
			tagMatchModelId: undefined,
			tagMatchModelName: "",
		});
	});

	it("新增匹配模型时，保留岗位编码原值供抽屉继续解析岗位节点", async () => {
		const matrix: EditableMatrixStateRow[] = [
			{
				rowKey: "open-model-drawer",
				departmentLine: "客服",
				authorizedJobId: "A001",
				authorizedJobName: "客服编制A",
				jobCode: "J001",
				jobName: "客服",
				positionCode: "P001",
				positionName: "客服管家",
				positionLevel: "一星",
				requiredCount: 1,
				editMode: "row",
				isGroupCellMergeReady: true,
				isHierarchyCellMergeReady: true,
				isMatchModelConfirmed: true,
			},
		];

		render(
			<EditableMatrixTable
				matrix={matrix}
				meta={meta}
				bodyScrollY={500}
				onChange={vi.fn()}
				orgMatchId="GSXX1181"
				orgMatchName="滨湖项目群"
			/>,
		);

		const addModelButtons = await screen.findAllByRole("button");
		const addModelButton = addModelButtons.find((button) =>
			button.getAttribute("class")?.includes("!bg-[#ecf5ff]"),
		);
		expect(addModelButton).toBeTruthy();

		fireEvent.click(addModelButton!);

		await waitFor(() => {
			expect(matchingModelDrawerPropsMock).toHaveBeenCalled();
		});

		const latestDrawerProps = matchingModelDrawerPropsMock.mock.calls.at(-1)?.[0] as
			| {
					initialModelData?: {
						jobId?: number | string;
						postId?: number | string;
						postLevelId?: number | string;
					};
			  }
			| undefined;
		expect(latestDrawerProps?.initialModelData).toMatchObject({
			jobId: "J001",
			postId: "P001",
			postLevelId: "一星",
		});
	});

	it("行内新增子行时，继承并锁定编制岗位且不会把同条线拆成两段", async () => {
		const editableMeta: PositionMatrixMetaItem[] = [
			{
				jobTypeName: "项目管理",
				authorizedJobId: "A004",
				authorizedJobName: "4岗项目管理",
				jobCode: "J004",
				jobName: "项目管理（住宅）",
				postCode: "P004",
				postName: "项目经理",
				positionLevel: "4",
			},
			{
				jobTypeName: "项目管理",
				authorizedJobId: "A006",
				authorizedJobName: "6岗项目管理",
				jobCode: "J006",
				jobName: "项目管理（住宅）",
				postCode: "P006",
				postName: "项目经理",
				positionLevel: "6",
			},
			{
				jobTypeName: "项目管理",
				authorizedJobId: "A005",
				authorizedJobName: "5岗项目管理",
				jobCode: "J005",
				jobName: "项目管理（住宅）",
				postCode: "P005",
				postName: "项目经理",
				positionLevel: "5",
			},
			{
				jobTypeName: "项目管理",
				authorizedJobId: "A007",
				authorizedJobName: "新增项目管理",
				jobCode: "J007",
				jobName: "项目管理（住宅）",
				postCode: "P007",
				postName: "项目主管",
				positionLevel: "7",
			},
			{
				jobTypeName: "项目管理",
				authorizedJobId: "A007",
				authorizedJobName: "新增项目管理",
				jobCode: "J007",
				jobName: "项目管理（住宅）",
				postCode: "P008",
				postName: "项目经理助理",
				positionLevel: "8",
			},
		];
		const initialMatrix: DeployPositionMatrixRow[] = [
			{
				rowKey: "row-4",
				departmentLine: "项目管理",
				authorizedJobId: "A004",
				authorizedJobName: "4岗项目管理",
				jobCode: "J004",
				jobName: "项目管理（住宅）",
				positionCode: "P004",
				positionName: "项目经理",
				positionLevel: "4",
				requiredCount: 1,
			},
			{
				rowKey: "row-6",
				departmentLine: "项目管理",
				authorizedJobId: "A006",
				authorizedJobName: "6岗项目管理",
				jobCode: "J006",
				jobName: "项目管理（住宅）",
				positionCode: "P006",
				positionName: "项目经理",
				positionLevel: "6",
				requiredCount: 1,
			},
			{
				rowKey: "row-5",
				departmentLine: "项目管理",
				authorizedJobId: "A005",
				authorizedJobName: "5岗项目管理",
				jobCode: "J005",
				jobName: "项目管理（住宅）",
				positionCode: "P005",
				positionName: "项目经理",
				positionLevel: "5",
				requiredCount: 1,
			},
		];

		function ControlledMatrixTable() {
			const [matrix, setMatrix] = useState(initialMatrix);
			return (
				<EditableMatrixTable
					matrix={matrix}
					meta={editableMeta}
					bodyScrollY={500}
					onChange={setMatrix}
				/>
			);
		}

		render(<ControlledMatrixTable />);

		const targetRow = screen.getByRole("row", { name: /6岗项目管理/ });
		const rowButtons = within(targetRow).getAllByRole("button");
		const addRowButton = rowButtons.at(-2);
		expect(addRowButton).toBeDefined();
		fireEvent.click(addRowButton!);

		await waitFor(() => {
			const authorizedRowSpans = Array.from(document.querySelectorAll("td"))
				.filter((cell) => cell.textContent === "6岗项目管理")
				.map((cell) => Number(cell.getAttribute("rowspan") ?? "0"));
			expect(authorizedRowSpans).toEqual([2]);
		});
		expect(document.querySelectorAll('[id$="_authorizedJobId"]')).toHaveLength(0);

		await waitFor(() => {
			const departmentRowSpans = Array.from(document.querySelectorAll("td"))
				.filter((cell) => cell.textContent === "项目管理")
				.map((cell) => Number(cell.getAttribute("rowspan") ?? "0"));
			expect(departmentRowSpans).toEqual([4]);
		});
	});

	it("外新增行点行内新增时，仅继承条线和编制岗位值，不参与合并", async () => {
		const editableMeta: PositionMatrixMetaItem[] = [
			{
				jobTypeName: "安全",
				authorizedJobId: "A001",
				authorizedJobName: "安全员",
				jobCode: "J001",
				jobName: "安全管理",
				postCode: "P001",
				postName: "安全员",
				positionLevel: "1",
			},
			{
				jobTypeName: "安全",
				authorizedJobId: "A010",
				authorizedJobName: "安全班长",
				jobCode: "J010",
				jobName: "安全管理",
				postCode: "P010",
				postName: "安全班长",
				positionLevel: "2",
			},
		];
		const draftMatrix = [
			{
				rowKey: "initial-safety",
				departmentLine: "安全",
				authorizedJobId: "A001",
				authorizedJobName: "安全员",
				jobCode: "J001",
				jobName: "安全管理",
				positionCode: "P001",
				positionName: "安全员",
				positionLevel: "1",
				requiredCount: 1,
			},
			{
				rowKey: "draft-row",
				departmentLine: "安全",
				authorizedJobId: "A010",
				authorizedJobName: "安全班长",
				jobCode: undefined,
				jobName: "",
				positionCode: undefined,
				positionName: "",
				positionLevel: undefined,
				requiredCount: undefined,
				editMode: "full",
				isGroupCellMergeReady: false,
				isHierarchyCellMergeReady: false,
				isMatchModelConfirmed: false,
			},
		] satisfies EditableMatrixStateRow[];
		let latestMatrix: DeployPositionMatrixRow[] = draftMatrix;

		function ControlledDraftMatrixTable() {
			const [matrix, setMatrix] = useState<DeployPositionMatrixRow[]>(draftMatrix);
			useEffect(() => {
				latestMatrix = matrix;
			}, [matrix]);
			return (
				<EditableMatrixTable
					matrix={matrix}
					meta={editableMeta}
					bodyScrollY={500}
					onChange={setMatrix}
				/>
			);
		}

		render(<ControlledDraftMatrixTable />);

		const draftRow = screen.getByRole("row", { name: /安全班长/ });
		const rowButtons = within(draftRow).getAllByRole("button");
		const addRowButton = rowButtons.at(-2);
		expect(addRowButton).toBeDefined();
		fireEvent.click(addRowButton!);

		await waitFor(() => {
			expect(latestMatrix).toHaveLength(3);
			const parentDraftRow = latestMatrix.find((row) => row.rowKey === "draft-row");
			expect(parentDraftRow).toMatchObject({
				editMode: "full",
				isGroupCellMergeReady: false,
				isHierarchyCellMergeReady: false,
				departmentLine: "安全",
				authorizedJobId: "A010",
			});
			expect(
				(parentDraftRow as EditableMatrixStateRow | undefined)?.isAuthorizedJobLocked,
			).not.toBe(true);
			const childDraftRow = latestMatrix.find(
				(row) => row.rowKey !== "draft-row" && String(row.rowKey).startsWith("new_"),
			);
			expect(childDraftRow).toMatchObject({
				editMode: "full",
				isGroupCellMergeReady: false,
				isHierarchyCellMergeReady: false,
				departmentLine: "安全",
				authorizedJobId: "A010",
				authorizedJobName: "安全班长",
				jobCode: undefined,
			});
			expect(
				(childDraftRow as EditableMatrixStateRow | undefined)?.isAuthorizedJobLocked,
			).not.toBe(true);
		});

		const normalizedRows = normalizeEditableMatrixRows(
			latestMatrix as EditableMatrixStateRow[],
		);
		const spans = getMatrixRowSpans(normalizedRows, {
			canMergeGroupCell: resolveGroupCellMergeReady,
			canMergeHierarchyCells: resolveHierarchyCellMergeReady,
		});
		expect(normalizedRows.map((row) => row.rowKey)).toEqual([
			"initial-safety",
			"draft-row",
			expect.stringMatching(/^new_/),
		]);
		expect(spans.departmentLine).toEqual([1, 1, 1]);
		expect(spans.authorizedJobName).toEqual([1, 1, 1]);
	});

	it("保存校验时，相同岗位-职位-职级组合只允许配置一条", async () => {
		const duplicateMatrix: DeployPositionMatrixRow[] = [
			{
				rowKey: "row-1",
				departmentLine: "客服",
				authorizedJobId: "A001",
				authorizedJobName: "客服编制",
				jobCode: "J001",
				jobName: "客服",
				positionCode: "P001",
				positionName: "客服管家",
				positionLevel: "一星",
				tagMatchModelId: "900",
				tagMatchModelName: "排兵布阵-test",
				requiredCount: 1,
			},
			{
				rowKey: "row-2",
				departmentLine: "客服",
				authorizedJobId: "A001",
				authorizedJobName: "客服编制",
				jobCode: "J001",
				jobName: "客服",
				positionCode: "P001",
				positionName: "客服管家",
				positionLevel: "一星",
				tagMatchModelId: "901",
				tagMatchModelName: "排兵布阵-test-2",
				requiredCount: 2,
			},
		];

		const { container, getTableRef } = renderWithTableRef({
			matrix: duplicateMatrix,
			meta,
			bodyScrollY: 500,
			onChange: vi.fn(),
		});

		await waitFor(() => {
			expect(getTableRef()).not.toBeNull();
		});

		let validateResult = true;
		await act(async () => {
			validateResult = await getTableRef()!.validate();
		});
		expect(validateResult).toBe(false);
		await waitFor(() => {
			expect(container.querySelectorAll(".ant-select-status-error")).toHaveLength(2);
		});
	});
});
