import type { DeployPositionMatrixRow } from "#src/api/org-brain/deployment";
import type { ColumnsType } from "antd/es/table";

import { cn } from "#src/utils";
import { Table } from "antd";
import { useMemo } from "react";

import {
	FULLY_MERGEABLE_MATRIX_ELIGIBILITY,
	getMatrixMergeCellProps,
	getMatrixRowSpans,
	groupMatrixRowsForMerge,
} from "./getMatrixRowSpans";
import { buildMatrixJobPositionSelectionLabel } from "./matrixJobPositionUtils";

interface BenchmarkMatrixTableProps {
	matrix: DeployPositionMatrixRow[];
	/** 表体纵向滚动高度；传 false 时不限制高度，按内容自然撑开 */
	bodyScrollY?: number | false;
}

function buildMatrixTableScroll(x: number | string, bodyScrollY?: number | false) {
	return {
		x,
		...(typeof bodyScrollY === "number" ? { y: bodyScrollY } : {}),
	};
}

export function BenchmarkMatrixTable({ matrix, bodyScrollY }: BenchmarkMatrixTableProps) {
	// 后端 init 数据不保证按条线、编制分组连续排列，先做一次稳定分组排序，
	// 保证展示顺序与 rowSpan 合并算法所需的物理相邻前提一致
	const groupedMatrix = useMemo(() => groupMatrixRowsForMerge(matrix), [matrix]);
	const spans = getMatrixRowSpans(groupedMatrix, FULLY_MERGEABLE_MATRIX_ELIGIBILITY);
	const columns: ColumnsType<DeployPositionMatrixRow> = [
		{
			title: "条线",
			dataIndex: "departmentLine",
			width: 120,
			onCell: (_: DeployPositionMatrixRow, index?: number) =>
				getMatrixMergeCellProps(spans, "departmentLine", index),
		},
		{
			title: "编制岗位",
			dataIndex: "authorizedJobName",
			width: 120,
			onCell: (_: DeployPositionMatrixRow, index?: number) =>
				getMatrixMergeCellProps(spans, "authorizedJobName", index),
			render: (value?: string) => value || "/",
		},
		{
			title: "岗位-职位-职级",
			key: "jobPositionLabel",
			width: 240,
			render: (_, record) => buildMatrixJobPositionSelectionLabel(record) || "/",
		},
		{ title: "人数（人）", dataIndex: "requiredCount", width: 100 },
	];

	return (
		<Table<DeployPositionMatrixRow>
			dataSource={groupedMatrix}
			columns={columns}
			rowKey="rowKey"
			size="small"
			pagination={false}
			bordered
			scroll={buildMatrixTableScroll("max-content", bodyScrollY)}
			className={cn(
				typeof bodyScrollY === "number" && "h-full min-h-0",
				typeof bodyScrollY === "number" && "[&_.ant-table-body]:!overflow-y-auto",
			)}
		/>
	);
}
