import type { PositionMatrixMetaItem } from "#src/api/org-brain/deployment";
import type { EditableMatrixStateRow } from "#src/pages/org-brain/deployment/components/panel/config-matrix/matrixJobPositionUtils";

import { getMatrixRowSpans } from "#src/pages/org-brain/deployment/components/panel/config-matrix/getMatrixRowSpans";
import {
	buildMatrixJobPositionSelectionLabel,
	buildMatrixJobPositionValue,
	buildMatrixRowOptions,
	getNormalizedRowIndex,
	markEditingRow,
	normalizeEditableMatrixRows,
	resolveGroupCellMergeReady,
	resolveHierarchyCellMergeReady,
} from "#src/pages/org-brain/deployment/components/panel/config-matrix/matrixJobPositionUtils";
import { describe, expect, it } from "vitest";

function buildEditableRow(
	rowKey: string,
	patch?: Partial<EditableMatrixStateRow>,
): EditableMatrixStateRow {
	return {
		rowKey,
		departmentLine: "",
		authorizedJobId: "",
		authorizedJobName: "",
		jobCode: "",
		jobName: "",
		positionCode: "",
		positionName: "",
		positionLevel: "",
		requiredCount: 1,
		...patch,
	};
}

describe("matrixJobPositionUtils", () => {
	it("组合岗位 value 与组合展示文案保持稳定", () => {
		expect(
			buildMatrixJobPositionValue({
				jobCode: "J001",
				positionCode: "P001",
				positionLevel: "一星",
			}),
		).toBe("J001::P001::一星");
		expect(
			buildMatrixJobPositionSelectionLabel({
				jobName: "客服",
				positionName: "客服管家",
				positionLevel: "一星",
			}),
		).toBe("客服-客服管家-一星");
	});

	it("稳定重排时未具备编制合并资格的子行不会被错误吸附到别的分组", () => {
		const rows = [
			buildEditableRow("parent-a", {
				departmentLine: "客服",
				authorizedJobName: "客服编制A",
			}),
			buildEditableRow("child-a", {
				departmentLine: "客服",
				editMode: "row",
				isGroupCellMergeReady: true,
				isHierarchyCellMergeReady: false,
			}),
			buildEditableRow("parent-b", {
				departmentLine: "客服",
				authorizedJobName: "客服编制B",
			}),
			buildEditableRow("child-b", {
				departmentLine: "客服",
				editMode: "row",
				isGroupCellMergeReady: true,
				isHierarchyCellMergeReady: false,
			}),
		];

		expect(normalizeEditableMatrixRows(rows).map((row) => row.rowKey)).toEqual([
			"parent-a",
			"child-a",
			"parent-b",
			"child-b",
		]);
		expect(getNormalizedRowIndex(rows, "child-b")).toBe(3);
	});

	it("结构字段进入编辑态后会先退出合并，避免切换选项时整表立即重排", () => {
		const editedRow = markEditingRow(
			buildEditableRow("editing-row", {
				departmentLine: "客服",
				authorizedJobName: "客服编制A",
				editMode: "row",
				isGroupCellMergeReady: true,
				isHierarchyCellMergeReady: true,
			}),
		);

		expect(editedRow.isGroupCellMergeReady).toBe(false);
		expect(editedRow.isHierarchyCellMergeReady).toBe(false);
		expect(
			normalizeEditableMatrixRows([
				buildEditableRow("parent-a", {
					departmentLine: "客服",
					authorizedJobName: "客服编制A",
				}),
				editedRow,
				buildEditableRow("parent-b", {
					departmentLine: "客服",
					authorizedJobName: "客服编制B",
				}),
			]).map((row) => row.rowKey),
		).toEqual(["parent-a", "editing-row", "parent-b"]);
	});

	it("同条线内切换编制岗位时保留条线合并，只退出层级合并", () => {
		const editedRow = markEditingRow(
			buildEditableRow("editing-row", {
				departmentLine: "项目管理",
				authorizedJobName: "6岗项目管理",
				editMode: "row",
				isGroupCellMergeReady: true,
				isHierarchyCellMergeReady: true,
			}),
			{ preserveGroupCellMergeReady: true },
		);

		expect(editedRow.isGroupCellMergeReady).toBe(true);
		expect(editedRow.isHierarchyCellMergeReady).toBe(false);

		const rows = normalizeEditableMatrixRows([
			buildEditableRow("row-4", {
				departmentLine: "项目管理",
				authorizedJobName: "4岗项目管理",
			}),
			editedRow,
			buildEditableRow("row-5", {
				departmentLine: "项目管理",
				authorizedJobName: "5岗项目管理",
			}),
		]);

		expect(rows.map((row) => row.rowKey)).toEqual(["row-4", "editing-row", "row-5"]);
		expect(
			getMatrixRowSpans(rows, {
				canMergeGroupCell: resolveGroupCellMergeReady,
				canMergeHierarchyCells: resolveHierarchyCellMergeReady,
			}).departmentLine,
		).toEqual([3, 0, 0]);
	});

	it("组内新增行开始选择时，不会把同条线拆成多段", () => {
		const rows = normalizeEditableMatrixRows([
			buildEditableRow("row-4", {
				departmentLine: "项目管理",
				authorizedJobName: "4岗项目管理",
			}),
			buildEditableRow("row-6", {
				departmentLine: "项目管理",
				authorizedJobName: "6岗项目管理",
			}),
			markEditingRow(
				buildEditableRow("new-row", {
					departmentLine: "项目管理",
					authorizedJobName: "新增岗位",
					editMode: "row",
					isGroupCellMergeReady: true,
					isHierarchyCellMergeReady: false,
				}),
				{ preserveGroupCellMergeReady: true },
			),
			buildEditableRow("row-5", {
				departmentLine: "项目管理",
				authorizedJobName: "5岗项目管理",
			}),
		]);

		expect(rows.map((row) => row.rowKey)).toEqual(["row-4", "row-6", "new-row", "row-5"]);
		expect(
			getMatrixRowSpans(rows, {
				canMergeGroupCell: resolveGroupCellMergeReady,
				canMergeHierarchyCells: resolveHierarchyCellMergeReady,
			}),
		).toMatchObject({
			departmentLine: [4, 0, 0, 0],
			authorizedJobName: [1, 1, 1, 1],
		});
	});

	it("组内新增行补齐岗位职位职级后，仍保持同条线连续合并", () => {
		const rows = normalizeEditableMatrixRows([
			buildEditableRow("row-4", {
				departmentLine: "项目管理",
				authorizedJobId: "A004",
				authorizedJobName: "4岗项目管理",
				jobCode: "J004",
				jobName: "项目管理（住宅）",
				positionCode: "P004",
				positionName: "项目经理",
				positionLevel: "4",
			}),
			buildEditableRow("row-6", {
				departmentLine: "项目管理",
				authorizedJobId: "A006",
				authorizedJobName: "6岗项目管理",
				jobCode: "J006",
				jobName: "项目管理（住宅）",
				positionCode: "P006",
				positionName: "项目经理",
				positionLevel: "6",
			}),
			markEditingRow(
				buildEditableRow("new-row", {
					departmentLine: "项目管理",
					authorizedJobId: "A007",
					authorizedJobName: "新增项目管理",
					jobCode: "J007",
					jobName: "项目管理（住宅）",
					positionCode: "P007",
					positionName: "项目主管",
					positionLevel: "7",
					editMode: "row",
					isGroupCellMergeReady: true,
					isHierarchyCellMergeReady: true,
				}),
				{ preserveGroupCellMergeReady: true },
			),
			buildEditableRow("row-5", {
				departmentLine: "项目管理",
				authorizedJobId: "A005",
				authorizedJobName: "5岗项目管理",
				jobCode: "J005",
				jobName: "项目管理（住宅）",
				positionCode: "P005",
				positionName: "项目经理",
				positionLevel: "5",
			}),
		]);

		expect(rows.map((row) => row.rowKey)).toEqual(["row-4", "row-6", "new-row", "row-5"]);
		expect(
			getMatrixRowSpans(rows, {
				canMergeGroupCell: resolveGroupCellMergeReady,
				canMergeHierarchyCells: resolveHierarchyCellMergeReady,
			}),
		).toMatchObject({
			departmentLine: [4, 0, 0, 0],
			authorizedJobName: [1, 1, 1, 1],
		});
	});

	it("不同 mergeGroupId 的同条线行不会被重新归并到同一组", () => {
		const rows = normalizeEditableMatrixRows([
			buildEditableRow("initial-safety", {
				departmentLine: "安全",
				authorizedJobName: "安全员",
				mergeGroupId: "initial::安全",
			}),
			buildEditableRow("draft-parent", {
				departmentLine: "安全",
				authorizedJobId: "A010",
				authorizedJobName: "安全班长",
				editMode: "row",
				isGroupCellMergeReady: true,
				isHierarchyCellMergeReady: true,
				mergeGroupId: "draft::group-1",
			}),
			buildEditableRow("draft-child", {
				departmentLine: "安全",
				authorizedJobId: "A010",
				authorizedJobName: "安全班长",
				editMode: "row",
				isGroupCellMergeReady: true,
				isHierarchyCellMergeReady: true,
				mergeGroupId: "draft::group-1",
			}),
		]);

		expect(rows.map((row) => row.rowKey)).toEqual([
			"initial-safety",
			"draft-parent",
			"draft-child",
		]);
		expect(
			getMatrixRowSpans(rows, {
				canMergeGroupCell: resolveGroupCellMergeReady,
				canMergeHierarchyCells: resolveHierarchyCellMergeReady,
			}),
		).toMatchObject({
			departmentLine: [1, 2, 0],
			authorizedJobName: [1, 2, 0],
		});
	});

	it("当前值不在候选树里时，补到已有岗位父节点而不是生成重复父节点", () => {
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

		const rowOptions = buildMatrixRowOptions(
			meta,
			buildEditableRow("fallback-row", {
				departmentLine: "客服",
				authorizedJobId: "A001",
				authorizedJobName: "客服编制",
				jobCode: "J001",
				jobName: "客服",
				positionCode: "P999",
				positionName: "客服主管",
				positionLevel: "二星",
			}),
		);

		expect(rowOptions.jobPositionTreeOptions).toHaveLength(1);
		expect(rowOptions.jobPositionTreeOptions[0].value).toBe("job:J001");
		expect(
			rowOptions.jobPositionTreeOptions[0].children?.map((item) => item.selectionLabel),
		).toEqual(["客服-客服管家-一星", "客服-客服主管-二星"]);
	});
});
