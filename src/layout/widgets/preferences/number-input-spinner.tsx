import { isNumber } from "#src/utils";
import { MinusOutlined, PlusOutlined } from "@ant-design/icons";

import { Button, InputNumber, Space } from "antd";

export interface NumberInputSpinnerProps {
	children: React.ReactNode;
	name: string;
	min: number;
	max: number;
	value?: number;
	disabled?: boolean;
	onChange?: (a: string, b: number) => void;
}

export function NumberInputSpinner({
	children,
	disabled,
	value,
	name,
	onChange,
	min,
	max,
}: NumberInputSpinnerProps) {
	const isMax = value === max;
	const isMin = value === min;

	const handleDecrement = () => {
		if (value && isNumber(value) && !isMin) {
			onChange?.(name, value - 1);
		}
	};
	const handleIncrement = () => {
		if (value && isNumber(value) && !isMax) {
			onChange?.(name, value + 1);
		}
	};

	const handleChange = (v: number | null) => {
		if (v && isNumber(v)) {
			onChange?.(name, v);
		}
	};

	return (
		<div className="my-1 flex w-full items-center justify-between rounded-md px-2 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700">
			<span className="flex items-center text-sm">{children}</span>
			<Space.Compact>
				<Button
					className="rounded-none"
					type="text"
					disabled={isMin}
					onPointerDown={handleDecrement}
					icon={<MinusOutlined />}
				/>
				<InputNumber
					className="w-40 [&_input]:!text-center"
					min={min}
					max={max}
					precision={0}
					changeOnWheel
					controls={false}
					disabled={disabled}
					value={value}
					onChange={handleChange}
				/>
				<Button
					className="rounded-none"
					type="text"
					disabled={isMax}
					onPointerDown={handleIncrement}
					icon={<PlusOutlined />}
				/>
			</Space.Compact>
		</div>
	);
}
