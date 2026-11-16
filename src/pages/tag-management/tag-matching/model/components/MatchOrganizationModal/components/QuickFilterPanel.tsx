import { Checkbox } from "antd";
import React from "react";

/**
 * 快速筛选面板属性
 */
interface QuickFilterPanelProps {
	/** 快速筛选选项 */
	quickFilterOptions: Array<{ label: string; value: string }>;
	/** 当前选中的快速筛选值 */
	quickFilter: string[];
	/** 快速筛选值变化回调 */
	onChange: (values: string[]) => void;
}

/**
 * 左侧快速筛选面板组件
 */
export function QuickFilterPanel({
	quickFilterOptions,
	quickFilter,
	onChange,
}: QuickFilterPanelProps) {
	return (
		<div className="mr-4 w-[250px] rounded-lg border border-gray-200">
			<div className="rounded-t-lg bg-[#f5f5f5] p-3">
				<span className="mr-1 text-red-500">*</span>
				组织层级
			</div>
			<Checkbox.Group
				value={quickFilter}
				onChange={(values) => {
					onChange(values as string[]);
				}}
				className="flex flex-col gap-3 p-3"
			>
				{quickFilterOptions.map((opt) => (
					<Checkbox key={opt.value} value={opt.value} disabled={opt.value === "SYS"}>
						{opt.label}
					</Checkbox>
				))}
			</Checkbox.Group>
		</div>
	);
}
