/**
 * 键值对编辑器
 * 用于编辑 {key1: value1, key2: value2} 形式的对象
 */

import { DeleteOutlined } from "@ant-design/icons";
import { Button, Input } from "antd";
import React, { useEffect, useState } from "react";

interface KeyValueItem {
	key: string;
	value: any;
}

interface Props {
	/** 当前值 (对象格式) */
	value?: Record<string, any>;
	/** 值变化回调 */
	onChange?: (value: Record<string, any>) => void;
	/** 添加按钮的占位符 */
	placeholder?: string;
	/** 是否禁用 */
	disabled?: boolean;
}

export default function KeyValueEditor({ value, onChange, placeholder, disabled }: Props) {
	// 内部使用数组格式便于编辑
	const [items, setItems] = useState<KeyValueItem[]>([]);

	// 对象 -> 数组 (初始化)
	useEffect(() => {
		if (value && typeof value === "object") {
			const arr = Object.entries(value).map(([k, v]) => ({ key: k, value: v }));
			setItems(arr);
		} else {
			setItems([]);
		}
	}, [value]);

	// 数组 -> 对象 (提交)
	const handleItemsChange = (newItems: KeyValueItem[]) => {
		setItems(newItems);

		// 转换为对象并通知父组件
		const obj = newItems.reduce(
			(acc, item) => {
				if (item.key) {
					// 过滤空key
					// 自动类型转换: 数字字符串 -> 数字
					const numValue = Number(item.value);
					acc[item.key] = Number.isNaN(numValue) ? item.value : numValue;
				}
				return acc;
			},
			{} as Record<string, any>,
		);

		onChange?.(obj);
	};

	// 添加新项
	const handleAdd = () => {
		handleItemsChange([...items, { key: "", value: "" }]);
	};

	// 删除项
	const handleRemove = (index: number) => {
		handleItemsChange(items.filter((_, i) => i !== index));
	};

	// 修改某项
	const handleChange = (index: number, field: "key" | "value", val: string) => {
		const newItems = [...items];
		newItems[index] = { ...newItems[index], [field]: val };
		handleItemsChange(newItems);
	};

	return (
		<div className="rounded border bg-gray-50 p-4">
			{items.length === 0 && (
				<div className="mb-2 py-2 text-center text-gray-400">暂无参数,点击下方按钮添加</div>
			)}

			{items.map((item, index) => (
				<div key={index} className="mb-2 flex gap-2">
					{/* 序号 */}
					<span className="flex w-8 items-center text-gray-400">{index + 1}.</span>

					{/* 参数名 */}
					<Input
						placeholder="参数名 (如 targetPlanId)"
						value={item.key}
						onChange={(e) => handleChange(index, "key", e.target.value)}
						className="flex-1"
						disabled={disabled}
					/>

					{/* 参数值 */}
					<Input
						placeholder="参数值 (如 900188)"
						value={item.value}
						onChange={(e) => handleChange(index, "value", e.target.value)}
						className="flex-1"
						disabled={disabled}
					/>

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
				{placeholder || "添加参数"}
			</Button>
		</div>
	);
}
