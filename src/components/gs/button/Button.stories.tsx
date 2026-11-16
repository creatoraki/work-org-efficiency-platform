import type { Meta, StoryObj } from "@storybook/react";
import {
	DeleteOutlined,
	DownloadOutlined,
	EditOutlined,
	PlusOutlined,
	SaveOutlined,
	SearchOutlined,
} from "@ant-design/icons";
import { GSButton } from "@components/gs/button";
import { fn } from "@storybook/test";
import { Button, message, Space } from "antd";
import { useState } from "react";

const { Group: ButtonGroup } = Button;

const meta: Meta<typeof GSButton> = {
	title: "Components/GSButton",
	component: GSButton,
	tags: ["autodocs"],
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component:
					"GSButton（GS = 绿城科技 善数研发）基于 antd Button 封装，提供 tone（primary / secondary / ghost / text）以及 fullWidth，其余属性与 antd Button 保持一致。",
			},
		},
	},
	argTypes: {
		tone: {
			control: "select",
			options: ["primary", "secondary", "ghost", "text"],
			description: "色调预设，默认为 primary",
			table: {
				type: { summary: "GSButtonTone" },
				defaultValue: { summary: "primary" },
			},
		},
		fullWidth: {
			control: "boolean",
			description: "是否铺满父容器宽度",
			table: {
				type: { summary: "boolean" },
				defaultValue: { summary: "false" },
			},
		},
		size: {
			control: "select",
			options: ["large", "middle", "small"],
			description: "按钮尺寸",
			table: {
				type: { summary: "'large' | 'middle' | 'small'" },
				defaultValue: { summary: "middle" },
			},
		},
		loading: {
			control: "boolean",
			description: "加载状态",
			table: {
				type: { summary: "boolean" },
				defaultValue: { summary: "false" },
			},
		},
		disabled: {
			control: "boolean",
			description: "禁用状态",
			table: {
				type: { summary: "boolean" },
				defaultValue: { summary: "false" },
			},
		},
		danger: {
			control: "boolean",
			description: "危险按钮",
			table: {
				type: { summary: "boolean" },
				defaultValue: { summary: "false" },
			},
		},
		children: {
			control: "text",
			description: "按钮内容，可以是文本、图标或 ReactNode",
			table: {
				type: { summary: "ReactNode" },
			},
		},
		type: {
			control: "select",
			options: ["default", "primary", "dashed", "text", "link"],
			description: "按钮类型（注意：当设置了 tone 时，type 会被 tone 映射覆盖）",
			table: {
				type: { summary: "ButtonProps['type']" },
				category: "Antd Props",
			},
		},
		htmlType: {
			control: "select",
			options: ["button", "submit", "reset"],
			description: "原生 button 标签的 type 属性",
			table: {
				type: { summary: "'button' | 'submit' | 'reset'" },
				defaultValue: { summary: "button" },
				category: "Antd Props",
			},
		},
		shape: {
			control: "select",
			options: ["default", "circle", "round"],
			description: "按钮形状",
			table: {
				type: { summary: "'default' | 'circle' | 'round'" },
				defaultValue: { summary: "default" },
				category: "Antd Props",
			},
		},
		block: {
			control: "boolean",
			description: "是否铺满父容器宽度（与 fullWidth 功能相同）",
			table: {
				type: { summary: "boolean" },
				defaultValue: { summary: "false" },
				category: "Antd Props",
			},
		},
		className: {
			control: "text",
			description: "自定义类名",
			table: {
				type: { summary: "string" },
				category: "Style",
			},
		},
		style: {
			control: "object",
			description: "自定义样式对象",
			table: {
				type: { summary: "CSSProperties" },
				category: "Style",
			},
		},
		onClick: {
			action: "clicked",
			description: "点击事件回调",
			table: {
				type: { summary: "(event: MouseEvent) => void" },
				category: "Events",
			},
		},
		onMouseEnter: {
			action: "mouseEnter",
			description: "鼠标进入事件",
			table: {
				type: { summary: "(event: MouseEvent) => void" },
				category: "Events",
			},
		},
		onMouseLeave: {
			action: "mouseLeave",
			description: "鼠标离开事件",
			table: {
				type: { summary: "(event: MouseEvent) => void" },
				category: "Events",
			},
		},
		onFocus: {
			action: "focus",
			description: "获得焦点事件",
			table: {
				type: { summary: "(event: FocusEvent) => void" },
				category: "Events",
			},
		},
		onBlur: {
			action: "blur",
			description: "失去焦点事件",
			table: {
				type: { summary: "(event: FocusEvent) => void" },
				category: "Events",
			},
		},
	},
	args: {
		children: "操作按钮",
		tone: "primary",
		onClick: fn(),
		onMouseEnter: fn(),
		onMouseLeave: fn(),
		onFocus: fn(),
		onBlur: fn(),
	},
};

