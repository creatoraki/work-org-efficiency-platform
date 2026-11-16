import type { JobPositionTreeNode } from "#src/api/tag-management/rule-library";

import { processJobPositionTreeData } from "#src/utils";

/**
 * 岗位树选择节点。
 *
 * 在原始岗位-职位-职级树基础上，补充 TreeSelect 展示与选择所需的字段。
 *
 * @author 王善能
 * @since 2026-07-09
 */
export interface JobPostTreeSelectNode extends JobPositionTreeNode {
	title: string;
	value: string;
	selectionLabel: string;
	selectable: boolean;
	children?: JobPostTreeSelectNode[];
}

/**
 * 岗位树选择写回的人岗匹配表单字段。
 *
 * @author 王善能
 * @since 2026-07-09
 */
export interface JobPostSelectionFields {
	jobPostNodeValue?: string;
	jobId?: string;
	jobName?: string;
	postId?: string;
	postName?: string;
	postgradeId?: string;
	postgradeName?: string;
}

/**
 * 构造岗位树节点值。
 *
 * @param node - 岗位树节点
 * @returns TreeSelect 使用的唯一值
 * @author 王善能
 * @since 2026-07-09
 */
export function buildJobPostTreeValue(
	node: Pick<JobPositionTreeNode, "id" | "type" | "postGrade">,
): string {
	if (node.type === "position") {
		return `position:${node.id}:${node.postGrade}`;
	}
	return `${node.type}:${node.id}`;
}

/**
 * 将岗位-职位-职级树转换为抽屉展示结构。
 *
 * @param nodes - 原始岗位树
 * @returns TreeSelect 使用的树数据
 * @author 王善能
 * @since 2026-07-09
 */
export function buildJobPostTreeSelectData(nodes?: JobPositionTreeNode[]): JobPostTreeSelectNode[] {
	return processJobPositionTreeData(nodes).map((node) => {
		const parentName = node.parentName ?? node.parentLabel;
		const selectionLabel =
			node.type === "position" && parentName ? `${parentName}-${node.title}` : node.title;
		return {
			id: node.id,
			parentId: node.parentId,
			parentName: node.parentName,
			parentLabel: node.parentLabel,
			label: node.label,
			postGrade: node.postGrade,
			postGradeName: node.postGradeName,
			ethnicName: node.ethnicName,
			type: node.type,
			title: node.title,
			value: buildJobPostTreeValue(node),
			selectionLabel,
			selectable: node.type === "position",
			children: node.children?.length ? buildJobPostTreeSelectData(node.children) : undefined,
		};
	});
}

/**
 * 为岗位树构建值到节点的索引。
 *
 * @param nodes - TreeSelect 树数据
 * @returns 节点索引
 * @author 王善能
 * @since 2026-07-09
 */
export function createJobPostNodeMap(
	nodes: JobPostTreeSelectNode[],
): Map<string, JobPostTreeSelectNode> {
	const nodeMap = new Map<string, JobPostTreeSelectNode>();

	const walk = (treeNodes: JobPostTreeSelectNode[]) => {
		treeNodes.forEach((node) => {
			nodeMap.set(buildJobPostTreeValue(node), node);
			if (node.children?.length) {
				walk(node.children);
			}
		});
	};

	walk(nodes);
	return nodeMap;
}

/**
 * 根据岗位树节点构造人岗匹配表单字段。
 *
 * @param node - 当前选中的岗位树节点
 * @returns 需要写回表单的岗位链路字段
 * @author 王善能
 * @since 2026-07-09
 */
export function buildJobPostSelectionFields(node?: JobPostTreeSelectNode): JobPostSelectionFields {
	if (!node || node.type !== "position") {
		return {
			jobPostNodeValue: undefined,
			jobId: undefined,
			jobName: undefined,
			postId: undefined,
			postName: undefined,
			postgradeId: undefined,
			postgradeName: undefined,
		};
	}

	return {
		jobPostNodeValue: node.value,
		jobId: String(node.parentId),
		jobName: node.parentName ?? undefined,
		postId: String(node.id),
		postName: node.label,
		postgradeId: node.postGrade != null ? String(node.postGrade) : undefined,
		postgradeName: node.postGradeName ?? undefined,
	};
}
