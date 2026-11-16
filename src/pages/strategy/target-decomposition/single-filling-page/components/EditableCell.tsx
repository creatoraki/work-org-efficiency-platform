import { InputNumber } from "antd";
import React, { useEffect, useState } from "react";

export interface EditableCellProps {
	value: any;
	id: any;
	onSave: (id: any, val: any) => void;
	disabled?: boolean;
}

/**
 * 可编辑数字单元格组件
 */
export const EditableCell: React.FC<EditableCellProps> = React.memo(
	({ value, id, onSave, disabled = false }) => {
		const [val, setVal] = useState(value);
		useEffect(() => {
			setVal(value);
		}, [value]);
		const save = () => {
			if (!disabled) {
				onSave(id, val);
			}
		};
		return (
			<InputNumber
				style={{ width: "100%" }}
				value={val}
				onChange={setVal}
				onBlur={save}
				onPressEnter={save}
				disabled={disabled}
			/>
		);
	},
);

EditableCell.displayName = "EditableCell";
