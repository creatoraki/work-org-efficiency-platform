/**
 * 部门树组件
 * 纯展示组件，负责渲染部门树和搜索框
 */

import type { OrganizationTreeNode } from "#src/api/common";

import { SearchOutlined } from "@ant-design/icons";
import { Empty, Form, Input, theme, Tree } from "antd";
import React from "react";

/**
 * 部门树组件属性接口
 */
interface DepartmentTreeProps {
	/** 搜索值 */
	searchValue: string;
	/** 搜索值变化回调 */
	onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	/** 树数据 */
	treeData: OrganizationTreeNode[];
	/** 选中的部门编码 */
	selectedKeys: string[];
	/** 选中回调 */
	onSelect: (selectedKeys: React.Key[], info: any) => void;
	/** 展开的节点 */
	expandedKeys: React.Key[];
	/** 展开回调 */
	onExpand: (keys: React.Key[]) => void;
	/** 自动展开父节点 */
	autoExpandParent: boolean;
}

/**
 * 部门树组件
 *
 * @param props - 组件属性
 */
export function DepartmentTree({
	searchValue,
	onSearchChange,
	treeData,
	selectedKeys,
	onSelect,
	expandedKeys,
	onExpand,
	autoExpandParent,
}: DepartmentTreeProps) {
	const { token } = theme.useToken();

	return (
		<div className="flex w-1/3 flex-col rounded border border-gray-200 p-4">
			<Form.Item noStyle>
				<Input
					suffix={<SearchOutlined style={{ color: token.colorTextTertiary }} />}
					placeholder="搜索名称"
					value={searchValue}
					onChange={onSearchChange}
					allowClear
					className="mb-4"
				/>
			</Form.Item>
			<div className="relative flex-1 overflow-auto">
				{treeData.length === 0 ? (
					<div className="absolute inset-0 flex items-center justify-center">
						<Empty description="暂无组织数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
					</div>
				) : (
					<Tree
						treeData={treeData as any}
						selectedKeys={selectedKeys}
						onSelect={onSelect}
						expandedKeys={expandedKeys}
						onExpand={onExpand}
						autoExpandParent={autoExpandParent}
						fieldNames={{
							title: "name",
							key: "code",
							children: "children",
						}}
						titleRender={(nodeData: any) => {
							const strTitle = nodeData.name || "";
							const index = strTitle.indexOf(searchValue);
							if (index > -1) {
								const beforeStr = strTitle.substring(0, index);
								const afterStr = strTitle.slice(index + searchValue.length);
								return (
									<span>
										{beforeStr}
										<span style={{ color: token.colorError }}>
											{searchValue}
										</span>
										{afterStr}
									</span>
								);
							}
							return <span>{strTitle}</span>;
						}}
					/>
				)}
			</div>
		</div>
	);
}
