/**
 * 用户列表面板组件
 * 显示可选用户列表，支持搜索和无限滚动
 */

import type { UserInfo } from "#src/api/personnel-archive/common";

import { SearchOutlined } from "@ant-design/icons";
import { Divider, Empty, Form, Input, Radio, Spin, theme } from "antd";
import InfiniteScroll from "react-infinite-scroll-component";

/**
 * 用户列表面板属性接口
 */
interface UserListPanelProps {
	/** 任务名称（用于滚动容器ID） */
	taskName: number;
	/** 搜索值 */
	searchValue: string;
	/** 搜索值变化回调 */
	onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	/** 用户列表数据 */
	userList: UserInfo[];
	/** 加载状态 */
	loading: boolean;
	/** 总数 */
	total: number;
	/** 加载更多回调 */
	onLoadMore: () => void;
	/** 当前选中的用户ID */
	selectedUserId?: number;
	/** 选择用户回调 */
	onSelectUser: (user: UserInfo) => void;
}

/**
 * 用户列表面板组件
 *
 * @param props - 组件属性
 */
export function UserListPanel({
	taskName,
	searchValue,
	onSearchChange,
	userList,
	loading,
	total,
	onLoadMore,
	selectedUserId,
	onSelectUser,
}: UserListPanelProps) {
	const { token } = theme.useToken();

	return (
		<div className="flex min-h-0 flex-1 flex-col">
			<Form.Item noStyle>
				<Input
					suffix={<SearchOutlined style={{ color: token.colorTextTertiary }} />}
					placeholder="搜索姓名"
					value={searchValue}
					onChange={onSearchChange}
					allowClear
					className="mb-4"
				/>
			</Form.Item>
			<div
				id={`scrollableUserList-${taskName}`}
				className="relative min-h-0 flex-1 overflow-auto"
			>
				{loading && userList.length === 0 ? (
					<div className="absolute inset-0 flex items-center justify-center">
						<Spin />
					</div>
				) : (
					<InfiniteScroll
						dataLength={userList.length}
						next={onLoadMore}
						hasMore={userList.length < total}
						loader={
							loading ? (
								<div className="flex items-center justify-center py-4">
									<Spin size="small" />
								</div>
							) : null
						}
						endMessage={
							userList.length > 0 && userList.length >= total ? (
								<div className="py-4 text-center">
									<Divider plain className="my-0">
										<span className="text-xs text-gray-400">
											没有更多数据了
										</span>
									</Divider>
								</div>
							) : null
						}
						scrollableTarget={`scrollableUserList-${taskName}`}
						style={{ minHeight: "100%" }}
					>
						{!loading && userList.length === 0 ? (
							<div className="py-12 text-center">
								<Empty
									description="暂无人员"
									image={Empty.PRESENTED_IMAGE_SIMPLE}
								/>
							</div>
						) : (
							<div className="space-y-1">
								{userList.map((user: UserInfo) => (
									<div
										key={user.id}
										className="cursor-pointer rounded px-2 py-1 transition-colors hover:bg-gray-50"
										onClick={() => onSelectUser(user)}
									>
										<Radio
											checked={selectedUserId === user.id}
											onChange={() => onSelectUser(user)}
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
	);
}
