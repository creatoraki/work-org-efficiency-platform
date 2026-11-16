import type { DataDimOepOrgTreeNode } from "#src/api/strategy";
import type { DataNode } from "antd/es/tree";
import { fetchOrganizationTree } from "#src/api/common";
import { fetchDataDimOepOrgTree } from "#src/api/strategy";
import { create } from "zustand";

/**
 * @zh 应用的初始状态
 * @en Initial state of the application
 */
const initialState = {
	/**
	 * @zh 全局加载动画是否显示
	 * @en Whether the global spinning animation is shown
	 */
	globalSpin: false,
	/**
	 * @zh 窗帘动画是否显示（闭合状态）
	 */
	curtainVisible: false,
};

type GlobalState = typeof initialState;

interface GlobalAction {
	openGlobalSpin: () => void;
	closeGlobalSpin: () => void;
	setCurtainVisible: (visible: boolean) => void;
	// 部门树相关
	deptTree: DataNode[];
	deptMap: Record<string, string>;
	deptLoading: boolean;
	setDeptTree: (nodes: DataNode[]) => void;
	loadDeptTree: (force?: boolean) => Promise<void>;
	// OEP 组织树相关
	oepOrgTree: DataNode[];
	oepOrgLoading: boolean;
	setOepOrgTree: (nodes: DataNode[]) => void;
	loadOepOrgTree: (force?: boolean) => Promise<void>;
}

export const useGlobalStore = create<GlobalState & GlobalAction>((set) => ({
	...initialState,

	// 部门树初始
	deptTree: [],
	deptMap: {},
	deptLoading: false,

	setDeptTree: (nodes: DataNode[]) => set({ deptTree: nodes }),

	loadDeptTree: async (force = false) => {
		// 如果已加载且不强制，则直接返回
		let shouldLoad = force;
		const current = useGlobalStore.getState();
		if (!current.deptTree || current.deptTree.length === 0) shouldLoad = true;
		if (!shouldLoad) return;
		set({ deptLoading: true });
		try {
			const data = await fetchOrganizationTree();
			let nodesSource: any[] = [];
			if (Array.isArray(data)) {
				nodesSource = data;
			} else if (data && typeof data === "object") {
				if (Array.isArray(data.children)) {
					if (data.name || data.id || data.code) {
						nodesSource = [data];
					} else {
						nodesSource = data.children;
					}
				}
			}
			const mapNode = (n: any): DataNode => {
				const children = Array.isArray(n.children) ? n.children.map(mapNode) : undefined;
				const key = String(
					n.code ??
						n.key ??
						n.id ??
						n.value ??
						(n.data && n.data.oepOrgUuid) ??
						Math.random(),
				);
				const title = n.name || key;
				// 尝试保留原始 fullname 字段，方便调用方展示完整路径/名称
				const fullname = n.fullname || n.fullName || n.full_name || title;
				const id = String(
					n.id ??
						n.key ??
						n.code ??
						n.value ??
						(n.data && n.data.oepOrgUuid) ??
						Math.random(),
				);
				return {
					id,
					title,
					key,
					children,
					isLeaf: !children || children.length === 0,
					fullname,
				} as DataNode;
			};
			const tree = nodesSource.map(mapNode);

			const map: Record<string, string> = {};
			const stack = [...tree];
			while (stack.length) {
				const n = stack.shift();
				if (!n) continue;
				map[String((n as any).id)] = (n as any).fullname || String(n.title);
				if (n.children) stack.push(...n.children);
			}

			set({ deptTree: tree, deptMap: map });
		} catch (e) {
			console.error("loadDeptTree failed", e);
		} finally {
			set({ deptLoading: false });
		}
	},

	// OEP 组织树初始
	oepOrgTree: [],
	oepOrgLoading: false,

	setOepOrgTree: (nodes: DataNode[]) => set({ oepOrgTree: nodes }),

	loadOepOrgTree: async (force = false): Promise<void> => {
		let shouldLoad = force;
		const current = useGlobalStore.getState();
		if (!current.oepOrgTree || current.oepOrgTree.length === 0) shouldLoad = true;
		if (!shouldLoad) return;

		set({ oepOrgLoading: true });
		try {
			const res: DataDimOepOrgTreeNode | DataDimOepOrgTreeNode[] =
				await fetchDataDimOepOrgTree();

			// 数据处理逻辑
			const processNodes = (nodes: DataDimOepOrgTreeNode[]): DataDimOepOrgTreeNode[] => {
				return nodes.map((node) => ({
					...node,
					title: node.name, // 确保 title 存在
					key: node.id, // 确保 key 存在
					disableCheckbox: node.canChoose === false,
					children: Array.isArray(node.children)
						? processNodes(node.children as DataDimOepOrgTreeNode[])
						: [],
				}));
			};

			let data: DataDimOepOrgTreeNode[] = [];
			if (Array.isArray(res)) {
				data = res;
			} else if (res && typeof res === "object") {
				if (Array.isArray(res.children)) {
					// 有些接口返回 { children: [...] } 结构
					if (res.name) {
						data = [res as DataDimOepOrgTreeNode];
					} else {
						data = res.children as DataDimOepOrgTreeNode[];
					}
				} else if (Object.keys(res).length > 0) {
					data = [res as DataDimOepOrgTreeNode];
				}
			}

			const processedData = processNodes(data);
			const mapToDataNode = (node: DataDimOepOrgTreeNode): DataNode => {
				const children = Array.isArray(node.children)
					? node.children.map(mapToDataNode)
					: undefined;
				return {
					title: node.name,
					key: node.id,
					id: node.id,
					children,
					isLeaf: !children || children.length === 0,
					disableCheckbox: node.canChoose === false,
					oepOrgUuid: node.data?.oepOrgUuid,
				} as DataNode;
			};
			const oepTreeNodes = processedData.map(mapToDataNode);
			set({ oepOrgTree: oepTreeNodes });
		} catch (e) {
			console.error("loadOepOrgTree failed", e);
		} finally {
			set({ oepOrgLoading: false });
		}
	},

	openGlobalSpin: () => {
		return set({
			globalSpin: true,
		});
	},

	closeGlobalSpin: () => {
		return set({
			globalSpin: false,
		});
	},

	setCurtainVisible: (visible: boolean) => {
		return set({
			curtainVisible: visible,
		});
	},
}));
