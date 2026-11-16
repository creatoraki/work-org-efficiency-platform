import type { DataNode, Row } from "./types";
import React from "react";

export function getTitleText(title: any): string {
	if (title === null || title === undefined) return "";
	if (typeof title === "string" || typeof title === "number") return String(title);
	if (Array.isArray(title)) return title.map(getTitleText).join("").trim();
	if (React.isValidElement(title)) return getTitleText((title as any).props?.children).trim();
	return "";
}

export function flattenExportHeads(
	cols: any[],
): { tableHeadCode: string; tableHeadName: string }[] {
	const result: { tableHeadCode: string; tableHeadName: string }[] = [];
	const walk = (list: any[]) => {
		list.forEach((col) => {
			if (col?.children && Array.isArray(col.children) && col.children.length > 0) {
				walk(col.children);
				return;
			}
			const rawCode = col?.dataIndex ?? col?.key;
			if (!rawCode) return;
			const tableHeadCode = String(rawCode).startsWith("period_")
				? String(rawCode).replace("period_", "")
				: String(rawCode);
			const tableHeadName = getTitleText(col?.title).replaceAll("*", "") || String(rawCode);
			result.push({ tableHeadCode, tableHeadName });
		});
	};
	walk(cols || []);

	const responsibleIndex = result.findIndex(
		(item) => item.tableHeadCode === "responsiblePersonName",
	);
	if (responsibleIndex !== -1) {
		const hasJobNumber = result.some((item) => item.tableHeadCode === "负责人工号");
		if (!hasJobNumber) {
			result.splice(responsibleIndex + 1, 0, {
				tableHeadCode: "员工工号",
				tableHeadName: "负责人工号",
			});
		}
	}

	const targetOrgNameIndex = result.findIndex((item) => item.tableHeadCode === "targetOrgName");
	const targetOrgCodeIndex = result.findIndex((item) => item.tableHeadCode === "targetOrgCode");
	if (targetOrgNameIndex !== -1 && targetOrgCodeIndex !== -1) {
		const [targetOrgCodeItem] = result.splice(targetOrgCodeIndex, 1);
		const insertIndex = result.findIndex((item) => item.tableHeadCode === "targetOrgName");
		result.splice(insertIndex + 1, 0, targetOrgCodeItem);
	}

	return result;
}

/**
 * 处理树数据，过滤 treeElement === 1 的节点
 */
export function processTreeData(nodes: Row[]): Row[] {
	const result: Row[] = [];
	nodes.forEach((node) => {
		// 确保 parentSummaryWeight 有默认值
		if (node.parentSummaryWeight === undefined || node.parentSummaryWeight === null) {
			node.parentSummaryWeight = 100;
		}

		if (node.treeElement === 1) {
			// 如果当前节点是占位节点，只处理其子节点
			if (node.children && node.children.length > 0) {
				const children = processTreeData(node.children);
				result.push(...children);
			}
		} else {
			// 普通节点，处理其子节点
			if (node.children && node.children.length > 0) {
				const children = processTreeData(node.children);
				if (children.length > 0) {
					node.children = children;
				} else {
					node.children = undefined;
				}
			} else {
				node.children = undefined;
			}
			result.push(node);
		}
	});
	return result;
}

/**
 * 计算子孙节点数量
 */
export function countDescendants(nodes: Row[]): void {
	nodes.forEach((node) => {
		const traverse = (n: Row) => {
			if (n.children && n.children.length > 0) {
				n.treeElement = n.children.length;
				n.children.forEach((child: Row) => {
					traverse(child);
				});
			} else {
				n.treeElement = 0;
			}
		};
		traverse(node);
	});
}

/**
 * 为树节点添加唯一 key
 */
export function addKeysToNodes(nodes: Row[]): Row[] {
	return nodes.map((node, index) => {
		const newNode = { ...node };
		if (!newNode.key) {
			newNode.key = newNode.targetOrgCode || `row-${index}-${Date.now()}`;
		}
		if (newNode.children && Array.isArray(newNode.children)) {
			newNode.children = addKeysToNodes(newNode.children);
		}
		return newNode;
	});
}

