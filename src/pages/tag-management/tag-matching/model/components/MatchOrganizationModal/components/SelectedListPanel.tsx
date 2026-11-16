import { CloseOutlined } from "@ant-design/icons";
import { Button, Empty, List } from "antd";
import React from "react";

/**
 * 已选列表面板属性
 */
interface SelectedListPanelProps {
	/** 已选中的节点列表 */
	checkedNodes: any[];
	/** 移除节点回调 */
	onRemove: (key: React.Key) => void;
	/** 清空所有节点回调 */
	onClear: () => void;
}

/**
 * 右侧已选列表面板组件
 */
export function SelectedListPanel({ checkedNodes, onRemove, onClear }: SelectedListPanelProps) {
	return (
		<div className="flex w-64 flex-col bg-white p-3">
			<div className="mb-3 flex items-center justify-between">
				<span className="font-medium">已选 ({checkedNodes.length})</span>
				<Button
					type="link"
					size="small"
					onClick={onClear}
					disabled={checkedNodes.length === 0}
				>
					清空
				</Button>
			</div>
			<div className="flex-1 overflow-auto">
				{checkedNodes.length === 0 ? (
					<Empty description="未选择任何对象" image={Empty.PRESENTED_IMAGE_SIMPLE} />
				) : (
					<List
						split={false}
						dataSource={checkedNodes}
						renderItem={(node: any) => (
							<List.Item
								style={{
									background: "#f0f2f5",
									borderRadius: 6,
									padding: "8px 12px",
									marginBottom: 8,
								}}
							>
								<div className="flex w-full items-center justify-between">
									<span
										className="flex-1 truncate text-sm font-semibold"
										title={node.name}
									>
										{node.name}
									</span>
									<Button
										type="text"
										size="small"
										icon={<CloseOutlined />}
										onClick={() => onRemove(node.id)}
										className="ml-2 text-gray-500 hover:text-red-500"
									/>
								</div>
							</List.Item>
						)}
					/>
				)}
			</div>
		</div>
	);
}
