/**
 * 树形搜索面板组件
 */

import { Input, Tree } from "antd";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAdjustmentCanvas } from "../context";

interface TreePanelProps {
	className?: string;
}

export const TreePanel: React.FC<TreePanelProps> = ({ className }) => {
	const [treeSearch, setTreeSearch] = useState("");
	const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
	const hasInitExpanded = useRef(false);

	const { oepOrgTree, selectedTreeNodeId, handleTreeNodeSelect } = useAdjustmentCanvas();

	const filterTree = useCallback((nodes: any[], term: string): any[] => {
		if (!term) return nodes;
		const lower = term.toLowerCase();
		const res: any[] = [];
		for (const node of nodes) {
			const title = String(node.title || "").toLowerCase();
			const children = node.children ? filterTree(node.children, term) : [];
			if (title.includes(lower) || (children && children.length > 0)) {
				res.push({ ...node, children: children.length ? children : undefined });
			}
		}
		return res;
	}, []);

	const filteredTree = useMemo(
		() => filterTree(oepOrgTree || [], treeSearch.trim()),
		[oepOrgTree, treeSearch, filterTree],
	);

	const autoExpandKeys = useMemo(() => {
		const keys: string[] = [];
		const walk = (nodes: any[]) => {
			for (const n of nodes) {
				if (n.children && n.children.length) {
					keys.push(n.key);
					walk(n.children);
				}
			}
		};
		walk(filteredTree);
		return keys;
	}, [filteredTree]);

	useEffect(() => {
		if (treeSearch) setExpandedKeys(autoExpandKeys);
	}, [treeSearch, autoExpandKeys]);

	// 初始化展开第一层节点（只执行一次）
	useEffect(() => {
		if (!hasInitExpanded.current && Array.isArray(oepOrgTree) && oepOrgTree.length > 0) {
			setExpandedKeys(oepOrgTree.map((n) => String(n.key)));
			hasInitExpanded.current = true;
		}
	}, [oepOrgTree]);

	return (
		<div
			className={`${className || ""} left-tree-wrapper`}
			style={{
				border: "1px solid #f0f0f0",
				padding: 12,
				paddingTop: 0,
				overflow: "auto",
				height: "calc(100vh - 150px)",
			}}
		>
			<div
				style={{
					position: "sticky",
					top: 0,
					zIndex: 1,
					background: "#fff",
					paddingBottom: 8,
					paddingTop: 12,
				}}
			>
				<Input.Search
					placeholder="搜索名称"
					allowClear
					onChange={(e) => setTreeSearch(e.target.value)}
					style={{ marginBottom: 8 }}
				/>
			</div>
			<Tree
				treeData={filteredTree}
				onSelect={(keys) => {
					const key = (keys as React.Key[])[0];
					if (key !== undefined && key !== null) {
						handleTreeNodeSelect(String(key));
					}
				}}
				selectedKeys={selectedTreeNodeId ? [selectedTreeNodeId] : []}
				expandedKeys={expandedKeys}
				onExpand={(keys) => setExpandedKeys((keys as React.Key[]).map((k) => String(k)))}
			/>
		</div>
	);
};

export default TreePanel;
