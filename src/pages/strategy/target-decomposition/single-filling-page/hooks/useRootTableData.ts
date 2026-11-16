import type { Row } from "../types";
import { fetchSubmitUserIndicatorDetail } from "#src/api/strategy/target-filling";
import { useState } from "react";
import { addKeysToNodes, collectExpandableKeys, processTreeData } from "../utils";

/**
 * 主表格数据管理 Hook（根视图）
 */
export function useRootTableData(planId: string) {
	const [columns, setColumns] = useState<any[]>([]);
	const [tableData, setTableData] = useState<Row[]>([]);
	const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]);

	// 加载主表格详情数据
	const loadDetailData = () => {
		if (!planId) return;

		fetchSubmitUserIndicatorDetail(planId).then((res) => {
			const headerRow: Row = {
				id: "header-row",
				key: "header-row",
				isHeaderRow: true,
			} as Row;
			const data = res.data;

			if (data) {
				const rawList = Array.isArray(data) ? data : [data];
				const normalizeNode = (node: any): Row => {
					const id =
						node.id ??
						node.targetOrgCode ??
						node.mapMap?.id ??
						`${node.targetOrgCode || node.responsiblePersonId || "row"}`;
					return {
						...node,
						id,
						children: Array.isArray(node.children)
							? node.children.map(normalizeNode)
							: undefined,
					};
				};
				const normalizedList = rawList.map(normalizeNode);
				const processedList = processTreeData(normalizedList);
				processedList.forEach((node) => ((node as any).isRoot = true));
				const list = addKeysToNodes(processedList);

				// 默认展开所有有子节点的行
				const keys = collectExpandableKeys(list);
				setExpandedRowKeys(keys);
				setTableData([headerRow, ...list]);
			} else {
				setTableData([headerRow]);
			}
		});
	};

	// 更新表格值
	const handleValueChange = (val: number | null, record: Row, indicatorId: number) => {
		const updateTreeData = (list: Row[]): Row[] => {
			return list.map((node) => {
				if (node.key === record.key) {
					return {
						...node,
						mapMap: {
							...(node as any).mapMap,
							[indicatorId]: {
								...(node as any).mapMap?.[indicatorId],
								totalTargetAmount: val,
							},
						},
					};
				}
				if (node.children && Array.isArray(node.children)) {
					return {
						...node,
						children: updateTreeData(node.children),
					};
				}
				return node;
			});
		};
		setTableData((prev) => updateTreeData(prev));
	};

	return {
		columns,
		setColumns,
		tableData,
		setTableData,
		expandedRowKeys,
		setExpandedRowKeys,
		loadDetailData,
		handleValueChange,
	};
}
