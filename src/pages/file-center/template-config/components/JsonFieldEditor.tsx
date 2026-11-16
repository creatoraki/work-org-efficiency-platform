/**
 * JSON 字段可视化编辑器
 * 用于编辑 Record<string, any>[] 类型的数组字段
 */

import { DeleteOutlined } from "@ant-design/icons";
import { Button, Input } from "antd";
import React from "react";

interface Props {
	/** 当前值 */
	value?: Record<string, any>[];
	/** 值变化回调 */
	onChange?: (value: Record<string, any>[]) => void;
	/** 字段名列表,如 ["key", "label"] */
	fields: string[];
	/** 添加按钮的占位符 */
	placeholder?: string;
	/** 是否禁用 */
	disabled?: boolean;
}

export default function JsonFieldEditor({
	value = [],
	onChange,
	fields,
	placeholder,
	disabled,
}: Props) {
	// 添加新项
	const handleAdd = () => {
		const newItem: Record<string, any> = {};
		fields.forEach((f) => (newItem[f] = ""));
		onChange?.([...value, newItem]);
	};

	// 删除项
	const handleRemove = (index: number) => {
		onChange?.(value.filter((_, i) => i !== index));
	};

	// 修改某项的某个字段
	const handleChange = (index: number, field: string, val: string) => {
		const newValue = [...value];
		newValue[index] = { ...newValue[index], [field]: val };
		onChange?.(newValue);
	};

	return (
		<div className="rounded border bg-gray-50 p-4">
			{value.length === 0 && (
				<div className="mb-2 py-2 text-center text-gray-400">暂无数据,点击下方按钮添加</div>
			)}

			{value.map((item, index) => (
				<div key={index} className="mb-2 flex gap-2">
					{/* 序号 */}
					<span className="flex w-8 items-center text-gray-400">{index + 1}.</span>

					{/* 动态字段输入框 */}
					{fields.map((field) => (
						<Input
							key={field}
							placeholder={field}
							value={item[field] || ""}
							onChange={(e) => handleChange(index, field, e.target.value)}
							className="flex-1"
							disabled={disabled}
						/>
					))}

					{/* 删除按钮 */}
					<Button
						type="text"
						danger
						icon={<DeleteOutlined />}
						onClick={() => handleRemove(index)}
						disabled={disabled}
					/>
				</div>
			))}

			{/* 添加按钮 */}
			<Button type="dashed" block onClick={handleAdd} disabled={disabled}>
				{placeholder || "添加项"}
			</Button>
		</div>
	);
}
