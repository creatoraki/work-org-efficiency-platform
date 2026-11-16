import type { OrganizationTreeNode } from "#src/api/common";

/**
 * 组织树节点类型
 */
export interface OrganizationNode {
	/** 节点ID */
	id: string | number;
	/** 节点名称 */
	name: string;
	/** 节点层级 */
	level?: string;
	/** 节点键值（用于 Tree 组件） */
	key?: string | number;
	/** 子节点 */
	children?: OrganizationNode[];
	/** 是否禁用勾选框 */
	disableCheckbox?: boolean;
}

/**
 * 弹窗关闭回调结果
 */
export interface CloseResult {
	/** 是否保存了数据 */
	saved: boolean;
	/** 选中的节点列表 */
	selected: OrganizationNode[];
	/** 选中的组织层级（逗号分隔） */
	orgLevel: string;
	/** 选中的组织ID（逗号分隔） */
	orgId: string;
}

/**
 * 匹配组织选择弹窗组件属性
 */
export interface MatchOrganizationModalProps {
	/** 弹窗是否打开 */
	open: boolean;
	/** 弹窗标题 */
	title?: string;
	/** 组织树数据 */
	treeData?: OrganizationTreeNode | null;
	/** 树数据加载状态 */
	treeLoading?: boolean;
	/** 初始选中的组织ID（用于回显，支持逗号分隔的多个ID） */
	initialSelectedOrgId?: string | number | null;
	/** 初始选中的组织层级（用于回显，支持逗号分隔的多个层级） */
	initialSelectedOrgLevel?: string | null;
	/** 关闭弹窗回调 */
	onClose: (result?: CloseResult) => void;
	/** 自定义提交处理函数，返回 true 表示提交成功 */
	customSubmit?: (nodes: OrganizationNode[]) => Promise<boolean>;
}

/**
 * 字典选项类型
 */
export interface DictOption {
	/** 选项标签 */
	label: string;
	/** 选项值 */
	value: string;
}
