import type { DeptTreeNode, UserInfo } from "#src/api/tag-management/common";
import type { RadioChangeEvent } from "antd";
import { getDeptTree, pageUserList } from "#src/api/tag-management/common";
import { CloseOutlined, SearchOutlined } from "@ant-design/icons";
import { useRequest } from "ahooks";
import {
	Button,
	Descriptions,
	Divider,
	Empty,
	Input,
	message,
	Modal,
	Radio,
	Select,
	Skeleton,
	Spin,
	theme,
	Tree,
	Typography,
} from "antd";
import { debounce } from "lodash-es";
import { useCallback, useEffect, useMemo, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";

const EMPTY_ROLE_OPTIONS: Array<{ label: string; value: string }> = [];

/**
 * 维护人选择器弹窗组件属性
 */
interface MaintainerSelectorModalProps {
	/** 是否显示弹窗 */
	open: boolean;
	/** 关闭回调 */
	onClose: () => void;
	/** 确认回调 */
	onConfirm: (value: {
		type: "person" | "role";
		typeValue: "1" | "2";
		person?: { id: string; name: string; deptPath: string };
		role?: string;
	}) => void;
	/** 当前值 */
	value?: {
		type: "person" | "role";
		person?: { id: string; name: string; deptPath: string };
		role?: string;
	};
	/** 角色选项列表 */
	roleOptions?: Array<{ label: string; value: string }>;
	/** 弹窗标题 */
	title?: string;
}

/**
 * 维护人选择器弹窗组件
 *
 * @param props - 组件属性
 * @param props.open - 是否显示弹窗
 * @param props.onClose - 关闭回调
 * @param props.onConfirm - 确认回调
 * @param props.value - 当前值
 * @param props.roleOptions - 角色选项列表
 * @param props.title - 弹窗标题
 * @returns 弹窗组件
 */
export function MaintainerSelectorModal({
	open,
	onClose,
	onConfirm,
	value,
	roleOptions = EMPTY_ROLE_OPTIONS,
	title = "维护人",
}: MaintainerSelectorModalProps) {
	const { token } = theme.useToken();
	const [maintainerType, setMaintainerType] = useState<"person" | "role">(
		value?.type || "person",
	);
	const [selectedDeptCode, setSelectedDeptCode] = useState<string>("");
	const [selectedUserId, setSelectedUserId] = useState<string | undefined>(undefined);
	const [selectedUser, setSelectedUser] = useState<UserInfo | undefined>(undefined);
	const [selectedRole, setSelectedRole] = useState<string>(value?.role || "");
	const [deptSearchValue, setDeptSearchValue] = useState("");
	const [userSearchValue, setUserSearchValue] = useState("");
	const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
	const [autoExpandParent, setAutoExpandParent] = useState(true);
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
					setAutoExpandParent(false);
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
				setAutoExpandParent(true);
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

	// 初始化时展开第一层节点，如果有选中数据则展开到选中节点路径
	useEffect(() => {
		if (open && treeData.length > 0 && expandedKeys.length === 0 && !deptSearchValue) {
			// 如果有选中数据，需要展开到选中节点的路径
			if (value?.type === "person" && value.person) {
				// 根据选中的部门路径展开
				const deptPath = value.person.deptPath;
				if (deptPath) {
					// 查找并展开到选中节点的路径
					const findPath = (
						nodes: DeptTreeNode[],
						targetPath: string,
						path: React.Key[],
					): React.Key[] | null => {
						for (const node of nodes) {
							const currentPath = [...path, node.deptCode];
							// 检查当前节点是否匹配路径
							if (deptPath.includes(node.deptName)) {
								if (node.children) {
									const found = findPath(node.children, targetPath, currentPath);
									if (found) {
										return found;
									}
								}
								// 如果完全匹配，返回路径
								if (
									deptPath.endsWith(node.deptName) ||
									deptPath === node.deptName
								) {
									return currentPath.slice(0, -1); // 返回父节点路径（展开到父节点）
								}
							}
							if (node.children) {
								const found = findPath(node.children, targetPath, currentPath);
								if (found) {
									return found;
								}
							}
						}
						return null;
					};
					const path = findPath(treeData, deptPath, []);
					if (path) {
						setExpandedKeys(path);
						return;
					}
				}
			}

			// 默认只展开第一层
			const firstLevelKeys = treeData.map((node) => node.deptCode);
			setExpandedKeys(firstLevelKeys);
		}
	}, [open, treeData, deptSearchValue, value]);

	// 初始化选中状态
	useEffect(() => {
		if (open && value) {
			setMaintainerType(value.type);
			if (value.type === "person" && value.person) {
				setSelectedUserId(value.person.id);
				setSelectedUser({
					id: String(value.person.id),
					name: value.person.name,
					deptName: value.person.deptPath.split(">").pop() || "",
					deptId: 0,
					account: "",
					staffJobCode: "",
					staffPostCode: "",
					staffPostName: "",
					staffJobName: "",
					mobileNum: "",
					status: "",
					jobStatus: "",
					jobStatusName: "",
					userType: "",
					loginDate: "",
				});
			} else if (value.type === "role") {
				setSelectedRole(value.role || "");
			}
		} else if (open) {
			setMaintainerType("person");
			setSelectedDeptCode("");
			setSelectedUserId(undefined);
			setSelectedUser(undefined);
			setSelectedRole("");
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

	// 当选中部门、弹窗打开或维护人类型变化时，立即重新加载第一页数据
	useEffect(() => {
		if (open && maintainerType === "person") {
			setUserListPageNum(1);
			setAllUserList([]);
			fetchUserList(selectedDeptCode, userSearchValue, 1, false);
		}
	}, [open, selectedDeptCode, maintainerType, fetchUserList]);

	// 当人员搜索条件变化时，使用防抖重新加载第一页数据
	useEffect(() => {
		if (open && maintainerType === "person") {
			debouncedUserSearch(selectedDeptCode, userSearchValue);
		}
	}, [userSearchValue]);

	/**
	 * 加载更多人员数据
	 *
	 * 当用户滚动到底部时，自动加载下一页数据
	 */
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
		setSelectedUserId(undefined);
		setSelectedUser(undefined);
	};

	/**
	 * 处理人员选择
	 *
	 * @param user - 选中的用户信息
	 */
	const handleUserSelect = (user: UserInfo) => {
		setSelectedUserId(String(user.id));
		setSelectedUser(user);
	};

	/**
	 * 处理角色选择
	 *
	 * @param role - 选中的角色值
	 */
	const handleRoleChange = (role: string) => {
		setSelectedRole(role);
	};

	/**
	 * 处理维护人类型变化
	 */
	const handleTypeChange = (e: RadioChangeEvent) => {
		const newType = e.target.value as "person" | "role";
		setMaintainerType(newType);
		setSelectedUserId(undefined);
		setSelectedUser(undefined);
		setSelectedRole("");
		setSelectedDeptCode("");
		setUserListPageNum(1);
		setUserListTotal(0);
		setAllUserList([]);
	};

	/**
	 * 构建部门路径
	 *
	 * @param deptId - 部门ID
	 * @param nodes - 部门树节点数组
	 * @returns 部门路径字符串（用 ">" 分隔）
	 */
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

	/**
	 * 处理确认
	 *
	 * 根据选择的类型（人员或角色），构建确认数据并调用回调
	 */
	const handleConfirm = () => {
		if (maintainerType === "person") {
			if (!selectedUser) {
				message.warning("请选择人员");
				return;
			}

			// 构建部门路径
			const deptPath = selectedUser.deptName || "";
			const fullPath = buildDeptPath(selectedUser.deptId, treeData);

			onConfirm({
				type: "person",
				typeValue: "1", // 人员
				person: {
					id: String(selectedUser.id),
					name: selectedUser.name,
					deptPath: fullPath || deptPath,
				},
			});
		} else {
			if (!selectedRole) {
				message.warning("请选择角色");
				return;
			}

			onConfirm({
				type: "role",
				typeValue: "2", // 角色
				role: selectedRole,
			});
		}

		onClose();
	};

	/**
	 * 关闭弹窗
	 */
	const handleCancel = () => {
		onClose();
	};

	/**
	 * 清空已选人员
	 */
	const handleClearSelected = () => {
		setSelectedUserId(undefined);
		setSelectedUser(undefined);
	};

	// 判断是否有值（用于显示按钮文本）
	const hasValue = useMemo(() => {
		if (maintainerType === "person") {
			return !!selectedUser;
		}
		return !!selectedRole;
	}, [maintainerType, selectedUser, selectedRole]);

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
					{hasValue ? "更新" : "确定"}
				</Button>,
			]}
			closeIcon={<CloseOutlined />}
		>
			<Descriptions
				column={1}
				className="my-4"
				colon={false}
				styles={{
					label: {
						width: "104px",
						display: "flex",
						justifyContent: "flex-end",
						alignItems: "center",
						whiteSpace: "nowrap",
					},
				}}
				items={[
					{
						label: (
							<Typography.Text>
								<span className="mr-1 text-red-500">*</span>
								{title}
								类型
							</Typography.Text>
						),
						children: (
							<Radio.Group
								value={maintainerType || "person"}
								onChange={handleTypeChange}
							>
								<Radio value="person">人员</Radio>
								<Radio value="role">角色</Radio>
							</Radio.Group>
						),
					},
					...(maintainerType === "role"
						? [
								{
									label: (
										<Typography.Text>
											<span className="mr-1 text-red-500">*</span>
											角色名称
										</Typography.Text>
									),
									children: (
										<Select
											placeholder="请选择"
											value={selectedRole}
											onChange={handleRoleChange}
											options={roleOptions}
											className="w-full"
											showSearch
											optionFilterProp="label"
										/>
									),
								},
							]
						: []),
				]}
			/>

			{maintainerType === "person" && (
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
										setAutoExpandParent(false);
									}}
									autoExpandParent={autoExpandParent}
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
										<SearchOutlined
											style={{ color: token.colorTextTertiary }}
										/>
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
															className="cursor-pointer"
															onClick={() => handleUserSelect(user)}
														>
															<Radio
																checked={
																	selectedUserId ===
																	String(user.id)
																}
																onChange={() =>
																	handleUserSelect(user)
																}
															>
																{user.name}
															</Radio>
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
										{selectedUser ? 1 : 0})
									</span>
									{selectedUser && (
										<Button
											type="link"
											size="small"
											onClick={handleClearSelected}
										>
											清空
										</Button>
									)}
								</div>
								<div className="flex-1 overflow-auto" style={{ minHeight: 0 }}>
									{selectedUser ? (
										<div
											className="flex items-start justify-between rounded p-2"
											style={{ background: "rgba(240, 242, 245, 1)" }}
										>
											<div className="flex-1">
												<div className="mb-1 font-medium">
													{selectedUser.name}
												</div>
												<div className="text-sm text-gray-500">
													{buildDeptPath(selectedUser.deptId, treeData) ||
														selectedUser.deptName}
												</div>
											</div>
											<Button
												type="text"
												size="small"
												icon={<CloseOutlined />}
												onClick={handleClearSelected}
												className="text-gray-500 hover:text-gray-700"
											/>
										</div>
									) : (
										<Empty
											description="暂无已选人员"
											image={Empty.PRESENTED_IMAGE_SIMPLE}
										/>
									)}
								</div>
							</div>
						</div>
					</div>
				</div>
			)}
		</Modal>
	);
}
