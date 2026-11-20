import type { AppraisalOrgNode } from "#src/api/performance-management/yearly-performance";

import { Input, Spin } from "antd";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { ORG_TREE_DEFAULT_EXPAND_DEPTH } from "../constants";
import { TreeRow } from "./tree-row";

interface OrgTreePanelProps {
	/** 组织树 */
	nodes: AppraisalOrgNode[];
	/** 加载中 */
	loading?: boolean;
	/** 述职总人数（当前用户可见范围），未知时不展示 */
	totalCount?: number;
	/** 选中组织 code */
	selectedCode?: string;
	/** 选中组织变更 */
	onSelect: (code: string) => void;
}

/**
 * 按关键字过滤组织树：保留命中节点及其祖先链路
 *
 * @param nodes - 组织树
 * @param keyword - 关键字
 * @returns 过滤后的组织树
 */
function filterOrgTree(nodes: AppraisalOrgNode[], keyword: string): AppraisalOrgNode[] {
	if (!keyword) {
		return nodes;
	}
	return nodes.flatMap((node) => {
		if (node.name.includes(keyword)) {
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
 * 真实组织树层级较深，默认只展开前两级，其余按需展开；无数据权限的节点置灰不可选。
 * 契约 DeptTreeV 不含人数，节点右侧不展示人数（与设计稿差异见对接文档）。
 *
 * @param props - 组件属性
 * @param props.nodes - 组织树
 * @param props.loading - 加载中
 * @param props.totalCount - 述职总人数
 * @param props.selectedCode - 选中组织 code
 * @param props.onSelect - 选中组织变更
 * @returns 组织架构面板
 *
 * @since 2026-11-16
 */
export function OrgTreePanel({
	nodes,
	loading,
	totalCount,
	selectedCode,
	onSelect,
}: OrgTreePanelProps) {
	const [keyword, setKeyword] = useState("");
	/** 用户手动切换过展开状态的节点：与默认展开状态取反 */
	const [toggledCodes, setToggledCodes] = useState<Set<string>>(() => new Set());
	const visibleNodes = useMemo(() => filterOrgTree(nodes, keyword.trim()), [nodes, keyword]);

	const toggle = (code: string) => {
		setToggledCodes((prev) => {
			const next = new Set(prev);
			if (next.has(code)) {
				next.delete(code);
			} else {
				next.add(code);
			}
			return next;
		});
	};

	const renderNodes = (list: AppraisalOrgNode[], level: number) =>
		list.map((node) => {
			const hasChildren = Boolean(node.children?.length);
			const defaultExpanded = level < ORG_TREE_DEFAULT_EXPAND_DEPTH;
			// 搜索时强制展开，避免命中节点被折叠隐藏
			const expanded = Boolean(keyword) || defaultExpanded !== toggledCodes.has(node.code);
			return (
				<div key={node.code}>
					<TreeRow
						level={level}
						title={node.name}
						selected={selectedCode === node.code}
						disabled={!node.accessible}
						showSwitcher={hasChildren}
						expanded={expanded}
						onToggle={() => toggle(node.code)}
						onClick={() => onSelect(node.code)}
					/>
					{hasChildren && expanded ? renderNodes(node.children ?? [], level + 1) : null}
				</div>
			);
		});

	return (
		<div className="flex h-full min-h-0 min-w-0 flex-col">
			<div className="flex h-[22px] items-center justify-between text-sm leading-[22px]">
				<span className="font-semibold text-[#323233]">组织架构</span>
				{totalCount === undefined ? null : (
					<span className="text-[#606266]">
						总人数：
						{totalCount}
					</span>
				)}
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
				{loading && !nodes.length ? (
					<div className="flex justify-center py-6">
						<Spin size="small" />
					</div>
				) : visibleNodes.length ? (
					renderNodes(visibleNodes, 0)
				) : (
					<div className="py-6 text-center text-sm text-[#909399]">
						{keyword ? "暂无匹配组织" : "暂无组织"}
					</div>
				)}
			</div>
		</div>
	);
}
