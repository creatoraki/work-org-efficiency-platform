import type { UserTreeType } from "#src/api/system";
import type { DeptTreeNode, UserInfo } from "#src/api/user/sys";

import { pageUserList } from "#src/api/user/sys";
import { CloseOutlined, SearchOutlined } from "@ant-design/icons";
import { useRequest } from "ahooks";
import { Button, Checkbox, Divider, Empty, Input, message, Modal, Spin, theme } from "antd";
import { debounce, uniqBy } from "lodash-es";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";

import InfiniteScroll from "react-infinite-scroll-component";
import UserTree from "../../user/components/UserTree";
import { TreeDataContext } from "./RuleConfig";
/**
 * 维护人选择器弹窗属性
 */
interface MaintainerSelectorModalProps {
	/** 是否显示弹窗 */
	open: boolean;
	/** 关闭回调 */
	onClose: () => void;
	/** 确认回调 */
	onConfirm: (selectedUserId: number[]) => void;
	/** 弹窗标题 */
	title?: string;
}

/**
 * 维护人选择器弹窗组件
 *
 * @param props - 组件属性
 * @returns 弹窗组件
 */
export function MaintainerSelectorModal({
	open,
	onClose,
	onConfirm,
	title = "维护人",
}: MaintainerSelectorModalProps) {
	const { token } = theme.useToken();
	const [selectedDeptCode, setSelectedDeptCode] = useState<string>("");
	const [selectedUser, setSelectedUser] = useState<UserInfo[]>([]);
	const [userSearchValue, setUserSearchValue] = useState("");
	const [userListPageNum, setUserListPageNum] = useState(1);
	const [userListTotal, setUserListTotal] = useState(0);
	const [allUserList, setAllUserList] = useState<any[]>([]);
	const { treeData } = useContext<any>(TreeDataContext); // 部门树数据
	const [dept, setDept] = useState<UserTreeType | null>();
	const [messageApi, contextHolder] = message.useMessage();

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

	// 获取人员列表（支持分页）
	const { loading: userListLoading, run: fetchUserList } = useRequest(
		async (deptCode: string, name: string, pageNum: number, _isLoadMore: boolean) => {
			// 确保 deptCode 有值才查询
			if (!deptCode || deptCode.trim() === "") {
				console.warn("部门编码 deptCode 为空，无法查询人员列表");
				return {
					data: {
						list: [],
						total: 0,
						pageNum: 1,
						pageSize: 20,
						pages: 0,
						emptyFlag: true,
					},
				};
			}
			// 当选择选择的是系统用户，传userType: "00"
			const param =
				deptCode === "-1"
					? { userType: "00" }
					: {
							deptCode,
							status: "0", // 0正常
							jobStatus: "1", // 1在职
						};
			const { data: result } = await pageUserList({
				account: "",
				name: name || "",

				...param,
				pageNum,
				pageSize: 20, // 每页20条
				sortItemList: [],
			});
			return result;
		},
		{
			manual: true,
			onSuccess: (result, [_deptCode, _name, pageNum, isLoadMore]) => {
				// API 返回的数据结构：result.list 和 result.total
				const resultAny = result as any;
				const newList = Array.isArray(resultAny.list) ? resultAny.list : [];
				const total = typeof resultAny.total === "number" ? resultAny.total : 0;

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
				messageApi.error("获取人员列表失败，请稍后重试");
				// 错误时清空列表
				setAllUserList([]);
				setUserListTotal(0);
			},
		},
	);

	// 初始化选中状态
	useEffect(() => {
		if (open) {
			setSelectedDeptCode("");
			setUserSearchValue("");
			setUserListPageNum(1);
			setUserListTotal(0);
			setAllUserList([]);
			setSelectedUser([]);
			setDept(null);
		}
	}, [open]);

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

	// 处理取消
	const handleCancel = () => {
		onClose();
	};

	// 清空已选人员
	const handleClearSelected = () => {
		setSelectedUser([]);
	};
	// 剔除已选人员
	const handlesubtractSelected = (userId: number) => {
		setSelectedUser(selectedUser?.filter((user: UserInfo) => user.id !== userId));
	};

	// 全选按钮
	const hanledCheckedAll = (e: any) => {
		const checked = e.target.checked;

		if (checked) {
			const newSelectedUser = uniqBy([...selectedUser, ...allUserList], "id");
			setSelectedUser(newSelectedUser);
		} else {
			const newSelectedUser = selectedUser?.filter(
				(user: UserInfo) => !allUserList?.find((e: UserInfo) => e.id === user.id),
			);
			setSelectedUser(newSelectedUser);
		}
	};
	// 处理人员选择
	const handleUserSelect = (keys: number[]) => {
		const userList = uniqBy([...selectedUser, ...allUserList], "id")?.filter(
			(e: UserInfo) =>
				!!keys?.includes(e.id) || !allUserList?.find((user: UserInfo) => user.id === e.id),
		);
		setSelectedUser(userList);
	};

	useEffect(() => {
		if (dept) {
			setSelectedDeptCode(dept.deptCode);
		}
	}, [dept]);

	const selectedUserId = useMemo(() => {
		return selectedUser?.map((user: UserInfo) => user.id);
	}, [selectedUser]);

	const deptSelectedUserId = useMemo(() => {
		return allUserList
			?.filter((user: UserInfo) => selectedUser?.find((e: UserInfo) => e.id === user.id))
			?.map((a: UserInfo) => a.id);
	}, [allUserList, selectedUser]);

	return (
		<>
			{contextHolder}
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
					<Button key="confirm" type="primary" onClick={() => onConfirm(selectedUserId)}>
						确定
					</Button>,
				]}
				closeIcon={<CloseOutlined />}
			>
				<div className="flex gap-4" style={{ height: "500px" }}>
					<div className="h-full w-1/3 rounded-md border bg-white/100">
						<UserTree dept={dept} setDept={setDept} TreeDataContext={TreeDataContext} />
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
										<div className="flex items-center justify-center">
											<Spin />
										</div>
									) : (
										<InfiniteScroll
											style={{ overflow: "hidden" }}
											dataLength={allUserList.length}
											next={loadMoreUserData}
											hasMore={allUserList.length < userListTotal}
											loader={
												<div className="flex items-center justify-center">
													<Spin />
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
											{!selectedDeptCode ? (
												<div className="py-8 text-center text-gray-400">
													请先选择组织
												</div>
											) : allUserList.length === 0 ? (
												<div className="py-8 text-center text-gray-400">
													暂无人员
												</div>
											) : (
												<div>
													<Checkbox
														checked={
															deptSelectedUserId.length > 0 &&
															deptSelectedUserId.length ===
																allUserList.length
														}
														indeterminate={
															deptSelectedUserId.length > 0 &&
															deptSelectedUserId.length <
																allUserList.length
														}
														onChange={hanledCheckedAll}
														className="mb-2"
													>
														全部
													</Checkbox>
													<Checkbox.Group
														className="flex flex-col gap-2"
														value={selectedUserId}
														options={allUserList?.map((e: UserInfo) => {
															return {
																label: e.name,
																value: e.id,
															};
														})}
														onChange={handleUserSelect}
													></Checkbox.Group>
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
										{selectedUser.length})
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
									{selectedUser.length ? (
										selectedUser.map((item: UserInfo) => {
											return (
												<div
													className="mb-2 flex items-start justify-between rounded p-2"
													style={{ background: "rgba(240, 242, 245, 1)" }}
													key={item.id}
												>
													<div className="flex-1">
														<div className="mb-1 font-medium">
															{item.name}
														</div>
														<div className="text-sm text-gray-500">
															{buildDeptPath(item.deptId, treeData) ||
																item.deptName}
														</div>
													</div>
													<Button
														type="text"
														size="small"
														icon={<CloseOutlined />}
														onClick={() =>
															handlesubtractSelected(item.id)
														}
														className="text-gray-500 hover:text-gray-700"
													/>
												</div>
											);
										})
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
			</Modal>
		</>
	);
}
