import type { DeptTreeNode, UserInfo } from "#src/api/personnel-archive/common";
import { getDeptTree, pageUserList } from "#src/api/personnel-archive/common";
import { CloseOutlined, SearchOutlined } from "@ant-design/icons";
import { useRequest } from "ahooks";
import { Button, Checkbox, Divider, Empty, Input, Modal, Skeleton, Spin, theme, Tree } from "antd";
import { debounce } from "lodash-es";
import { useCallback, useEffect, useMemo, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";

/**
 * 已选人员信息
 */
export interface SelectedPersonnel {
	/** 用户ID */
	id: number;
	/** 用户姓名 */
	name: string;
	/** 部门路径 */
	deptPath: string;
}

/**
 * 人员选择器弹窗属性（支持多选）
 */
interface PersonnelSelectorModalProps {
	/** 是否显示弹窗 */
	open: boolean;
	/** 关闭回调 */
	onClose: () => void;
	/** 确认回调 */
	onConfirm: (selectedPersonnel: SelectedPersonnel[]) => void;
	/** 当前已选人员列表 */
	value?: SelectedPersonnel[];
	/** 弹窗标题 */
	title?: string;
}

/**
 * 人员选择器弹窗组件（支持多选）
 *
 * @param props - 组件属性
 * @returns 弹窗组件
 */
export function PersonnelSelectorModal({
	open,
	onClose,
	onConfirm,
	value = [],
	title = "部分人员",
}: PersonnelSelectorModalProps) {
	const { token } = theme.useToken();
	const [selectedDeptCode, setSelectedDeptCode] = useState<string>("");
	const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(new Set());
	const [selectedPersonnelMap, setSelectedPersonnelMap] = useState<
		Map<number, SelectedPersonnel>
	>(new Map());
	const [deptSearchValue, setDeptSearchValue] = useState("");
	const [userSearchValue, setUserSearchValue] = useState("");
	const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
	const [isAutoExpandParent, setIsAutoExpandParent] = useState(true);
	const [userListPageNum, setUserListPageNum] = useState(1);
	const [userListTotal, setUserListTotal] = useState(0);
	const [allUserList, setAllUserList] = useState<UserInfo[]>([]);

	// 获取部门树数据
	const { data: deptTreeData, loading: deptTreeLoading } = useRequest(getDeptTree, {
		ready: open,
	});

	// 部门树数据（后端已返回树形结构，直接使用）
	const treeData = useMemo<DeptTreeNode[]>(() => {
		if (!deptTreeData) {
			return [];
		}
		return Array.isArray(deptTreeData) ? deptTreeData : [];
	}, [deptTreeData]);

	// 获取父节点 key（使用 deptCode）
	const getParentKey = useCallback(
		(key: React.Key, tree: DeptTreeNode[]): React.Key | undefined => {
			let parentKey: React.Key | undefined;
			for (let i = 0; i < tree.length; i++) {
				const node = tree[i];
				if (node.children) {
					if (node.children.some((item) => item.deptCode === key)) {
						parentKey = node.deptCode;
					} else {
						const found = getParentKey(key, node.children);
						if (found) {
							parentKey = found;
						}
					}
				}
			}
			return parentKey;
		},
		[],
	);

	// 生成部门树扁平列表（用于搜索，使用 deptCode 作为 key）
	const deptDataList = useMemo(() => {
		const list: Array<{ key: React.Key; title: string }> = [];
		const generateList = (data: DeptTreeNode[]) => {
			for (let i = 0; i < data.length; i++) {
				const node = data[i];
				list.push({ key: node.deptCode, title: node.deptName });
				if (node.children) {
					generateList(node.children);
				}
			}
		};
		generateList(treeData);
		return list;
	}, [treeData]);

	// 获取人员列表（支持分页）
	const { loading: userListLoading, run: fetchUserList } = useRequest(
		async (deptCode: string, name: string, pageNum: number, _isLoadMore: boolean) => {
			const result = await pageUserList({
				name: name || "",
				status: "0", // 0正常
				jobStatus: "1", // 1在职
				deptCode: (deptCode || "").trim(),
				pageNum,
				pageSize: 20, // 每页20条
			});
			return result;
		},
		{
			manual: true,
			onSuccess: (result, [_deptCode, _name, pageNum, isLoadMore]) => {
				const newList = Array.isArray(result.list) ? result.list : [];
				const total = typeof result.total === "number" ? result.total : 0;

				if (isLoadMore) {
					// 加载更多：追加数据
					setAllUserList((prev) => [...prev, ...newList]);
				} else {
					// 首次加载或搜索：重置数据
					setAllUserList(newList);
				}

				setUserListTotal(total);
				setUserListPageNum(pageNum);
			},
			onError: (error) => {
				console.error("获取人员列表失败:", error);
				// 错误时清空列表
				setAllUserList([]);
				setUserListTotal(0);
			},
		},
	);

	// 部门搜索防抖处理函数
	const debouncedDeptSearch = useMemo(
		() =>
			debounce((value: string) => {
				if (!value) {
					setExpandedKeys([]);
					setIsAutoExpandParent(false);
					return;
				}

				// 找到匹配的节点，并获取其父节点 key
				const newExpandedKeys = deptDataList
					.map((item) => {
						if (item.title.includes(value)) {
							return getParentKey(item.key, treeData);
						}
						return null;
					})
					.filter(
						(item, i, self): item is React.Key => !!(item && self.indexOf(item) === i),
					);

				setExpandedKeys(newExpandedKeys);
				setIsAutoExpandParent(true);
			}, 300),
		[deptDataList, treeData, getParentKey],
	);

	useEffect(() => () => debouncedDeptSearch.cancel(), [debouncedDeptSearch]);

	// 处理部门树搜索
	const handleDeptSearchChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const { value } = e.target;
			setDeptSearchValue(value);
			debouncedDeptSearch(value);
		},
		[debouncedDeptSearch],
	);

	// 可搜索的部门树数据（高亮搜索关键词，使用 deptCode 作为 key，deptName 作为 title）
	const searchableTreeData = useMemo(() => {
		const loop = (data: DeptTreeNode[]): any[] =>
			data.map((item) => {
				const strTitle = item.deptName;
				const index = strTitle.indexOf(deptSearchValue);
				const beforeStr = strTitle.substring(0, index);
				const afterStr = strTitle.slice(index + deptSearchValue.length);

				const deptName =
					index > -1 && deptSearchValue ? (
						<span>
							{beforeStr}
							<span className="font-semibold text-blue-500">{deptSearchValue}</span>
							{afterStr}
						</span>
					) : (
						<span>{strTitle}</span>
					);

				if (item.children) {
					return {
						deptName,
						deptCode: item.deptCode,
						deptId: item.deptId,
						children: loop(item.children),
					};
				}

				return {
					deptName,
					deptCode: item.deptCode,
					deptId: item.deptId,
				};
			});

		return loop(treeData);
	}, [treeData, deptSearchValue]);

	// 初始化时展开第一层节点
	useEffect(() => {
		if (open && treeData.length > 0 && expandedKeys.length === 0 && !deptSearchValue) {
			// 默认只展开第一层
			const firstLevelKeys = treeData.map((node) => node.deptCode);
			setExpandedKeys(firstLevelKeys);
		}
	}, [open, treeData, deptSearchValue]);

	// 初始化选中状态
	useEffect(() => {
		if (open && value && value.length > 0) {
			const ids = new Set<number>();
			const map = new Map<number, SelectedPersonnel>();
			value.forEach((person) => {
				ids.add(person.id);
				map.set(person.id, person);
			});
			setSelectedUserIds(ids);
			setSelectedPersonnelMap(map);
		} else if (open) {
			setSelectedDeptCode("");
			setSelectedUserIds(new Set());
			setSelectedPersonnelMap(new Map());
			setDeptSearchValue("");
			setUserSearchValue("");
			setUserListPageNum(1);
			setUserListTotal(0);
			setAllUserList([]);
		}
	}, [open, value]);

	// 人员搜索防抖处理函数
	const debouncedUserSearch = useMemo(
		() =>
			debounce((deptCode: string, name: string) => {
				setUserListPageNum(1);
				setAllUserList([]);
				fetchUserList(deptCode, name, 1, false);
			}, 300),
		[fetchUserList],
	);

	useEffect(() => () => debouncedUserSearch.cancel(), [debouncedUserSearch]);

	// 当选中部门或弹窗打开时，立即重新加载第一页数据
	useEffect(() => {
		if (open) {
			setUserListPageNum(1);
			setAllUserList([]);
			fetchUserList(selectedDeptCode, userSearchValue, 1, false);
		}
	}, [open, selectedDeptCode, fetchUserList]);

	// 当人员搜索条件变化时，使用防抖重新加载第一页数据
	useEffect(() => {
		if (open) {
			debouncedUserSearch(selectedDeptCode, userSearchValue);
		}
	}, [userSearchValue]);

	// 加载更多人员数据
	const loadMoreUserData = useCallback(() => {
		if (userListLoading) {
			return;
		}

		const hasMore = allUserList.length < userListTotal;
		if (hasMore) {
			const nextPage = userListPageNum + 1;
			fetchUserList(selectedDeptCode, userSearchValue, nextPage, true);
		}
	}, [
		userListLoading,
		selectedDeptCode,
		allUserList.length,
		userListTotal,
		userListPageNum,
		userSearchValue,
		fetchUserList,
	]);

	/**
	 * 处理部门树选择
	 *
	 * @param selectedKeys - 选中的节点 key 数组
	 * @param info - 节点信息
	 */
	const handleDeptSelect = (selectedKeys: React.Key[], info: any) => {
		if (selectedKeys.length === 0) {
			return;
		}

		const node = info.node as any;
		const deptCode = (selectedKeys[0] as string) || node.deptCode || "";

		if (!deptCode) {
			console.warn("未找到部门编码 deptCode，请检查数据结构");
			return;
		}

		setSelectedDeptCode(deptCode);
	};

	// 构建部门路径
	const buildDeptPath = (deptId: number, nodes: DeptTreeNode[]): string => {
		const findPath = (
			id: number,
			nodeList: DeptTreeNode[],
			path: string[],
		): string[] | null => {
			for (const node of nodeList) {
				const currentPath = [...path, node.deptName];
				if (node.deptId === id) {
					return currentPath;
				}
				if (node.children) {
					const result = findPath(id, node.children, currentPath);
					if (result) {
						return result;
					}
				}
			}
			return null;
		};

		const path = findPath(deptId, nodes, []);
		return path ? path.join(">") : "";
	};

	// 处理人员选择（多选）
	const handleUserSelect = (user: UserInfo, checked: boolean) => {
		const newSelectedIds = new Set(selectedUserIds);
		const newMap = new Map(selectedPersonnelMap);

		if (checked) {
			// 添加
			const deptPath = buildDeptPath(user.deptId, treeData);
			const personnel: SelectedPersonnel = {
				id: user.id,
				name: user.name,
				deptPath: deptPath || user.deptName || "",
			};
			newSelectedIds.add(user.id);
			newMap.set(user.id, personnel);
		} else {
			// 移除
			newSelectedIds.delete(user.id);
			newMap.delete(user.id);
		}

		setSelectedUserIds(newSelectedIds);
		setSelectedPersonnelMap(newMap);
	};

	// 处理确认
	const handleConfirm = () => {
		const selectedList = Array.from(selectedPersonnelMap.values());
		onConfirm(selectedList);
		onClose();
	};

	// 处理取消
	const handleCancel = () => {
		onClose();
	};

	// 清空已选人员
	const handleClearSelected = () => {
		setSelectedUserIds(new Set());
		setSelectedPersonnelMap(new Map());
	};

	// 移除单个已选人员
	const handleRemovePersonnel = (id: number) => {
		const newSelectedIds = new Set(selectedUserIds);
		const newMap = new Map(selectedPersonnelMap);
		newSelectedIds.delete(id);
		newMap.delete(id);
		setSelectedUserIds(newSelectedIds);
		setSelectedPersonnelMap(newMap);
	};

	const selectedPersonnelList = Array.from(selectedPersonnelMap.values());

	return (
		<Modal
			title={title}
			open={open}
			onCancel={handleCancel}
			centered
			width={1000}
			footer={[
				<Button key="cancel" onClick={handleCancel}>
					取消
				</Button>,
				<Button key="confirm" type="primary" onClick={handleConfirm}>
					确定
				</Button>,
			]}
			closeIcon={<CloseOutlined />}
		>
			<div className="flex gap-4" style={{ height: "500px" }}>
				{/* 左侧：部门树 */}
				<div className="flex w-1/3 flex-col rounded border border-gray-200 p-4">
					<Input
						suffix={<SearchOutlined style={{ color: token.colorTextTertiary }} />}
						placeholder="搜索名称"
						value={deptSearchValue}
						onChange={handleDeptSearchChange}
						allowClear
						className="mb-4"
					/>
					<div className="relative flex-1 overflow-auto">
						{deptTreeLoading ? (
							<div className="absolute inset-0 flex items-center justify-center">
								<Spin />
							</div>
						) : (
							<Tree
								treeData={searchableTreeData}
								selectedKeys={selectedDeptCode ? [selectedDeptCode] : []}
								onSelect={handleDeptSelect}
								expandedKeys={expandedKeys}
								onExpand={(keys) => {
									setExpandedKeys(keys);
									setIsAutoExpandParent(false);
								}}
								autoExpandParent={isAutoExpandParent}
								fieldNames={{
									title: "deptName",
									key: "deptCode",
									children: "children",
								}}
							/>
						)}
					</div>
				</div>

				{/* 右侧：添加成员（包含人员列表和已选人员） */}
				<div
					className="flex flex-1 flex-col rounded border border-gray-200"
					style={{ minHeight: 0 }}
				>
					<div
						className="flex h-12 items-center px-4 font-semibold"
						style={{ background: "rgba(240, 242, 245, 1)" }}
					>
						添加成员
					</div>
					<div className="flex flex-1 gap-4 p-4" style={{ minHeight: 0 }}>
						{/* 中间：人员列表 */}
						<div className="flex flex-1 flex-col" style={{ minHeight: 0 }}>
							<Input
								suffix={
									<SearchOutlined style={{ color: token.colorTextTertiary }} />
								}
								placeholder="搜索姓名"
								value={userSearchValue}
								onChange={(e) => setUserSearchValue(e.target.value)}
								allowClear
								className="mb-4"
							/>
							<div
								id="scrollableUserList"
								className="relative flex-1 overflow-auto"
								style={{ minHeight: 0 }}
							>
								{userListLoading && allUserList.length === 0 ? (
									<div className="absolute inset-0 flex items-center justify-center">
										<Spin />
									</div>
								) : (
									<InfiniteScroll
										dataLength={allUserList.length}
										next={loadMoreUserData}
										hasMore={allUserList.length < userListTotal}
										loader={
											<div className="px-2 py-4">
												<Skeleton
													avatar={false}
													paragraph={{ rows: 1 }}
													active
												/>
											</div>
										}
										endMessage={
											allUserList.length > 0 ? (
												<Divider plain className="my-4">
													没有更多数据了
												</Divider>
											) : null
										}
										scrollableTarget="scrollableUserList"
									>
										{allUserList.length === 0 ? (
											<div className="py-8 text-center text-gray-400">
												暂无人员
											</div>
										) : (
											<div className="space-y-1">
												{allUserList.map((user: UserInfo) => (
													<div
														key={user.id}
														className="cursor-pointer rounded px-2 py-1 transition-colors hover:bg-gray-50"
														onClick={() =>
															handleUserSelect(
																user,
																!selectedUserIds.has(user.id),
															)
														}
													>
														<Checkbox
															checked={selectedUserIds.has(user.id)}
															onChange={(e) => {
																e.stopPropagation();
																handleUserSelect(
																	user,
																	e.target.checked,
																);
															}}
															onClick={(e) => {
																e.stopPropagation();
															}}
														>
															<span className="select-none">
																{user.name}
															</span>
														</Checkbox>
													</div>
												))}
											</div>
										)}
									</InfiniteScroll>
								)}
							</div>
						</div>

						{/* 右侧：已选人员 */}
						<div className="flex flex-1 flex-col" style={{ minHeight: 0 }}>
							<div className="mb-4 flex h-8 items-center justify-between">
								<span>
									已选(
									{selectedPersonnelList.length})
								</span>
								{selectedPersonnelList.length > 0 && (
									<Button type="link" size="small" onClick={handleClearSelected}>
										清空
									</Button>
								)}
							</div>
							<div className="flex-1 overflow-auto" style={{ minHeight: 0 }}>
								{selectedPersonnelList.length === 0 ? (
									<Empty
										description="暂无已选人员"
										image={Empty.PRESENTED_IMAGE_SIMPLE}
									/>
								) : (
									<div className="space-y-2">
										{selectedPersonnelList.map((personnel) => (
											<div
												key={personnel.id}
												className="flex items-start justify-between rounded p-2"
												style={{ background: "rgba(240, 242, 245, 1)" }}
											>
												<div className="flex-1">
													<div className="mb-1 font-medium">
														{personnel.name}
													</div>
													<div className="text-sm text-gray-500">
														{personnel.deptPath}
													</div>
												</div>
												<Button
													type="text"
													size="small"
													icon={<CloseOutlined />}
													onClick={() =>
														handleRemovePersonnel(personnel.id)
													}
													className="text-gray-500 hover:text-gray-700"
												/>
											</div>
										))}
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		</Modal>
	);
}
