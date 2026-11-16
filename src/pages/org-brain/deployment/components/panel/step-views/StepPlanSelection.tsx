import type {
	DeploymentDetail,
	DeploymentItem,
	DeployPositionMatrixRow,
	DeploySolution,
	DeploySolutionMatrixRow,
} from "#src/api/org-brain/deployment";
import type { ColumnsType } from "antd/es/table";

import { formatDeploymentQualityScore } from "#src/api/org-brain/deployment";
import { ResizableSplitLayout } from "#src/components/resizable-split-layout";
import { cn } from "#src/utils";
import { useSize } from "ahooks";
import { Card, Table, Typography } from "antd";
import { Check, Circle } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useRef } from "react";

import {
	SOLUTION_COMPARE_GROUP_ID,
	SOLUTION_COMPARE_LEFT_PANEL_ID,
	SOLUTION_COMPARE_RIGHT_PANEL_ID,
} from "../compare-panels";
import { buildMatrixJobPositionSelectionLabel } from "../config-matrix/matrixJobPositionUtils";
import { DEPLOYMENT_TABLE_MIN_SCROLL_Y, SCHEME_LABEL } from "../constants";
import { useDeploymentTableScrollY } from "../hooks";

const { Text } = Typography;

interface StepPlanSelectionProps {
	detail?: DeploymentDetail | null;
	project: DeploymentItem;
	onSelectSolution: (solutionNo: number) => void;
}

type SolutionMergeColumnKey =
	| "departmentLine"
	| "authorizedJobName"
	| "jobPositionLabel"
	| "staffCount"
	| "tagMatchModelName";

interface SolutionTableRow extends DeploySolutionMatrixRow {
	rowKey: string;
	jobPositionLabel: string;
	tagMatchModelName: string;
	staffName: string;
}

interface SolutionTableRowSpans {
	departmentLine: number[];
	authorizedJobName: number[];
	jobPositionLabel: number[];
	staffCount: number[];
	tagMatchModelName: number[];
	staffName: number[];
}

/**
 * 构建岗位矩阵元数据索引。
 *
 * 供方案总览表格回查匹配模型等补充信息使用，
 * key 口径与岗位矩阵和方案矩阵的匹配维度保持一致。
 *
 * @param matrixRows - 项目岗位矩阵
 * @returns 岗位矩阵索引
 * @author 王善能
 * @since 2026-06-12
 */
function buildMatrixMetaMap(
	matrixRows: DeployPositionMatrixRow[],
): Map<string, DeployPositionMatrixRow> {
	return new Map(
		matrixRows.map((row) => [
			[
				row.departmentLine?.trim() ?? "",
				row.jobCode?.trim() ?? "",
				row.positionCode?.trim() ?? "",
				row.positionLevel?.trim() ?? "",
			].join("|"),
			row,
		]),
	);
}

/**
 * 构建方案矩阵行唯一 key。
 *
 * @param row - 方案矩阵行
 * @returns 岗位维度组合 key
 * @author 王善能
 * @since 2026-06-12
 */
function buildSolutionRowKey(row: DeploySolutionMatrixRow): string {
	return [
		row.departmentLine?.trim() ?? "",
		row.jobCode?.trim() ?? "",
		row.positionCode?.trim() ?? "",
		row.positionLevel?.trim() ?? "",
	].join("|");
}

/**
 * 构建方案总览表格行。
 *
 * 按人员维度展开方案矩阵：同一岗位下每位人员各占一行，
 * 这样前置岗位层级列才可以逐级合并，人员列保持逐人展示。
 *
 * @param solution - 当前方案
 * @param matrixMetaMap - 岗位矩阵元数据映射
 * @returns 方案总览表格数据源
 * @author 王善能
 * @since 2026-06-11
 */
function buildSolutionTableRows(
	solution: DeploySolution,
	matrixMetaMap: Map<string, DeployPositionMatrixRow>,
): SolutionTableRow[] {
	return solution.staffMatrixList.flatMap((row) => {
		const rowKey = buildSolutionRowKey(row);
		const matrixMeta = matrixMetaMap.get(rowKey);
		const staffNames = row.staffConfigList
			.map((config) => config.empName?.trim() ?? "")
			.filter(Boolean);
		const normalizedStaffNames = staffNames.length > 0 ? staffNames : ["/"];

		return normalizedStaffNames.map((staffName, index) => ({
			...row,
			rowKey: `${rowKey}:${index}`,
			jobPositionLabel: buildMatrixJobPositionSelectionLabel(row) || "/",
			tagMatchModelName: matrixMeta?.tagMatchModelName?.trim() || "/",
			staffName,
		}));
	});
}

