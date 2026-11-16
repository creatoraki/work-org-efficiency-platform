import type { DeploymentPersistDebugPayloads } from "./deployment-persist-payload";

import { Button, Drawer, Tabs, Typography } from "antd";

const { Text } = Typography;

interface DeploymentPayloadDebugDrawerProps {
	open: boolean;
	onClose: () => void;
	payloads: DeploymentPersistDebugPayloads;
}

/**
 * 开发环境调试抽屉：预览暂存 / 保存接口请求体 JSON。
 *
 * @param props - 组件属性
 * @param props.open - 是否打开
 * @param props.onClose - 关闭回调
 * @param props.payloads - 暂存与保存请求体
 * @returns 左侧调试抽屉
 *
 * @author 王善能
 * @since 2026-06-11
 */
export function DeploymentPayloadDebugDrawer({
	open,
	onClose,
	payloads,
}: DeploymentPayloadDebugDrawerProps) {
	const tabItems = [
		{
			key: "stash",
			label: "暂存 deploy/save",
			children: (
				<JsonPreview
					title="POST /deploy/save"
					description="步骤一、二点击「暂存」时将发送以下 JSON"
					data={payloads.stash}
				/>
			),
		},
		{
			key: "commit",
			label: "保存 deploy/commit",
			children: payloads.commit ? (
				<JsonPreview
					title="POST /deploy/commit"
					description="步骤三点击「保存」时将发送以下 JSON"
					data={payloads.commit}
				/>
			) : (
				<Text type="secondary">请先选择方案后，保存请求体才会生成。</Text>
			),
		},
	];

	return (
		<Drawer
			open={open}
			onClose={onClose}
			title="接口请求体预览"
			placement="left"
			width={560}
			destroyOnClose
			footer={
				<div className="flex justify-end">
					<Button onClick={onClose}>关闭</Button>
				</div>
			}
		>
			<Tabs items={tabItems} />
		</Drawer>
	);
}

function JsonPreview({
	title,
	description,
	data,
}: {
	title: string;
	description: string;
	data: unknown;
}) {
	const jsonText = JSON.stringify(data, null, 2);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(jsonText);
		} catch {
			// 忽略复制失败
		}
	};

	return (
		<div className="flex min-h-0 flex-col gap-3">
			<div className="flex items-start justify-between gap-3">
				<div>
					<Text strong>{title}</Text>
					<div>
						<Text type="secondary" className="text-xs">
							{description}
						</Text>
					</div>
				</div>
				<Button size="small" onClick={() => void handleCopy()}>
					复制
				</Button>
			</div>
			<pre className="custom-scrollbar max-h-[calc(100vh-220px)] overflow-auto rounded border bg-[#fafafa] p-3 text-xs leading-5">
				{jsonText}
			</pre>
		</div>
	);
}