export default meta;

type Story = StoryObj<typeof GSButton>;

// ==================== 基础样式 ====================
export const Primary: Story = {
	args: {
		children: "主按钮",
	},
};

export const Secondary: Story = {
	args: {
		tone: "secondary",
		children: "次按钮",
	},
};

export const Ghost: Story = {
	args: {
		tone: "ghost",
		children: "幽灵按钮",
	},
};

export const Text: Story = {
	args: {
		tone: "text",
		children: "文本按钮",
	},
};

// ==================== Children 处理示例 ====================
export const ChildrenAsText: Story = {
	args: {
		children: "纯文本内容",
	},
	parameters: {
		docs: {
			description: {
				story: "children 可以是简单的文本字符串",
			},
		},
	},
};

export const ChildrenWithIcon: Story = {
	args: {
		icon: <DownloadOutlined />,
		children: "下载文件",
	},
	parameters: {
		docs: {
			description: {
				story: "children 可以与 icon 属性配合使用",
			},
		},
	},
};

export const ChildrenAsReactNode: Story = {
	render: () => (
		<GSButton>
			<span style={{ display: "flex", alignItems: "center", gap: 4 }}>
				<SaveOutlined />
				<span>保存并提交</span>
			</span>
		</GSButton>
	),
	parameters: {
		docs: {
			description: {
				story: "children 可以是复杂的 ReactNode，支持自定义布局",
			},
		},
	},
};

export const DynamicChildren: Story = {
	render: () => {
		const DynamicChildrenDemo = () => {
			const [count, setCount] = useState(0);
			return (
				<GSButton onClick={() => setCount(count + 1)}>
					点击次数:
					{count}
				</GSButton>
			);
		};

		return <DynamicChildrenDemo />;
	},
	parameters: {
		docs: {
			description: {
				story: "children 可以动态变化，支持状态更新",
			},
		},
	},
};

// 尺寸
export const Sizes: Story = {
	render: () => (
		<Space direction="vertical" size="middle">
			<GSButton size="large" tone="primary">
				大尺寸按钮
			</GSButton>
			<GSButton size="middle" tone="primary">
				中等尺寸按钮
			</GSButton>
			<GSButton size="small" tone="primary">
				小尺寸按钮
			</GSButton>
		</Space>
	),
};

// 图标按钮
export const WithIcon: Story = {
	args: {
		icon: <DownloadOutlined />,
		children: "下载",
	},
};

export const IconOnly: Story = {
	render: () => (
		<Space>
			<GSButton icon={<SearchOutlined />} />
			<GSButton icon={<EditOutlined />} tone="secondary" />
			<GSButton icon={<DeleteOutlined />} danger />
		</Space>
	),
};

// 加载状态
export const Loading: Story = {
	args: {
		loading: true,
		children: "加载中",
	},
};

export const LoadingWithIcon: Story = {
	args: {
		loading: true,
		icon: <DownloadOutlined />,
		children: "下载中",
	},
};

// 异步操作示例
export const AsyncAction: Story = {
	render: () => {
		const AsyncActionDemo = () => {
			const [loading, setLoading] = useState(false);

			const handleAsyncClick = async () => {
				setLoading(true);
				// 模拟异步操作
				await new Promise((resolve) => setTimeout(resolve, 2000));
				setLoading(false);
				message.success("操作完成！");
			};

			return (
				<GSButton loading={loading} onClick={handleAsyncClick} icon={<SaveOutlined />}>
					保存数据
				</GSButton>
			);
		};

		return <AsyncActionDemo />;
	},
};

// 禁用状态
export const Disabled: Story = {
	args: {
		disabled: true,
		children: "禁用按钮",
	},
};

export const DisabledStates: Story = {
	render: () => (
		<Space>
			<GSButton disabled tone="primary">
				禁用主按钮
			</GSButton>
			<GSButton disabled tone="secondary">
				禁用次按钮
			</GSButton>
			<GSButton disabled tone="ghost">
				禁用幽灵按钮
			</GSButton>
			<GSButton disabled tone="text">
				禁用文本按钮
			</GSButton>
		</Space>
	),
};

// 危险按钮
export const Danger: Story = {
	args: {
		danger: true,
		children: "危险操作",
	},
};

export const DangerVariants: Story = {
	render: () => (
		<Space>
			<GSButton danger tone="primary">
				删除
			</GSButton>
			<GSButton danger tone="secondary">
				删除
			</GSButton>
			<GSButton danger tone="ghost">
				删除
			</GSButton>
			<GSButton danger tone="text">
				删除
			</GSButton>
		</Space>
	),
};

