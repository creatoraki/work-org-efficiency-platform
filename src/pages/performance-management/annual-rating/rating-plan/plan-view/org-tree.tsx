import type { PlanOrgNode } from "#src/api/performance-management/plan";
import type { DataNode } from "antd/es/tree";

import { SearchOutlined } from "@ant-design/icons";
import { Input, Tooltip, Tree } from "antd";
import { useEffect, useMemo, useState } from "react";
import styles from "./org-tree.module.css";

/**
 * 组织树属性
 */
interface OrgTreeProps {
	/** 组织树数据 */
	tree: PlanOrgNode[];
	/** 是否折叠 */
	collapsed: boolean;
	/** 折叠切换回调 */
	onToggleCollapsed: () => void;
}

/**
 * 组织树（人员清单左侧）
 *
 * 基于 antd Tree 原生 showLine 渲染（官方示例用法）：
 * 16px 行文字、内置 +/− 方形展开器、每级 16px 缩进、叶子折线端点；
 * 根节点使用主色，部门节点展示人数与负责人，右侧提供折叠把手。
 *
 * @param props - 组件属性
 * @param props.tree - 组织树数据
 * @param props.collapsed - 是否折叠
 * @param props.onToggleCollapsed - 折叠切换回调
 * @returns 组织树组件
 *
 * @author 王善能
 * @since 2026-11-12
 */
export function OrgTree({ tree, collapsed, onToggleCollapsed }: OrgTreeProps) {
	/** 展开节点 key 集合 */
	const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
	/** 搜索关键词 */
	const [keyword, setKeyword] = useState("");

	/** 数据到达或搜索时为全部节点展开 */
	useEffect(() => {
		setExpandedKeys(collectKeys(tree));
	}, [tree, keyword]);

	const visibleTree = useMemo(() => filterTree(tree, keyword.trim()), [tree, keyword]);
	const treeData = useMemo(() => toTreeData(visibleTree, tree[0]?.key), [visibleTree, tree]);

	if (collapsed) {
		return (
			<div className="relative flex h-full w-6 shrink-0 items-start justify-center rounded border border-[#E4E7ED] bg-white py-2">
				<button
					type="button"
					aria-label="展开组织树"
					className="cursor-pointer border-0 bg-transparent p-0 text-[#606266]"
					onClick={onToggleCollapsed}
				>
					›
				</button>
			</div>
		);
	}

	return (
		<div className="relative flex h-full w-[380px] shrink-0 flex-col rounded-[4px] border border-[#E4E7ED] bg-white p-4">
			<Input
				allowClear
				value={keyword}
				onChange={(e) => setKeyword(e.target.value)}
				placeholder="支持模糊搜索"
				className="mb-2 h-8"
				suffix={<SearchOutlined className="text-[#C0C4CC]" />}
			/>
			<div className="min-h-0 flex-1 overflow-y-auto">
				<Tree
					showLine={{ showLeafIcon: false }}
					blockNode
					className={styles.orgTree}
					treeData={treeData}
					expandedKeys={expandedKeys}
					onExpand={(keys) => setExpandedKeys(keys as string[])}
				/>
				{visibleTree.length === 0 ? (
					<div className="py-6 text-center text-sm text-[#909399]">暂无匹配的组织</div>
				) : null}
			</div>
			{/* 右侧折叠把手 */}
			<button
				type="button"
				aria-label="收起组织树"
				className="absolute -right-3 top-1/2 flex size-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-[#E4E7ED] bg-white text-[#606266] shadow-sm"
				onClick={onToggleCollapsed}
			>
				‹
			</button>
		</div>
	);
}

/**
 * 收集全部父节点 key（默认展开）
 *
 * @param nodes - 树节点
 * @returns key 列表
 */
function collectKeys(nodes: PlanOrgNode[]): string[] {
	const keys: string[] = [];
	const walk = (list: PlanOrgNode[]) => {
		list.forEach((node) => {
			if (node.children?.length) {
				keys.push(node.key);
				walk(node.children);
			}
		});
	};
	walk(nodes);
	return keys;
}

/**
 * 按搜索词过滤树（命中节点保留祖先链）
 *
 * @param nodes - 树节点
 * @param keyword - 搜索词
 * @returns 过滤后的树
 */
function filterTree(nodes: PlanOrgNode[], keyword: string): PlanOrgNode[] {
	if (!keyword) return nodes;
	const keep = (node: PlanOrgNode): boolean =>
		node.title.includes(keyword) || Boolean(node.children?.some(keep));
	const prune = (list: PlanOrgNode[]): PlanOrgNode[] =>
		list.filter(keep).map((node) => ({
			...node,
			children: node.children ? prune(node.children) : undefined,
		}));
	return prune(nodes);
}

/**
 * 转换为 antd Tree 数据（标题含负责人）
 *
 * @param nodes - 树节点
 * @param rootKey - 根节点 key（根节点文字为主色）
 * @returns antd Tree 节点
 */
function toTreeData(nodes: PlanOrgNode[], rootKey?: string): DataNode[] {
	return nodes.map((node) => ({
		key: node.key,
		title: (
			<span className="flex min-w-0 items-center gap-2">
				<Tooltip title={node.title} mouseEnterDelay={0.4}>
					<span
						className={`truncate ${node.key === rootKey ? "text-[#0075FF]" : "text-[#323233]"}`}
					>
						{node.title}
					</span>
				</Tooltip>
				{node.owner ? (
					<span className="shrink-0 truncate text-sm leading-[22px] text-[#606266]">
						{node.owner}
					</span>
				) : null}
			</span>
		),
		children: node.children ? toTreeData(node.children, rootKey) : undefined,
	}));
}