/**
 * 收集所有可展开的节点 key
 */
export function collectExpandableKeys(nodes: Row[]): React.Key[] {
	const keys: React.Key[] = [];
	const traverse = (nodeList: Row[]) => {
		nodeList.forEach((node) => {
			if (node.children && node.children.length > 0) {
				keys.push(node.key!);
				traverse(node.children);
			}
		});
	};
	traverse(nodes);
	return keys;
}

/**
 * 在树中查找指定 key 的节点
 */
export function findNodeByKey(treeData: DataNode[], targetKey: string): DataNode | null {
	const stack = [...treeData];
	while (stack.length) {
		const n = stack.shift();
		if (!n) continue;
		if (String(n.key) === targetKey) return n;
		if (n.children) stack.push(...n.children);
	}
	return null;
}

/**
 * 更新树中指定节点的 fillInLabels
 */
export function updateNodeLabels(
	nodes: DataNode[],
	targetKey: string,
	updateFn: (node: DataNode) => DataNode,
): DataNode[] {
	return nodes.map((node) => {
		if (String(node.key) === String(targetKey)) {
			return updateFn(node);
		}
		if (node.children) {
			return { ...node, children: updateNodeLabels(node.children, targetKey, updateFn) };
		}
		return node;
	});
}

/**
 * 递归更新表格数据中的指定行
 */
export function updateRowInTree(
	nodes: Row[],
	targetId: string | number,
	updateFn: (row: Row) => Row,
): Row[] {
	return nodes.map((node) => {
		if (node.id === targetId) {
			return updateFn(node);
		}
		if (node.children && node.children.length > 0) {
			return { ...node, children: updateRowInTree(node.children, targetId, updateFn) };
		}
		return node;
	});
}

/**
 * 去重节点（基于 id）
 */
export function deduplicateNodes(existing: Row[], incoming: Row[]): Row[] {
	const seenIds = new Set<string | number>();

	// 递归收集已存在的 ID
	const collectIds = (nodeList: Row[]) => {
		nodeList.forEach((node) => {
			seenIds.add(node.id);
			if (node.children && node.children.length > 0) {
				collectIds(node.children);
			}
		});
	};

	// 递归过滤新节点
	const filterNodes = (nodeList: Row[]): Row[] => {
		const res: Row[] = [];
		nodeList.forEach((node) => {
			if (seenIds.has(node.id)) {
				return;
			}
			seenIds.add(node.id);

			const newNode = { ...node };
			if (newNode.children && newNode.children.length > 0) {
				newNode.children = filterNodes(newNode.children);
			}
			res.push(newNode);
		});
		return res;
	};

	collectIds(existing);
	return filterNodes(incoming);
}

/**
 * 表单验证：检查子表格数据是否完整
 */
export function validateChildTableData(childTableData: Row[]): {
	hasError: boolean;
	errorMessage?: string;
} {
	for (const row of childTableData) {
		// 检查必填字段
		if (!row.responsiblePersonName) {
			return {
				hasError: true,
				errorMessage: "已完成校验，提交前请先更正错误数据",
			};
		}

		// 检查备注：如果年度目标值 > 下级汇总，则备注必填
		const hasChildren = row.children && row.children.length > 0;
		if (hasChildren) {
			const childrenSum = row.children!.reduce(
				(acc, curr) => acc + (Number(curr.annualTargetValue) || 0),
				0,
			);
			if ((Number(row.annualTargetValue) || 0) > childrenSum) {
				if (!row.remarks || row.remarks.trim() === "") {
					return {
						hasError: true,
						errorMessage: "已完成校验，提交前请先更正错误数据",
					};
				}
			}
		}
	}

	return { hasError: false };
}

/**
 * 计算缺口值
 */
export function calculateGapValue(targetValue: string, summaryTotal: number): number {
	const target = Number(targetValue) || 0;
	return Math.max(0, target - summaryTotal);
}
