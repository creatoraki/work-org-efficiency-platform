/**
 * 查询结构可视化编辑器
 * 用于编辑分页查询参数映射
 */

import type { QueryStructure } from "../types";
import { Collapse } from "antd";
import React from "react";
import KeyValueEditor from "./KeyValueEditor";

interface Props {
	/** 当前值 */
	value?: QueryStructure;
	/** 值变化回调 */
	onChange?: (value: QueryStructure | undefined) => void;
	/** 是否禁用 */
	disabled?: boolean;
}

export default function QueryStructureEditor({ value, onChange, disabled }: Props) {
	// 处理子编辑器的变化
	const handleMapChange = (field: keyof QueryStructure, newValue: Record<string, any>) => {
		const hasValue = Object.keys(newValue).length > 0;

		// 构建新的 QueryStructure
		const newQueryStructure: QueryStructure = {
			...value,
			[field]: hasValue ? newValue : undefined,
		};

		// 检查是否所有字段都为空
		const isEmpty =
			!newQueryStructure.pageNumMap &&
			!newQueryStructure.pageSizeMap &&
			!newQueryStructure.countMap;

		// 如果全部为空，则返回 undefined
		onChange?.(isEmpty ? undefined : newQueryStructure);
	};

	const items = [
		{
			key: "pageNumMap",
			label: "页码参数映射 (pageNumMap)",
			children: (
				<KeyValueEditor
					value={value?.pageNumMap}
					onChange={(v) => handleMapChange("pageNumMap", v)}
					placeholder="添加页码参数"
					disabled={disabled}
				/>
			),
		},
		{
			key: "pageSizeMap",
			label: "每页数量参数映射 (pageSizeMap)",
			children: (
				<KeyValueEditor
					value={value?.pageSizeMap}
					onChange={(v) => handleMapChange("pageSizeMap", v)}
					placeholder="添加每页数量参数"
					disabled={disabled}
				/>
			),
		},
		{
			key: "countMap",
			label: "查询总数参数映射 (countMap)",
			children: (
				<KeyValueEditor
					value={value?.countMap}
					onChange={(v) => handleMapChange("countMap", v)}
					placeholder="添加查询总数参数"
					disabled={disabled}
				/>
			),
		},
	];

	return (
		<div className="query-structure-editor">
			<Collapse
				items={items}
				defaultActiveKey={["pageNumMap", "pageSizeMap", "countMap"]}
				ghost
			/>
			<div className="mt-2 text-sm text-gray-400">
				提示：用于定义分页查询时的参数映射，例如 pageNum → 1 表示第 1 页
			</div>
		</div>
	);
}
