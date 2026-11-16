import type { ConfirmUserIdsIndicatorCountHisAdjustAllRes } from "#src/api/strategy/target-confirm";
import type { ConfirmUserIdsIndicatorCountHisAdjustReferenceValueCalLinkageRes } from "#src/api/strategy/target-filling/types";
import type { DataNode } from "antd/es/tree";
import { confirmUserIdsIndicatorCountHisAdjustAll } from "#src/api/strategy/target-confirm";
import {
	confirmUserIdsIndicatorCountHisAdjustAllCal,
	confirmUserIdsIndicatorCountHisAdjustAllSubmit,
} from "#src/api/strategy/target-filling";
import SearchableTable from "#src/components/searchable-table";
import { addThousand } from "#src/utils/add-thousand";
import { EditOutlined } from "@ant-design/icons";
import { Button, Drawer, Input, InputNumber, message, Modal, Spin, Tree, Typography } from "antd";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { commonDrawerProps } from "../../target-management/constants/base";
import { AdjustHistoryContext } from "./AdjustHistoryContext";
import AdjustReferenceValueDrawer from "./AdjustReferenceValueDrawer";

const { Search } = Input;

interface Props {
	open: boolean;
	onClose: () => void;
	effTaskSubmissionId: number;
	onSubmitSuccess?: () => Promise<void> | void;
}

interface TableRow {
	id: number;
	targetOrgCode: string;
	targetOrgName: string;
	responsiblePersonName: string;
	samePeriodValue: number;
	referenceValue: number;
	annualTargetValueChange: number;
	annualTargetValue: number;
	deviationValue: number;
	deviationFormulaFlag: number;
	remarks: string;
	confirmPeriodAll: {
		id: number;
		code: number;
		resultValue: number;
		supportModify: number;
	}[];
	parentSummaryWeight: number;
	periodicReporting?: Record<string, any>;
	children?: TableRow[];
}

interface HisAdjustAllCalInnerMapItem {
	listOverviewHisId?: number;
	referenceValue?: number;
	annualTargetValue?: number;
}

interface CalResultItem {
	id: number;
	annualTargetValue: number;
	deviationValue: number | null;
	deviationFormulaFlag: number | null;
	map: Record<string, unknown>;
}

type RawAdjustHistoryNode =
	ConfirmUserIdsIndicatorCountHisAdjustAllRes["data"]["hisListFirstLayer"][number]["hisListSecondLayers"][number]["innerAllNodes"][number];

type AdjustHistoryNode = Omit<RawAdjustHistoryNode, "child"> & {
	child?: AdjustHistoryNode[];
};

function getAdjustHistoryChildren(node: AdjustHistoryNode) {
	return Array.isArray(node.child) ? node.child : [];
}

function castAdjustHistoryNodes(nodes: RawAdjustHistoryNode[]): AdjustHistoryNode[] {
	return nodes as unknown as AdjustHistoryNode[];
}

function visitAdjustHistoryNodes(
	nodes: AdjustHistoryNode[],
	visitor: (node: AdjustHistoryNode) => void,
) {
	nodes.forEach((node) => {
		visitor(node);
		const children = getAdjustHistoryChildren(node);
		if (children.length > 0) {
			visitAdjustHistoryNodes(children, visitor);
		}
	});
}

function findAdjustHistoryNodeByTargetOrgCode(
	nodes: AdjustHistoryNode[],
	targetOrgCode: string,
): AdjustHistoryNode | undefined {
	for (const node of nodes) {
		if (node.targetOrgCode === targetOrgCode) {
			return node;
		}

		const children = getAdjustHistoryChildren(node);
		if (children.length > 0) {
			const matchedChild = findAdjustHistoryNodeByTargetOrgCode(children, targetOrgCode);
			if (matchedChild) {
				return matchedChild;
			}
		}
	}

	return undefined;
}

interface SubmitRowSnapshot {
	id: number;
	referenceValue?: number;
	annualTargetValue?: number;
	remarks?: string;
	map: Record<string, unknown>;
}

