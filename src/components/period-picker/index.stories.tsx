import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import { PeriodPicker } from "./index";

const meta: Meta<typeof PeriodPicker> = {
	title: "Components/PeriodPicker",
	component: PeriodPicker,
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component: "一个用于选择年份和周期的组件，支持动画切换年份、清空选择等功能。",
			},
		},
	},
	tags: ["autodocs"],
	argTypes: {
		value: { control: "object", description: "当前选中值 [年份, 周期值]" },
		borderless: { control: "boolean", description: "是否无边框模式" },
		disabled: { control: "boolean", description: "是否禁用" },
		allowClear: { control: "boolean", description: "是否允许清空" },
		parentOpen: { control: "boolean", description: "父级弹窗打开状态（用于重置年份）" },
	},
};

export default meta;
type Story = StoryObj<typeof PeriodPicker>;

function PeriodPickerWithState(args: any) {
	const [value, setValue] = useState<[number, number] | null>(args.value || null);
	return (
		<div style={{ width: 300 }}>
			<PeriodPicker {...args} value={value} onChange={setValue} />
			<div style={{ marginTop: 16, color: "#666", fontSize: 12 }}>
				当前选中值: {JSON.stringify(value)}
			</div>
		</div>
	);
}

export const Default: Story = {
	args: {
		allowClear: true,
	},
	render: (args) => <PeriodPickerWithState {...args} />,
};

export const WithInitialValue: Story = {
	args: {
		value: [2025, 1],
	},
	render: (args) => <PeriodPickerWithState {...args} />,
};

export const Borderless: Story = {
	args: {
		borderless: true,
		value: [2025, 2],
	},
	render: (args) => <PeriodPickerWithState {...args} />,
};

export const Disabled: Story = {
	args: {
		disabled: true,
		value: [2025, 3],
	},
	render: (args) => <PeriodPickerWithState {...args} />,
};

export const NoClear: Story = {
	args: {
		allowClear: false,
		value: [2025, 4],
	},
	render: (args) => <PeriodPickerWithState {...args} />,
};
