import type { OrganizationTreeNode } from "#src/api/common";
import type { DataNode } from "antd/es/tree";
import { fetchOrganizationTree } from "#src/api/common";
import { SearchOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { Button, Empty, Input, Spin, theme, Tree, Typography } from "antd";

import { useEffect, useMemo, useRef, useState } from "react";

const { useToken } = theme;
const { Text } = Typography;
/** 组织树变更频率较低，页面内固定复用 10 分钟缓存。 */
const ORG_TREE_CACHE_TIME = 10 * 60 * 1000;
const ORG_TREE_CLASS_NAME =
	"[&_.ant-tree-node-content-wrapper]:min-w-0 [&_.ant-tree-node-content-wrapper]:overflow-hidden [&_.ant-tree-title]:block [&_.ant-tree-title]:min-w-0";

function transformToTreeData(node: OrganizationTreeNode): DataNode {
	const children = node.children?.map(transformToTreeData);

	return {
		id: String(node.id),
		key: String(node.id),
		title: node.name,
		fullname: node.fullname || node.name,
		children,
		isLeaf: !children || children.length === 0,
	} as DataNode;
}

interface OrgTreePanelProps {
	/** 选中的组织ID */
	selectedOrgId?: string;
	/** 选中组织变化回调 */
	onSelect?: (orgId: string) => void;
}

/**
 * 人员档案左侧组织树面板。
 * 约束：
 * - 直接使用 React Query 管理 `/dept/tree` 缓存，不再额外封装查询 Hook。
 * - 首次加载与无数据失败态明确反馈，后台刷新期间继续稳定展示缓存数据。
 *
 * @author 王善能
 * @date 2026-04-16
 */
export function OrgTreePanel({ selectedOrgId, onSelect }: OrgTreePanelProps) {
	const { token } = useToken();
	const {
		data: orgTreeData,
		error,
		isFetching,
		isPending,
		refetch,
	} = useQuery({
		queryKey: ["org-tree", "all"],
		queryFn: () => fetchOrganizationTree(),
		staleTime: ORG_TREE_CACHE_TIME,
		gcTime: ORG_TREE_CACHE_TIME,
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
	});
	const [searchValue, setSearchValue] = useState("");
	const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
	const [autoExpandParent, setAutoExpandParent] = useState(true);
	const hasInitialized = useRef(false);
	const treeData = useMemo<DataNode[]>(
		() => (orgTreeData ? [transformToTreeData(orgTreeData)] : []),
		[orgTreeData],
	);
	const hasTreeData = treeData.length > 0;
	const isInitialLoading = isPending && !hasTreeData;
	const isRefreshing = isFetching && hasTreeData;
	const shouldShowError = !!error && !hasTreeData;
	const loadError = error?.message || "组织树加载失败，请稍后重试";

	// 搜索仅作用于当前缓存树，同时收集命中祖先节点，避免重复遍历。
	const { filterTree, autoExpandKeys } = useMemo(() => {
		const expandedKeySet = new Set<string>();
		const filter = (nodes: DataNode[], term: string): DataNode[] => {
			if (!term) return nodes;
			const lower = term.toLowerCase();
			const result: DataNode[] = [];
			for (const node of nodes) {
				const title = String(node.title || "").toLowerCase();
				const children = node.children ? filter(node.children, term) : [];
				if (title.includes(lower) || children.length > 0) {
					if (children.length > 0) {
						expandedKeySet.add(String(node.key));
					}
					result.push({ ...node, children: children.length ? children : undefined });
				}
			}
			return result;
		};
		const filteredTree = filter(treeData, searchValue.trim());
		return {
			filterTree: filteredTree,
			autoExpandKeys: Array.from(expandedKeySet),
		};
	}, [searchValue, treeData]);

	// 首次进入默认展开首个一级节点，避免左侧面板首屏信息密度过低。
	const getFirstNodePath = useMemo(() => {
		if (!filterTree || filterTree.length === 0) {
			return [];
		}
		const firstNode = filterTree[0];
		if (firstNode.children && firstNode.children.length > 0) {
			const nodeId = String((firstNode as any).id || firstNode.key);
			return [nodeId];
		}
		return [];
	}, [filterTree]);

	// 首次进入页面时默认展开首个一级节点，降低空白感。
	useEffect(() => {
		if (
			!isPending &&
			!hasInitialized.current &&
			!searchValue &&
			filterTree.length > 0 &&
			getFirstNodePath.length > 0
		) {
			setExpandedKeys(getFirstNodePath);
			setAutoExpandParent(true);
			hasInitialized.current = true;
		}
	}, [filterTree, getFirstNodePath, isPending, searchValue]);

	// 搜索词变化时由组件接管展开状态，便于快速浏览命中结果。
	useEffect(() => {
		if (searchValue) {
			setExpandedKeys(autoExpandKeys);
			setAutoExpandParent(true);
		}
	}, [searchValue, autoExpandKeys]);

	const handleSelect = (selectedKeys: React.Key[]) => {
		if (selectedKeys.length > 0) {
			const orgId = String(selectedKeys[0]);
			onSelect?.(orgId);
		}
	};

	const handleExpand = (keys: React.Key[]) => {
		setExpandedKeys(keys.map((k) => String(k)));
		setAutoExpandParent(false);
	};

	// 搜索命中时只高亮文本，不改变树节点原有结构，便于在大树中快速定位。
	const titleRender = (nodeData: DataNode) => {
		const strTitle = String(nodeData.title || "");
		const index = strTitle.toLowerCase().indexOf(searchValue.toLowerCase());
		if (index > -1 && searchValue) {
			const beforeStr = strTitle.substring(0, index);
			const afterStr = strTitle.slice(index + searchValue.length);
			return (
				<Text
					style={{ display: "block", maxWidth: "100%", minWidth: 0 }}
					ellipsis={{ tooltip: strTitle }}
				>
					{beforeStr}
					<span style={{ color: token.colorError }}>{searchValue}</span>
					{afterStr}
				</Text>
			);
		}
		return (
			<Text
				style={{ display: "block", maxWidth: "100%", minWidth: 0 }}
				ellipsis={{ tooltip: strTitle }}
			>
				{strTitle}
			</Text>
		);
	};

	return (
		<div className="flex h-full flex-col gap-4 py-4">
			<div className="px-4">
				<Input
					suffix={
						isRefreshing ? (
							<Spin size="small" />
						) : (
							<SearchOutlined style={{ color: token.colorTextTertiary }} />
						)
					}
					placeholder="搜索部门/项目名称"
					value={searchValue}
					onChange={(e) => setSearchValue(e.target.value)}
					allowClear
				/>
			</div>

			<div className="custom-scrollbar flex-1 overflow-auto px-4">
				{isInitialLoading ? (
					<div className="flex h-full items-center justify-center">
						<Spin />
					</div>
				) : shouldShowError ? (
					<div className="flex h-full flex-col items-center justify-center gap-3">
						<Empty description={loadError} image={Empty.PRESENTED_IMAGE_SIMPLE} />
						<Button type="primary" onClick={() => void refetch()}>
							重新加载
						</Button>
					</div>
				) : filterTree.length === 0 ? (
					<div className="flex h-full items-center justify-center">
						<Empty description="暂无组织数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
					</div>
				) : (
					<Tree
						className={ORG_TREE_CLASS_NAME}
						treeData={filterTree as any}
						selectedKeys={selectedOrgId ? [selectedOrgId] : []}
						onSelect={handleSelect}
						expandedKeys={expandedKeys}
						onExpand={handleExpand}
						autoExpandParent={autoExpandParent}
						titleRender={titleRender}
						fieldNames={{ key: "id", title: "title", children: "children" }}
						blockNode
						showLine
					/>
				)}
			</div>
		</div>
	);
}
