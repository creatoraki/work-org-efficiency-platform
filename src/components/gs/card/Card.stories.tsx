import type { Meta, StoryObj } from "@storybook/react";
import {
	DeleteOutlined,
	EditOutlined,
	HeartOutlined,
	MoreOutlined,
	ShareAltOutlined,
} from "@ant-design/icons";
import { GSCard } from "@components/gs/card";
import { fn } from "@storybook/test";
import { Avatar, Button, Divider, message, Space, Typography } from "antd";

import { useState } from "react";

const { Paragraph, Text } = Typography;

const meta: Meta<typeof GSCard> = {
	title: "Components/GSCard",
	component: GSCard,
	tags: ["autodocs"],
	parameters: {
		layout: "padded",
		docs: {
			description: {
				component:
					"GSCard（GS = 绿城科技 善数研发）基于 antd Card 封装，提供 variant（default / bordered / shadow）以及 hoverable，其余属性与 antd Card 保持一致。",
			},
		},
	},
	argTypes: {
		variant: {
			control: "select",
			options: ["default", "bordered", "shadow"],
			description: "卡片变体样式",
			table: {
				type: { summary: "GSCardVariant" },
				defaultValue: { summary: "default" },
			},
		},
		hoverable: {
			control: "boolean",
			description: "是否可悬浮（当 variant 为 shadow 时默认启用）",
			table: {
				type: { summary: "boolean" },
				defaultValue: { summary: "false" },
			},
		},
		title: {
			control: "text",
			description: "卡片标题",
			table: {
				type: { summary: "ReactNode" },
			},
		},
		extra: {
			control: "text",
			description: "卡片右上角操作区域",
			table: {
				type: { summary: "ReactNode" },
			},
		},
		children: {
			control: "text",
			description: "卡片内容",
			table: {
				type: { summary: "ReactNode" },
			},
		},
		cover: {
			control: false,
			description: "卡片封面图片",
			table: {
				type: { summary: "ReactNode" },
				category: "Antd Props",
			},
		},
		actions: {
			control: false,
			description: "卡片操作组，位置在卡片底部",
			table: {
				type: { summary: "ReactNode[]" },
				category: "Antd Props",
			},
		},
		bordered: {
			control: "boolean",
			description: "是否有边框（当 variant 为 bordered 时默认启用）",
			table: {
				type: { summary: "boolean" },
				defaultValue: { summary: "true" },
				category: "Antd Props",
			},
		},
		loading: {
			control: "boolean",
			description: "当卡片内容还在加载中时，可以用 loading 展示一个占位",
			table: {
				type: { summary: "boolean" },
				defaultValue: { summary: "false" },
				category: "Antd Props",
			},
		},
		size: {
			control: "select",
			options: ["default", "small"],
			description: "卡片尺寸",
			table: {
				type: { summary: "'default' | 'small'" },
				defaultValue: { summary: "default" },
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
			action: "cardClicked",
			description: "卡片点击事件（当 hoverable 为 true 时可用）",
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
	},
	args: {
		title: "卡片标题",
		children: "这是卡片的内容区域，可以放置任何内容。",
		onClick: fn(),
		onMouseEnter: fn(),
		onMouseLeave: fn(),
	},
};

export default meta;

type Story = StoryObj<typeof GSCard>;

// ==================== 基础样式 ====================
export const Default: Story = {
	args: {
		variant: "default",
	},
};

export const Bordered: Story = {
	args: {
		variant: "bordered",
		title: "带边框卡片",
	},
};

export const Shadow: Story = {
	args: {
		variant: "shadow",
		title: "阴影卡片",
	},
};

// ==================== Children 处理示例 ====================
export const ChildrenAsText: Story = {
	args: {
		title: "文本内容",
		children: "这是简单的文本内容，可以直接作为 children 传入。",
	},
	parameters: {
		docs: {
			description: {
				story: "children 可以是简单的文本字符串",
			},
		},
	},
};

export const ChildrenAsReactNode: Story = {
	args: {
		title: "复杂内容",
		children: (
			<div>
				<Paragraph>这是卡片的内容区域，可以放置任何 ReactNode。</Paragraph>
				<Divider />
				<Space>
					<Button type="primary">操作按钮</Button>
					<Button>取消</Button>
				</Space>
			</div>
		),
	},
	parameters: {
		docs: {
			description: {
				story: "children 可以是复杂的 ReactNode，支持嵌套组件",
			},
		},
	},
};

export const DynamicChildren: Story = {
	render: () => {
		const DynamicChildrenDemo = () => {
			const [count, setCount] = useState(0);
			return (
				<GSCard title="动态内容" onClick={() => setCount(count + 1)}>
					<Space direction="vertical">
						<Text>
							点击卡片次数:
							{count}
						</Text>
						<Button
							onClick={(e) => {
								e.stopPropagation();
								setCount(0);
							}}
						>
							重置计数
						</Button>
					</Space>
				</GSCard>
			);
		};

		return <DynamicChildrenDemo />;
	},
	parameters: {
		docs: {
			description: {
				story: "children 可以动态变化，支持状态更新和交互",
			},
		},
	},
};

// ==================== 标题和操作区域 ====================
export const WithTitle: Story = {
	args: {
		title: "带标题的卡片",
		children: "卡片内容",
	},
};

export const WithExtra: Story = {
	args: {
		title: "带操作区域的卡片",
		extra: (
			<Button type="link" icon={<MoreOutlined />}>
				更多
			</Button>
		),
		children: "右上角有额外的操作按钮",
	},
};

export const CustomTitle: Story = {
	args: {
		title: (
			<Space>
				<Avatar size="small" style={{ backgroundColor: "#1677ff" }}>
					C
				</Avatar>
				<span>自定义标题</span>
			</Space>
		),
		extra: (
			<Space>
				<Button type="text" icon={<EditOutlined />} />
				<Button type="text" danger icon={<DeleteOutlined />} />
			</Space>
		),
		children: "标题和操作区域都可以是自定义的 ReactNode",
	},
};

// ==================== 交互事件 ====================
export const Clickable: Story = {
	args: {
		variant: "shadow",
		title: "可点击卡片",
		children: "点击此卡片查看 Actions 面板",
		onClick: fn((e) => {
			console.warn("卡片被点击", e);
			message.info("卡片被点击了！");
		}),
	},
};

export const Hoverable: Story = {
	args: {
		variant: "shadow",
		title: "可悬浮卡片",
		children: "鼠标悬停查看效果",
		hoverable: true,
	},
};

export const AllEvents: Story = {
	render: () => (
		<GSCard
			title="所有事件示例"
			variant="shadow"
			hoverable
			onClick={fn((e) => console.warn("点击", e))}
			onMouseEnter={fn((e) => console.warn("鼠标进入", e))}
			onMouseLeave={fn((e) => console.warn("鼠标离开", e))}
		>
			<Text>悬停并点击卡片，查看控制台输出</Text>
		</GSCard>
	),
};

// ==================== 实际应用场景 ====================
export const ProductCard: Story = {
	render: () => (
		<GSCard
			variant="shadow"
			hoverable
			style={{ width: 300 }}
			cover={
				<img
					alt="产品图片"
					src="https://via.placeholder.com/300x200?text=Product+Image"
					style={{ height: 200, objectFit: "cover" }}
				/>
			}
			actions={[
				<HeartOutlined key="like" />,
				<ShareAltOutlined key="share" />,
				<MoreOutlined key="more" />,
			]}
		>
			<Space direction="vertical" style={{ width: "100%" }}>
				<Text strong style={{ fontSize: 16 }}>
					产品名称
				</Text>
				<Text type="secondary">这是产品的描述信息，可以包含多行内容。</Text>
				<Text strong style={{ fontSize: 18, color: "#1677ff" }}>
					¥ 299.00
				</Text>
			</Space>
		</GSCard>
	),
	parameters: {
		docs: {
			description: {
				story: "实际应用场景：产品卡片",
			},
		},
	},
};

export const UserCard: Story = {
	render: () => (
		<GSCard
			variant="bordered"
			style={{ width: 300 }}
			title={
				<Space>
					<Avatar size="large" style={{ backgroundColor: "#1677ff" }}>
						用户
					</Avatar>
					<Space direction="vertical" size={0}>
						<Text strong>张三</Text>
						<Text type="secondary" style={{ fontSize: 12 }}>
							产品经理
						</Text>
					</Space>
				</Space>
			}
			extra={<Button type="link">编辑</Button>}
		>
			<Space direction="vertical" style={{ width: "100%" }}>
				<Text>
					<Text strong>邮箱：</Text>
					zhangsan@example.com
				</Text>
				<Text>
					<Text strong>电话：</Text>
					138****8888
				</Text>
				<Text>
					<Text strong>部门：</Text>
					产品研发部
				</Text>
			</Space>
		</GSCard>
	),
	parameters: {
		docs: {
			description: {
				story: "实际应用场景：用户信息卡片",
			},
		},
	},
};

export const StatCard: Story = {
	render: () => (
		<Space>
			<GSCard variant="shadow" style={{ width: 200, textAlign: "center" }}>
				<Space direction="vertical">
					<Text type="secondary">总用户数</Text>
					<Text strong style={{ fontSize: 32, color: "#1677ff" }}>
						1,234
					</Text>
					<Text type="secondary" style={{ fontSize: 12 }}>
						较上月 +12%
					</Text>
				</Space>
			</GSCard>
			<GSCard variant="shadow" style={{ width: 200, textAlign: "center" }}>
				<Space direction="vertical">
					<Text type="secondary">活跃用户</Text>
					<Text strong style={{ fontSize: 32, color: "#52c41a" }}>
						856
					</Text>
					<Text type="secondary" style={{ fontSize: 12 }}>
						较上月 +8%
					</Text>
				</Space>
			</GSCard>
			<GSCard variant="shadow" style={{ width: 200, textAlign: "center" }}>
				<Space direction="vertical">
					<Text type="secondary">新增用户</Text>
					<Text strong style={{ fontSize: 32, color: "#faad14" }}>
						234
					</Text>
					<Text type="secondary" style={{ fontSize: 12 }}>
						较上月 +15%
					</Text>
				</Space>
			</GSCard>
		</Space>
	),
	parameters: {
		docs: {
			description: {
				story: "实际应用场景：统计卡片",
			},
		},
	},
};

// ==================== 其他属性示例 ====================
export const WithCover: Story = {
	args: {
		title: "带封面的卡片",
		cover: (
			<img
				alt="封面图片"
				src="https://via.placeholder.com/300x200?text=Cover+Image"
				style={{ width: "100%", height: 200, objectFit: "cover" }}
			/>
		),
		children: "卡片可以包含封面图片",
	},
	parameters: {
		docs: {
			description: {
				story: "使用 cover 属性添加卡片封面",
			},
		},
	},
};

export const WithActions: Story = {
	args: {
		title: "带操作按钮的卡片",
		actions: [
			<Button key="edit" type="text" icon={<EditOutlined />}>
				编辑
			</Button>,
			<Button key="delete" type="text" danger icon={<DeleteOutlined />}>
				删除
			</Button>,
		],
		children: "底部操作区域可以放置多个操作按钮",
	},
	parameters: {
		docs: {
			description: {
				story: "使用 actions 属性在卡片底部添加操作按钮",
			},
		},
	},
};

export const Loading: Story = {
	args: {
		title: "加载中",
		loading: true,
		children: "卡片内容加载中...",
	},
	parameters: {
		docs: {
			description: {
				story: "使用 loading 属性显示加载状态",
			},
		},
	},
};

export const Sizes: Story = {
	render: () => (
		<Space>
			<GSCard title="默认尺寸" style={{ width: 200 }}>
				默认尺寸卡片
			</GSCard>
			<GSCard title="小尺寸" size="small" style={{ width: 200 }}>
				小尺寸卡片
			</GSCard>
		</Space>
	),
	parameters: {
		docs: {
			description: {
				story: "卡片支持两种尺寸：default（默认）和 small（小）",
			},
		},
	},
};

export const CustomStyle: Story = {
	render: () => (
		<GSCard
			title="自定义样式"
			style={{
				background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
				color: "#fff",
			}}
			headStyle={{ borderBottom: "1px solid rgba(255,255,255,0.2)" }}
		>
			<Text style={{ color: "#fff" }}>可以通过 style 和 headStyle 自定义卡片样式</Text>
		</GSCard>
	),
	parameters: {
		docs: {
			description: {
				story: "可以通过 style 和 headStyle 属性自定义卡片样式",
			},
		},
	},
};

// ==================== 综合示例 ====================
export const AllVariants: Story = {
	render: () => (
		<Space direction="vertical" size="large" style={{ width: "100%" }}>
			<div>
				<h4 style={{ marginBottom: 8 }}>基础变体</h4>
				<Space>
					<GSCard variant="default" title="默认样式" style={{ width: 250 }}>
						默认卡片
					</GSCard>
					<GSCard variant="bordered" title="边框样式" style={{ width: 250 }}>
						边框卡片
					</GSCard>
					<GSCard variant="shadow" title="阴影样式" style={{ width: 250 }}>
						阴影卡片
					</GSCard>
				</Space>
			</div>
			<div>
				<h4 style={{ marginBottom: 8 }}>交互状态</h4>
				<Space>
					<GSCard variant="shadow" hoverable title="可悬浮" style={{ width: 250 }}>
						鼠标悬停查看效果
					</GSCard>
					<GSCard
						variant="shadow"
						hoverable
						title="可点击"
						onClick={fn()}
						style={{ width: 250 }}
					>
						点击卡片触发事件
					</GSCard>
					<GSCard title="加载中" loading style={{ width: 250 }}>
						加载状态
					</GSCard>
				</Space>
			</div>
			<div>
				<h4 style={{ marginBottom: 8 }}>尺寸</h4>
				<Space>
					<GSCard title="默认尺寸" style={{ width: 200 }}>
						默认
					</GSCard>
					<GSCard title="小尺寸" size="small" style={{ width: 200 }}>
						小
					</GSCard>
				</Space>
			</div>
		</Space>
	),
	parameters: {
		layout: "padded",
	},
};
