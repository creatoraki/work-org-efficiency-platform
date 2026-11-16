import {
	fetchIndicatorSubmitUserViewData,
	fetchIndicatorSubmitUserViewDataHead,
	fetchIndicatorSubmitUserViewDataIndicatorName,
} from "#src/api/strategy/target-filling";
import {
	fetchTargetPlanViewData,
	fetchTargetPlanViewDataHead,
	fetchTargetPlanViewDataHeadSelectIndicatorId,
} from "#src/api/strategy/target-plan";
import { useGlobalStore } from "#src/store";
import { Col, Drawer, Input, Row, Tree } from "antd";
import React from "react";
import SearchableTable from "../../../../components/searchable-table";
import { commonDrawerProps } from "../constants/base";

interface Plan {
	id: string | number;
	name: string;
	effTaskIndicatorSubmitUserId?: string | number;
	effTaskIndicatorSubmitIndicatorListId?: string | number;
	[key: string]: any;
}

export default function PlanViewDataDrawer({
	open,
	onClose,
	record,
	type,
}: {
	open: boolean;
	record?: Plan | null;
	onClose: (res?: any) => void;
	type?: number;
}) {
	const [selectedOrg, setSelectedOrg] = React.useState<any>(null);
	const [treeSearch, setTreeSearch] = React.useState("");
	const [expandedKeys, setExpandedKeys] = React.useState<string[]>([]);
	const [dynamicColumns, setDynamicColumns] = React.useState<any[]>([]);
	const [indicatorNames, setIndicatorNames] = React.useState<{ label: string; value: string }[]>(
		[],
	);
	const [reloadSignal, setReloadSignal] = React.useState(0);

	const normalizeChildren = React.useCallback((rows: any[]): any[] => {
		return rows.map((row) => {
			if (Array.isArray(row.children)) {
				if (row.children.length === 0) {
					const { children, ...rest } = row;
					return rest;
				}
				return { ...row, children: normalizeChildren(row.children) };
			}
			return row;
		});
	}, []);

	const { oepOrgTree, loadOepOrgTree } = useGlobalStore();

	React.useEffect(() => {
		if (open) {
			loadOepOrgTree().catch(() => {
				/* ignore */
			});
		}
	}, [open, loadOepOrgTree]);

	// 默认不选中任何节点

	const filterTree = React.useCallback((nodes: any[], term: string): any[] => {
		if (!term) return nodes;
		const lower = term.toLowerCase();
		const res: any[] = [];
		for (const node of nodes) {
			const title = String(node.title || "").toLowerCase();
			const children = node.children ? filterTree(node.children, term) : [];
			if (title.includes(lower) || (children && children.length > 0)) {
				res.push({ ...node, children: children.length ? children : undefined });
			}
		}
		return res;
	}, []);

	const filteredTree = React.useMemo(
		() => filterTree(oepOrgTree || [], treeSearch.trim()),
		[oepOrgTree, treeSearch, filterTree],
	);

	const autoExpandKeys = React.useMemo(() => {
		const keys: string[] = [];
		const walk = (nodes: any[]) => {
			for (const n of nodes) {
				if (n.children && n.children.length) {
					keys.push(n.key);
					walk(n.children);
				}
			}
		};
		walk(filteredTree);
		return keys;
	}, [filteredTree]);

	React.useEffect(() => {
		if (treeSearch) setExpandedKeys(autoExpandKeys);
	}, [treeSearch, autoExpandKeys]);

	React.useEffect(() => {
		if (
			!treeSearch &&
			(!expandedKeys || expandedKeys.length === 0) &&
			Array.isArray(oepOrgTree) &&
			oepOrgTree.length > 0
		) {
			setExpandedKeys(oepOrgTree.map((n) => String(n.key)));
		}
	}, [oepOrgTree, expandedKeys, treeSearch]);

	React.useEffect(() => {
		if (open && selectedOrg) {
			setReloadSignal((s) => s + 1);
		}
	}, [open, selectedOrg]);

	React.useEffect(() => {
		if (!open) {
			setSelectedOrg(null);
			setTreeSearch("");
			setExpandedKeys([]);
			setDynamicColumns([]);
		}
	}, [open]);

	// Fetch dynamic columns (Head)
	const fetchHead = React.useCallback(
		(indicatorId?: number) => {
			const planId = record?.id;
			if (type === 1) {
				const userId = record?.effTaskIndicatorSubmitUserId || record?.id;
				if (userId) {
					const payload: any = {
						effTaskIndicatorSubmitUserId: userId,
						effTaskIndicatorSubmitIndicatorListId: indicatorId!,
					};
					if (selectedOrg) payload.targetOrgCode = selectedOrg;
					fetchIndicatorSubmitUserViewDataHead(payload).then((res: any) => {
						if (res.code === 200 && res.data) {
							const periods = res.data.periods || [];
							const cols = periods.map((p: any) => ({
								title: p.name,
								dataIndex: ["periodMap", String(p.id)],
								key: `period-${p.id}`,
								width: 120,
								render: (v: number | string, record: any) => {
									return v !== null && v !== undefined && v !== "" && v !== "-"
										? `${v}${record.unitName || ""}`
										: "-";
								},
							}));
							setDynamicColumns(cols);
						}
					});
				}
			} else if (planId) {
				fetchTargetPlanViewDataHead({
					effTargetPlanId: Number(planId),
					indicatorId,
				}).then((res: any) => {
					if (res.code === 200 && res.data) {
						const cols = (res.data || []).map((p: any) => ({
							title: p.name,
							dataIndex: ["periodMap", String(p.id)],
							key: `period-${p.id}`,
							width: 120,
							render: (v: number | string, record: any) => {
								return v !== null && v !== undefined && v !== "" && v !== "-"
									? `${v}${record.unitName || ""}`
									: "-";
							},
						}));
						setDynamicColumns(cols);
					}
				});
			}
		},
		[record, selectedOrg, type],
	);

	// 初始表头由表格首次加载时触发，避免在此处重复调用

	// Fetch indicator names for filter
	React.useEffect(() => {
		const planId = record?.id;
		if (type === 1) {
			const userId = record?.effTaskIndicatorSubmitUserId || record?.id;
			if (userId) {
				fetchIndicatorSubmitUserViewDataIndicatorName({
					effTaskIndicatorSubmitUserId: userId,
				}).then((res: any) => {
					if (res.code === 200 && res.data) {
						const map = res.data || {};
						const options = Object.keys(map).map((key) => ({
							label: map[key],
							value: key,
						}));
						setIndicatorNames(options);
					}
				});
			}
		} else if (planId) {
			fetchTargetPlanViewDataHeadSelectIndicatorId(planId).then((res: any) => {
				if (res.code === 200 && res.data) {
					const options = (res.data || []).map((item: any) => ({
						label: item.name,
						value: item.id,
					}));
					setIndicatorNames(options);
				}
			});
		}
	}, [record, type]);

	const treeSelectData = React.useMemo(() => {
		const mapNode = (n: any) => {
			if (!n) return n;
			const children = Array.isArray(n.children) ? n.children.map(mapNode) : undefined;
			return {
				title: n.title ?? n.label,
				label: n.title ?? n.label,
				value: n.value ?? n.key ?? String(n.key),
				key: n.key ?? n.value ?? String(n.key),
				children,
			};
		};
		return Array.isArray(oepOrgTree) ? oepOrgTree.map(mapNode) : [];
	}, [oepOrgTree]);

	const searchSchema = React.useMemo(
		() => [
			// { name: "target", label: "拆解对象", type: "treeSelect", treeData: treeSelectData, fieldProps: { dropdownStyle: { minWidth: 620 }, showSearch: true, treeDefaultExpandAll: false, allowClear: false } },
			// { name: "mdCode", label: "主数据编码", type: "input" },
			{ name: "metricName", label: "指标名称", type: "select", options: indicatorNames },
			{ name: "owner", label: "负责人", type: "input" },
		],
		[treeSelectData, indicatorNames],
	);

	const fetchData = React.useCallback(
		async (params: any) => {
			if (!open) {
				return { data: [], total: 0 };
			}

			const planId = record?.id;

			if (type === 1) {
				const userId = record?.effTaskIndicatorSubmitUserId || record?.id;
				if (!userId) {
					return { data: [], total: 0 };
				}
				const payload = {
					effTaskIndicatorSubmitUserId: userId,
					responsibleUserName: params.owner,
					effTaskIndicatorSubmitIndicatorListId: params.metricName,
					...params,
				};
				if (selectedOrg) payload.targetOrgCode = selectedOrg;
				delete payload.page;
				delete payload.pageNum;
				delete payload.pageSize;
				delete payload.target;
				delete payload.owner;
				delete payload.metricName;
				delete payload.mdCode;

				fetchHead(params.metricName);

				try {
					const res: any = await fetchIndicatorSubmitUserViewData(payload);
					const rawList = res.data || [];
					const list = normalizeChildren(rawList);
					const total = res.total || list.length || 0;
					return { data: list, total };
				} catch (e) {
					console.error("Fetch view data failed", e);
					return { data: [], total: 0 };
				}
			}

			if (!planId) {
				return { data: [], total: 0 };
			}

			const payload = {
				targetPlanId: Number(planId),
				responsibleUserName: params.owner,
				indicatorId: params.metricName,
				...params,
			};
			if (selectedOrg) payload.targetOrgCode = selectedOrg;
			delete payload.page;
			delete payload.pageNum;
			delete payload.pageSize;
			delete payload.target;
			delete payload.owner;
			delete payload.metricName;
			delete payload.mdCode;
			// 每次查询时更新表头
			fetchHead(params.metricName);

			try {
				const res: any = await fetchTargetPlanViewData({
					...payload,
				});
				// Handle different response structures
				const list = normalizeChildren(res.data || []);
				const total = res.total || list.length || 0;
				return { data: list, total };
			} catch (e) {
				console.error("Fetch view data failed", e);
				return { data: [], total: 0 };
			}
		},
		[selectedOrg, record, type, fetchHead],
	);

	const columns = React.useMemo(
		() => [
			{
				title: "拆解对象",
				dataIndex: "targetOrgName",
				key: "targetOrgName",
				width: 300,
				ellipsis: true,
			},
			{ title: "主数据编码", dataIndex: "targetOrgCode", key: "targetOrgCode", width: 120 },
			{
				title: "指标名称",
				dataIndex: "indicatorName",
				key: "indicatorName",
				width: 160,
				ellipsis: true,
			},
			{
				title: "负责人",
				dataIndex: "responsiblePersonName",
				key: "responsiblePersonName",
				width: 100,
			},
			{
				title: "年度目标值",
				dataIndex: "annualTargetValue",
				key: "annualTargetValue",
				width: 140,
				render: (v: number, record: any) =>
					v !== null && v !== undefined ? `${v}${record.unitName || ""}` : "-",
			},
			...dynamicColumns,
			{
				title: "上级汇总权重(%)",
				dataIndex: "parentSummaryWeight",
				key: "parentSummaryWeight",
				width: 140,
				render: (v: number | string) => {
					return v !== null && v !== undefined && v !== "" && v !== "-"
						? `${v}${"%"}`
						: "-";
				},
			},
			{ title: "提交版本", dataIndex: "submitVersion", key: "submitVersion", width: 140 },
			{ title: "备注", dataIndex: "remarks", key: "remarks", width: 140 },
		],
		[dynamicColumns],
	);

	return (
		<Drawer
			title="查看数据"
			placement="right"
			width={1536}
			open={open}
			{...commonDrawerProps(onClose)}
		>
			<Row gutter={12} style={{ height: "100%" }} className="left-tree-wrapper">
				<Col
					span={4}
					style={{
						border: "1px solid #f0f0f0",
						padding: 12,
						paddingTop: 0,
						overflow: "auto",
						height: "calc(100vh - 150px)",
					}}
				>
					<div
						style={{
							position: "sticky",
							top: 0,
							zIndex: 1,
							background: "#fff",
							paddingBottom: 8,
							paddingTop: 12,
						}}
					>
						<div style={{ marginBottom: 8, fontWeight: 600 }}>组织架构</div>
						<Input.Search
							placeholder="搜索名称"
							allowClear
							onChange={(e) => setTreeSearch(e.target.value)}
							style={{ marginBottom: 8 }}
						/>
					</div>
					<Tree
						treeData={filteredTree}
						onSelect={(keys) => {
							const key = (keys as React.Key[])[0];
							setSelectedOrg(key !== undefined && key !== null ? String(key) : null);
						}}
						selectedKeys={selectedOrg ? [selectedOrg] : []}
						expandedKeys={expandedKeys}
						onExpand={(keys) =>
							setExpandedKeys((keys as React.Key[]).map((k) => String(k)))
						}
					/>
				</Col>
				<Col span={20} style={{ paddingLeft: 12 }}>
					<div style={{ height: "calc(100% - 40px)" }}>
						{open ? (
							<SearchableTable
								key={`${type ?? 0}-${record?.id ?? "empty"}`}
								columns={columns}
								searchSchema={searchSchema}
								fetchData={fetchData}
								pageSize={10}
								reloadSignal={reloadSignal}
								exportConfig={{
									excelId: type === 2 ? 5 : 8,
									extraParams:
										type === 1
											? {
													effTaskIndicatorSubmitUserId:
														record?.effTaskIndicatorSubmitUserId ||
														record?.id,
												}
											: {
													targetPlanId: record?.id,
												},
								}}
								rowKey={(row) => `${row.targetOrgCode}-${row.indicatorName}`}
							/>
						) : null}
					</div>
				</Col>
			</Row>
		</Drawer>
	);
}
