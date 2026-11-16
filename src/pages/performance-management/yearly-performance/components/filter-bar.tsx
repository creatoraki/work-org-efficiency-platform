import type { YearlyReportCascaderOption } from "#src/api/performance-management/yearly-performance";
import type { ReactNode } from "react";
import type { ReportFilterValues } from "../types";

import { cn } from "#src/utils";
import { Button, Cascader, DatePicker, Input, Select } from "antd";
import { Clock } from "lucide-react";
import { YEARLY_REPORT_STATUS_OPTIONS } from "../constants";
import styles from "../index.module.css";

interface LabeledFieldProps {
	/** 字段名 */
	label: string;
	/** 表单控件（无边框） */
	children: ReactNode;
	/** 额外样式 */
	className?: string;
}

/**
 * 内嵌标签的筛选框外壳
 *
 * 32px 高、#DCDFE6 描边，字段名 #606266 位于框内左侧（左内边距 12px），与控件间距 12px；
 * 悬浮 / 聚焦时描边切换为主色。控件需使用 borderless 变体。
 *
 * @param props - 组件属性
 * @param props.label - 字段名
 * @param props.children - 表单控件
 * @param props.className - 额外样式
 * @returns 筛选框
 */
function LabeledField({ label, children, className }: LabeledFieldProps) {
	return (
		<div
			className={cn(
				"flex h-8 min-w-0 items-center gap-3 rounded border border-solid border-[#DCDFE6] bg-white pl-3 transition-colors focus-within:border-[#0075FF] hover:border-[#0075FF]",
				styles.labeledField,
				className,
			)}
		>
			<span className="shrink-0 text-sm leading-[22px] text-[#606266]">{label}</span>
			<div className="min-w-0 flex-1">{children}</div>
		</div>
	);
}

interface FilterBarProps {
	/** 表单值 */
	value: ReportFilterValues;
	/** 管理者类别选项 */
	managerCategoryOptions: YearlyReportCascaderOption[];
	/** 紧凑模式：两列布局，查询 / 重置另起一行右对齐（设计稿 18） */
	compact?: boolean;
	/** 表单值变更 */
	onChange: (value: ReportFilterValues) => void;
	/** 查询 */
	onSearch: () => void;
	/** 重置 */
	onReset: () => void;
}

/**
 * 筛选区
 *
 * 宽屏：员工姓名 / 管理者类别 / 述职状态等分剩余宽度，述职时间固定 320px，查询 / 重置跟随在后，间距 12px。
 * 紧凑：两列网格，查询 / 重置另起一行右对齐。
 *
 * @param props - 组件属性
 * @param props.value - 表单值
 * @param props.managerCategoryOptions - 管理者类别选项
 * @param props.compact - 紧凑模式：两列布局，查询 / 重置另起一行右对齐（设计稿 18）
 * @param props.onChange - 表单值变更
 * @param props.onSearch - 查询
 * @param props.onReset - 重置
 * @returns 筛选区
 *
 * @since 2026-11-16
 */
export function FilterBar({
	value,
	managerCategoryOptions,
	compact,
	onChange,
	onSearch,
	onReset,
}: FilterBarProps) {
	const patch = (partial: Partial<ReportFilterValues>) => onChange({ ...value, ...partial });

	const fields = (
		<>
			<LabeledField label="员工姓名" className={compact ? undefined : "flex-1"}>
				<Input
					variant="borderless"
					allowClear
					placeholder="请输入"
					value={value.employeeName}
					onChange={(event) => patch({ employeeName: event.target.value })}
					onPressEnter={onSearch}
				/>
			</LabeledField>
			<LabeledField label="管理者类别" className={compact ? undefined : "flex-1"}>
				<Cascader
					variant="borderless"
					className="w-full"
					placeholder="请选择"
					changeOnSelect
					options={managerCategoryOptions}
					value={value.managerCategory}
					onChange={(next) => patch({ managerCategory: next as string[] | undefined })}
				/>
			</LabeledField>
			<LabeledField label="述职状态" className={compact ? undefined : "flex-1"}>
				<Select
					variant="borderless"
					className="w-full"
					placeholder="请选择"
					allowClear
					options={YEARLY_REPORT_STATUS_OPTIONS}
					value={value.status}
					onChange={(status) => patch({ status })}
				/>
			</LabeledField>
			<LabeledField label="述职时间" className={compact ? undefined : "w-[320px] shrink-0"}>
				<DatePicker.RangePicker
					variant="borderless"
					className={cn("w-full", compact ? styles.rangeCompact : styles.rangeWide)}
					showTime={{ format: "HH:mm" }}
					format="YYYY-MM-DD HH:mm"
					placeholder={["请选择", "请选择"]}
					separator="至"
					suffixIcon={<Clock className="size-3.5 text-[#909399]" strokeWidth={1.5} />}
					value={value.reportTimeRange}
					onChange={(range) => patch({ reportTimeRange: range })}
				/>
			</LabeledField>
		</>
	);

	const actions = (
		<div className={cn("flex shrink-0 items-center gap-2", compact && "justify-end")}>
			<Button type="primary" className="!px-[11px]" onClick={onSearch}>
				查询
			</Button>
			<Button type="text" className="!px-2 !text-[#323233]" onClick={onReset}>
				重置
			</Button>
		</div>
	);

	if (compact) {
		return (
			<div className="flex flex-col gap-3">
				<div className="grid grid-cols-2 gap-3">{fields}</div>
				{actions}
			</div>
		);
	}

	return (
		<div className="flex items-center gap-3">
			{fields}
			{actions}
		</div>
	);
}