/**
 * 计算方案总览表格逐列合并的 rowSpan。
 *
 * 按列顺序级联判定：只有当前列以及其左侧所有列都相同，当前列才允许继续合并。
 * 人员列按逐人展开后的结果展示，不再把多个人员压缩到同一单元格。
 *
 * @param rows - 方案总览表格数据
 * @returns 每个可合并列对应的 rowSpan 数组
 * @author 王善能
 * @since 2026-06-11
 */
function getSolutionTableRowSpans(rows: SolutionTableRow[]): SolutionTableRowSpans {
	const mergeColumns: SolutionMergeColumnKey[] = [
		"departmentLine",
		"authorizedJobName",
		"jobPositionLabel",
		"staffCount",
		"tagMatchModelName",
	];
	const rowSpans = mergeColumns.reduce((result, columnKey) => {
		result[columnKey] = Array.from<number>({ length: rows.length });
		return result;
	}, {} as SolutionTableRowSpans);
	const isPrefixMatched = (left: SolutionTableRow, right: SolutionTableRow, endIndex: number) =>
		mergeColumns
			.slice(0, endIndex + 1)
			.every((columnKey) => String(left[columnKey] ?? "") === String(right[columnKey] ?? ""));

	mergeColumns.forEach((columnKey, columnIndex) => {
		for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
			const currentRow = rows[rowIndex];
			const prevRow = rowIndex > 0 ? rows[rowIndex - 1] : undefined;

			if (prevRow && isPrefixMatched(currentRow, prevRow, columnIndex)) {
				rowSpans[columnKey][rowIndex] = 0;
				continue;
			}

			let span = 1;
			while (
				rowIndex + span < rows.length &&
				isPrefixMatched(currentRow, rows[rowIndex + span], columnIndex)
			) {
				span++;
			}
			rowSpans[columnKey][rowIndex] = span;
		}
	});

	return rowSpans;
}

/**
 * 单个方案卡片。
 *
 * @param props - 组件属性
 * @param props.solution - 当前方案
 * @param props.matrixMetaMap - 岗位矩阵元数据映射
 * @param props.onSelect - 选择方案回调
 * @param props.preferTableScroll - 是否优先使用表格内部滚动
 * @returns 方案卡片
 * @author 王善能
 * @since 2026-06-12
 */
