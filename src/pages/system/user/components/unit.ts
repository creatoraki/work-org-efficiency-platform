// 如果在 JS 文件中使用，把类型注释去掉或当作普通注释即可

/**
 * 扁平化树：返回数组，每项 { parents: [...parentNodes...], nodes: [...leafNodes...], id, name }
 * 规则：
 * - 对于某个节点 node，如果 node.children 存在且 node.children 中的每个 child 都没有 children（即 child 为叶子节点/操作项），
 *   则把一条记录加入结果：parents = path 到 node（包含 node），nodes = node.children，id/name = node.id/name。
 * - 否则继续向下遍历。
 */
export function flattenTree(tree: any | any[]): any[] {
	const roots = Array.isArray(tree) ? tree : [tree];
	const result: any[] = [];

	function traverse(node: any, path: any[]) {
		if (!node) return;
		// 如果 node.children 存在并且其 children 都是叶子节点（无 children 或 children.length === 0）
		if (
			Array.isArray(node.children) &&
			node.children.length > 0 &&
			node.children.every((c: any) => !c.children || c.children.length === 0)
		) {
			// parents 包含 path + node
			const parents = [...path, { ...node, children: node.children }]; // clone node 保持数据独立
			const nodes = node.children.map((c: any) => ({ ...c })); // leaf nodes
			result.push({
				parents,
				nodes,
				id: node.id,
				name: node.name,
				inheritsRole: node.inheritsRole,
				checked: node.checked,
				userChecked: node.userChecked,
			});
			return;
		}

		// 否则继续遍历 children
		if (Array.isArray(node.children)) {
			for (const ch of node.children) {
				traverse(ch, [...path, node]);
			}
		}
	}

	for (const r of roots) traverse(r, []);
	return result;
}

export function idCountMap(data: any) {
	return (data ?? []).reduce((acc: any, curr: any) => {
		for (const { id } of curr.parents) {
			acc.set(id, (acc.get(id) || 0) + 1);
		}
		return acc;
	}, new Map<string, number>());
}
