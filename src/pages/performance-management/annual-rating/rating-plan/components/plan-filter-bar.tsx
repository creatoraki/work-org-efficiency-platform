import type { RatingPlanQuery } from "#src/api/performance-management/plan";

import {
	LabeledInput,
	LabeledSelect,
} from "#src/pages/performance-management/annual-rating/components/filter-fields";
import { Button } from "antd";
import { useCallback } from "react";
import { CYCLE_OPTIONS, PLAN_STATUS_OPTIONS } from "../config";

/**
 * 筛选区组件属性
 */
interface PlanFilterBarProps {
	/** 当前筛选条件 */
	value: RatingPlanQuery;
	/** 筛选条件变更回调 */
	onChange: (value: RatingPlanQuery) => void;
	/** 点击查询回调 */
	onSearch: () => void;
	/** 点击重置回调 */
	onReset: () => void;
}

/**
 * 评级计划筛选区
 *
 * 单行四字段：计划名称、周期、主责人、状态；查询/重置按钮贴右。
 *
 * @param props - 组件属性
 * @param props.value - 当前筛选条件
 * @param props.onChange - 筛选条件变更回调
 * @param props.onSearch - 点击查询回调
 * @param props.onReset - 点击重置回调
 * @returns 筛选区组件
 *
 * @author 王善能
 * @since 2026-11-12
 */
export function PlanFilterBar({ value, onChange, onSearch, onReset }: PlanFilterBarProps) {
	const update = useCallback(
		(key: keyof RatingPlanQuery, next?: string) => {
			onChange({ ...value, [key]: next || undefined });
		},
		[onChange, value],
	);

	return (
		<div className="grid grid-cols-5 items-center gap-3">
			<div className="min-w-0">
				<LabeledInput
					label="计划名称"
					value={value.planName}
					onChange={(next) => update("planName", next)}
				/>
			</div>
			<div className="min-w-0">
				<LabeledSelect
					label="周期"
					value={value.cycle}
					options={CYCLE_OPTIONS}
					onChange={(next) => update("cycle", next)}
				/>
			</div>
			<div className="min-w-0">
				<LabeledInput
					label="主责人"
					value={value.owner}
					onChange={(next) => update("owner", next)}
				/>
			</div>
			<div className="min-w-0">
				<LabeledSelect
					label="状态"
					value={value.status}
					options={PLAN_STATUS_OPTIONS}
					onChange={(next) => update("status", next)}
				/>
			</div>
			<div className="flex items-center justify-end gap-2">
				<Button type="primary" className="rounded-[3px] bg-[#0075FF]" onClick={onSearch}>
					查询
				</Button>
				<Button type="text" className="px-2 text-[#606266]" onClick={onReset}>
					重置
				</Button>
			</div>
		</div>
	);
}