function AdjustHistoryDrawer({ open, onClose, effTaskSubmissionId, onSubmitSuccess }: Props) {
	const [loading, setLoading] = useState(false);
	const [data, setData] = useState<ConfirmUserIdsIndicatorCountHisAdjustAllRes["data"] | null>(
		null,
	);
	const [treeData, setTreeData] = useState<DataNode[]>([]);
	const [selectedKey, setSelectedKey] = useState<string | null>(null);
	const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
	const [search, setSearch] = useState("");
	const [tableData, setTableData] = useState<TableRow[]>([]);
	const [periodConfigs, setPeriodConfigs] = useState<{ id: number; name: string }[]>([]);
	const [indicatorUnitName, setIndicatorUnitName] = useState("");
	const originalMapRef = useRef<
		Record<
			number,
			{
				referenceValue?: number;
				annualTargetValue?: number;
				remarks?: string;
				map: Record<string, unknown>;
			}
		>
	>({});
	const editedMapRef = useRef<
		Record<
			number,
			{
				annualTargetValue?: number;
				remarks?: string;
				map?: Record<string, unknown>;
				referenceValue?: number;
				deviationValue?: number;
				deviationFormulaFlag?: number;
			}
		>
	>({});
	const annualCalInFlightRef = useRef<Record<number, boolean>>({});
	const annualCalLastSubmittedRef = useRef<Record<number, number>>({});
	// 全局基础指标缓存,所有拆解对象共享
	const globalBasicIndicatorMapRef = useRef<Record<string, string>>({});
	// 按拆解对象分组的基础指标缓存,用于提交
	const basicIndicatorMapRef = useRef<Record<string, Record<string, string>>>({});

	// 参考值抽屉相关
	const [referenceDrawerOpen, setReferenceDrawerOpen] = useState(false);
	const [currentEditRecord, setCurrentEditRecord] = useState<TableRow | null>(null);

	const buildOriginalSnapshot = useCallback(
		(node: AdjustHistoryNode) => ({
			referenceValue: node.referenceValue,
			annualTargetValue: node.annualTargetValue,
			remarks: node.remarks,
			map: Object.fromEntries(
				node.confirmPeriodAll.map((period) => [String(period.code), period.resultValue]),
			),
		}),
		[],
	);

	const syncOriginalMapFromData = useCallback(
		(responseData: ConfirmUserIdsIndicatorCountHisAdjustAllRes["data"]) => {
			const nextOriginalMap: Record<
				number,
				{
					referenceValue?: number;
					annualTargetValue?: number;
					remarks?: string;
					map: Record<string, unknown>;
				}
			> = {};

			responseData.hisListFirstLayer.forEach((dept) => {
				dept.hisListSecondLayers.forEach((indicator) => {
					visitAdjustHistoryNodes(
						castAdjustHistoryNodes(indicator.innerAllNodes),
						(node) => {
							nextOriginalMap[node.id] = buildOriginalSnapshot(node);
						},
					);
				});
			});

			originalMapRef.current = nextOriginalMap;
		},
		[buildOriginalSnapshot],
	);

	const buildSubmitRowSnapshotMap = useCallback(() => {
		const snapshotMap = new Map<number, SubmitRowSnapshot>();

		if (!data) {
			return snapshotMap;
		}

		data.hisListFirstLayer.forEach((dept) => {
			dept.hisListSecondLayers.forEach((indicator) => {
				visitAdjustHistoryNodes(castAdjustHistoryNodes(indicator.innerAllNodes), (node) => {
					const edited = editedMapRef.current[node.id] || {};
					const original = originalMapRef.current[node.id] || buildOriginalSnapshot(node);
					snapshotMap.set(node.id, {
						id: node.id,
						referenceValue: edited.referenceValue ?? node.referenceValue,
						annualTargetValue: edited.annualTargetValue ?? node.annualTargetValue,
						remarks: edited.remarks ?? node.remarks,
						map: {
							...(original.map || {}),
							...(edited.map || {}),
						},
					});
				});
			});
		});

		return snapshotMap;
	}, [buildOriginalSnapshot, data]);

	// 加载数据
	useEffect(() => {
		if (open && effTaskSubmissionId) {
			setLoading(true);
			confirmUserIdsIndicatorCountHisAdjustAll(effTaskSubmissionId)
				.then((res) => {
					if (res.code === 200 && res.data) {
						syncOriginalMapFromData(res.data);
						setData(res.data);
						// 构建树数据
						buildTreeData(res.data);
					} else {
						message.error(res.msg || "加载数据失败");
					}
				})
				.catch((err) => {
					console.error(err);
					message.error("加载数据失败");
				})
				.finally(() => {
					setLoading(false);
				});
		}
	}, [open, effTaskSubmissionId, syncOriginalMapFromData]);

	useEffect(() => {
		if (!open) {
			setData(null);
			setTreeData([]);
			setSelectedKey(null);
			setExpandedKeys([]);
			setSearch("");
			setTableData([]);
			setPeriodConfigs([]);
			setIndicatorUnitName("");
			originalMapRef.current = {};
			editedMapRef.current = {};
			annualCalInFlightRef.current = {};
			annualCalLastSubmittedRef.current = {};
			globalBasicIndicatorMapRef.current = {};
			basicIndicatorMapRef.current = {};
			setReferenceDrawerOpen(false);
			setCurrentEditRecord(null);
		}
	}, [open]);

	// 构建树数据
	const buildTreeData = (responseData: ConfirmUserIdsIndicatorCountHisAdjustAllRes["data"]) => {
		const tree: DataNode[] = responseData.hisListFirstLayer.map((dept, deptIndex) => ({
			title: dept.responsibleDepartmentName,
			key: `dept-${deptIndex}`,
			selectable: false,
			children: dept.hisListSecondLayers.map((indicator, indicatorIndex) => ({
				title: indicator.name,
				key: `dept-${deptIndex}-indicator-${indicatorIndex}`,
				unitName: indicator.unitName,
				period: indicator.period,
				innerAllNodes: indicator.innerAllNodes,
			})),
		}));

		setTreeData(tree);

		// 默认展开第一个部门，选中第一个指标
		if (tree.length > 0) {
			const firstDept = tree[0];
			setExpandedKeys([firstDept.key]);
			if (firstDept.children && firstDept.children.length > 0) {
				const firstIndicator = firstDept.children[0];
				setSelectedKey(String(firstIndicator.key));
			}
		}
	};

	const buildTableRows = useCallback((nodes: AdjustHistoryNode[]): TableRow[] => {
		return nodes.map((node) => {
			const periodicReporting: Record<string, any> = {};
			node.confirmPeriodAll.forEach((period) => {
				periodicReporting[period.code] = {
					id: period.id,
					periodCode: period.code,
					resultValue: period.resultValue,
					supportModify: period.supportModify,
				};
			});

			const baseRow: TableRow = {
				id: node.id,
				targetOrgCode: node.targetOrgCode,
				targetOrgName: node.targetOrgName,
				responsiblePersonName: node.responsiblePersonName,
				samePeriodValue: node.samePeriodValue,
				referenceValue: node.referenceValue,
				annualTargetValueChange: node.annualTargetValueChange,
				annualTargetValue: node.annualTargetValue,
				deviationValue: node.deviationValue,
				deviationFormulaFlag: node.deviationFormulaFlag,
				remarks: node.remarks,
				confirmPeriodAll: node.confirmPeriodAll,
				parentSummaryWeight: node.parentSummaryWeight,
				periodicReporting,
			};

			const editedRow = editedMapRef.current[node.id];
			if (editedRow) {
				if (editedRow.referenceValue !== undefined) {
					baseRow.referenceValue = editedRow.referenceValue;
				}
				if (editedRow.annualTargetValue !== undefined) {
					baseRow.annualTargetValue = editedRow.annualTargetValue;
				}
				if (editedRow.deviationValue !== undefined) {
					baseRow.deviationValue = editedRow.deviationValue;
				}
				if (editedRow.deviationFormulaFlag !== undefined) {
					baseRow.deviationFormulaFlag = editedRow.deviationFormulaFlag;
				}
				if (editedRow.remarks !== undefined) {
					baseRow.remarks = editedRow.remarks;
				}
				if (editedRow.map) {
					const updated = { ...(baseRow.periodicReporting || {}) };
					Object.entries(editedRow.map).forEach(([key, value]) => {
						const periodCode = Number(key);
						const existing = updated[periodCode] || { periodCode };
						updated[periodCode] = { ...existing, resultValue: value };
					});
					baseRow.periodicReporting = updated;
				}
			}

			const children = getAdjustHistoryChildren(node);
			if (children.length > 0) {
				baseRow.children = buildTableRows(children);
			}

			return baseRow;
		});
	}, []);

	const updateTableRows = useCallback(
		(
			rows: TableRow[],
			matcher: (row: TableRow) => boolean,
			updater: (row: TableRow) => TableRow,
		): TableRow[] => {
			return rows.map((row) => {
				const nextChildren = row.children?.length
					? updateTableRows(row.children, matcher, updater)
					: row.children;
				const currentRow =
					nextChildren !== row.children ? { ...row, children: nextChildren } : row;

				if (!matcher(currentRow)) {
					return currentRow;
				}

				return updater(currentRow);
			});
		},
		[],
	);

	const findTableRowById = useCallback(
		(rows: TableRow[], recordId: number): TableRow | undefined => {
			for (const row of rows) {
				if (row.id === recordId) {
					return row;
				}

				if (row.children?.length) {
					const matchedChild = findTableRowById(row.children, recordId);
					if (matchedChild) {
						return matchedChild;
					}
				}
			}

			return undefined;
		},
		[],
	);

	// 当选中树节点时，更新表格数据
	useEffect(() => {
		if (!selectedKey || !data) {
			setTableData([]);
			setPeriodConfigs([]);
			setIndicatorUnitName("");
			return;
		}

		const match = selectedKey.match(/^dept-(\d+)-indicator-(\d+)$/);
		if (!match) {
			setTableData([]);
			return;
		}

		const deptIndex = Number.parseInt(match[1], 10);
		const indicatorIndex = Number.parseInt(match[2], 10);
		const indicator = data.hisListFirstLayer[deptIndex]?.hisListSecondLayers[indicatorIndex];
		if (!indicator) {
			setTableData([]);
			setPeriodConfigs([]);
			setIndicatorUnitName("");
			return;
		}

		setPeriodConfigs(indicator.period || []);
		setIndicatorUnitName(indicator.unitName || "");
		setTableData(buildTableRows(castAdjustHistoryNodes(indicator.innerAllNodes)));
	}, [selectedKey, data, buildTableRows]);

	const buildHisAdjustAllCalInnerMap = useCallback(
		(targetOrgCode: string) => {
			if (!data) {
				return {} as Record<string, HisAdjustAllCalInnerMapItem>;
			}

			const innerMap: Record<string, HisAdjustAllCalInnerMapItem> = {};

			data.hisListFirstLayer.forEach((dept) => {
				dept.hisListSecondLayers.forEach((indicator) => {
					visitAdjustHistoryNodes(
						castAdjustHistoryNodes(indicator.innerAllNodes),
						(node) => {
							if (node.targetOrgCode !== targetOrgCode) {
								return;
							}

							const edited = editedMapRef.current[node.id] || {};
							innerMap[String(node.id)] = {
								listOverviewHisId: node.id,
								referenceValue: edited.referenceValue ?? node.referenceValue,
								annualTargetValue:
									edited.annualTargetValue ?? node.annualTargetValue,
							};
						},
					);
				});
			});

			return innerMap;
		},
		[data],
	);

	const handlePeriodChange = useCallback(
		(recordId: number, periodId: number, value: number | null) => {
			const currentRow = findTableRowById(tableData, recordId);
			const currentPeriod = currentRow?.periodicReporting?.[periodId];
			if (currentPeriod?.supportModify === 0) {
				return;
			}

			setTableData((prev) =>
				updateTableRows(
					prev,
					(row) => row.id === recordId,
					(row) => {
						const periodicReporting = { ...(row.periodicReporting || {}) };
						const existing = periodicReporting[periodId] || {};
						periodicReporting[periodId] = {
							...existing,
							periodCode: periodId,
							resultValue: value ?? undefined,
							supportModify: existing.supportModify ?? 1,
						};
						return { ...row, periodicReporting };
					},
				),
			);

			const existing = editedMapRef.current[recordId] || {};
			const updatedMap = { ...(existing.map || {}) };
			updatedMap[String(periodId)] = value ?? undefined;
			editedMapRef.current[recordId] = {
				...existing,
				map: updatedMap,
			};
		},
		[findTableRowById, tableData, updateTableRows],
	);

	const handleAnnualTargetChange = useCallback(
		(recordId: number, value: number | null) => {
			setTableData((prev) =>
				updateTableRows(
					prev,
					(row) => row.id === recordId,
					(row) => ({
						...row,
						annualTargetValue: value ?? row.annualTargetValue,
					}),
				),
			);

			const existing = editedMapRef.current[recordId] || {};
			editedMapRef.current[recordId] = {
				...existing,
				annualTargetValue: value ?? existing.annualTargetValue,
			};
		},
		[updateTableRows],
	);

	const handleAnnualTargetCommit = useCallback(
		async (recordId: number) => {
			const currentRow = findTableRowById(tableData, recordId);
			if (!currentRow) {
				return;
			}

			const value = currentRow.annualTargetValue;
			if (value === null || value === undefined) {
				return;
			}

			if (annualCalInFlightRef.current[recordId]) {
				return;
			}

			if (annualCalLastSubmittedRef.current[recordId] === value) {
				return;
			}

			annualCalInFlightRef.current[recordId] = true;

			const hisAdjustAllCalInnerMap = buildHisAdjustAllCalInnerMap(currentRow.targetOrgCode);
			hisAdjustAllCalInnerMap[String(recordId)] = {
				...(hisAdjustAllCalInnerMap[String(recordId)] || {}),
				listOverviewHisId: recordId,
				annualTargetValue: value,
			};

			const targetBasicIndicatorMap =
				basicIndicatorMapRef.current[currentRow.targetOrgCode] ||
				globalBasicIndicatorMapRef.current;

			try {
				const resp = await confirmUserIdsIndicatorCountHisAdjustAllCal({
					id: recordId,
					value: Number(value),
					basicIndicatorMap: targetBasicIndicatorMap,
					hisAdjustAllCalInnerMap,
				});

				if (resp?.code !== 200 || !resp.data) {
					message.error(resp?.msg || "年度目标值计算失败");
					return;
				}

				const rawCalData = resp.data as CalResultItem | Record<string, CalResultItem>;
				const calResultByIndicator: Record<string, CalResultItem> =
					rawCalData && typeof rawCalData === "object" && "id" in rawCalData
						? { __single__: rawCalData as CalResultItem }
						: (rawCalData as Record<string, CalResultItem>);

				const affectedRowResultMap: Record<number, CalResultItem> = {};
				if (data) {
					data.hisListFirstLayer.forEach((dept) => {
						dept.hisListSecondLayers.forEach((indicator) => {
							const indicatorListId = String(indicator.indicatorListId ?? "");
							const indicatorResult =
								calResultByIndicator[indicatorListId] ||
								calResultByIndicator.__single__;
							if (!indicatorResult) {
								return;
							}

							const linkedRow = findAdjustHistoryNodeByTargetOrgCode(
								castAdjustHistoryNodes(indicator.innerAllNodes),
								currentRow.targetOrgCode,
							);
							if (!linkedRow) {
								return;
							}

							affectedRowResultMap[linkedRow.id] = indicatorResult;
						});
					});
				}

				setTableData((prev) =>
					updateTableRows(
						prev,
						(row) => Boolean(affectedRowResultMap[row.id]),
						(row) => {
							const calData = affectedRowResultMap[row.id];
							if (!calData) {
								return row;
							}

							const periodicReporting = { ...(row.periodicReporting || {}) };
							Object.entries(calData.map || {}).forEach(([key, mapValue]) => {
								const periodCode = Number(key);
								const existing = periodicReporting[periodCode] || {};
								periodicReporting[periodCode] = {
									...existing,
									periodCode,
									resultValue: mapValue as number,
									id: existing.id,
									supportModify: existing.supportModify ?? 1,
								};
							});

							return {
								...row,
								annualTargetValue: calData.annualTargetValue,
								deviationValue: calData.deviationValue ?? 0,
								deviationFormulaFlag: calData.deviationFormulaFlag ?? 0,
								periodicReporting,
							};
						},
					),
				);

				Object.entries(affectedRowResultMap).forEach(([rowIdStr, calData]) => {
					const rowId = Number(rowIdStr);
					const currentEdit = editedMapRef.current[rowId] || {};
					editedMapRef.current[rowId] = {
						...currentEdit,
						annualTargetValue: calData.annualTargetValue,
						deviationValue: calData.deviationValue ?? 0,
						deviationFormulaFlag: calData.deviationFormulaFlag ?? 0,
						map: { ...(currentEdit.map || {}), ...(calData.map || {}) },
					};
				});

				annualCalLastSubmittedRef.current[recordId] = Number(value);
			} catch (error) {
				console.error(error);
				message.error("年度目标值计算失败");
			} finally {
				annualCalInFlightRef.current[recordId] = false;
			}
		},
		[buildHisAdjustAllCalInnerMap, data, tableData, updateTableRows, findTableRowById],
	);

	const hasMapChanged = useCallback(
		(originalMap: Record<string, unknown>, editedMap?: Record<string, unknown>) => {
			if (!editedMap) {
				return false;
			}
			return Object.entries(editedMap).some(([key, value]) => originalMap[key] !== value);
		},
		[],
	);

	const handleRemarksChange = useCallback(
		(recordId: number, value: string) => {
			setTableData((prev) =>
				updateTableRows(
					prev,
					(row) => row.id === recordId,
					(row) => ({
						...row,
						remarks: value,
					}),
				),
			);

			const existing = editedMapRef.current[recordId] || {};
			editedMapRef.current[recordId] = {
				...existing,
				remarks: value,
			};
		},
		[updateTableRows],
	);

	const handleSubmit = useCallback(async () => {
		const currentRowMap = buildSubmitRowSnapshotMap();
		const adjustFormList = Object.entries(editedMapRef.current)
			.map(([id]) => {
				const rowId = Number(id);
				const original = originalMapRef.current[rowId];
				const currentRow = currentRowMap.get(rowId);
				if (!original || !currentRow) {
					return null;
				}

				const mapPayload = currentRow.map || {};

				const hasReferenceChanged = currentRow.referenceValue !== original.referenceValue;
				const hasAnnualChanged =
					currentRow.annualTargetValue !== original.annualTargetValue;
				const hasRemarksChanged = currentRow.remarks !== original.remarks;
				const hasPeriodChanged = hasMapChanged(original.map || {}, mapPayload);

				if (
					!hasReferenceChanged &&
					!hasAnnualChanged &&
					!hasRemarksChanged &&
					!hasPeriodChanged
				) {
					return null;
				}

				return {
					id: rowId,
					referenceValue: currentRow.referenceValue,
					annualTargetValue: currentRow.annualTargetValue,
					remarks: currentRow.remarks,
					map: mapPayload,
				};
			})
			.filter(Boolean) as {
			id: number;
			referenceValue?: number;
			annualTargetValue?: number;
			map: Record<string, unknown>;
			remarks?: string;
		}[];

		if (adjustFormList.length === 0) {
			message.info("暂无修改，无需提交");
			return;
		}

		Modal.confirm({
			title: "提交确认",
			content: "确认提交当前调整吗？",
			onOk: async () => {
				const resp = await confirmUserIdsIndicatorCountHisAdjustAllSubmit({
					effTaskSubmissionId,
					adjustFormList,
					basicIndicatorMap: basicIndicatorMapRef.current,
				});

				if (resp?.code === 200) {
					await onSubmitSuccess?.();
					editedMapRef.current = {};
					globalBasicIndicatorMapRef.current = {};
					basicIndicatorMapRef.current = {};
					onClose();
				}
			},
		});
	}, [buildSubmitRowSnapshotMap, effTaskSubmissionId, hasMapChanged, onSubmitSuccess]);

	// 搜索过滤
	const filteredTreeData = useMemo(() => {
		if (!search) return treeData;

		const filterTree = (nodes: DataNode[]): DataNode[] => {
			return nodes
				.map((node) => {
					const children = node.children ? filterTree(node.children) : [];
					const matched = String(node.title || "")
						.toLowerCase()
						.includes(search.toLowerCase());

					if (matched || children.length > 0) {
						return {
							...node,
							children,
						};
					}
					return null;
				})
				.filter(Boolean) as DataNode[];
		};

		return filterTree(treeData);
	}, [treeData, search]);

	// 表格列定义
	const columns = useMemo(() => {
		const periodCols = periodConfigs.map((p) => ({
			title: indicatorUnitName ? `${p.name}(${indicatorUnitName})` : p.name,
			key: `period_${p.id}`,
			width: 140,
			render: (_: any, record: TableRow) => {
				const map = record.periodicReporting || {};
				const found = Object.values(map).find((item: any) => item.periodCode === p.id) as
					| { resultValue?: number; supportModify?: number }
					| undefined;
				const val = found?.resultValue;
				const editable = found ? found.supportModify !== 0 : true;
				return (
					<InputNumber
						value={val}
						min={0}
						disabled={!editable}
						className="w-full"
						onChange={(v) => handlePeriodChange(record.id, p.id, v)}
					/>
				);
			},
		}));

		return [
			{
				title: "拆解对象",
				dataIndex: "targetOrgName",
				key: "targetOrgName",
				width: 180,
				fixed: "left" as const,
				render: (v: any) => (
					<Typography.Text ellipsis={{ tooltip: true }}>{v}</Typography.Text>
				),
			},
			{
				title: "主数据编码",
				dataIndex: "targetOrgCode",
				key: "targetOrgCode",
				width: 120,
				fixed: "left" as const,
				render: (v: any) => (
					<Typography.Text ellipsis={{ tooltip: true }}>{v}</Typography.Text>
				),
			},
			{
				title: "负责人",
				dataIndex: "responsiblePersonName",
				key: "responsiblePersonName",
				width: 120,
			},
			{
				title: `同期值(${indicatorUnitName || ""})`,
				dataIndex: "samePeriodValue",
				key: "samePeriodValue",
				width: 140,
				render: (val: any) => addThousand(val),
			},
			{
				title: `参考值(${indicatorUnitName || ""})`,
				dataIndex: "referenceValue",
				key: "referenceValue",
				width: 180,
				render: (val: any, record: TableRow) => (
					<div className="flex items-center justify-between gap-2">
						<span>{addThousand(val)}</span>
						<Button
							type="link"
							size="small"
							icon={<EditOutlined />}
							onClick={() => {
								setCurrentEditRecord(record);
								setReferenceDrawerOpen(true);
							}}
						/>
					</div>
				),
			},
			{
				title: "年度",
				children: [
					{
						title: `年度目标值(${indicatorUnitName || ""})`,
						dataIndex: "annualTargetValue",
						key: "annualTargetValue",
						width: 160,
						render: (v: any, record: TableRow) => {
							if (record.annualTargetValueChange === 1) {
								return (
									<InputNumber
										value={v as number | undefined}
										min={0}
										className="w-full"
										onChange={(val) => handleAnnualTargetChange(record.id, val)}
										onBlur={() => void handleAnnualTargetCommit(record.id)}
										onPressEnter={() =>
											void handleAnnualTargetCommit(record.id)
										}
									/>
								);
							}
							return addThousand(v);
						},
					},
					{
						title: `偏差(${indicatorUnitName || ""})`,
						dataIndex: "deviationValue",
						key: "deviationValue",
						width: 120,
						render: (v: any, record: TableRow) => {
							const isRed = record.deviationFormulaFlag === 1;
							return (
								<span style={{ color: isRed ? "red" : undefined }}>
									{addThousand(v)}
								</span>
							);
						},
					},
				],
			},
			...periodCols,
			{
				title: "上级汇总权重(%)",
				dataIndex: "parentSummaryWeight",
				key: "parentSummaryWeight",
				width: 140,
				render: (v: any) => v ?? "",
			},
			{
				title: "备注",
				dataIndex: "remarks",
				key: "remarks",
				width: 150,
				render: (v: any, record: TableRow) => (
					<Input
						value={v as string | undefined}
						placeholder="请输入"
						onChange={(e) => handleRemarksChange(record.id, e.target.value)}
					/>
				),
			},
		];
	}, [
		periodConfigs,
		indicatorUnitName,
		handleAnnualTargetChange,
		handleAnnualTargetCommit,
		handlePeriodChange,
		handleRemarksChange,
	]);

	// 查找与指定 targetOrgCode 相同的所有数据行
	const findSameTargetOrgRows = useCallback(
		(targetOrgCode: string) => {
			if (!data) return [];

			const rows: Array<{
				id: number;
				samePeriodValue: number;
				referenceValue: number;
				annualTargetValue: number;
			}> = [];

			// 遍历所有部门
			data.hisListFirstLayer.forEach((dept) => {
				// 遍历每个部门的所有指标
				dept.hisListSecondLayers.forEach((indicator) => {
					// 递归遍历每个指标的所有数据行
					visitAdjustHistoryNodes(
						castAdjustHistoryNodes(indicator.innerAllNodes),
						(node) => {
							// 找出与当前编辑行相同 targetOrgCode 的行
							if (node.targetOrgCode === targetOrgCode) {
								rows.push({
									id: node.id,
									samePeriodValue: node.samePeriodValue,
									referenceValue: node.referenceValue,
									annualTargetValue: node.annualTargetValue,
								});
							}
						},
					);
				});
			});

			return rows;
		},
		[data],
	);

	const handleReferenceValueSave = useCallback(
		(
			updatedBasicIndicatorMap: Record<string, unknown>,
			linkageData?: ConfirmUserIdsIndicatorCountHisAdjustReferenceValueCalLinkageRes,
		) => {
			if (!currentEditRecord) return;

			// 转换为 string 类型
			const convertedMap: Record<string, string> = {};
			Object.entries(updatedBasicIndicatorMap).forEach(([key, value]) => {
				convertedMap[key] = String(value ?? "");
			});

			// 更新全局基础指标缓存(所有拆解对象共享)
			Object.entries(convertedMap).forEach(([key, value]) => {
				globalBasicIndicatorMapRef.current[key] = value;
			});

			// 更新当前拆解对象的基础指标缓存(用于提交)
			if (!basicIndicatorMapRef.current[currentEditRecord.targetOrgCode]) {
				basicIndicatorMapRef.current[currentEditRecord.targetOrgCode] = {};
			}
			basicIndicatorMapRef.current[currentEditRecord.targetOrgCode] = convertedMap;

			if (!linkageData || !data) {
				return;
			}

			const match = selectedKey?.match(/^dept-(\d+)-indicator-(\d+)$/);
			const deptIndex = match ? Number.parseInt(match[1], 10) : -1;
			const indicatorIndex = match ? Number.parseInt(match[2], 10) : -1;
			const indicator =
				data.hisListFirstLayer?.[deptIndex]?.hisListSecondLayers?.[indicatorIndex];
			const indicatorListId = indicator?.indicatorListId;
			const currentLinkageItem = linkageData[String(indicatorListId ?? "")];

			setTableData((prev) => {
				if (!currentLinkageItem) {
					return prev;
				}

				return updateTableRows(
					prev,
					(row) => row.targetOrgCode === currentEditRecord.targetOrgCode,
					(row) => {
						const periodicReporting = { ...(row.periodicReporting || {}) };
						Object.entries(currentLinkageItem.periodic || {}).forEach(
							([periodCodeStr, periodValue]) => {
								const periodCode = Number(periodCodeStr);
								const existing = periodicReporting[periodCode] || { periodCode };
								periodicReporting[periodCode] = {
									...existing,
									periodCode,
									resultValue: periodValue,
								};
							},
						);

						editedMapRef.current[row.id] = {
							...(editedMapRef.current[row.id] || {}),
							referenceValue: currentLinkageItem.referenceValue,
							annualTargetValue: currentLinkageItem.annualTargetValue,
							deviationValue: currentLinkageItem.deviationValue,
							deviationFormulaFlag: currentLinkageItem.deviationFormulaFlag,
							map: {
								...((editedMapRef.current[row.id] || {}).map || {}),
								...(currentLinkageItem.periodic || {}),
							},
						};

						return {
							...row,
							referenceValue: currentLinkageItem.referenceValue,
							annualTargetValue: currentLinkageItem.annualTargetValue,
							deviationValue: currentLinkageItem.deviationValue,
							deviationFormulaFlag: currentLinkageItem.deviationFormulaFlag,
							periodicReporting,
						};
					},
				);
			});

			data.hisListFirstLayer.forEach((dept) => {
				dept.hisListSecondLayers.forEach((indicator) => {
					const indicatorListId = indicator.indicatorListId;
					const linkageItem = linkageData[String(indicatorListId ?? "")];
					if (!linkageItem) {
						return;
					}

					const row = findAdjustHistoryNodeByTargetOrgCode(
						castAdjustHistoryNodes(indicator.innerAllNodes),
						currentEditRecord.targetOrgCode,
					);
					if (!row) {
						return;
					}

					editedMapRef.current[row.id] = {
						...(editedMapRef.current[row.id] || {}),
						referenceValue: linkageItem.referenceValue,
						annualTargetValue: linkageItem.annualTargetValue,
						deviationValue: linkageItem.deviationValue,
						deviationFormulaFlag: linkageItem.deviationFormulaFlag,
						map: {
							...((editedMapRef.current[row.id] || {}).map || {}),
							...(linkageItem.periodic || {}),
						},
					};
				});
			});
		},
		[currentEditRecord, data, selectedKey, updateTableRows],
	);

	const currentIndicatorListId = useMemo(() => {
		if (!selectedKey || !data) {
			return null;
		}

		const match = selectedKey.match(/^dept-(\d+)-indicator-(\d+)$/);
		if (!match) {
			return null;
		}

		const deptIndex = Number.parseInt(match[1], 10);
		const indicatorIndex = Number.parseInt(match[2], 10);
		const indicator =
			data.hisListFirstLayer?.[deptIndex]?.hisListSecondLayers?.[indicatorIndex];
		const indicatorListId = indicator?.indicatorListId;
		if (indicatorListId === undefined || indicatorListId === null) {
			return null;
		}
		return String(indicatorListId);
	}, [selectedKey, data]);

	return (
		<>
			<AdjustHistoryContext.Provider value={{ currentIndicatorListId }}>
				<AdjustReferenceValueDrawer
					open={referenceDrawerOpen}
					onClose={() => {
						setReferenceDrawerOpen(false);
						setCurrentEditRecord(null);
					}}
					listOverviewHisId={currentEditRecord?.id ?? null}
					targetOrgCode={currentEditRecord?.targetOrgCode ?? ""}
					indicatorName={indicatorUnitName}
					unitName={indicatorUnitName}
					initialReferenceValue={currentEditRecord?.referenceValue ?? 0}
					cachedBasicIndicatorMap={globalBasicIndicatorMapRef.current}
					sameTargetOrgRows={
						currentEditRecord
							? findSameTargetOrgRows(currentEditRecord.targetOrgCode)
							: []
					}
					onSave={handleReferenceValueSave}
				/>
			</AdjustHistoryContext.Provider>

			<Drawer
				{...commonDrawerProps(onClose)}
				title="目标调整"
				open={open}
				width="80%"
				styles={{
					body: {
						paddingRight: 0,
						paddingLeft: 4,
					},
				}}
				footer={
					<div className="flex justify-end gap-2">
						<Button onClick={onClose}>取消</Button>
						<Button type="primary" onClick={handleSubmit}>
							提交
						</Button>
					</div>
				}
			>
				<Spin spinning={loading}>
					<div style={{ display: "flex", height: "calc(100vh - 120px)" }}>
						{/* 左侧树 */}
						<div
							className="left-tree-wrapper"
							style={{
								width: 240,
								borderRight: "1px solid #f0f0f0",
								padding: "0 12px",
								overflowY: "auto",
							}}
						>
							<div style={{ marginBottom: 12 }}>
								<Search
									placeholder="搜索指标"
									value={search}
									onChange={(e) => setSearch(e.target.value)}
									allowClear
								/>
							</div>
							<Tree
								treeData={filteredTreeData}
								selectedKeys={selectedKey ? [selectedKey] : []}
								expandedKeys={expandedKeys}
								onSelect={(keys) => {
									if (keys && keys[0]) {
										setSelectedKey(String(keys[0]));
									}
								}}
								onExpand={(keys) => {
									setExpandedKeys(keys);
								}}
							/>
						</div>

						{/* 右侧表格 */}
						<div style={{ flex: 1, padding: "0 12px", overflowY: "auto" }}>
							{data?.confirmationOpinion && (
								<div
									style={{
										marginBottom: 12,
										padding: 12,
										background: "#f5f5f5",
										borderRadius: 4,
									}}
								>
									<div>
										<strong>确认意见:</strong>
									</div>
									<div>{data.confirmationOpinion}</div>
								</div>
							)}

							{tableData.length > 0 ? (
								<SearchableTable
									columns={columns}
									dataSource={tableData}
									rowKey="id"
									size="small"
									bordered
									adaptive={false}
									scroll={{ x: "max-content", y: "calc(100vh - 280px)" }}
									searchSchema={[]}
									pagination={false}
									columnEmptyText=""
								/>
							) : (
								<div style={{ textAlign: "center", padding: 48, color: "#999" }}>
									{selectedKey ? "暂无数据" : "请选择左侧指标"}
								</div>
							)}
						</div>
					</div>
				</Spin>
			</Drawer>
		</>
	);
}

export { AdjustHistoryDrawer };
export default AdjustHistoryDrawer;
