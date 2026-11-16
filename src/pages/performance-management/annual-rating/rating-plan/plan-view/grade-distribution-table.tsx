import type { GradeDistributionRow, GradeLevel } from "#src/api/performance-management/plan";

import type { TableColumnsType } from "antd";
import { PLAN_CHECK_RESULT } from "#src/api/performance-management/plan";

import { Table } from "antd";
import { useMemo } from "react";
import { CHECK_TEXT_COLOR } from "../config";

/**
 * 等级分布表格
 *
 * 表头分组为标准人数 / 实际人数 / 异常校验，每组包含 A、B+、B、C/D 四档；
 * 人员清单与分析报表采用相同的分组口径。
 *
 * @param props - 组件属性
 * @param props.rows - 等级分布行
 * @returns 等级分布表格
 *
 * @author 王善能
 * @since 2026-11-12
 */
export function GradeDistributionTable({ rows }: { rows: GradeDistributionRow[] }) {
	const columns = useMemo<TableColumnsType<GradeDistributionRow>>(() => {
		const groupColumns = (
			group: "standard" | "actual" | "check",
			title: string,
			hint?: string,
		): TableColumnsType<GradeDistributionRow>[number] => ({
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
				width: 64,
				// 实际人数单元格带浅灰底，提示可点击筛选
				onCell: group === "actual" ? () => ({ className: "bg-[#F5F7FA]" }) : undefined,
				render: (_text: unknown, record: GradeDistributionRow) => {
					if (group === "check") {
						const value = record.check[level];
						const color =
							value === PLAN_CHECK_RESULT.NORMAL
								? CHECK_TEXT_COLOR.normal
								: CHECK_TEXT_COLOR.abnormal;
						return (
							<span className="whitespace-nowrap" style={{ color }}>
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
				title: "岗位分类",
				dataIndex: "positionCategory",
				key: "positionCategory",
				width: 150,
			},
			{ title: "人数", dataIndex: "headCount", key: "headCount", align: "center", width: 72 },
			groupColumns("standard", "标准人数"),
			groupColumns("actual", "实际人数", "点击单元格可进行筛选"),
			groupColumns("check", "异常校验"),
		];
	}, []);

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
