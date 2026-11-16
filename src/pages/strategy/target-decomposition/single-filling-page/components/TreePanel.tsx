import type { DataNode } from "../types";
import { Input, Tag, theme, Tree } from "antd";
import React from "react";

export interface TreePanelProps {
	treeData: DataNode[];
	selectedKeys: string[];
	expandedKeys: React.Key[];
	onSelect: (selectedKeys: React.Key[]) => void;
	onExpand: (expandedKeys: React.Key[]) => void;
	search: string;
	onSearchChange: (value: string) => void;
}

/**
 * 左侧树面板组件 - 完全匹配主文件实现
 */
export const TreePanel: React.FC<TreePanelProps> = React.memo(
	({ treeData, selectedKeys, expandedKeys, onSelect, onExpand, search, onSearchChange }) => {
		const { token } = theme.useToken();

		return (
			<div
				className="left-tree-wrapper"
				style={{
					height: "calc(100vh - 200px)",
					width: 240,
					border: "1px solid #f0f0f0",
					padding: 12,
					borderRadius: 4,
					background: token.colorBgContainer,
					float: "left",
					boxSizing: "border-box",
					display: "flex",
					flexDirection: "column",
				}}
			>
				<Input.Search
					placeholder="搜索组织/计划"
					value={search}
					onChange={(e) => onSearchChange(e.target.value)}
					allowClear
					style={{ marginBottom: 8 }}
				/>
				<div
					className="left-tree-scroll-container"
					style={{ flex: 1, minHeight: 0, overflow: "auto", paddingBottom: 8 }}
				>
					<Tree
						treeData={treeData}
						selectedKeys={selectedKeys}
						expandedKeys={expandedKeys}
						onExpand={(keys) => onExpand(keys as React.Key[])}
						onSelect={(keys) => {
							const nextKeys = keys as React.Key[];
							if (nextKeys.length === 0) return;
							onSelect(nextKeys);
						}}
						fieldNames={{ title: "title", key: "key", children: "children" }}
						titleRender={(node: any) => {
							let color = "#1677ff";
							let bg = "#e6f4ff";
							if (node.fillInLabels === "已校验") {
								color = "rgba(20, 185, 104, 1)";
								bg = "rgba(20, 185, 104, 0.1)";
							} else if (node.fillInLabels === "进行中") {
								color = "rgba(255, 125, 0, 1)";
								bg = "rgba(255, 125, 0, 0.1)";
							}
							return (
								<div
									title={node.title as string}
									style={{
										overflow: "hidden",
										textOverflow: "ellipsis",
										whiteSpace: "nowrap",
									}}
								>
									{node.fillInLabels && (
										<Tag
											bordered={false}
											style={{ color, backgroundColor: bg, marginRight: 4 }}
										>
											{node.fillInLabels}
										</Tag>
									)}
									{node.title}
								</div>
							);
						}}
					/>
				</div>
			</div>
		);
	},
);

TreePanel.displayName = "TreePanel";
