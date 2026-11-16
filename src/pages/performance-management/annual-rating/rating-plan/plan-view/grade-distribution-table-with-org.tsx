import type { GradeDistributionRow, GradeLevel } from "#src/api/performance-management/plan";

import type { TableColumnsType } from "antd";
import { PLAN_CHECK_RESULT } from "#src/api/performance-management/plan";

import { Table } from "antd";
import { useMemo } from "react";
import { CHECK_TEXT_COLOR } from "../config";

/**
 * 计算合并行的 rowSpan
 *
 * 同一 organization（组织类型 + 组织名称）的连续行只在首行渲染组织列；
 * 异常情况说明同样按组织块合并。
 *
 * @param rows - 数据行
 * @returns 每个分组的起始下标与行数
 */
function buildOrgSpans(rows: GradeDistributionRow[]) {
	const spans: Array<{ start: number; length: number }> = [];
	rows.forEach((row, index) => {
		const prev = rows[index - 1];
		if (prev && prev.orgType === row.orgType && prev.orgName === row.orgName) {
			spans[spans.length - 1].length += 1;
		} else {
			spans.push({ start: index, length: 1 });
		}
	});
	return spans;
}

/**
 * 分析报表等级分布表格
 *
 * 相比人员清单的等级分布，额外包含「组织类型 / 组织名称」合并列与
 * 按组织合并的「异常情况说明」列。
 *
 * @param props - 组件属性
 * @param props.rows - 分析报表行
 * @returns 等级分布表格
 *
 * @author 王善能
 * @since 2026-11-12
 */
export function GradeDistributionTableWithOrg({ rows }: { rows: GradeDistributionRow[] }) {
	const orgStartMap = useMemo(() => {
		const map = new Map<number, number>();
		buildOrgSpans(rows).forEach((span) => map.set(span.start, span.length));
		return map;
	}, [rows]);

	const noteStartMap = useMemo(() => {
		const map = new Map<number, number>();
		buildOrgSpans(rows).forEach((span) => {
			if (rows[span.start]?.abnormalNote) {
				map.set(span.start, span.length);
			}
		});
		return map;
	}, [rows]);

	const columns = useMemo<TableColumnsType<GradeDistributionRow>>(() => {
		const groupColumns = (
			group: "standard" | "actual" | "check",
			title: string,
			width: number,
			hint?: string,
		) => ({
			title: hint ? (
				<span>
					{title}
					<em className="ml-1 text-xs not-italic text-[#909399]">{hint}</em>
				</span>
			) : (
				title
			),
			children: (["A", "B+", "B", "C/D"] as GradeLevel[]).map((level) => ({
				title: level,
				key: `${group}-${level}`,
				align: "center" as const,
				width,
				// 实际人数单元格带浅灰底，提示可点击筛选
				onCell: group === "actual" ? () => ({ className: "bg-[#F5F7FA]" }) : undefined,
				render: (_text: unknown, record: GradeDistributionRow) => {
					if (group === "check") {
						const value = record.check[level];
						return (
							<span
								className="whitespace-nowrap"
								style={{
									color:
										value === PLAN_CHECK_RESULT.NORMAL
											? CHECK_TEXT_COLOR.normal
											: CHECK_TEXT_COLOR.abnormal,
								}}
							>
								{value}
							</span>
						);
					}
					return record[group][level];
				},
			})),
		});

		return [
			{
				title: "组织类型",
				dataIndex: "orgType",
				key: "orgType",
				width: 80,
				onCell: (_record: GradeDistributionRow, index?: number) => ({
					rowSpan: index === undefined ? 0 : (orgStartMap.get(index) ?? 0),
				}),
			},
			{
				title: "组织名称",
				dataIndex: "orgName",
				key: "orgName",
				width: 80,
				onCell: (_record: GradeDistributionRow, index?: number) => ({
					rowSpan: index === undefined ? 0 : (orgStartMap.get(index) ?? 0),
				}),
			},
			{
				title: "岗位分类",
				dataIndex: "positionCategory",
				key: "positionCategory",
				width: 146,
			},
			{
				title: "人数",
				dataIndex: "headCount",
				key: "headCount",
				align: "center" as const,
				width: 50,
			},
			groupColumns("standard", "标准人数", 62),
			groupColumns("actual", "实际人数", 72, "点击单元格可进行筛选"),
			groupColumns("check", "异常校验", 98),
			{
				title: "异常情况说明",
				dataIndex: "abnormalNote",
				key: "abnormalNote",
				width: 132,
				render: (value?: string, _record?: GradeDistributionRow, index?: number) => {
					if (index === undefined || !noteStartMap.has(index)) return null;
					return <span className="text-xs leading-5 text-[#606266]">{value}</span>;
				},
				onCell: (_record: GradeDistributionRow, index?: number) => ({
					rowSpan: index === undefined ? 0 : (noteStartMap.get(index) ?? 0),
				}),
			},
		];
	}, [orgStartMap, noteStartMap]);

	return (
		<Table<GradeDistributionRow>
			rowKey="key"
			size="middle"
			columns={columns}
			dataSource={rows}
			pagination={false}
			bordered
			className="[&_.ant-table-thead>tr>th]:bg-[#f0f2f5]"
			onRow={(record) => (record.isTotal ? { className: "font-medium" } : {})}
		/>
	);
}
