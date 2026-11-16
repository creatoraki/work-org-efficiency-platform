import type { YearlyReportOrgNode } from "#src/api/performance-management/yearly-performance";

import { Input } from "antd";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { TreeRow } from "./tree-row";

interface OrgTreePanelProps {
	/** 组织树 */
	nodes: YearlyReportOrgNode[];
	/** 述职总人数 */
	totalCount: number;
	/** 选中组织 */
	selectedOrgId?: string;
	/** 选中组织变更 */
	onSelect: (orgId: string) => void;
}

/**
 * 按关键字过滤组织树：保留命中节点及其祖先链路
 *
 * @param nodes - 组织树
 * @param keyword - 关键字
 * @returns 过滤后的组织树
 */
function filterOrgTree(nodes: YearlyReportOrgNode[], keyword: string): YearlyReportOrgNode[] {
	if (!keyword) {
		return nodes;
	}
	return nodes.flatMap((node) => {
		if (node.orgName.includes(keyword)) {
			return [node];
		}
		const children = filterOrgTree(node.children ?? [], keyword);
		return children.length ? [{ ...node, children }] : [];
	});
}

/**
 * 组织架构面板
 *
 * 标题「组织架构」+ 总人数；搜索框按名称过滤（保留祖先链路）；
 * 树节点可展开收起，叶子节点展示述职人数（与设计稿一致，上级节点不重复展示人数，总数见标题）。
 *
 * @param props - 组件属性
 * @param props.nodes - 组织树
 * @param props.totalCount - 述职总人数
 * @param props.selectedOrgId - 选中组织
 * @param props.onSelect - 选中组织变更
 * @returns 组织架构面板
 *
 * @since 2026-11-16
 */
export function OrgTreePanel({ nodes, totalCount, selectedOrgId, onSelect }: OrgTreePanelProps) {
	const [keyword, setKeyword] = useState("");
	const [collapsedIds, setCollapsedIds] = useState<Set<string>>(() => new Set());
	const visibleNodes = useMemo(() => filterOrgTree(nodes, keyword.trim()), [nodes, keyword]);

	const toggle = (orgId: string) => {
		setCollapsedIds((prev) => {
			const next = new Set(prev);
			if (next.has(orgId)) {
				next.delete(orgId);
			} else {
				next.add(orgId);
			}
			return next;
		});
	};

	const renderNodes = (list: YearlyReportOrgNode[], level: number) =>
		list.map((node) => {
			const hasChildren = Boolean(node.children?.length);
			// 搜索时强制展开，避免命中节点被折叠隐藏
			const expanded = Boolean(keyword) || !collapsedIds.has(node.orgId);
			return (
				<div key={node.orgId}>
					<TreeRow
						level={level}
						title={node.orgName}
						count={hasChildren ? undefined : node.headCount}
						selected={selectedOrgId === node.orgId}
						showSwitcher={hasChildren}
						expanded={expanded}
						onToggle={() => toggle(node.orgId)}
						onClick={() => onSelect(node.orgId)}
					/>
					{hasChildren && expanded ? renderNodes(node.children ?? [], level + 1) : null}
				</div>
			);
		});

	return (
		<div className="flex h-full min-h-0 min-w-0 flex-col">
			<div className="flex h-[22px] items-center justify-between text-sm leading-[22px]">
				<span className="font-semibold text-[#323233]">组织架构</span>
				<span className="text-[#606266]">
					总人数：
					{totalCount}
				</span>
			</div>
			<Input
				className="mt-2 shrink-0"
				placeholder="搜索组织"
				allowClear
				value={keyword}
				onChange={(event) => setKeyword(event.target.value)}
				suffix={<Search className="size-3.5 text-[#909399]" strokeWidth={1.75} />}
			/>
			<div className="mt-1 min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
				{visibleNodes.length ? (
					renderNodes(visibleNodes, 0)
				) : (
					<div className="py-6 text-center text-sm text-[#909399]">暂无匹配组织</div>
				)}
			</div>
		</div>
	);
}
