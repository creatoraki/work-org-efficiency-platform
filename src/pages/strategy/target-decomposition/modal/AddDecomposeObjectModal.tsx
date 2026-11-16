import { addDisassembleObjects, fetchDataDimOepOrgList } from "#src/api/strategy";
import { fetchDataDimOepOrg } from "#src/api/strategy/target-filling";
import { useGlobalStore } from "#src/store";
import { Button, Empty, Input, List, message, Modal, Radio, Spin, Tree } from "antd";
import React from "react";
import RuleBuilder from "./RuleBuilder";

interface Props {
	open: boolean;
	onClose: (res?: any) => void;
	quickFilterId: string | number;
	customSubmit?: (nodes: any[]) => Promise<boolean>;
	title?: string;
	customFetchTree?: () => Promise<any>;
}

export default function AddDecomposeObjectModal({
	open,
	onClose,
	quickFilterId,
	customSubmit,
	title,
	customFetchTree,
}: Props) {
	const { oepOrgTree, loadOepOrgTree, oepOrgLoading } = useGlobalStore();
	const [mode, setMode] = React.useState<"org" | "quick">("org");
	const [quickFilter, setQuickFilter] = React.useState<string>();
	const [treeData, setTreeData] = React.useState<any[]>([]);
	const [treeLoading, setTreeLoading] = React.useState(false);
	const [expandedKeys, setExpandedKeys] = React.useState<React.Key[]>([]);
	const [searchValue, setSearchValue] = React.useState("");
	const [autoExpandParent, setAutoExpandParent] = React.useState(true);
	const [checkedKeys, setCheckedKeys] = React.useState<React.Key[]>([]);
	const [checkedNodes, setCheckedNodes] = React.useState<any[]>([]);
	// 加载左侧筛选列表
	const [filterOptions, setFilterOptions] = React.useState<any[]>([]);
	const hasLoadedRef = React.useRef(false);

	// 关闭时重置状态
	React.useEffect(() => {
		if (!open) {
			setTreeData([]);
			setCheckedKeys([]);
			setCheckedNodes([]);
			setSearchValue("");
			setExpandedKeys([]);
			hasLoadedRef.current = false;
		}
	}, [open]);

	React.useEffect(() => {
		const loadFilterOptions = async () => {
			try {
				const res = await fetchDataDimOepOrgList();
				if (res) {
					let options: any[] = [];
					if (Array.isArray(res)) {
						options = res.map((item: any) => ({
							label: item.name || item.label || item.dimensionName,
							value: item.id || item.value || item.dimensionId,
						}));
					} else if (typeof res === "object") {
						options = Object.entries(res).map(([key, value]) => ({
							label: value,
							value: key,
						}));
					}
					setFilterOptions(options);
				}
			} catch (e) {
				console.error("loadFilterOptions failed", e);
			}
		};
		loadFilterOptions();
	}, []);

	// 监听 mode 变化加载中间树数据（只加载一次，不再依赖 quickFilter）
	React.useEffect(() => {
		if (!open || mode !== "org") return;

		const loadData = async () => {
			if (customFetchTree) {
				// 如果树数据已经存在，就不重新加载
				if (hasLoadedRef.current) return;

				setTreeLoading(true);
				try {
					const res = await customFetchTree();
					hasLoadedRef.current = true;

					// 其他维度树的数据处理逻辑
					const processNodes = (nodes: any[]): any[] => {
						return nodes.map((node) => ({
							...node,
							title: node.name || node.title, // 确保 title 存在
							key: node.id || node.key, // 确保 key 存在
							disableCheckbox: node.canChoose === false,
							children: Array.isArray(node.children)
								? processNodes(node.children)
								: [],
						}));
					};

					let data: any[] = [];
					if (Array.isArray(res)) {
						data = res;
					} else if (res && typeof res === "object") {
						if (Array.isArray(res.children)) {
							// 有些接口返回 { children: [...] } 结构
							if (res.name || res.title || res.label || res.id || res.key) {
								data = [res];
							} else {
								data = res.children;
							}
						} else if (Object.keys(res).length > 0) {
							data = [res];
						}
					}

					const processedData = processNodes(data);
					setTreeData(processedData);
					if (processedData.length > 0) {
						setExpandedKeys([processedData[0].key]);
					}
				} catch (error) {
					console.error("Load tree data failed:", error);
					setTreeData([]);
				} finally {
					setTreeLoading(false);
				}
			} else {
				if (oepOrgTree.length === 0) {
					loadOepOrgTree();
				}
			}
		};

		loadData();
	}, [open, mode, customFetchTree]); // 移除 quickFilter 依赖

	React.useEffect(() => {
		if (!customFetchTree && mode === "org" && open) {
			setTreeData(oepOrgTree);
			if (oepOrgTree.length > 0 && expandedKeys.length === 0) {
				setExpandedKeys([oepOrgTree[0].key]);
			}
		}
	}, [oepOrgTree, customFetchTree, mode, open]);

	// 监听 quickFilter 变化，调用 fetchReferenceTargetOrg 并自动勾选
	React.useEffect(() => {
		if (!open || mode !== "org" || !quickFilter || treeData.length === 0) return;

		const autoCheck = async () => {
			setTreeLoading(true);
			try {
				const res: any = await fetchDataDimOepOrg({
					quickFilterId: quickFilter,
					pageNum: 1,
					pageSize: 500,
				});

				const list = res;
				const ids = list.map((item: any) => String(item)); // 假设返回对象包含 targetOrgId 或 id

				// 在 treeData 中查找对应的节点
				const foundNodes: any[] = [];
				const idSet = new Set(ids);

				const traverse = (nodes: any[]) => {
					for (const node of nodes) {
						if (idSet.has(String(node.key))) {
							// 过滤掉不可选中的节点
							if (!node.disableCheckbox) {
								foundNodes.push(node);
							}
						}
						if (node.children) {
							traverse(node.children);
						}
					}
				};
				traverse(treeData);

				const validIds = foundNodes.map((n) => String(n.key));
				setCheckedKeys(validIds);
				setCheckedNodes(foundNodes);
			} catch (e) {
				console.error("fetchReferenceTargetOrg failed", e);
			} finally {
				setTreeLoading(false);
			}
		};

		autoCheck();
	}, [quickFilter, open, mode, treeData]); // 依赖 treeData 确保树加载完后再勾选

	React.useEffect(() => {
		if (!open) {
			setCheckedKeys([]);
			setCheckedNodes([]);
			setQuickFilter(undefined);
			setSearchValue("");
			setExpandedKeys([]);
			setAutoExpandParent(true);
		}
	}, [open]);

	const onCheck = (checked: any, info: any) => {
		// checkStrictly mode returns { checked: [], halfChecked: [] }
		const currentCheckedKeys = checked.checked || checked;

		// 如果正在搜索，需要合并隐藏的已选节点
		if (searchValue) {
			// 1. 获取当前展示的所有节点 Key
			const visibleKeys = new Set<React.Key>();
			const traverse = (nodes: any[]) => {
				nodes.forEach((node) => {
					visibleKeys.add(node.key);
					if (node.children) {
						traverse(node.children);
					}
				});
			};
			traverse(displayTreeData);

			// 2. 找出之前已选但现在被隐藏的节点
			const hiddenCheckedKeys = checkedKeys.filter((k) => !visibleKeys.has(k));

			// 3. 合并
			const finalKeys = [...hiddenCheckedKeys, ...currentCheckedKeys];
			setCheckedKeys(finalKeys);

			// 4. 更新 checkedNodes (需要从完整 treeData 中查找)
			const finalNodes: any[] = [];
			const findNodes = (nodes: any[]) => {
				nodes.forEach((node) => {
					if (finalKeys.includes(node.key)) {
						finalNodes.push(node);
					}
					if (node.children) {
						findNodes(node.children);
					}
				});
			};
			findNodes(treeData);
			setCheckedNodes(finalNodes);
		} else {
			setCheckedKeys(currentCheckedKeys);
			setCheckedNodes(info.checkedNodes);
		}
	};

	const handleRemove = (key: React.Key) => {
		const newKeys = checkedKeys.filter((k) => k !== key);
		setCheckedKeys(newKeys);
		setCheckedNodes((prev) => prev.filter((n) => (n.key || n.id) !== key));
	};

	const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { value } = e.target;
		setSearchValue(value);
		if (!value) {
			return;
		}

		const keys = new Set<React.Key>();
		const dfs = (nodes: any[], parents: React.Key[] = []) => {
			for (const n of nodes || []) {
				const key = n.key;
				const title = String(n.title || n.name || "");
				if (title.includes(value)) {
					parents.forEach((p) => keys.add(p));
				}
				if (n.children) {
					dfs(n.children, [...parents, key]);
				}
			}
		};
		dfs(treeData);
		setExpandedKeys(Array.from(keys));
		setAutoExpandParent(true);
	};

	const onExpand = (newExpandedKeys: React.Key[]) => {
		setExpandedKeys(newExpandedKeys);
		setAutoExpandParent(false);
	};

	const titleRender = (node: any) => {
		const title = node.title || node.name || "";
		if (!searchValue) return title;
		const index = title.indexOf(searchValue);
		if (index > -1) {
			const before = title.substring(0, index);
			const after = title.substring(index + searchValue.length);
			return (
				<span>
					{before}
					<span style={{ color: "#f50" }}>{searchValue}</span>
					{after}
				</span>
			);
		}
		return title;
	};

	const [confirmLoading, setConfirmLoading] = React.useState(false);

	const handleOk = async () => {
		if (mode === "org" && checkedNodes.length === 0) {
			message.warning("请选择拆解对象");
			return;
		}

		setConfirmLoading(true);
		try {
			if (customSubmit) {
				const success = await customSubmit(checkedNodes);
				if (success) {
					onClose({ saved: true });
				}
			} else {
				const targetOrgConfig: Record<string, string> = {};
				checkedNodes.forEach((node) => {
					const key = node.key || node.id;
					const title = node.title || node.name;
					if (key && title) {
						targetOrgConfig[key] = title;
					}
				});

				const targetOrgDesc = Object.values(targetOrgConfig).join("、");

				const payload = {
					effTaskIndicatorConfDetailsId: quickFilterId, // 这里的 quickFilterId 实际上是 effTaskIndicatorConfDetailsId
					quickFilterId: quickFilter === "dept" ? 0 : quickFilter,
					retrievalMethod: mode === "org" ? 0 : 1,
					targetOrgDesc,
					targetOrgConfig,
					targetOrgCount: checkedNodes.length,
					// countUpdateTime: new Date().toISOString() // 后端可能自动生成
				};

				const res = await addDisassembleObjects(payload);
				if (res) {
					onClose({
						saved: true,
						mode,
						selected: mode === "org" ? checkedNodes : [],
					});
				} else {
					message.error("保存失败");
				}
			}
		} catch (e) {
			console.error(e);
			message.error("保存失败");
		} finally {
			setConfirmLoading(false);
		}
	};

	const handleCancel = () => {
		setCheckedKeys([]);
		setCheckedNodes([]);
		setQuickFilter(undefined);
		setSearchValue("");
		setExpandedKeys([]);
		setAutoExpandParent(true);
		onClose();
	};

	const displayTreeData = React.useMemo(() => {
		if (!searchValue) return treeData;

		const loop = (data: any[]): any[] => {
			const result: any[] = [];
			data.forEach((item) => {
				const strTitle = String(item.title || item.name || "");
				const index = strTitle.indexOf(searchValue);
				const match = index > -1;

				if (item.children && item.children.length > 0) {
					const children = loop(item.children);
					if (match || children.length > 0) {
						result.push({ ...item, children });
					}
				} else if (match) {
					result.push({ ...item });
				}
			});
			return result;
		};
		return loop(treeData);
	}, [searchValue, treeData]);

	return (
		<Modal
			title={title || "新增拆解对象"}
			open={open}
			onOk={handleOk}
			confirmLoading={confirmLoading}
			onCancel={handleCancel}
			width={900}
			centered
			destroyOnHidden
		>
			<div className="px-4 py-3">
				<Radio.Group value={mode} onChange={(e) => setMode(e.target.value)}>
					<Radio value="org">组织架构</Radio>
					{/* {!customFetchTree && <Radio value="quick">标签圈选</Radio>} */}
				</Radio.Group>
			</div>

			<div className="h-[500px]">
				{mode === "org" ? (
					<div className="flex h-full">
						{/* Left: Quick Filter */}
						<div className="mr-4 w-[250px] rounded-lg border border-gray-200">
							<div className="mb-3 rounded-t-lg bg-gray-50 p-3 font-medium text-gray-700">
								快速筛选
							</div>
							<Radio.Group
								value={quickFilter}
								onChange={(e) => setQuickFilter(e.target.value)}
								className="flex flex-col gap-3 p-3"
							>
								{filterOptions.map((opt) => (
									<Radio key={opt.value} value={opt.value}>
										{opt.label}
									</Radio>
								))}
							</Radio.Group>
						</div>

						{/* Middle & Right Container */}
						<div className="flex flex-1 overflow-hidden rounded-lg border border-gray-200">
							{/* Middle: Tree */}
							<div className="flex min-w-0 flex-1 flex-col border-r border-gray-200 p-3">
								<Input.Search
									placeholder="搜索"
									className="mb-3"
									allowClear
									onChange={handleSearch}
								/>
								<div className="flex-1 overflow-auto">
									<Spin
										spinning={
											treeLoading || (!customFetchTree && oepOrgLoading)
										}
									>
										{treeData.length > 0 ? (
											<Tree
												checkable
												checkStrictly
												treeData={displayTreeData}
												fieldNames={{
													title: "title",
													key: "key",
													children: "children",
												}}
												checkedKeys={checkedKeys}
												onCheck={onCheck}
												expandedKeys={expandedKeys}
												onExpand={onExpand}
												autoExpandParent={autoExpandParent}
												titleRender={titleRender}
												height={420}
												blockNode
											/>
										) : (
											<div className="flex h-full items-center justify-center pt-20">
												<Empty
													description="暂无数据"
													image={Empty.PRESENTED_IMAGE_SIMPLE}
												/>
											</div>
										)}
									</Spin>
								</div>
							</div>

							{/* Right: Selected */}
							<div className="flex w-64 flex-col bg-white p-3">
								<div className="mb-3 flex items-center justify-between">
									<span className="font-medium">
										已选 ({checkedNodes.length})
									</span>
									<Button
										type="link"
										size="small"
										onClick={() => {
											setCheckedKeys([]);
											setCheckedNodes([]);
										}}
										disabled={checkedNodes.length === 0}
									>
										清空
									</Button>
								</div>
								<div className="flex-1 overflow-auto">
									{checkedNodes.length === 0 ? (
										<Empty
											description="未选择任何对象"
											image={Empty.PRESENTED_IMAGE_SIMPLE}
										/>
									) : (
										<List
											split={false}
											dataSource={checkedNodes}
											renderItem={(node: any) => (
												<List.Item
													style={{
														background: "#f0f2f5",
														borderRadius: 6,
														padding: "8px 12px",
														marginBottom: 8,
													}}
												>
													<div className="flex w-full items-center justify-between">
														<span
															className="flex-1 truncate text-sm font-semibold"
															title={node.title || node.name}
														>
															{node.title || node.name}
														</span>
														<Button
															type="text"
															size="small"
															onClick={() =>
																handleRemove(node.key || node.id)
															}
															className="ml-2 text-gray-500 hover:text-red-500"
														>
															X
														</Button>
													</div>
												</List.Item>
											)}
										/>
									)}
								</div>
							</div>
						</div>
					</div>
				) : (
					<div className="h-full bg-white p-4">
						<RuleBuilder />
					</div>
				)}
			</div>
		</Modal>
	);
}
