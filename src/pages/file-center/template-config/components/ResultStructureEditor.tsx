/**
 * 返回结构可视化编辑器
 * 用于编辑API响应数据路径
 */

import type { ResultStructure } from "../types";
import { Divider } from "antd";
import JsonFieldEditor from "./JsonFieldEditor";

interface Props {
	/** 当前值 */
	value?: ResultStructure;
	/** 值变化回调 */
	onChange?: (value: ResultStructure | undefined) => void;
	/** 是否禁用 */
	disabled?: boolean;
}

export default function ResultStructureEditor({ value, onChange, disabled }: Props) {
	// 处理子编辑器的变化
	const handlePathChange = (field: keyof ResultStructure, newValue: Record<string, any>[]) => {
		const hasValue = newValue.length > 0;

		// 构建新的 ResultStructure
		const newResultStructure: ResultStructure = {
			...value,
			[field]: hasValue ? newValue : undefined,
		};

		// 检查是否所有字段都为空
		const isEmpty =
			!newResultStructure.totalNumPath?.length && !newResultStructure.dataPath?.length;

		// 如果全部为空，则返回 undefined
		onChange?.(isEmpty ? undefined : newResultStructure);
	};

	return (
		<div className="result-structure-editor">
			{/* 总条数路径 */}
			<div className="mb-4">
				<div className="mb-2 text-sm font-medium">总条数路径 (totalNumPath)</div>
				<JsonFieldEditor
					value={value?.totalNumPath || []}
					onChange={(v) => handlePathChange("totalNumPath", v)}
					fields={["path"]}
					placeholder="添加总条数路径"
					disabled={disabled}
				/>
				<div className="mt-1 text-xs text-gray-400">
					示例：data.total 表示从响应的 data.total 字段获取总条数
				</div>
			</div>

			<Divider />

			{/* 数据数组路径 */}
			<div>
				<div className="mb-2 text-sm font-medium">数据数组路径 (dataPath)</div>
				<JsonFieldEditor
					value={value?.dataPath || []}
					onChange={(v) => handlePathChange("dataPath", v)}
					fields={["path"]}
					placeholder="添加数据路径"
					disabled={disabled}
				/>
				<div className="mt-1 text-xs text-gray-400">
					示例：data.list 表示从响应的 data.list 字段获取数据数组
				</div>
			</div>
		</div>
	);
}
