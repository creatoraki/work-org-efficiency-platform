import type { RatingTodoQuery } from "#src/api/performance-management/todo";

import { fetchRatingOrgTreeData } from "#src/api/performance-management/org";
import { fetchPlanOptions } from "#src/api/performance-management/plan";
import { fetchTodoSearchOptions } from "#src/api/performance-management/todo";
import {
	LabeledSelect,
	LabeledTreeSelect,
	LabeledYearPicker,
} from "#src/pages/performance-management/annual-rating/components/filter-fields";
import { useQuery } from "@tanstack/react-query";
import { Button } from "antd";
import { useCallback, useMemo } from "react";
import { useAnnualRatingDict } from "../../hooks/use-annual-rating-dict";

/**
 * 筛选区组件属性
 */
interface TodoFilterBarProps {
	/** 当前筛选条件 */
	value: RatingTodoQuery;
	/** 筛选条件变更回调 */
	onChange: (value: RatingTodoQuery) => void;
	/** 点击查询回调 */
	onSearch: () => void;
	/** 点击重置回调 */
	onReset: () => void;
}

/**
 * 筛选框列数自适应规则
 *
 * 筛选框列数按内容区宽度自适应：
 * - 1000px 以下：一行 3 列
 * - 1001px–1700px：一行 4 列
 * - 1701px–2000px：一行 5 列
 * - 2001px 以上：一行 6 列
 *
 * Tailwind 断点按视口宽度生效，此处换算为「视口 − 侧边栏 224px」的
 * 内容区宽度后再取列数，筛选框宽度均分。
 */
const FILTER_GRID_CLASS =
	"grid gap-3 grid-cols-3 min-[1225px]:grid-cols-4 min-[1925px]:grid-cols-5 min-[2225px]:grid-cols-6";

/**
 * 组合执行人下拉选项
 *
 * 执行人重名概率较高，面板内按「姓名 - 工号」分两列展示：姓名列固定最小宽度，
 * 破折号与工号逐行对齐。选项 label 仍保留全文，用于搜索过滤与选中后的展示。
 * 工号为空时只展示姓名，避免出现悬空的分隔符。
 *
 * @param item - 后端下发的执行人选项
 * @param item.dealUserName - 执行人姓名
 * @param item.dealUserCode - 执行人工号
 * @returns 下拉选项
 *
 * @author 王善能
 * @since 2026-11-15
 */
function buildExecutorOption(item: { dealUserCode: string; dealUserName: string }) {
	const name = item.dealUserName?.trim() ?? "";
	const code = item.dealUserCode?.trim();
	return {
		label: code ? `${name} - ${code}` : name,
		value: item.dealUserCode,
		splitLabel: code ? { primary: name, secondary: code } : undefined,
	};
}

/**
 * 评级待办筛选区
 *
 * 筛选项按固定顺序流式排列，查询/重置按钮位于最后一行右侧。
 *
 * @param props - 组件属性
 * @param props.value - 当前筛选条件
 * @param props.onChange - 筛选条件变更回调
 * @param props.onSearch - 点击查询回调
 * @param props.onReset - 点击重置回调
 * @returns 筛选区组件
 *
 * @author 王善能
 * @since 2026-11-11
 */
export function TodoFilterBar({ value, onChange, onSearch, onReset }: TodoFilterBarProps) {
	const { assessTypeOptions, nodeTypeOptions, statusOptions } = useAnnualRatingDict();

	/** 计划名称源：POST plan/list/all → planId */
	const { data: planOptions } = useQuery({
		queryKey: ["performance-management", "rating-todo", "plan-options"],
		queryFn: fetchPlanOptions,
	});
	const planSelectOptions = useMemo(
		() =>
			(planOptions ?? []).map((item) => ({
				label: item.planName,
				value: item.id,
			})),
		[planOptions],
	);

	/** 执行范围源：POST org/list/all → dealOrgCode（orgCodePath 组树） */
	const { data: orgTree } = useQuery({
		queryKey: ["performance-management", "rating-todo", "org-tree"],
		queryFn: fetchRatingOrgTreeData,
	});

	/** 执行人源：GET userTask/search-options.dealUserOptions → dealUserCode */
	const { data: searchOptions } = useQuery({
		queryKey: ["performance-management", "rating-todo", "search-options"],
		queryFn: fetchTodoSearchOptions,
	});
	const executorOptions = useMemo(
		() => (searchOptions?.dealUserOptions ?? []).map(buildExecutorOption),
		[searchOptions],
	);

	const update = useCallback(
		<K extends keyof RatingTodoQuery>(key: K, next?: RatingTodoQuery[K]) => {
			onChange({ ...value, [key]: next ?? undefined });
		},
		[onChange, value],
	);

	return (
		<div className="flex flex-col gap-3">
			<div className={FILTER_GRID_CLASS}>
				<LabeledSelect
					label="计划名称"
					value={value.planId}
					options={planSelectOptions}
					searchable
					onChange={(next) => update("planId", next)}
				/>
				<LabeledYearPicker
					label="周期"
					value={value.cycle}
					onChange={(next) => update("cycle", next)}
				/>
				<LabeledSelect
					label="考核类型"
					value={value.assessType}
					options={assessTypeOptions}
					onChange={(next) => update("assessType", next)}
				/>
				<LabeledSelect
					label="节点类型"
					value={value.nodeType}
					options={nodeTypeOptions}
					onChange={(next) => update("nodeType", next)}
				/>
				<LabeledTreeSelect
					label="执行范围"
					value={value.dealOrgCode}
					treeData={orgTree ?? []}
					onChange={(next) => update("dealOrgCode", next)}
				/>
				<LabeledSelect
					label="执行人"
					value={value.dealUserCode}
					options={executorOptions}
					searchable
					onChange={(next) => update("dealUserCode", next)}
				/>
				<LabeledSelect
					label="状态"
					value={value.status}
					options={statusOptions}
					onChange={(next) => update("status", next)}
				/>
				{/* 查询/重置按钮跨满剩余列，右对齐贴右 */}
				<div className="col-start-3 flex items-center justify-end gap-2 min-[1225px]:col-start-4 min-[1925px]:col-start-5 min-[2225px]:col-start-6">
					<Button
						type="primary"
						className="rounded-[3px] bg-[#0075FF]"
						onClick={onSearch}
					>
						查询
					</Button>
					<Button type="text" className="px-2 text-[#606266]" onClick={onReset}>
						重置
					</Button>
				</div>
			</div>
		</div>
	);
}
