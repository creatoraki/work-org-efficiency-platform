import {
	fetchSubmitUserIndicatorDetailUpperRight,
	fetchSubmitUserIndicatorPageChildNotSubmitted,
	fetchSubmitUserIndicatorPageChildTable,
	fetchSubmitUserIndicatorTree,
} from "#src/api/strategy/target-filling";
import Icon1 from "#src/assets/small-icons/target-filling/sub-1.svg?react";
import Icon2 from "#src/assets/small-icons/target-filling/sub-2.svg?react";
import Icon3 from "#src/assets/small-icons/target-filling/sub-3.svg?react";
import Icon4 from "#src/assets/small-icons/target-filling/sub-4.svg?react";
import Icon5 from "#src/assets/small-icons/target-filling/sub-5.svg?react";
import { addThousand } from "#src/utils/add-thousand";
import { MinusOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Drawer, Input, Space, Table, Tree } from "antd";
import React, { useEffect, useMemo, useState } from "react";
import { commonDrawerProps } from "../../target-management/constants/base";

interface Props {
	open: boolean;
	onClose: () => void;
	onCommit?: (selectedMap: Record<string, React.Key[]>) => void;
	effTaskIndicatorSubmitUserId?: string | number;
	defaultSelectedKey?: string | number | null;
	initialSelectedChildIdsMap?: Record<string, React.Key[]>;
	limitIndicatorIds?: string[];
}

