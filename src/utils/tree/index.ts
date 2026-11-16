import type { OrganizationTreeNode } from "#src/api/common";

/**
 * @description 构造树型结构数据
 * @param data 数据源
 * @param id id字段 默认id
 * @param parentId 父节点字段，默认parentId
 * @param children 子节点字段，默认children
 * @returns 追加字段后的树
 */
export function handleTree(data: any[], id?: string, parentId?: string, children?: string): any {
	if (!Array.isArray(data)) {
		console.warn("data must be an array");
		return [];
	}
	const config = {
		id: id || "id",
		parentId: parentId || "parentId",
		childrenList: children || "children",
	};

	const childrenListMap: any = {};
	const nodeIds: any = {};
	const tree = [];

	for (const d of data) {
		const parentId = d[config.parentId];
		if (childrenListMap[parentId] == null) {
			childrenListMap[parentId] = [];
		}
		nodeIds[d[config.id]] = d;
		childrenListMap[parentId].push(d);
	}

	for (const d of data) {
		const parentId = d[config.parentId];
		if (nodeIds[parentId] == null) {
			tree.push(d);
		}
	}

	for (const t of tree) {
		adaptToChildrenList(t);
	}

	function adaptToChildrenList(o: Record<string, any>) {
		if (childrenListMap[o[config.id]] !== null) {
			o[config.childrenList] = childrenListMap[o[config.id]];
		}
		if (o[config.childrenList]) {
			for (const c of o[config.childrenList]) {
				adaptToChildrenList(c);
			}
		}
	}
	return tree;
}

export interface TreeConfigOptions {
	// 子属性的名称，默认为'children'
	childProps: string;
}

/**
 * @zh_CN 遍历树形结构，并返回所有节点中指定的值。
 * @param tree 树形结构数组
 * @param getValue 获取节点值的函数
 * @param options 作为子节点数组的可选属性名称。
 * @returns 所有节点中指定的值的数组
 */
export function traverseTreeValues<T, V>(
	tree: T[],
	getValue: (node: T) => V,
	options?: TreeConfigOptions,
): V[] {
	const result: V[] = [];
	const { childProps } = options || {
		childProps: "children",
	};

	const dfs = (treeNode: T) => {
		const value = getValue(treeNode);
		result.push(value);
		const children = (treeNode as Record<string, any>)?.[childProps];
		if (!children) {
			return;
		}
		if (children.length > 0) {
			for (const child of children) {
				dfs(child);
			}
		}
	};

	for (const treeNode of tree) {
		dfs(treeNode);
	}
	return result.filter(Boolean);
}

/**
 * 根据条件过滤给定树结构的节点，并以原有顺序返回所有匹配节点的数组。
 * @param tree 要过滤的树结构的根节点数组。
 * @param filter 用于匹配每个节点的条件。
 * @param options 作为子节点数组的可选属性名称。
 * @returns 包含所有匹配节点的数组。
 */
export function filterTree<T extends Record<string, any>>(
	tree: T[],
	filter: (node: T) => boolean,
	options?: TreeConfigOptions,
): T[] {
	const { childProps } = options || {
		childProps: "children",
	};

	const _filterTree = (nodes: T[]): T[] => {
		return nodes.filter((node: Record<string, any>) => {
			if (filter(node as T)) {
				if (node[childProps]) {
					node[childProps] = _filterTree(node[childProps]);
				}
				return true;
			}
			return false;
		});
	};

	return _filterTree(tree);
}

/**
 * 根据条件重新映射给定树结构的节点
 * @param tree 要过滤的树结构的根节点数组。
 * @param mapper 用于map每个节点的条件。
 * @param options 作为子节点数组的可选属性名称。
 */
export function mapTree<T, V extends Record<string, any>>(
	tree: T[],
	mapper: (node: T) => V,
	options?: TreeConfigOptions,
): V[] {
	const { childProps } = options || {
		childProps: "children",
	};
	return tree.map((node) => {
		const mapperNode: Record<string, any> = mapper(node);
		if (mapperNode[childProps]) {
			mapperNode[childProps] = mapTree(mapperNode[childProps], mapper, options);
		}
		return mapperNode as V;
	});
}

/**
 * 格式化岗位职位节点显示文本
 *
 * 显示规则：
 * - 职位类型（position）：如果有职级名称，显示为 "label-职级名称"
 * - 岗位类型（job）：如果有族群名称，显示为 "label（族群：族群名称）"
 * - 其他情况：只显示 label
 *
 * @param node - 节点对象
 * @param node.label - 节点名称
 * @param node.type - 节点类型
 * @param node.postGradeName - 职级名称
 * @param node.ethnicName - 族群名称
 * @returns 格式化后的显示文本
 */
