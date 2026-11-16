import type { DataNode } from "../types";
import { useEffect, useState } from "react";

/**
 * 树数据管理 Hook（简化版 - 仅状态管理）
 * 不包含数据加载逻辑，由主文件控制
 */
export function useTreeData() {
	const [treeData, setTreeData] = useState<DataNode[]>([]);
	const [selectedKey, setSelectedKey] = useState<string | null>(null);
	const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
	const [search, setSearch] = useState("");

	// 搜索自动展开
	useEffect(() => {
		if (!search) return;

		const keys = new Set<React.Key>();
		const dfs = (nodes: DataNode[], parents: React.Key[] = []): boolean => {
			let foundAny = false;
			for (const n of nodes || []) {
				const key = n.key;
				const title = String(n.title || "");
				const childMatched = n.children ? dfs(n.children, [...parents, key]) : false;
				if (title.includes(search) || childMatched) {
					parents.forEach((p) => keys.add(p));
					keys.add(key);
					foundAny = true;
				}
			}
			return foundAny;
		};
		dfs(treeData);
		setExpandedKeys(Array.from(keys));
	}, [search, treeData]);

	// 查找选中节点
	const selectedNode = (() => {
		if (!selectedKey) return null;
		const stack = [...treeData];
		while (stack.length) {
			const n = stack.shift();
			if (!n) continue;
			if (String(n.key) === selectedKey) return n;
			if (n.children) stack.push(...n.children);
		}
		return null;
	})();

	// 判断是否为根节点选中
	const isRootSelected = !!(
		selectedNode &&
		Array.isArray(selectedNode.children) &&
		selectedNode.children.length > 0
	);

	// 移除已校验标签
	const removeVerifiedLabel = () => {
		setTreeData((prev) => {
			const update = (nodes: DataNode[]): DataNode[] => {
				return nodes.map((node) => {
					if (String(node.key) === String(selectedKey)) {
						if (node.fillInLabels === "已校验") {
							return { ...node, fillInLabels: undefined };
						}
					}
					if (node.children) {
						return { ...node, children: update(node.children) };
					}
					return node;
				});
			};
			return update(prev);
		});
	};

	return {
		treeData,
		setTreeData,
		selectedKey,
		setSelectedKey,
		expandedKeys,
		setExpandedKeys,
		search,
		setSearch,
		selectedNode,
		isRootSelected,
		removeVerifiedLabel,
	};
}
