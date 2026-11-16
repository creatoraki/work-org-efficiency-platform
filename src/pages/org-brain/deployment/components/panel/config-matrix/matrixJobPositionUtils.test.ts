import type { PositionMatrixMetaItem } from "#src/api/org-brain/deployment";

import { describe, expect, it } from "vitest";

import {
	buildMatrixRowOptions,
	collectUsedMatrixJobPositionValues,
	filterMatrixJobPositionTreeOptions,
	isInitialGroupedChildRow,
	markEditingRow,
	MATRIX_DUPLICATE_ERROR_MESSAGE,
	mergeMatrixDuplicateError,
} from "./matrixJobPositionUtils";

const baseMetaItem = {
	id: "1",
	jobTypeCode: "line-1",
	jobTypeName: "安全",
	authorizedJobId: "auth-1",
	authorizedJobName: "安全员",
} as const;

function createMetaItem(overrides: Partial<PositionMatrixMetaItem>): PositionMatrixMetaItem {
	return {
		...baseMetaItem,
		jobCode: "job-1",
		jobName: "安全",
		postCode: "post-1",
		postName: "安全员",
		positionLevel: "1",
		...overrides,
	} as PositionMatrixMetaItem;
}

describe("matrixJobPositionUtils", () => {
	it("仅过滤同组下最后一级已占用选项", () => {
		const meta = [
			createMetaItem({
				jobCode: "job-1",
				jobName: "安全",
				postCode: "post-1",
				postName: "安全员",
				positionLevel: "1",
			}),
			createMetaItem({
				jobCode: "job-1",
				jobName: "安全",
				postCode: "post-2",
				postName: "安全员",
				positionLevel: "2",
			}),
		];
		const { jobPositionTreeOptions } = buildMatrixRowOptions(meta, {
			departmentLine: "安全",
			authorizedJobId: "auth-1",
		});

		const filteredOptions = filterMatrixJobPositionTreeOptions(
			jobPositionTreeOptions,
			new Set(["job-1::post-1::1"]),
		);

		expect(filteredOptions).toHaveLength(1);
		expect(filteredOptions[0]?.children?.map((item) => item.value)).toEqual([
			"job-1::post-2::2",
		]);
	});

	it("编辑当前值时保留已选中的最后一级选项", () => {
		const meta = [
			createMetaItem({
				jobCode: "job-1",
				jobName: "安全",
				postCode: "post-1",
				postName: "安全员",
				positionLevel: "1",
			}),
			createMetaItem({
				jobCode: "job-1",
				jobName: "安全",
				postCode: "post-2",
				postName: "安全员",
				positionLevel: "2",
			}),
		];
		const { jobPositionTreeOptions } = buildMatrixRowOptions(meta, {
			departmentLine: "安全",
			authorizedJobId: "auth-1",
		});

		const filteredOptions = filterMatrixJobPositionTreeOptions(
			jobPositionTreeOptions,
			new Set(["job-1::post-1::1", "job-1::post-2::2"]),
			"job-1::post-1::1",
		);

		expect(filteredOptions[0]?.children?.map((item) => item.value)).toEqual([
			"job-1::post-1::1",
		]);
	});

	it("重复错误合并时不覆盖字段上的其他错误信息", () => {
		expect(
			mergeMatrixDuplicateError(["请选择岗位-职位-职级"], {
				hasDuplicate: true,
			}),
		).toEqual(["请选择岗位-职位-职级", MATRIX_DUPLICATE_ERROR_MESSAGE]);

		expect(
			mergeMatrixDuplicateError(["请选择岗位-职位-职级", MATRIX_DUPLICATE_ERROR_MESSAGE], {
				hasDuplicate: false,
			}),
		).toEqual(["请选择岗位-职位-职级"]);
	});

	it("仅统计同条线同编制岗位的已占用最后一级组合值", () => {
		const usedValues = collectUsedMatrixJobPositionValues(
			[
				{
					rowKey: "row-1",
					departmentLine: "安全",
					authorizedJobId: "auth-1",
					jobCode: "job-1",
					positionCode: "post-1",
					positionLevel: "1",
				},
				{
					rowKey: "row-2",
					departmentLine: "安全",
					authorizedJobId: "auth-2",
					jobCode: "job-1",
					positionCode: "post-2",
					positionLevel: "2",
				},
				{
					rowKey: "row-3",
					departmentLine: "绿化",
					authorizedJobId: "auth-1",
					jobCode: "job-1",
					positionCode: "post-3",
					positionLevel: "3",
				},
			],
			{
				rowKey: "row-4",
				departmentLine: "安全",
				authorizedJobId: "auth-1",
			},
		);

		expect(Array.from(usedValues)).toEqual(["job-1::post-1::1"]);
	});

	it("初始组内子行在编辑过程中保持前两列合并态", () => {
		const editedRow = markEditingRow({
			rowKey: "row-1",
			groupSource: "initial",
			mergeGroupId: "initial::工程",
			departmentLine: "工程",
			authorizedJobId: "auth-1",
			authorizedJobName: "工程管理",
			editMode: "row",
			isGroupCellMergeReady: true,
			isHierarchyCellMergeReady: true,
		});

		expect(isInitialGroupedChildRow(editedRow)).toBe(true);
		expect(editedRow.isGroupCellMergeReady).toBe(true);
		expect(editedRow.isHierarchyCellMergeReady).toBe(true);
	});
});