function SolutionCard({
	solution,
	matrixMetaMap,
	onSelect,
	preferTableScroll,
}: {
	solution: DeploySolution;
	matrixMetaMap: Map<string, DeployPositionMatrixRow>;
	onSelect: () => void;
	preferTableScroll: boolean;
}) {
	const tableRows = useMemo(
		() => buildSolutionTableRows(solution, matrixMetaMap),
		[matrixMetaMap, solution],
	);
	const rowSpans = useMemo(() => getSolutionTableRowSpans(tableRows), [tableRows]);
	const { tableHostRef, scrollY: tableScrollY } = useDeploymentTableScrollY(
		preferTableScroll,
		tableRows.length,
	);
	const columns: ColumnsType<SolutionTableRow> = [
		{
			title: "条线",
			dataIndex: "departmentLine",
			width: 100,
			onCell: (_, index) => ({ rowSpan: rowSpans.departmentLine[index ?? 0] ?? 1 }),
		},
		{
			title: "编制岗位",
			dataIndex: "authorizedJobName",
			width: 100,
			render: (value?: string) => value || "/",
			onCell: (_, index) => ({ rowSpan: rowSpans.authorizedJobName[index ?? 0] ?? 1 }),
		},
		{
			title: "岗位-职位-职级",
			dataIndex: "jobPositionLabel",
			width: 220,
			onCell: (_, index) => ({ rowSpan: rowSpans.jobPositionLabel[index ?? 0] ?? 1 }),
		},
		{
			title: "人数（人）",
			dataIndex: "staffCount",
			width: 100,
			onCell: (_, index) => ({ rowSpan: rowSpans.staffCount[index ?? 0] ?? 1 }),
		},
		{
			title: "匹配模型",
			key: "tagMatchModelName",
			width: 100,
			dataIndex: "tagMatchModelName",
			render: (value: string) => <Text ellipsis={{ tooltip: true }}>{value}</Text>,
			onCell: (_, index) => ({ rowSpan: rowSpans.tagMatchModelName[index ?? 0] ?? 1 }),
		},
		{
			title: "人员",
			key: "staffName",
			width: 100,
			dataIndex: "staffName",
			render: (value: string) => <Text ellipsis={{ tooltip: value }}>{value}</Text>,
		},
	];

	return (
		<Card
			size="small"
			className={cn(
				"flex flex-1 flex-col overflow-hidden rounded-[4px] border border-[#E5EAF3] bg-white transition-all duration-200 ease-out",
				preferTableScroll && "h-full min-h-0",
				"cursor-pointer hover:border-[rgb(var(--oo-colorPrimary)/0.45)] hover:shadow-[0_8px_20px_rgba(31,111,255,0.08)]",
				solution.choice &&
					"!border-[rgb(var(--oo-colorPrimary))] shadow-[0_0_0_1px_rgba(31,111,255,0.08)]",
			)}
			styles={{
				body: {
					position: "relative",
					padding: 0,
					...(preferTableScroll
						? {
								display: "flex",
								flexDirection: "column",
								flex: 1,
								minHeight: 0,
								height: "100%",
							}
						: {}),
				},
			}}
			onClick={onSelect}
		>
			<div className="flex shrink-0 items-center justify-between border-b border-[#EEF2F7] p-4">
				<div className="flex items-center gap-2">
					<div className="h-4 w-1 rounded bg-[rgb(var(--oo-colorPrimary))]" />
					<Text strong className="text-[15px] text-[#303133]">
						方案{SCHEME_LABEL[solution.solutionNo] ?? solution.solutionNo}
					</Text>
				</div>
				<div className="flex items-center gap-3">
					<div className="flex items-center gap-1 text-[14px]">
						<Text className="!text-[#909399]">质量分：</Text>
						<Text strong className="!text-[14px] !text-[#303133]">
							{formatDeploymentQualityScore(solution.matchScore)}分
						</Text>
					</div>
					<div
						role="button"
						tabIndex={0}
						onKeyDown={(e) => e.key === "Enter" && onSelect()}
						onClick={(e) => {
							e.stopPropagation();
							onSelect();
						}}
						className={cn(
							"relative inline-flex h-7 shrink-0 cursor-pointer items-center overflow-hidden rounded-full border px-3 text-xs font-medium leading-none transition-[border-color,transform] duration-300 ease-out active:scale-[0.98]",
							solution.choice
								? "border-[rgb(var(--oo-colorPrimary))]"
								: "border-[#DCDFE6] bg-white hover:border-[rgb(var(--oo-colorPrimary)/0.45)]",
						)}
					>
						<div
							className="absolute inset-y-0 right-0 bg-[rgb(var(--oo-colorPrimary))] transition-[width] duration-300 ease-out"
							style={{ width: solution.choice ? "100%" : "0%" }}
							aria-hidden
						/>
						<span
							className={cn(
								"relative z-10 inline-flex items-center gap-1.5 transition-colors duration-300 ease-out",
								solution.choice
									? "text-white"
									: "text-[#606266] hover:text-[rgb(var(--oo-colorPrimary))]",
							)}
						>
							{solution.choice ? (
								<Check className="size-3.5 shrink-0" strokeWidth={2.5} />
							) : (
								<Circle className="size-3.5 shrink-0" strokeWidth={2} />
							)}
							{solution.choice ? "已选" : "选择"}
						</span>
					</div>
				</div>
			</div>
			<div
				className={cn(
					"min-w-0 px-3 py-3",
					preferTableScroll && "flex min-h-0 flex-1 flex-col overflow-hidden",
				)}
			>
				<div
					ref={tableHostRef}
					className={cn("min-w-0", preferTableScroll && "min-h-0 flex-1 overflow-hidden")}
				>
					<Table
						dataSource={tableRows}
						columns={columns}
						rowKey={(record) => `${solution.solutionNo}:${record.rowKey}`}
						size="small"
						pagination={false}
						bordered
						rowHoverable={false}
						scroll={{
							x: "max-content",
							...(preferTableScroll && tableScrollY ? { y: tableScrollY } : {}),
						}}
						className={cn(
							preferTableScroll && "h-full min-h-0",
							"[&_.ant-table-thead>tr>th]:!bg-[#F5F7FA]",
							"[&_.ant-table-thead>tr>th]:!px-3 [&_.ant-table-thead>tr>th]:!py-3",
							"[&_.ant-table-tbody>tr>td]:!px-3 [&_.ant-table-tbody>tr>td]:!py-3",
							"[&_.ant-table-cell]:!text-[13px]",
							"[&_.ant-table-body]:!overflow-y-auto",
						)}
					/>
				</div>
			</div>
		</Card>
	);
}

