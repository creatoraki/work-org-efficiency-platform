import type { DataNode } from "antd/es/tree";
import { fetchUsersByDeptId } from "#src/api/common/org";
import { useGlobalStore } from "#src/store";
import { modalDiverStyle } from "#src/styles/custom-style";
import { Button, Checkbox, Empty, Input, List, Modal, Spin, Tree } from "antd";
import React from "react";

interface Props {
	open: boolean;
	record?: any;
	onClose: (res?: any) => void;
	titleLabel?: string;
	single?: boolean;
	defaultSelected?: Person[];
	disabledKeys?: string[];
}

interface Person {
	id: string;
	name: string;
	employeeId?: string;
	department?: string;
	orgFullname?: string;
	deptId?: string;
}

const DEFAULT_SELECTED: Person[] = [];
const DEFAULT_DISABLED_KEYS: string[] = [];

export default function PersonCreateModal({
	open,
	titleLabel = "",
	onClose,
	single = false,
	defaultSelected = DEFAULT_SELECTED,
	disabledKeys = DEFAULT_DISABLED_KEYS,
}: Props) {
	const [search, setSearch] = React.useState("");
	const [selectedOrg, setSelectedOrg] = React.useState<string | null>(null);
	// 使用全局 store 存储部门树，避免重复请求
	const deptTree = useGlobalStore((state) => state.deptTree);
	const deptMap = useGlobalStore((state) => state.deptMap);
	const deptLoading = useGlobalStore((state) => state.deptLoading);
	const loadDeptTree = useGlobalStore((state) => state.loadDeptTree);
	const [members, setMembers] = React.useState<Person[]>([]);
	const [membersLoading, setMembersLoading] = React.useState(false);
	const [pageNum, setPageNum] = React.useState<number>(1);
	const pageSize = 50;
	const [hasMore, setHasMore] = React.useState<boolean>(true);
	const listContainerRef = React.useRef<HTMLDivElement | null>(null);
	const abortControllerRef = React.useRef<AbortController | null>(null);
	const [selectedIds, setSelectedIds] = React.useState<Record<string, Person>>({});
	const [memberSearch, setMemberSearch] = React.useState("");
	const [appliedSearch, setAppliedSearch] = React.useState("");

	const defaultSelectedKey = React.useMemo(() => {
		return JSON.stringify(defaultSelected || []);
	}, [defaultSelected]);

	React.useEffect(() => {
		if (!open) {
			setSearch("");
			setMemberSearch("");
			setAppliedSearch("");
			setSelectedOrg(null);
			setSelectedIds({});
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
				abortControllerRef.current = null;
			}
		} else {
			if (defaultSelected && defaultSelected.length > 0) {
				const map: Record<string, Person> = {};
				defaultSelected.forEach((p) => {
					if (p && p.id) map[p.id] = p;
				});
				setSelectedIds(map);
			}
		}
	}, [open, defaultSelectedKey]);

	// 当模态框打开时，触发全局加载部门树（如果尚未加载）
	React.useEffect(() => {
		if (!open) return;
		// loadDeptTree 内部会自行决定是否重复加载
		loadDeptTree().catch((e) => console.error(e));
	}, [open, loadDeptTree]);

	const orgFiltered = React.useMemo(() => {
		if (!search) return deptTree;
		const filterNode = (nodes: DataNode[]): DataNode[] =>
			nodes
				.map((n) => {
					const t = String(n.title || "");
					if (t.includes(search)) return n;
					if (n.children) {
						const c = filterNode(n.children as DataNode[]).filter(Boolean);
						if (c.length) return { ...n, children: c };
					}
					return null as any;
				})
				.filter(Boolean) as DataNode[];
		return filterNode(deptTree);
	}, [search, deptTree]);

	// 当进行树搜索时，自动展开包含匹配节点的所有父节点；同时允许用户手动展开/收缩
	const [expandedKeys, setExpandedKeys] = React.useState<React.Key[]>([]);

	React.useEffect(() => {
		if (!search) {
			if (deptTree && deptTree.length > 0) {
				setExpandedKeys(deptTree.map((node) => node.key));
			} else {
				setExpandedKeys([]);
			}
			return;
		}

		const keys = new Set<React.Key>();

		const dfs = (nodes: DataNode[], parents: React.Key[] = []): boolean => {
			let found = false;
			for (const n of nodes || []) {
				if (!n) continue;
				const key = String(n.key);
				const title = String(n.title || "");
				const childMatched = n.children
					? dfs(n.children as DataNode[], [...parents, key])
					: false;
				if (title.includes(search) || childMatched) {
					// 把父节点也展开
					for (const p of parents) keys.add(p);
					keys.add(key);
					found = true;
				}
			}
			return found;
		};

		dfs(deptTree || []);
		setExpandedKeys(Array.from(keys));
	}, [search, deptTree]);

	const loadPage = React.useCallback(
		async (page: number) => {
			if (!selectedOrg) return;

			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}
			const controller = new AbortController();
			abortControllerRef.current = controller;

			setMembersLoading(true);
			try {
				const resp: any = await fetchUsersByDeptId(
					selectedOrg,
					{
						name: appliedSearch?.trim() || undefined,
						pageNum: page,
						pageSize,
						jobStatus: 1,
					},
					{ signal: controller.signal },
				);
				const data = resp?.data ?? resp;
				let list: any[] = [];
				if (Array.isArray(data)) list = data;
				else if (Array.isArray(data?.list)) list = data.list;
				else if (Array.isArray(resp?.list)) list = resp.list;
				const mapped: Person[] = list.map((it: any) => ({
					id: String(it.userId ?? it.id ?? it.uid ?? it.key ?? Math.random()),
					name: it.fullname || it.fullName || it.name || it.userName || it.nickName || "",
					employeeId: it.employeeId || it.employeeCode || it.empNo || it.userCode,
					department: it.deptName || it.department || undefined,
					orgFullname: deptMap[it.deptId],
					deptId: it.deptId || selectedOrg,
				}));

				if (page === 1) {
					setMembers(mapped);
				} else {
					setMembers((prev) => [...prev, ...mapped]);
				}

				setPageNum(page);
				// if returned less than pageSize, no more data
				setHasMore(mapped.length >= pageSize);
			} catch (e: any) {
				if (e.name === "AbortError") return;
				console.error("fetchUsersByDeptId failed", e);
			} finally {
				if (abortControllerRef.current === controller) {
					setMembersLoading(false);
				}
			}
		},
		[selectedOrg, appliedSearch, deptMap],
	);

	// reset and load when org or search changes
	React.useEffect(() => {
		if (!selectedOrg) {
			setMembers([]);
			setHasMore(true);
			setPageNum(1);
			setMembersLoading(false);
			return;
		}
		setMembers([]);
		setPageNum(1);
		setHasMore(true);
		loadPage(1);
	}, [selectedOrg, appliedSearch, loadPage]);

	const toggleMember = (p: Person, checked: boolean) => {
		setSelectedIds((prev) => {
			if (single) {
				if (checked) return { [p.id]: p };
				return {};
			}
			const next = { ...prev };
			if (checked) next[p.id] = p;
			else delete next[p.id];
			return next;
		});
	};

	const selectAllInCurrent = (checked: boolean) => {
		if (single) return;
		// operate on currently loaded members (server page(s))
		if (!checked) {
			setSelectedIds((prev) => {
				const next = { ...prev };
				members.forEach((m) => {
					if (!disabledKeys.includes(m.id)) {
						delete next[m.id];
					}
				});
				return next;
			});
			return;
		}
		setSelectedIds((prev) => {
			const next = { ...prev };
			members.forEach((m) => {
				if (!disabledKeys.includes(m.id)) {
					next[m.id] = m;
				}
			});
			return next;
		});
	};

	const selectedCountInFiltered = React.useMemo(() => {
		if (!members || members.length === 0) return 0;
		return members.reduce((acc, m) => acc + (selectedIds[m.id] ? 1 : 0), 0);
	}, [members, selectedIds]);

	const clearSelected = () => setSelectedIds({});

	const handleOk = () => {
		const arr = Object.values(selectedIds);
		onClose(arr.length ? arr : null);
	};

	return (
		<Modal
			title={titleLabel || "添加人员"}
			open={open}
			onCancel={() => onClose(null)}
			onOk={handleOk}
			width={900}
			centered
			styles={modalDiverStyle}
		>
			<div
				style={{ display: "flex", gap: 12, height: 480 }}
				className="person-create-modal-content"
			>
				<style>
					{`
						.person-create-modal-content ::-webkit-scrollbar {
							width: 6px;
							height: 6px;
						}
						.person-create-modal-content ::-webkit-scrollbar-thumb {
							background: transparent;
							border-radius: 3px;
						}
						.person-create-modal-content ::-webkit-scrollbar-track {
							background: transparent;
						}
					`}
				</style>
				{/* 左侧：组织树与搜索 */}
				<div
					style={{ width: 280, border: "1px solid #f0f0f0", padding: 12 }}
					className="left-tree-wrapper"
				>
					<Input.Search
						placeholder="搜索名称"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						onSearch={(val) => setSearch(val)}
						allowClear
						style={{ marginBottom: 8 }}
					/>
					<div style={{ maxHeight: 420, overflow: "auto" }}>
						<Spin spinning={deptLoading}>
							<Tree
								treeData={orgFiltered}
								onSelect={(keys) =>
									setSelectedOrg(((keys && keys[0]) as string) || null)
								}
								selectedKeys={selectedOrg ? [selectedOrg] : []}
								expandedKeys={expandedKeys}
								onExpand={(keys) => setExpandedKeys(keys as React.Key[])}
								autoExpandParent
								// 不默认全部展开以避免大数据量下首次渲染压力
								defaultExpandAll={false}
								// 启用虚拟滚动（当前类型定义只接受 boolean）；通过 style 指定高度
								virtual={true as any}
								style={{ height: 420, overflow: "auto" }}
							/>
						</Spin>
					</div>
				</div>

				{/* 右侧：添加成员框，两列布局 */}
				<div style={{ border: "1px solid #f0f0f0", flex: 1, height: 480 }}>
					<div
						style={{ background: "#f5f7fa", height: 32, lineHeight: "32px" }}
						className="px-4 text-sm font-medium"
					>
						添加成员
					</div>
					<div style={{ flex: 1, display: "flex", gap: 12, height: 448 }}>
						<div
							style={{
								flex: 1,
								border: "1px solid #f0f0f0",
								padding: 12,
								display: "flex",
								flexDirection: "column",
							}}
						>
							<div style={{ marginBottom: 8 }}>
								<Input.Search
									placeholder="搜索姓名"
									value={memberSearch}
									onChange={(e) => setMemberSearch(e.target.value)}
									onSearch={(val) => setAppliedSearch(val)}
									allowClear
									disabled={!selectedOrg}
								/>
							</div>
							<div
								ref={listContainerRef}
								style={{ overflow: "auto", flex: 1 }}
								onScroll={(e) => {
									const el = e.currentTarget as HTMLDivElement;
									if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) {
										if (!membersLoading && hasMore) {
											loadPage(pageNum + 1);
										}
									}
								}}
							>
								{membersLoading && members.length === 0 ? (
									<div style={{ padding: 24, textAlign: "center" }}>
										<Spin />
									</div>
								) : members.length === 0 ? (
									<Empty description="暂无成员" />
								) : (
									<List
										split={false}
										header={
											!single && (
												<div
													style={{
														display: "flex",
														alignItems: "center",
														gap: 8,
													}}
												>
													<Checkbox
														onChange={(e) =>
															selectAllInCurrent(e.target.checked)
														}
														disabled={
															!selectedOrg || members.length === 0
														}
														checked={
															members.length > 0 &&
															selectedCountInFiltered ===
																members.length
														}
														indeterminate={
															selectedCountInFiltered > 0 &&
															selectedCountInFiltered < members.length
														}
													/>{" "}
													<span style={{ fontWeight: 600 }}>全选</span>
												</div>
											)
										}
										dataSource={members}
										renderItem={(item) => (
											<List.Item className="!py-2">
												<div
													style={{
														display: "flex",
														alignItems: "center",
														width: "100%",
														gap: 12,
													}}
												>
													<Checkbox
														checked={!!selectedIds[item.id]}
														onChange={(e) =>
															toggleMember(item, e.target.checked)
														}
														disabled={disabledKeys.includes(item.id)}
													/>
													<div style={{ flex: 1 }}>
														<div style={{ fontWeight: 500 }}>
															{item.name}
														</div>
													</div>
												</div>
											</List.Item>
										)}
										footer={
											<div style={{ textAlign: "center", padding: 8 }}>
												{membersLoading ? (
													<span>加载中...</span>
												) : !hasMore ? (
													<span>没有更多了</span>
												) : (
													<span>向下滚动加载更多</span>
												)}
											</div>
										}
									/>
								)}
							</div>
						</div>

						<div
							style={{
								width: 300,
								border: "1px solid #f0f0f0",
								padding: 12,
								display: "flex",
								flexDirection: "column",
							}}
						>
							<div
								style={{
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
									marginBottom: 8,
								}}
							>
								<div style={{ fontWeight: 600 }}>
									已选（
									{Object.keys(selectedIds).length}）
								</div>
								<Button type="link" onClick={clearSelected}>
									清空
								</Button>
							</div>
							<div style={{ overflow: "auto", flex: 1 }}>
								{Object.keys(selectedIds).length === 0 ? (
									<Empty description="未选人员" />
								) : (
									<List
										split={false}
										dataSource={Object.values(selectedIds)}
										renderItem={(item) => (
											<List.Item
												style={{
													background: "#f0f2f5",
													borderRadius: 6,
													padding: "8px 12px",
													marginBottom: 8,
												}}
											>
												<div className="w-full">
													<div
														style={{
															display: "flex",
															alignItems: "center",
														}}
													>
														<div style={{ minWidth: 254 }}>
															<div
																className="text-sm"
																style={{ fontWeight: 500 }}
															>
																{item.name}
															</div>
															<div
																className="text-sm"
																style={{
																	color: "#666",
																	width: "90%",
																}}
															>
																{(
																	deptMap[item.deptId || ""] ||
																	item.orgFullname
																)?.replaceAll(",", " > ")}
															</div>
														</div>
														<div
															style={{
																width: "1px",
																transform: "translateX(-30px)",
															}}
														>
															<Button
																key="rm"
																type="text"
																onClick={() =>
																	toggleMember(item, false)
																}
															>
																X
															</Button>
														</div>
													</div>
												</div>
											</List.Item>
										)}
									/>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		</Modal>
	);
}
