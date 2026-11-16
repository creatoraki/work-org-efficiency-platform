import type { Meta, StoryObj } from "@storybook/react";
import { useId, useState } from "react";
import { WaterDropTabs } from "./index";

const meta: Meta<typeof WaterDropTabs> = {
	title: "Components/WaterDropTabs",
	component: WaterDropTabs,
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component:
					"一个带有水滴流动动画效果的 Tab 切换组件。适用于一级导航或页面内模块切换，支持自定义颜色和响应式布局。",
			},
		},
	},
	tags: ["autodocs"],
	argTypes: {
		activeIdx: { control: "number" },
		className: { control: "text" },
		color: { control: "color" },
	},
};

export default meta;
type Story = StoryObj<typeof WaterDropTabs>;

function TabsWithState(args: any) {
	const [activeIdx, setActiveIdx] = useState(0);
	const id = useId();
	return (
		<div style={{ width: args.width || 600 }}>
			<WaterDropTabs {...args} layoutId={id} activeIdx={activeIdx} onChange={setActiveIdx} />
		</div>
	);
}

export const Default: Story = {
	args: {
		tabs: [
			{ label: "全部(15条)", value: 0 },
			{ label: "人效管控(10条)", value: 1 },
			{ label: "人岗匹配(5条)", value: 2 },
		],
	},
	render: (args) => <TabsWithState {...args} width={600} />,
};

export const TwoTabs: Story = {
	args: {
		tabs: [
			{ label: "Tab 1", value: 0 },
			{ label: "Tab 2", value: 1 },
		],
	},
	render: (args) => <TabsWithState {...args} width={400} />,
};

export const ManyTabs: Story = {
	args: {
		tabs: [
			{ label: "首页", count: 10, value: 0 },
			{ label: "文档", count: 5, value: 1 },
			{ label: "组件", count: 6, value: 2 },
			{ label: "API", count: 7, value: 3 },
			{ label: "关于", count: 5, value: 4 },
		],
	},
	render: (args) => <TabsWithState {...args} width={800} />,
};

export const CustomColor: Story = {
	args: {
		tabs: [
			{ label: "Red", value: 0 },
			{ label: "Green", value: 1 },
			{ label: "Blue", value: 2 },
		],
		color: "#ff4d4f",
	},
	render: (args) => <TabsWithState {...args} width={600} />,
};