// 全宽按钮
export const FullWidth: Story = {
	args: {
		fullWidth: true,
	},
	parameters: {
		layout: "padded",
	},
};

// 按钮组
export const ButtonGroupExample: Story = {
	render: () => (
		<Space direction="vertical" size="large">
			<ButtonGroup>
				<GSButton tone="primary">左</GSButton>
				<GSButton tone="primary">中</GSButton>
				<GSButton tone="primary">右</GSButton>
			</ButtonGroup>
			<ButtonGroup>
				<GSButton icon={<EditOutlined />}>编辑</GSButton>
				<GSButton icon={<DeleteOutlined />} danger>
					删除
				</GSButton>
			</ButtonGroup>
		</Space>
	),
};

// 点击事件示例
export const ClickEvent: Story = {
	args: {
		children: "点击我",
		onClick: fn((e) => {
			console.warn("按钮被点击", e);
			message.info("按钮被点击了！");
		}),
	},
};

// 鼠标事件示例
export const MouseEvents: Story = {
	render: () => (
		<GSButton
			onClick={fn((e) => console.warn("点击", e))}
			onMouseEnter={fn((e) => console.warn("鼠标进入", e))}
			onMouseLeave={fn((e) => console.warn("鼠标离开", e))}
			onFocus={fn((e) => console.warn("获得焦点", e))}
			onBlur={fn((e) => console.warn("失去焦点", e))}
		>
			悬停查看控制台
		</GSButton>
	),
};

// ==================== 形状和样式 ====================
export const Shapes: Story = {
	render: () => (
		<Space>
			<GSButton shape="default">默认</GSButton>
			<GSButton shape="round">圆角</GSButton>
			<GSButton shape="circle" icon={<SearchOutlined />} />
		</Space>
	),
	parameters: {
		docs: {
			description: {
				story: "按钮的不同形状：default（默认）、round（圆角）、circle（圆形）",
			},
		},
	},
};

export const HtmlType: Story = {
	render: () => (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				message.success("表单提交！");
			}}
		>
			<Space>
				<GSButton htmlType="submit" tone="primary">
					提交表单
				</GSButton>
				<GSButton htmlType="reset">重置</GSButton>
				<GSButton htmlType="button">普通按钮</GSButton>
			</Space>
		</form>
	),
	parameters: {
		docs: {
			description: {
				story: "htmlType 属性用于设置原生 button 标签的 type，常用于表单提交",
			},
		},
	},
};

export const CustomStyle: Story = {
	render: () => (
		<Space>
			<GSButton
				style={{
					background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
					border: "none",
					color: "#fff",
				}}
			>
				自定义样式
			</GSButton>
			<GSButton className="custom-button" style={{ borderRadius: 20 }}>
				自定义类名和样式
			</GSButton>
		</Space>
	),
	parameters: {
		docs: {
			description: {
				story: "可以通过 className 和 style 属性自定义按钮样式",
			},
		},
	},
};

// ==================== 综合示例 ====================
export const AllVariants: Story = {
	render: () => (
		<Space direction="vertical" size="large" style={{ width: "100%" }}>
			<div>
				<h4 style={{ marginBottom: 8 }}>基础样式</h4>
				<Space>
					<GSButton tone="primary">主按钮</GSButton>
					<GSButton tone="secondary">次按钮</GSButton>
					<GSButton tone="ghost">幽灵按钮</GSButton>
					<GSButton tone="text">文本按钮</GSButton>
				</Space>
			</div>
			<div>
				<h4 style={{ marginBottom: 8 }}>带图标</h4>
				<Space>
					<GSButton icon={<PlusOutlined />} tone="primary">
						新增
					</GSButton>
					<GSButton icon={<EditOutlined />} tone="secondary">
						编辑
					</GSButton>
					<GSButton icon={<DeleteOutlined />} danger>
						删除
					</GSButton>
				</Space>
			</div>
			<div>
				<h4 style={{ marginBottom: 8 }}>状态</h4>
				<Space>
					<GSButton loading>加载中</GSButton>
					<GSButton disabled>已禁用</GSButton>
					<GSButton danger>危险操作</GSButton>
				</Space>
			</div>
			<div>
				<h4 style={{ marginBottom: 8 }}>尺寸</h4>
				<Space>
					<GSButton size="large">大</GSButton>
					<GSButton size="middle">中</GSButton>
					<GSButton size="small">小</GSButton>
				</Space>
			</div>
			<div>
				<h4 style={{ marginBottom: 8 }}>形状</h4>
				<Space>
					<GSButton shape="default">默认</GSButton>
					<GSButton shape="round">圆角</GSButton>
					<GSButton shape="circle" icon={<SearchOutlined />} />
				</Space>
			</div>
		</Space>
	),
	parameters: {
		layout: "padded",
	},
};
