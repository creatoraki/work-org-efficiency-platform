import type { Meta, StoryObj } from "@storybook/react";

import { CollapsiblePanel } from "./CollapsiblePanel";

const meta: Meta<typeof CollapsiblePanel> = {
	title: "GS/CollapsiblePanel",
	component: CollapsiblePanel,
	parameters: {
		layout: "padded",
	},
	tags: ["autodocs"],
	argTypes: {
		width: {
			control: { type: "number" },
			description: "面板宽度",
		},
		defaultCollapsed: {
			control: { type: "boolean" },
			description: "初始是否折叠",
		},
		resizable: {
			control: { type: "boolean" },
			description: "是否启用拖拽调整宽度",
		},
		minWidth: {
			control: { type: "number" },
			description: "最小宽度限制",
		},
		maxWidth: {
			control: { type: "number" },
			description: "最大宽度限制",
		},
	},
};

export default meta;
type Story = StoryObj<typeof CollapsiblePanel>;

/**
 * 默认状态
 */
export const Default: Story = {
	args: {
		width: 320,
		children: (
			<div style={{ padding: 16 }}>
				<h3>面板内容</h3>
				<p>这是一个可折叠的侧边面板组件。</p>
				<p>点击右侧按钮可以折叠/展开面板。</p>
			</div>
		),
	},
};

/**
 * 初始折叠状态
 */
export const InitiallyCollapsed: Story = {
	args: {
		width: 320,
		defaultCollapsed: true,
		children: (
			<div style={{ padding: 16 }}>
				<h3>面板内容</h3>
				<p>初始状态为折叠。</p>
			</div>
		),
	},
};

/**
 * 可调整宽度
 */
export const Resizable: Story = {
	args: {
		width: 320,
		resizable: true,
		minWidth: 200,
		maxWidth: 600,
		children: (
			<div style={{ padding: 16 }}>
				<h3>可调整宽度</h3>
				<p>拖拽下方的双向箭头按钮可以调整面板宽度。</p>
				<p>最小宽度：200px</p>
				<p>最大宽度：600px</p>
			</div>
		),
	},
};

/**
 * 带回调函数
 */
export const WithCallbacks: Story = {
	args: {
		width: 320,
		resizable: true,
		onCollapsedChange: (isCollapsed) => {
			console.warn("折叠状态变化:", isCollapsed);
		},
		onWidthChange: (width) => {
			console.warn("宽度变化:", width);
		},
		children: (
			<div style={{ padding: 16 }}>
				<h3>带回调函数</h3>
				<p>打开控制台查看回调输出。</p>
			</div>
		),
	},
};

/**
 * 自定义宽度（字符串）
 */
export const StringWidth: Story = {
	args: {
		width: "25vw",
		children: (
			<div style={{ padding: 16 }}>
				<h3>自定义宽度</h3>
				<p>使用字符串设置宽度：25vw</p>
			</div>
		),
	},
};

/**
 * 复杂内容示例
 */
export const ComplexContent: Story = {
	args: {
		width: 360,
		resizable: true,
		children: (
			<div style={{ padding: 16, height: "100%", display: "flex", flexDirection: "column" }}>
				<h3 style={{ marginBottom: 16 }}>筛选条件</h3>
				<div style={{ flex: 1, overflow: "auto" }}>
					<div style={{ marginBottom: 12 }}>
						<label style={{ display: "block", marginBottom: 4 }}>关键词</label>
						<input
							type="text"
							placeholder="请输入关键词"
							style={{
								width: "100%",
								padding: 8,
								border: "1px solid #d9d9d9",
								borderRadius: 4,
							}}
						/>
					</div>
					<div style={{ marginBottom: 12 }}>
						<label style={{ display: "block", marginBottom: 4 }}>分类</label>
						<select
							style={{
								width: "100%",
								padding: 8,
								border: "1px solid #d9d9d9",
								borderRadius: 4,
							}}
						>
							<option>全部</option>
							<option>分类一</option>
							<option>分类二</option>
						</select>
					</div>
					<div style={{ marginBottom: 12 }}>
						<label style={{ display: "block", marginBottom: 4 }}>状态</label>
						<div>
							<label style={{ marginRight: 12 }}>
								<input type="checkbox" /> 启用
							</label>
							<label>
								<input type="checkbox" /> 禁用
							</label>
						</div>
					</div>
				</div>
				<div style={{ borderTop: "1px solid #e8e8e8", paddingTop: 12 }}>
					<button
						type="button"
						style={{
							width: "100%",
							padding: "8px 16px",
							backgroundColor: "#1890ff",
							color: "white",
							border: "none",
							borderRadius: 4,
							cursor: "pointer",
						}}
					>
						应用筛选
					</button>
				</div>
			</div>
		),
	},
	decorators: [
		(Story) => (
			<div style={{ height: 400, display: "flex" }}>
				<Story />
				<div style={{ flex: 1, padding: 16, backgroundColor: "#fafafa" }}>
					<h3>主内容区域</h3>
					<p>这是主内容区域，左侧是可折叠的筛选面板。</p>
				</div>
			</div>
		),
	],
};
