import { SearchOutlined } from "@ant-design/icons";
import { Empty, Input, Spin, theme, Tree } from "antd";
import React from "react";

/**
 * 树面板属性
 */
interface TreePanelProps {
	/** 树数据加载状态 */
	loading: boolean;
	/** 树数据 */
	treeData: any[];
	/** 显示用的树数据（搜索过滤后） */
	displayTreeData: any[];
	/** 选中的节点 keys */
	checkedKeys: React.Key[];
	/** 展开的节点 keys */
	expandedKeys: React.Key[];
	/** 是否自动展开父节点 */
	autoExpandParent: boolean;
	/** 节点勾选回调 */
	onCheck: (checked: any, info: any) => void;
	/** 节点展开/收起回调 */
	onExpand: (keys: React.Key[]) => void;
	/** 搜索回调 */
	onSearch: (e: React.ChangeEvent<HTMLInputElement>) => void;
	/** 标题渲染函数 */
	titleRender: (node: any) => React.ReactNode;
}

/**
 * 中间树面板组件
 */
export function TreePanel({
	loading,
	treeData,
	displayTreeData,
	checkedKeys,
	expandedKeys,
	autoExpandParent,
	onCheck,
	onExpand,
	onSearch,
	titleRender,
}: TreePanelProps) {
	const { token } = theme.useToken();

	return (
		<div className="flex min-w-0 flex-1 flex-col border-r border-gray-200 p-3">
			<Input
				placeholder="搜索"
				allowClear
				onChange={onSearch}
				suffix={<SearchOutlined style={{ color: token.colorTextTertiary }} />}
				className="mb-3"
			/>
			<div className="flex-1 overflow-auto">
				<Spin spinning={loading}>
					{treeData.length > 0 ? (
						<Tree
							checkable
							checkStrictly
							treeData={displayTreeData}
							fieldNames={{ title: "name", key: "id", children: "children" }}
							checkedKeys={checkedKeys}
							onCheck={onCheck}
							expandedKeys={expandedKeys}
							onExpand={onExpand}
							autoExpandParent={autoExpandParent}
							titleRender={titleRender}
							height={420}
							blockNode
						/>
					) : (
						<div className="flex h-full items-center justify-center pt-20">
							{loading ? (
								<Empty
									description="加载中..."
									image={Empty.PRESENTED_IMAGE_SIMPLE}
								/>
							) : (
								<Empty
									description="暂无数据"
									image={Empty.PRESENTED_IMAGE_SIMPLE}
								/>
							)}
						</div>
					)}
				</Spin>
			</div>
		</div>
	);
}
