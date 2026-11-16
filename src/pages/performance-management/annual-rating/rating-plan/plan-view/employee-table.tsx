import type { PlanEmployeeQuery, PlanEmployeeRow } from "#src/api/performance-management/plan";

import { fetchPlanEmployeeList, PLAN_CHECK_RESULT } from "#src/api/performance-management/plan";
import { exportCsv } from "#src/pages/performance-management/annual-rating/components/export-csv";
import {
	LabeledInput,
	LabeledSelect,
} from "#src/pages/performance-management/annual-rating/components/filter-fields";
import { SectionTitle } from "#src/pages/performance-management/annual-rating/components/section-title";
import { useAnnualRatingDict } from "#src/pages/performance-management/annual-rating/hooks/use-annual-rating-dict";
import { UploadOutlined } from "@ant-design/icons";
import { Button, Table } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
	CHECK_STATUS_OPTIONS,
	EMPLOYEE_STATUS_COLOR_MAP,
	EMPLOYMENT_STATUS_OPTIONS,
	POSITION_CATEGORY_OPTIONS,
	SUBMIT_GRADE_OPTIONS,
} from "../config";

/**
 * 人员清单表格
 *
 * 顶部为六项筛选 + 查询/重置，底部为人员清单分页表格。
 *
 * @returns 人员清单表格
 *
 * @author 王善能
 * @since 2026-11-12
 */
export function EmployeeTable() {
	const [query, setQuery] = useState<PlanEmployeeQuery>({});
	const [rows, setRows] = useState<PlanEmployeeRow[]>([]);
	const [loading, setLoading] = useState(false);
	const { statusOptions, statusLabel } = useAnnualRatingDict();

	const load = useCallback(
		async (next: PlanEmployeeQuery = query) => {
			setLoading(true);
			try {
				const result = await fetchPlanEmployeeList(next);
				setRows(result.data);
			} finally {
				setLoading(false);
			}
		},
		[query],
	);

	useEffect(() => {
		load({});
	}, []);

	const update = (key: keyof PlanEmployeeQuery, next?: string) => {
		setQuery((current) => ({ ...current, [key]: next || undefined }));
	};

	const columns = useMemo(
		() => [
			{ title: "员工", dataIndex: "name", key: "name", width: 80 },
			{ title: "工号", dataIndex: "employeeNo", key: "employeeNo", width: 90 },
			{ title: "部门", dataIndex: "department", key: "department", width: 110 },
			{ title: "岗位", dataIndex: "position", key: "position", width: 70 },
			{
				title: "自评分",
				dataIndex: "selfScore",
				key: "selfScore",
				width: 80,
				render: (value: number) => value.toFixed(2),
			},
			{
				title: "提报评分",
				dataIndex: "submitScore",
				key: "submitScore",
				width: 90,
				render: (value: number) => (
					<span className="text-[#0075FF]">{value.toFixed(2)}</span>
				),
			},
			{ title: "一级部门排名", dataIndex: "rank", key: "rank", width: 110 },
			{ title: "建议等级", dataIndex: "suggestGrade", key: "suggestGrade", width: 90 },
			{ title: "提报等级", dataIndex: "submitGrade", key: "submitGrade", width: 90 },
			{
				title: "校验",
				dataIndex: "checkStatus",
				key: "checkStatus",
				width: 110,
				render: (value: string) => {
					// 「正常 / 一致」为通过（绿点），其余为异常（红点）
					const color =
						value === PLAN_CHECK_RESULT.NORMAL || value === "一致"
							? "#14B968"
							: "#F5222D";
					return (
						<div className="flex items-center gap-1">
							<span
								className="size-1.5 shrink-0 rounded-full"
								style={{ backgroundColor: color }}
							/>
							<span style={{ color }}>{value}</span>
						</div>
					);
				},
			},
			{
				title: "异常情况说明",
				dataIndex: "abnormalNote",
				key: "abnormalNote",
				ellipsis: true,
			},
			{ title: "填报人", dataIndex: "submitter", key: "submitter", width: 90 },
			{
				title: "状态",
				dataIndex: "status",
				key: "status",
				width: 90,
				render: (value: string) => (
					<div className="flex items-center gap-1">
						<span
							className="size-1.5 shrink-0 rounded-full"
							style={{
								backgroundColor: EMPLOYEE_STATUS_COLOR_MAP[value] ?? "#C0C4CC",
							}}
						/>
						<span>{statusLabel(value)}</span>
					</div>
				),
			},
		],
		[statusLabel],
	);

	return (
		<div>
			<SectionTitle
				title="人员清单"
				extra={
					<button
						type="button"
						className="flex cursor-pointer items-center gap-1 rounded-[3px] border border-[#E4E7ED] bg-white px-3 py-[3px] text-sm leading-[22px] text-[#323233]"
						onClick={() => {
							const headers = [
								"员工",
								"工号",
								"部门",
								"岗位",
								"自评分",
								"提报评分",
								"一级部门排名",
								"建议等级",
								"提报等级",
								"校验",
								"异常情况说明",
								"填报人",
								"状态",
							];
							const csvRows = rows.map((item: PlanEmployeeRow) => [
								item.name,
								item.employeeNo,
								item.department,
								item.position,
								item.selfScore.toFixed(2),
								item.submitScore.toFixed(2),
								item.rank,
								item.suggestGrade,
								item.submitGrade,
								item.checkStatus,
								item.abnormalNote ?? "",
								item.submitter,
								statusLabel(item.status),
							]);
							exportCsv("人员清单.csv", headers, csvRows);
						}}
					>
						<UploadOutlined />
						导出
					</button>
				}
			/>
			<div className="mb-3 grid grid-cols-4 gap-3">
				<LabeledInput
					label="姓名/工号"
					value={query.keyword}
					onChange={(next) => update("keyword", next)}
				/>
				<LabeledSelect
					label="岗位类别"
					options={POSITION_CATEGORY_OPTIONS}
					value={query.positionCategory}
					onChange={(next) => update("positionCategory", next)}
				/>
				<LabeledSelect
					label="在职状态"
					options={EMPLOYMENT_STATUS_OPTIONS}
					value={query.employmentStatus}
					onChange={(next) => update("employmentStatus", next)}
				/>
				<LabeledSelect
					label="提报等级"
					options={SUBMIT_GRADE_OPTIONS}
					value={query.submitGrade}
					onChange={(next) => update("submitGrade", next)}
				/>
				<LabeledSelect
					label="校验情况"
					options={CHECK_STATUS_OPTIONS}
					value={query.checkStatus}
					onChange={(next) => update("checkStatus", next)}
				/>
				<LabeledSelect
					label="状态"
					options={statusOptions}
					value={query.status}
					onChange={(next) => update("status", next)}
				/>
				<div className="col-span-2 flex items-center justify-end gap-2">
					<Button
						type="primary"
						className="rounded-[3px] bg-[#0075FF]"
						onClick={() => load()}
					>
						查询
					</Button>
					<Button
						type="text"
						className="px-2 text-[#606266]"
						onClick={() => {
							setQuery({});
							load({});
						}}
					>
						重置
					</Button>
				</div>
			</div>
			<Table<PlanEmployeeRow>
				rowKey="key"
				size="middle"
				bordered
				loading={loading}
				columns={columns}
				dataSource={rows}
				scroll={{ x: 1300 }}
				pagination={{
					defaultPageSize: 20,
					showSizeChanger: true,
					showTotal: (total: number) => `共${total}条`,
				}}
				className="[&_.ant-table-thead>tr>th]:bg-[#f0f2f5]"
			/>
		</div>
	);
}
