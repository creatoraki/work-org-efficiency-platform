/**
 * 绩效管理 · 年度评级 · 组织
 *
 * 类型定义：评级组织下拉选项与组织树节点。
 */

/** 评级组织选项（后端 EffAnnualEvaluationOrgPageListBO 的展示子集） */
export interface RatingOrgOption {
	/** 组织code */
	orgCode: string;
	/** 上级组织code */
	parentOrgCode?: string;
	/** 组织编码路径（| 分隔，末段为自身） */
	orgCodePath?: string;
	/** 组织名称 */
	orgName: string;
	/** 组织名称路径（| 分隔，与 orgCodePath 对齐） */
	orgNamePath?: string;
}

/** 评级组织树节点（TreeSelect 数据） */
export interface RatingOrgTreeNode {
	/** 节点值（组织code） */
	value: string;
	/** 节点标题（组织名称） */
	title: string;
	/** 子节点 */
	children?: RatingOrgTreeNode[];
}
