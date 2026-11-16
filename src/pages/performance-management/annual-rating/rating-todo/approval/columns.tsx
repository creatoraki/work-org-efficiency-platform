import type {
	ApprovalDistributionRow,
	ApprovalEmployee,
} from "#src/api/performance-management/approval";
import type { TableColumnsType } from "antd";

import { ApprovalCheckStatus } from "#src/api/performance-management/approval";
import { distributionCheckColor } from "./approval-constants";
import { ApprovalStatus } from "./approval-shared";

const CD_LEVELS = ["A", "B+", "B", "C/D"] as const;
const ACTUAL_LEVELS = ["A", "B+", "B", "C", "D"] as const;

/** 等级分布列配置选项 */
interface ApprovalDistributionColumnOptions {
	/** 点击实际人数单元格回调，用于联动筛选提报名单 */
	onActualClick?: (level: string, record: ApprovalDistributionRow) => void;
}

/**
 * 获取等级分布列配置。
 *
 * @param options - 列配置选项
 * @param options.onActualClick - 点击实际人数单元格回调
 * @returns 等级分布列配置
 *
 * @author 王善能
 * @since 2026-11-13
 */
export function getApprovalDistributionColumns(
	options: ApprovalDistributionColumnOptions = {},
): TableColumnsType<ApprovalDistributionRow> {
	return [
		{ title: "岗位分类", dataIndex: "positionCategory", key: "positionCategory", width: 146 },
		{ title: "人数", dataIndex: "totalCount", key: "totalCount", align: "right", width: 50 },
		{
			title: "标准人数",
			children: CD_LEVELS.map((level) => ({
				title: level,
				key: `s-${level}`,
				align: "center" as const,
				width: 60,
				render: (_value: unknown, record: ApprovalDistributionRow) =>
					level === "C/D"
						? record.standard.cd
						: record.standard[level === "A" ? "a" : level === "B+" ? "bPlus" : "b"],
			})),
		},
		{
			title: (
				<span>
					实际人数
					<span className="ml-1 text-xs font-normal text-[#909399]">
						点击单元格可进行筛选
					</span>
				</span>
			),
			children: ACTUAL_LEVELS.map((level) => ({
				title: level,
				key: `a-${level}`,
				align: "center" as const,
				width: 64,
				render: (_value: unknown, record: ApprovalDistributionRow) => {
					const values = {
						A: record.actual.a,
						"B+": record.actual.bPlus,
						B: record.actual.b,
						C: record.actual.c,
						D: record.actual.d,
					} as const;
					const value = values[level];
					const submitLevel = level === "C" || level === "D" ? "C/D" : level;
					return (
						<span
							className={`block rounded-[2px] leading-6 ${
								value > 0 ? "cursor-pointer" : ""
							}`}
							onClick={
								value > 0
									? () => options.onActualClick?.(submitLevel, record)
									: undefined
							}
						>
							{value}
						</span>
					);
				},
			})),
		},
		{
			title: "异常校验",
			children: CD_LEVELS.map((level) => ({
				title: level,
				key: `c-${level}`,
				align: "center" as const,
				width: 76,
				render: (_value: unknown, record: ApprovalDistributionRow) => {
					const value =
						level === "C/D"
							? record.check.cd
							: record.check[level === "A" ? "a" : level === "B+" ? "bPlus" : "b"];
					return (
						<span
							className="whitespace-nowrap"
							style={{ color: distributionCheckColor(value) }}
						>
							{value}
						</span>
					);
				},
			})),
		},
	];
}

/**
 * 一级部门排名排序值（形如 1/3，按分子排序）
 *
 * @param row - 员工行
 * @returns 排序用数值，空值排到最后
 *
 * @author 王善能
 * @since 2026-11-13
 */
function rankValue(row: ApprovalEmployee) {
	const rank = Number.parseInt(row.departmentRank ?? "", 10);
	return Number.isNaN(rank) ? Number.MAX_SAFE_INTEGER : rank;
}

/**
 * 获取审批只读员工列配置。
 *
 * @param fixed - 是否固定提报评分和校验情况列
 * @returns 审批只读员工列配置
 *
 * @author 王善能
 * @since 2026-11-13
 */
export function getApprovalEmployeeColumns(fixed = false): TableColumnsType<ApprovalEmployee> {
	return [
		{ title: "员工", dataIndex: "name", key: "name", width: 66 },
		{ title: "工号", dataIndex: "employeeNo", key: "employeeNo", width: 64 },
		{ title: "部门", dataIndex: "department", key: "department", width: 94 },
		{ title: "岗位", dataIndex: "position", key: "position", width: 52 },
		{ title: "岗位分类", dataIndex: "positionCategory", key: "positionCategory", width: 146 },
		{ title: "职级", dataIndex: "jobLevel", key: "jobLevel", width: 52 },
		{ title: "在职状态", dataIndex: "employmentStatus", key: "employmentStatus", width: 80 },
		{
			title: "自评分",
			dataIndex: "selfScore",
			key: "selfScore",
			width: 86,
			sorter: (a, b) => (a.selfScore ?? 0) - (b.selfScore ?? 0),
			render: (value?: number) => (value === undefined ? "-" : value.toFixed(2)),
		},
		{
			title: "提报评分",
			dataIndex: "submitScore",
			fixed: fixed ? "right" : undefined,
			key: "submitScore",
			width: 100,
			sorter: (a, b) => (a.submitScore ?? 0) - (b.submitScore ?? 0),
			render: (value?: number) =>
				value === undefined ? (
					"-"
				) : (
					<span className="text-[#0075FF]">{value.toFixed(2)}</span>
				),
		},
		{
			title: "一级部门排名",
			dataIndex: "departmentRank",
			key: "departmentRank",
			width: 128,
			sorter: (a, b) => rankValue(a) - rankValue(b),
		},
		{ title: "建议等级", dataIndex: "suggestLevel", key: "suggestLevel", width: 80 },
		{ title: "提报等级", dataIndex: "submitLevel", key: "submitLevel", width: 80 },
		{
			title: "校验情况",
			dataIndex: "checkStatus",
			fixed: fixed ? "right" : undefined,
			key: "checkStatus",
			width: 106,
			render: (value: ApprovalCheckStatus) => {
				const color = value === ApprovalCheckStatus.NORMAL ? "#14B968" : "#F5222D";
				return (
					<span className="flex items-center gap-1 whitespace-nowrap" style={{ color }}>
						<span
							className="size-1.5 shrink-0 rounded-full"
							style={{ backgroundColor: color }}
						/>
						{value}
					</span>
				);
			},
		},
		{
			title: "异常情况说明",
			dataIndex: "exceptionNote",
			key: "exceptionNote",
			width: 108,
			ellipsis: true,
		},
		{ title: "填报人", dataIndex: "filler", key: "filler", width: 66 },
		{
			title: "状态",
			dataIndex: "status",
			key: "status",
			width: 76,
			render: (value: string) => <ApprovalStatus status={value} />,
		},
	];
}