export default function DataQuantityDrawer({
	open,
	onClose,
	onCommit,
	effTaskIndicatorSubmitUserId,
	defaultSelectedKey,
	initialSelectedChildIdsMap,
	limitIndicatorIds,
}: Props) {
	const [treeData, setTreeData] = useState<any[]>([]);
	const [selectedKey, setSelectedKey] = useState<string | null>(null);
	const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
	const [search, setSearch] = useState("");

	// Boxes
	const [boxHeight] = useState<number>(66);
	const [fieldObj, setFieldObj] = useState<string>("");
	const [fieldSubLeft, setFieldSubLeft] = useState<string>("");
	const [fieldIndicator, setFieldIndicator] = useState<string>("");
	const [fieldTarget, setFieldTarget] = useState<string>("");
	const [fieldGap, setFieldGap] = useState<string>("");
	const [fieldGapDesc, setFieldGapDesc] = useState<string>("");
	const [, setCheckStatus] = useState<boolean>(false);

	// Table
	const [tableData, setTableData] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);
	const [dynamicChildColumns, setDynamicChildColumns] = useState<any[]>([]);
	const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]);
	const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
	// 缓存每个指标的勾选状态: { [indicatorId]: selectedRowKeys[] }
	const [selectionCache, setSelectionCache] = useState<Record<string, React.Key[]>>({});

	const currentUnitName = useMemo(() => {
		if (!selectedKey) return "";
		let name = "";
		for (const dept of treeData) {
			const child = (dept.children || []).find((c: any) => c.key === selectedKey);
			if (child) {
				name = child.unitName;
				break;
			}
		}
		return name ? `(${name})` : "";
	}, [selectedKey, treeData]);

	useEffect(() => {
		if (open) {
			if (initialSelectedChildIdsMap) {
				// console.log("DataQuantityDrawer - initialSelectedChildIdsMap:", initialSelectedChildIdsMap);
				setSelectionCache(initialSelectedChildIdsMap);
			} else {
				setSelectionCache({});
			}
		}
	}, [open, initialSelectedChildIdsMap]);

	// 当 selectedKey 变化或 selectionCache 更新时，恢复选中状态
	useEffect(() => {
		if (selectedKey && tableData.length > 0) {
			const cached = selectionCache[selectedKey] || [];
			// console.log("DataQuantityDrawer - restoring selection for key:", selectedKey, "cached:", cached);
			// console.log('DataQuantityDrawer - tableData sample IDs:', tableData.slice(0, 3).map(item => ({ id: item.id, type: typeof item.id })));
			// 确保 selectedRowKeys 的类型与 tableData 中的 id 类型一致
			const normalizedKeys = cached.map((key) => {
				// 如果 tableData 中第一个 id 是数字，则换为数字；否则保持字符串
				if (tableData.length > 0 && typeof tableData[0].id === "number") {
					return typeof key === "string" ? Number(key) : key;
				}
				return key;
			});
			// console.log('DataQuantityDrawer - normalized selectedRowKeys:', normalizedKeys);
			setSelectedRowKeys(normalizedKeys);
		}
	}, [selectedKey, selectionCache, tableData]);

	// 当勾选变化时，更新缓存
	const handleSelectionChange = (keys: React.Key[]) => {
		setSelectedRowKeys(keys);
		if (selectedKey) {
			setSelectionCache((prev) => ({
				...prev,
				[selectedKey]: keys,
			}));
		}
	};

	// Load Tree
	useEffect(() => {
		if (open && effTaskIndicatorSubmitUserId) {
			fetchSubmitUserIndicatorTree(effTaskIndicatorSubmitUserId).then((res: any) => {
				let filteredRes = res || [];
				if (limitIndicatorIds && limitIndicatorIds.length > 0) {
					filteredRes = filteredRes
						.map((dept: any) => {
							const filteredChildren = (dept.innerDetailList || []).filter(
								(item: any) => limitIndicatorIds.includes(String(item.id)),
							);
							if (filteredChildren.length > 0) {
								return { ...dept, innerDetailList: filteredChildren };
							}
							return null;
						})
						.filter(Boolean);
				}

				const formatted = filteredRes.map((dept: any, index: number) => ({
					title: dept.responsibleDepartment,
					key: `dept-${index}-${dept.responsibleDepartment}`,
					selectable: false,
					children: (dept.innerDetailList || []).map((item: any) => ({
						title: item.name,
						key: String(item.id),
						...item,
					})),
					...dept,
				}));
				setTreeData(formatted);

				if (defaultSelectedKey) {
					const keyStr = String(defaultSelectedKey);
					setSelectedKey(keyStr);
					// Find parent to expand
					const parent = formatted.find(
						(d: any) =>
							d.children && d.children.some((c: any) => String(c.key) === keyStr),
					);
					if (parent) {
						setExpandedKeys([parent.key]);
					}
				} else if (formatted.length > 0) {
					// Select first leaf node if available
					setExpandedKeys([formatted[0].key]);
					if (formatted[0].children && formatted[0].children.length > 0) {
						setSelectedKey(String(formatted[0].children[0].key));
					}
				}
			});
		}
	}, [open, effTaskIndicatorSubmitUserId, defaultSelectedKey, limitIndicatorIds]);

	// Search Tree
	useEffect(() => {
		if (!search) return;
		const keys = new Set<React.Key>();
		const dfs = (nodes: any[], parents: React.Key[] = []) => {
			let foundAny = false;
			for (const n of nodes || []) {
				const key = n.key;
				const title = String(n.title || "");
				const childMatched = n.children ? dfs(n.children, [...parents, key]) : false;
				if (title.includes(search) || childMatched) {
					parents.forEach((p) => keys.add(p));
					keys.add(key);
					foundAny = true;
				}
			}
			return foundAny;
		};
		dfs(treeData);
		setExpandedKeys(Array.from(keys));
	}, [search, treeData]);

	// Load Boxes and Columns when selectedKey changes
	useEffect(() => {
		if (selectedKey) {
			// Boxes
			fetchSubmitUserIndicatorDetailUpperRight(selectedKey).then((res: any) => {
				if (res && res.data) {
					const d = res.data;
					setFieldObj(d.targetOrgName || "");
					setFieldSubLeft(String(d.targetOrgNum ?? ""));
					setFieldIndicator(d.indicatorName || "");
					setFieldTarget(String(d.targetValue ?? ""));
					setFieldGap(String(d.targetGap ?? ""));
					setFieldGapDesc(d.gapReason || "");
					setCheckStatus(d.checkStatus);
				}
			});

			// Columns
			fetchSubmitUserIndicatorPageChildTable(selectedKey).then((res: any) => {
				if (res && res.data) {
					const { unit, basic, period } = res.data;
					const newCols = [];
					if (Array.isArray(basic)) {
						newCols.push({
							key: "basic",
							children: basic.map((b: any) => ({
								title: unit ? `${b.name}(${unit})` : b.name,
								key: `basic_${b.id}`,
								width: 140,
								render: (_: any, r: any) => {
									if (r.isSummary) return null;
									const item = r.basicIndicator?.[String(b.id)];
									const val = item?.adjustmentValue ?? item?.value;
									return addThousand(val);
								},
							})),
						});
					}
					if (Array.isArray(period)) {
						newCols.push({
							key: "period",
							children: period.map((p: any) => ({
								title: unit ? `${p.name}(${unit})` : p.name,
								key: `period_${p.id}`,
								width: 140,
								render: (_: any, record: any) => {
									const val = record.periodic?.[p.id];
									if (record.isSummary) {
										return (
											<span style={{ fontWeight: "bold" }}>
												{addThousand(val ?? 0)}
											</span>
										);
									}
									return addThousand(val) ?? "";
								},
							})),
						});
					}
					setDynamicChildColumns(newCols);
				}
			});
		}
	}, [selectedKey]);

	// Load Table Data (Not Submitted)
	useEffect(() => {
		if (open && selectedKey) {
			setLoading(true);
			fetchSubmitUserIndicatorPageChildNotSubmitted({
				id: selectedKey,
			})
				.then((res: any) => {
					const list =
						res && res.data
							? Array.isArray(res.data)
								? res.data
								: res.data.list || []
							: [];
					// console.log("DataQuantityDrawer - table raw data:", list);
					// Process list to add keys if missing, similar to SingleFillingPage
					const processTreeData = (nodes: any[]): any[] => {
						const result: any[] = [];
						nodes.forEach((item) => {
							const node = { ...item };
							if (node.treeElement === 1) {
								if (
									node.children &&
									Array.isArray(node.children) &&
									node.children.length > 0
								) {
									result.push(...processTreeData(node.children));
								}
								return;
							}

							if (
								node.parentSummaryWeight === undefined ||
								node.parentSummaryWeight === null
							) {
								node.parentSummaryWeight = 100;
							}
							if (
								node.children &&
								Array.isArray(node.children) &&
								node.children.length > 0
							) {
								const children = processTreeData(node.children);
								node.children = children.length > 0 ? children : undefined;
							} else {
								node.children = undefined;
							}
							result.push(node);
						});
						return result;
					};
					const processedList = processTreeData(list);
					// console.log("DataQuantityDrawer - processed table data:", processedList);
					setTableData(processedList);

					// Default expand all rows
					const getAllKeys = (nodes: any[]): React.Key[] => {
						let keys: React.Key[] = [];
						nodes.forEach((node) => {
							keys.push(node.id);
							if (node.children) {
								keys = keys.concat(getAllKeys(node.children));
							}
						});
						return keys;
					};
					setExpandedRowKeys(getAllKeys(processedList));
				})
				.finally(() => {
					setLoading(false);
				});
		}
	}, [open, selectedKey]);

	// Construct Columns
	const columns: any[] = useMemo(() => {
		const periodCols = dynamicChildColumns.find((c) => c.key === "period")?.children || [];

		return [
			{
				title: "拆解对象",
				dataIndex: "targetOrgName",
				key: "targetOrgName",
				width: 300,
				fixed: "left",
				render: (v: any, r: any) =>
					r.isSummary ? <span style={{ fontWeight: "bold" }}>{v}</span> : v || "",
			},
			{
				title: "主数据编码",
				dataIndex: "targetOrgCode",
				key: "targetOrgCode",
				width: 120,
				fixed: "left",
				render: (v: any, r: any) => (r.isSummary ? "" : v || ""),
			},
			{
				title: "负责人",
				dataIndex: "responsiblePersonName",
				key: "responsiblePersonName",
				width: 120,
			},
			{
				title: "年度",
				children: [
					{
						title: `年度目标值${currentUnitName}`,
						dataIndex: "annualTargetValue",
						key: "annualTargetValue",
						width: 140,
						render: (v: any, r: any) => {
							if (r.isSummary)
								return <span style={{ fontWeight: "bold" }}>{addThousand(v)}</span>;
							return addThousand(v);
						},
					},
					{
						title: `偏差${currentUnitName}`,
						dataIndex: "deviationValue",
						key: "deviationValue",
						width: 120,
						render: (v: any, r: any) =>
							r.isSummary ? (
								<span style={{ fontWeight: "bold" }}>{addThousand(v)}</span>
							) : (
								addThousand(v)
							),
					},
				],
			},
			...(periodCols.length > 0 ? periodCols : []),
			{
				title: "备注",
				dataIndex: "remarks",
				key: "remarks",
				width: 150,
				render: (v: any, r: any) => (r.isSummary ? "" : v || ""),
			},
			{
				title: "状态",
				dataIndex: "statusStr",
				key: "statusStr",
				width: 100,
				render: (v: any, r: any) => (r.isSummary ? "" : v || ""),
			},
		];
	}, [dynamicChildColumns, currentUnitName]);

	return (
		<Drawer
			title="数据量"
			width="90%"
			open={open}
			destroyOnHidden
			{...commonDrawerProps(onClose)}
			footer={
				<div style={{ textAlign: "right" }}>
					<Space>
						<Button onClick={onClose}>取消</Button>
						<Button
							type="primary"
							onClick={() => {
								onCommit?.(selectionCache);
								onClose();
							}}
						>
							提交
						</Button>
					</Space>
				</div>
			}
		>
			<div style={{ display: "flex", height: "100%" }}>
				{/* Left Tree */}
				<div
					className="left-tree-wrapper"
					style={{
						width: 240,
						borderRight: "1px solid #f0f0f0",
						paddingRight: 12,
						marginRight: 12,
						display: "flex",
						flexDirection: "column",
					}}
				>
					<Input.Search
						placeholder="搜索组织/计划"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						allowClear
						style={{ marginBottom: 8 }}
					/>
					<div
						className="left-tree-scroll-container"
						style={{ flex: 1, overflow: "auto" }}
					>
						<Tree
							treeData={treeData}
							selectedKeys={selectedKey ? [selectedKey] : []}
							expandedKeys={expandedKeys}
							onExpand={(keys) => setExpandedKeys(keys as React.Key[])}
							onSelect={(keys) => setSelectedKey(keys[0] as string)}
							fieldNames={{ title: "title", key: "key", children: "children" }}
							titleRender={(node) => (
								<div
									title={node.title as string}
									style={{
										overflow: "hidden",
										textOverflow: "ellipsis",
										whiteSpace: "nowrap",
									}}
								>
									{node.title}
								</div>
							)}
						/>
					</div>
				</div>

				{/* Right Content */}
				<div
					style={{
						flex: 1,
						display: "flex",
						flexDirection: "column",
						overflow: "hidden",
					}}
				>
					{/* Boxes */}
					<div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
						{/* Copy boxes from SingleFillingPage but read-only */}
						<div
							style={{
								flex: 1,
								background: "rgba(245,247,250,1)",
								height: boxHeight,
								padding: 8,
								borderRadius: 6,
								display: "flex",
								flexDirection: "column",
								justifyContent: "center",
							}}
						>
							<div
								style={{
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
									fontSize: 14,
									color: "rgba(96,98,102,1)",
								}}
							>
								<span>拆解对象</span>
								<Icon1 />
							</div>
							<div style={{ marginTop: 6, fontSize: 14, fontWeight: 600 }}>
								{fieldObj || "未填写"}
							</div>
						</div>
						<div
							style={{
								flex: 1,
								background: "rgba(245,247,250,1)",
								height: boxHeight,
								padding: 8,
								borderRadius: 6,
								display: "flex",
								flexDirection: "column",
								justifyContent: "center",
							}}
						>
							<div
								style={{
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
									fontSize: 14,
									color: "rgba(96,98,102,1)",
								}}
							>
								<span>拆解子目标</span>
								<Icon2 style={{ transform: "translateY(4px)" }} />
							</div>
							<div style={{ marginTop: 6, fontSize: 14 }}>
								{fieldSubLeft || "未填写"}
							</div>
						</div>
						<div
							style={{
								flex: 1,
								background: "rgba(245,247,250,1)",
								height: boxHeight,
								padding: 8,
								borderRadius: 6,
								display: "flex",
								flexDirection: "column",
								justifyContent: "center",
							}}
						>
							<div
								style={{
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
									fontSize: 14,
									color: "rgba(96,98,102,1)",
								}}
							>
								<span>指标</span>
								<Icon3 />
							</div>
							<div style={{ marginTop: 6, fontSize: 14 }}>
								{fieldIndicator || "未填写"}
							</div>
						</div>
						<div
							style={{
								flex: 1,
								background: "rgba(245,247,250,1)",
								height: boxHeight,
								padding: 8,
								borderRadius: 6,
								display: "flex",
								flexDirection: "column",
								justifyContent: "center",
							}}
						>
							<div
								style={{
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
									fontSize: 14,
									color: "rgba(96,98,102,1)",
								}}
							>
								<span>
									目标值
									{currentUnitName}
								</span>
								<Icon4 />
							</div>
							<div style={{ marginTop: 6, fontSize: 14 }}>{fieldTarget || "0"}</div>
						</div>
						<div
							style={{
								flex: 1,
								background: "rgba(245,247,250,1)",
								height: boxHeight,
								padding: 8,
								borderRadius: 6,
								display: "flex",
								flexDirection: "column",
								justifyContent: "center",
							}}
						>
							<div
								style={{
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
									fontSize: 14,
									color: "rgba(96,98,102,1)",
								}}
							>
								<span>
									缺口
									{currentUnitName}
								</span>
								<Icon5 />
							</div>
							<div style={{ marginTop: 6, fontSize: 14, color: "red" }}>
								{addThousand(fieldGap)}
							</div>
						</div>
						<div
							style={{
								flex: 1,
								background: "rgba(245,247,250,1)",
								height: boxHeight,
								padding: 8,
								borderRadius: 6,
								display: "flex",
								flexDirection: "column",
								justifyContent: "center",
							}}
						>
							<div
								style={{
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
									fontSize: 14,
									color: "rgba(96,98,102,1)",
								}}
							>
								<span>缺口说明</span>
							</div>
							<div style={{ marginTop: 6, fontSize: 14 }}>{fieldGapDesc || ""}</div>
						</div>
					</div>

					{/* Table */}
					<div style={{ flex: 1, overflow: "hidden" }}>
						<style>
							{`
                                .red-header-table .ant-table-thead > tr > th {
                                    border-color: rgba(228, 231, 237, 1) !important;
                                }
                            `}
						</style>
						<Table
							className="red-header-table"
							columns={columns}
							dataSource={tableData}
							loading={loading}
							rowKey="id"
							size="small"
							bordered
							rowSelection={{
								selectedRowKeys,
								onChange: handleSelectionChange,
								checkStrictly: true,
							}}
							pagination={false}
							scroll={{ x: "max-content", y: 500 }}
							expandable={{
								expandedRowKeys,
								onExpandedRowsChange: (keys) =>
									setExpandedRowKeys(keys as React.Key[]),
								expandIcon: ({ expanded, onExpand, record }: any) => {
									if (!record.children || record.children.length === 0) {
										return (
											<span
												style={{
													display: "inline-block",
													width: 24,
													marginRight: 8,
												}}
											/>
										);
									}
									return (
										<div
											onClick={(e) => onExpand(record, e)}
											style={{
												display: "inline-flex",
												alignItems: "center",
												justifyContent: "center",
												width: 16,
												height: 16,
												border: "1px solid #d9d9d9",
												borderRadius: 2,
												cursor: "pointer",
												marginRight: 16,
												backgroundColor: "#fff",
												verticalAlign: "middle",
											}}
										>
											{expanded ? (
												<MinusOutlined
													style={{
														fontSize: 10,
														color: "rgba(0,0,0,0.85)",
													}}
												/>
											) : (
												<PlusOutlined
													style={{
														fontSize: 10,
														color: "rgba(0,0,0,0.85)",
														strokeWidth: 40,
														stroke: "currentColor",
													}}
												/>
											)}
										</div>
									);
								},
							}}
						/>
					</div>
				</div>
			</div>
		</Drawer>
	);
}
