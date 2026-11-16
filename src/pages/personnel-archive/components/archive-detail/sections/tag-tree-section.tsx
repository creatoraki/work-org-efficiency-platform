/**
 * 标签树区域组件
 */

import type React from "react";
import { Tree } from "antd";
import { useMemo } from "react";

/**
 * TagTreeSection 组件属性
 */
interface TagTreeSectionProps {
	/** 树形数据 */
	treeData: any[];
	/** 展开的节点 key 列表 */
	expandedKeys: React.Key[];
	/** 是否自动展开父节点 */
	autoExpandParent: boolean;
	/** 勾选的节点 key 列表 */
	checkedKeys: React.Key[];
	/** 树节点展开事件处理 */
	onExpand: (expandedKeys: React.Key[]) => void;
	/** 树节点勾选事件处理 */
	onCheck: (
		checkedKeysValue: React.Key[] | { checked: React.Key[]; halfChecked: React.Key[] },
	) => void;
	/** 是否有数据 */
	hasData: boolean;
}

/**
 * 标签树区域组件
 *
 * @param props - 组件属性
 * @param props.treeData - 树形数据
 * @param props.expandedKeys - 展开的节点 key 列表
 * @param props.autoExpandParent - 是否自动展开父节点
 * @param props.checkedKeys - 勾选的节点 key 列表
 * @param props.onExpand - 树节点展开事件处理
 * @param props.onCheck - 树节点勾选事件处理
 * @param props.hasData - 是否有数据
 * @returns 标签树区域元素
 */
export function TagTreeSection({
	treeData,
	expandedKeys,
	autoExpandParent,
	checkedKeys,
	onExpand,
	onCheck,
	hasData,
}: TagTreeSectionProps) {
	/**
	 * 当前树实际存在的 key 集合。
	 *
	 * 筛选条件变化时，外部保存的 checkedKeys/expandedKeys 可能短暂包含已被过滤掉的节点。
	 * 渲染前先过滤一遍，避免 antd Tree 报 “missing follow keys”。
	 */
	const existingKeySet = useMemo(() => {
		const keys = new Set<React.Key>();
		const collectKeys = (nodes: any[]) => {
			for (const node of nodes) {
				if (node?.id !== undefined && node?.id !== null) {
					keys.add(node.id);
				}
				if (Array.isArray(node?.children)) {
					collectKeys(node.children);
				}
			}
		};
		collectKeys(treeData);
		return keys;
	}, [treeData]);

	const validExpandedKeys = useMemo(() => {
		return expandedKeys.filter((key) => existingKeySet.has(key));
	}, [existingKeySet, expandedKeys]);

	const validCheckedKeys = useMemo(() => {
		return checkedKeys.filter((key) => existingKeySet.has(key));
	}, [checkedKeys, existingKeySet]);

	return (
		<aside className="flex flex-col overflow-hidden rounded border p-4">
			<section className="min-h-0 flex-1 overflow-y-auto" style={{ maxHeight: "100%" }}>
				{hasData && (
					<Tree
						checkable
						multiple
						blockNode
						fieldNames={{
							title: "name",
							key: "id",
							children: "children",
						}}
						onExpand={onExpand}
						expandedKeys={validExpandedKeys}
						autoExpandParent={autoExpandParent}
						checkedKeys={validCheckedKeys}
						onCheck={onCheck}
						treeData={treeData}
					/>
				)}
			</section>
		</aside>
	);
}