/**
 * 渲染带动效的方案卡片。
 *
 * @param solution - 当前方案
 * @param index - 方案索引
 * @param matrixMetaMap - 岗位矩阵元数据映射
 * @param preferTableScroll - 是否优先使用表格内部滚动
 * @param onSelectSolution - 方案选择回调
 * @returns 动效方案卡片
 * @author 王善能
 * @since 2026-06-12
 */
function renderSolutionCard(
	solution: DeploySolution,
	index: number,
	matrixMetaMap: Map<string, DeployPositionMatrixRow>,
	preferTableScroll: boolean,
	onSelectSolution: (solutionNo: number) => void,
) {
	return (
		<motion.div
			key={solution.solutionNo}
			initial={{ opacity: 0, y: 12 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.25, delay: index * 0.06, ease: "easeOut" }}
			className={cn("min-w-0", preferTableScroll && "flex h-full min-h-0 flex-col")}
		>
			<SolutionCard
				solution={solution}
				matrixMetaMap={matrixMetaMap}
				preferTableScroll={preferTableScroll}
				onSelect={() => onSelectSolution(solution.solutionNo)}
			/>
		</motion.div>
	);
}

/**
 * 步骤三方案选择视图。
 *
 * 展示 AI 排兵生成的候选方案，并支持最终方案选择。
 * 该视图的选中结果会继续流向预览抽屉、保存提交以及 PDF 导出链路。
 *
 * @param props - 组件属性
 * @param props.detail - 排兵布阵详情
 * @param props.onSelectSolution - 方案选择回调
 * @returns 方案选择视图
 * @author 王善能
 * @since 2026-06-12
 */
export function StepPlanSelection({ detail, onSelectSolution }: StepPlanSelectionProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const containerSize = useSize(containerRef);
	const solutions = detail?.solutions ?? [];
	const matrixMetaMap = useMemo(
		() => buildMatrixMetaMap(detail?.projectPositionMatrixList ?? []),
		[detail?.projectPositionMatrixList],
	);
	const preferOuterScroll = useMemo(() => {
		const containerHeight = containerSize?.height ?? 0;
		if (containerHeight <= 0) {
			return false;
		}
		// 视口过矮时改由外层滚动，具体阈值仅用于布局切换
		return containerHeight < DEPLOYMENT_TABLE_MIN_SCROLL_Y + 120;
	}, [containerSize?.height]);
	const preferTableScroll = !preferOuterScroll;

	const solutionContent =
		solutions.length === 2 ? (
			<ResizableSplitLayout
				groupId={SOLUTION_COMPARE_GROUP_ID}
				leftPanelId={SOLUTION_COMPARE_LEFT_PANEL_ID}
				rightPanelId={SOLUTION_COMPARE_RIGHT_PANEL_ID}
				groupClassName={preferTableScroll ? "h-full min-h-0" : undefined}
				groupStyle={preferTableScroll ? undefined : { height: "auto" }}
				panelClassName={preferTableScroll ? "min-h-0" : undefined}
				panelContentClassName={preferTableScroll ? "h-full min-h-0" : undefined}
				left={renderSolutionCard(
					solutions[0],
					0,
					matrixMetaMap,
					preferTableScroll,
					onSelectSolution,
				)}
				right={renderSolutionCard(
					solutions[1],
					1,
					matrixMetaMap,
					preferTableScroll,
					onSelectSolution,
				)}
			/>
		) : (
			<div
				className={cn(
					"grid grid-cols-1 gap-4",
					solutions.length > 1 && "xl:grid-cols-2",
					preferOuterScroll ? "items-start" : "min-h-0 flex-1 items-stretch",
				)}
			>
				{solutions.map((solution, index) =>
					renderSolutionCard(
						solution,
						index,
						matrixMetaMap,
						preferTableScroll,
						onSelectSolution,
					),
				)}
			</div>
		);

	return (
		<div
			ref={containerRef}
			className={cn(
				"h-full min-h-0 w-full",
				preferOuterScroll
					? "custom-scrollbar overflow-y-auto"
					: "flex flex-col overflow-hidden",
			)}
		>
			<div className={cn(!preferOuterScroll && solutions.length === 2 && "min-h-0 flex-1")}>
				{solutionContent}
			</div>
			{solutions.length === 0 && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 0.3 }}
					className="my-4 py-16 text-center"
				>
					<Text type="secondary">暂无排兵布阵方案</Text>
				</motion.div>
			)}
		</div>
	);
}