export function formatJobPositionNodeLabel(node: {
	label: string;
	type: string;
	postGradeName?: string | null;
	ethnicName?: string | null;
}): string {
	let title = node.label;

	// 如果是职位类型且有职级名称，添加职级信息
	if (node.type === "position" && node.postGradeName) {
		title = `${title}-${node.postGradeName}`;
	}

	// 如果是岗位类型且有族群名称，添加族群信息
	if (node.type === "job" && node.ethnicName) {
		title = `${title}（族群：${node.ethnicName}）`;
	}

	return title;
}

/**
 * 处理岗位职位树数据，为节点添加自定义 title
 *
 * @param jobPositionTreeData - 岗位职位树数据
 * @returns 处理后的树节点数组，每个节点都包含 title 字段
 */
export function processJobPositionTreeData<
	T extends {
		label: string;
		type: string;
		postGradeName?: string | null;
		ethnicName?: string | null;
		children?: T[];
	},
>(jobPositionTreeData: T[] | undefined): Array<T & { title: string }> {
	if (!jobPositionTreeData) {
		return [];
	}

	const processNode = (node: T): T & { title: string } => {
		const title = formatJobPositionNodeLabel(node);

		return {
			...node,
			title,
			children: node.children?.map(processNode),
		} as T & { title: string };
	};

	return jobPositionTreeData.map(processNode);
}

/**
 * 根据组织编码从组织树中递归查找节点。
 *
 * @param treeData - 组织树根节点
 * @param orgCode - 组织编码
 * @returns 命中的组织节点；未命中时返回 null
 * @author 王善能
 * @since 2026-06-30
 */
export function findOrganizationNodeByCode(
	treeData: OrganizationTreeNode | null | undefined,
	orgCode?: string | number,
): OrganizationTreeNode | null {
	if (!treeData || orgCode === undefined || orgCode === null) {
		return null;
	}

	if (String(treeData.code) === String(orgCode)) {
		return treeData;
	}

	for (const child of treeData.children ?? []) {
		const matchedNode = findOrganizationNodeByCode(child, orgCode);
		if (matchedNode) {
			return matchedNode;
		}
	}

	return null;
}

/**
 * 创建排兵布阵组织解析器。
 *
 * 固定组织树上下文后，返回一个仅负责解析当前项目组织节点的函数。
 * 解析规则如下：
 * 1. `serverCode` 非空时，优先使用 `serverCode` 与组织树节点 `code` 比对
 * 2. 若 `serverCode` 未命中节点，再使用 `projectGroupCode` 与组织树节点 `code` 比对
 * 3. 命中节点后，由调用方读取真实 `orgId`
 *
 * @param treeData - 组织树根节点
 * @returns 排兵布阵组织解析函数
 * @author 王善能
 * @since 2026-07-03
 */
export function createDeploymentOrganizationResolver(
	treeData: OrganizationTreeNode | null | undefined,
) {
	return (
		serverCode?: string | null,
		projectGroupCode?: string | null,
	): OrganizationTreeNode | null => {
		const trimmedServerCode = serverCode?.trim();
		if (trimmedServerCode) {
			const matchedByServerCode = findOrganizationNodeByCode(treeData, trimmedServerCode);
			if (matchedByServerCode) {
				return matchedByServerCode;
			}
		}

		const trimmedProjectGroupCode = projectGroupCode?.trim();
		if (trimmedProjectGroupCode) {
			return findOrganizationNodeByCode(treeData, trimmedProjectGroupCode);
		}

		return null;
	};
}

/**
 * 按排兵布阵组织匹配规则从组织树中查找节点。
 *
 * 兼容直接函数调用场景；内部复用 resolver factory，避免规则实现分叉。
 *
 * @param treeData - 组织树根节点
 * @param serverCode - 项目 `serverCode`
 * @param projectGroupCode - 项目群编码 `projectGroupCode`
 * @returns 命中的组织节点；未命中时返回 null
 * @author 王善能
 * @since 2026-07-03
 */
export function findDeploymentOrganizationNode(
	treeData: OrganizationTreeNode | null | undefined,
	serverCode?: string | null,
	projectGroupCode?: string | null,
): OrganizationTreeNode | null {
	return createDeploymentOrganizationResolver(treeData)(serverCode, projectGroupCode);
}
