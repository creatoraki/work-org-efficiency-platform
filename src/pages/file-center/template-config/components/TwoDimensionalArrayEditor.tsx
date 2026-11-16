/**
 * 二维数组编辑器
 * 用于编辑 string[][] 类型的数据,如 [["基础信息", "默认字段"], ["总得分维度", "总得分"]]
 */

import { DeleteOutlined } from "@ant-design/icons";
import { Button, Input } from "antd";
import React from "react";

interface Props {
	/** 当前值 (二维数组) */
	value?: string[][];
	/** 值变化回调 */
	onChange?: (value: string[][]) => void;
	/** 每个子数组的元素个数 */
	itemSize?: number;
	/** 元素标签,如 ["元素1", "元素2"] */
	itemLabels?: string[];
	/** 添加按钮的占位符 */
	placeholder?: string;
	/** 是否禁用 */
	disabled?: boolean;
}

export default function TwoDimensionalArrayEditor({
	value = [],
	onChange,
	itemSize = 2,
	itemLabels = [],
	placeholder,
	disabled,
}: Props) {
	// 添加新项
	const handleAdd = () => {
		const newItem = Array.from({ length: itemSize }).fill("") as string[];
		onChange?.([...value, newItem]);
	};

	// 删除项
	const handleRemove = (index: number) => {
		onChange?.(value.filter((_, i) => i !== index));
	};

	// 修改某项的某个元素
	const handleChange = (rowIndex: number, colIndex: number, val: string) => {
		const newValue = [...value];
		newValue[rowIndex] = [...newValue[rowIndex]];
		newValue[rowIndex][colIndex] = val;
		onChange?.(newValue);
	};

	// 生成元素标签
	const getLabel = (index: number) => {
		if (itemLabels[index]) {
			return itemLabels[index];
		}
		return `元素${index + 1}`;
	};

	return (
		<div className="rounded border bg-gray-50 p-4">
			{value.length === 0 && (
				<div className="mb-2 py-2 text-center text-gray-400">暂无数据,点击下方按钮添加</div>
			)}

			{value.map((item, rowIndex) => (
				<div key={rowIndex} className="mb-2">
					<div className="flex gap-2">
						{/* 列标签 */}
						<span
							className="flex items-center whitespace-nowrap text-sm text-gray-500"
							style={{ minWidth: "60px" }}
						>
							第{rowIndex + 1}列
						</span>

						{/* 元素输入框 */}
						{Array.from({ length: itemSize }).map((_, colIndex) => (
							<Input
								key={colIndex}
								placeholder={getLabel(colIndex)}
								value={item[colIndex] || ""}
								onChange={(e) => handleChange(rowIndex, colIndex, e.target.value)}
								className="flex-1"
								disabled={disabled}
							/>
						))}

						{/* 删除按钮 */}
						<Button
							type="text"
							danger
							icon={<DeleteOutlined />}
							onClick={() => handleRemove(rowIndex)}
							disabled={disabled}
						/>
					</div>
				</div>
			))}

			{/* 添加按钮 */}
			<Button type="dashed" block onClick={handleAdd} disabled={disabled}>
				{placeholder || "添加项"}
			</Button>
		</div>
	);
}
