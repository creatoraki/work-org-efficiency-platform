import type { ChildIndicatorSummary } from "#src/api/strategy/target-filling";
import type { Row } from "../types";
import {
	fetchChildIndicatorSummary,
	fetchSubmitUserIndicatorDetailById,
	fetchSubmitUserIndicatorDetailUpperRight,
	fetchSubmitUserIndicatorListChildDoubleCounting,
	fetchSubmitUserIndicatorPageChild,
	fetchSubmitUserIndicatorPageChildTable,
} from "#src/api/strategy/target-filling";
import { useEffect, useRef, useState } from "react";
import { countDescendants, deduplicateNodes, processTreeData } from "../utils";

/**
 * 子级表格数据管理 Hook
 */
export function useChildTableData(
	selectedKey: string | null,
	isRootSelected: boolean,
	childReloadSignal: number,
) {
	const [childTableData, setChildTableData] = useState<Row[]>([]);
	const [childTableLoading, setChildTableLoading] = useState(false);
	const [hasMore, setHasMore] = useState(true);
	const [childTableParams, setChildTableParams] = useState({ pageNum: 1, pageSize: 10 });
	const [aFetchedCount, setAFetchedCount] = useState(0);
	const [summaryData, setSummaryData] = useState<ChildIndicatorSummary | null>(null);
	const [basicIndicatorConfigs, setBasicIndicatorConfigs] = useState<any[]>([]);
	const [periodConfigs, setPeriodConfigs] = useState<any[]>([]);
	const [indicatorUnitName, setIndicatorUnitName] = useState<string>("");
	const [doubleCountingList, setDoubleCountingList] = useState<Row[]>([]);

	const selectedKeyRef = useRef<string | null>(null);
	const loadingRef = useRef(false);
	const prevReloadSignal = useRef(childReloadSignal);
	const doubleCountingRef = useRef<Row[]>([]);

	// 处理单元格变更
	const handleChildTableChange = (
		val: any,
		id: string | number,
		key: string,
		periodCode?: number,
		basicIndicatorId?: number,
	) => {
		const updateList = (list: Row[]): Row[] => {
			return list.map((item) => {
				if (item.id === id) {
					if (basicIndicatorId !== undefined) {
						const newBasic = { ...(item.basicIndicator || {}) };
						if (newBasic[basicIndicatorId]) {
							newBasic[basicIndicatorId] = {
								...newBasic[basicIndicatorId],
								value: val,
							};
						}
						return { ...item, basicIndicator: newBasic };
					}
					if (periodCode !== undefined) {
						const newMap = { ...(item.periodicReporting || {}) };
						const entryKey = Object.keys(newMap).find(
							(k) => newMap[k]?.periodCode === periodCode,
						);
						if (entryKey) {
							newMap[entryKey] = { ...newMap[entryKey], resultValue: val };
						}
						return { ...item, periodicReporting: newMap };
					}
					return { ...item, [key]: val };
				}
				if (item.children && Array.isArray(item.children)) {
					return { ...item, children: updateList(item.children) };
				}
				return item;
			});
		};
		setChildTableData((prev) => updateList(prev));
	};

	// 刷新单行数据
	const refreshRow = async (recordId: string | number) => {
		const currentKey = selectedKeyRef.current || selectedKey;
		if (!currentKey) return;

		try {
			const [detailRes, summaryRes, upperRes] = await Promise.all([
				fetchSubmitUserIndicatorDetailById(recordId),
				fetchChildIndicatorSummary(currentKey),
				fetchSubmitUserIndicatorDetailUpperRight(currentKey),
			]);

			const data = detailRes?.data;
			if (data) {
				const list = [data as any];
				const processedList = processTreeData(list);
				countDescendants(processedList);
				const newItem = processedList[0];

				setChildTableData((prev) => {
					const updateNodes = (nodes: Row[]): Row[] => {
						return nodes.map((node) => {
							if (node.id === newItem.id) {
								return {
									...newItem,
									key: node.key,
									children: node.children,
									treeElement: node.treeElement,
								};
							}
							if (node.children && node.children.length > 0) {
								return { ...node, children: updateNodes(node.children) };
							}
							return node;
						});
					};
					return updateNodes(prev);
				});
			}

			if (summaryRes?.code === 200) {
				setSummaryData(summaryRes.data);
			}

			return (upperRes as any)?.data;
		} catch (e) {
			console.error("refreshRow failed", e);
		}
	};

	// 加载子表格数据
	useEffect(() => {
		if (!selectedKey || isRootSelected) {
			if (childTableParams.pageNum !== 1) {
				setChildTableParams((p) => ({ ...p, pageNum: 1 }));
			}
			setChildTableData([]);
			return;
		}

		const isKeyChanged = selectedKey !== selectedKeyRef.current;
		const isReload = childReloadSignal !== prevReloadSignal.current;

		if (isKeyChanged || isReload) {
			if (isKeyChanged) selectedKeyRef.current = selectedKey;
			if (isReload) prevReloadSignal.current = childReloadSignal;

			setChildTableParams((p) => ({ ...p, pageNum: 1 }));
			setChildTableData([]);
			setHasMore(true);
			setAFetchedCount(0);
			setDoubleCountingList([]);
			doubleCountingRef.current = [];
		}

		const currentPage = childTableParams.pageNum;
		setChildTableLoading(true);
		loadingRef.current = true;

		// 获取动态列配置
		fetchSubmitUserIndicatorPageChildTable(selectedKey).then((res: any) => {
			if (res?.data) {
				const { unit, basic, period } = res.data;
				setBasicIndicatorConfigs(basic || []);
				setPeriodConfigs(period || []);
				setIndicatorUnitName(unit || "");
			}
		});

		// 获取汇总数据
		fetchChildIndicatorSummary(selectedKey)
			.then((res: any) => {
				if (res?.code === 200) {
					setSummaryData(res.data);
				} else {
					setSummaryData(null);
				}
			})
			.catch((e) => {
				console.error("fetchChildIndicatorSummary failed", e);
				setSummaryData(null);
			});

		// 获取表格数据（A:分页） + 前置双算列表（B:全量）并发
		const shouldFetchDoubleCounting =
			currentPage === 1 && doubleCountingRef.current.length === 0;
		Promise.all([
			fetchSubmitUserIndicatorPageChild({
				id: selectedKey,
				pageNum: currentPage,
				pageSize: childTableParams.pageSize,
			}),
			shouldFetchDoubleCounting
				? fetchSubmitUserIndicatorListChildDoubleCounting({ id: Number(selectedKey) })
				: Promise.resolve({ data: doubleCountingRef.current }),
		])
			.then(([pageRes, doubleRes]: any[]) => {
				const listA = pageRes?.data
					? Array.isArray(pageRes.data)
						? pageRes.data
						: pageRes.data.list || []
					: [];
				const listB = doubleRes?.data
					? Array.isArray(doubleRes.data)
						? doubleRes.data
						: doubleRes.data.list || []
					: [];

				// 检查是否到达末尾（仅基于 A 分页）
				const total = pageRes?.data?.total || 0;
				const currentFetchedCount =
					(currentPage - 1) * childTableParams.pageSize + listA.length;
				if (
					listA.length < childTableParams.pageSize ||
					(total > 0 && currentFetchedCount >= total)
				) {
					setHasMore(false);
				} else {
					setHasMore(true);
				}

				const processedA = processTreeData(listA);
				countDescendants(processedA);

				let processedB = doubleCountingRef.current;
				if (shouldFetchDoubleCounting) {
					processedB = processTreeData(listB);
					countDescendants(processedB);
					setDoubleCountingList(processedB);
					doubleCountingRef.current = processedB;
				}

				setChildTableData((prev) => {
					const bList = doubleCountingRef.current || [];
					if (currentPage === 1) {
						setAFetchedCount(processedA.length);
						return [...processedA, ...bList];
					}

					const prevWithoutB = bList.length ? prev.slice(0, -bList.length) : prev;
					const uniqueNewNodes = deduplicateNodes(prevWithoutB, processedA);
					const mergedA = [...prevWithoutB, ...uniqueNewNodes];
					setAFetchedCount(mergedA.length);
					return [...mergedA, ...bList];
				});
			})
			.finally(() => {
				setChildTableLoading(false);
				loadingRef.current = false;
			});
	}, [selectedKey, isRootSelected, childTableParams.pageNum, childReloadSignal]);

	return {
		childTableData,
		setChildTableData,
		childTableLoading,
		hasMore,
		childTableParams,
		setChildTableParams,
		aFetchedCount,
		summaryData,
		basicIndicatorConfigs,
		periodConfigs,
		indicatorUnitName,
		doubleCountingList,
		handleChildTableChange,
		refreshRow,
		loadingRef,
	};
}
