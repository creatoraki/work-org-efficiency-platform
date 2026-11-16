import type { PersonnelArchiveItem } from "#src/api/org-brain/personnel-archive";
import { ProDescriptions } from "@ant-design/pro-components";
import { Avatar, Button, Empty, Pagination, Spin, Typography } from "antd";

import { formatOrganizationPath } from "./organization-path";

const { Link, Paragraph } = Typography;

/**
 * 员工卡片视图属性
 */
interface EmployeeCardViewProps {
	/** 数据列表 */
	dataSource: PersonnelArchiveItem[];
	/** 加载状态 */
	loading?: boolean;
	/** 是否加载失败且无可展示数据 */
	loadFailed?: boolean;
	/** 重新加载回调 */
	onRetry?: () => void;
	/** 查看档案回调 */
	onViewArchive?: (record: PersonnelArchiveItem) => void;
	/** 分页配置 */
	pagination?: {
		current?: number;
		pageSize?: number;
		total?: number;
		onChange?: (page: number, pageSize: number) => void;
	};
}

/**
 * 员工卡片视图组件
 *
 * @author 王善能
 * @date 2026-04-16
 * @param props - 组件属性
 * @param props.dataSource - 数据列表
 * @param props.loading - 加载状态
 * @param props.loadFailed - 是否加载失败且无可展示数据
 * @param props.onRetry - 重新加载回调
 * @param props.onViewArchive - 查看档案回调
 * @param props.pagination - 分页配置
 * @returns 员工卡片视图元素
 */
export function EmployeeCardView({
	dataSource,
	loading,
	loadFailed,
	onRetry,
	onViewArchive,
	pagination,
}: EmployeeCardViewProps) {
	return (
		<div className="flex h-full flex-col">
			<div className="min-h-0 flex-1 overflow-auto">
				<Spin
					spinning={loading}
					size="large"
					tip="加载中..."
					wrapperClassName="h-full [&_.ant-spin-container]:h-full"
				>
					{loadFailed && dataSource.length === 0 ? (
						<div className="flex h-64 flex-col items-center justify-center gap-3">
							<Empty
								description="人员档案加载失败，请稍后重试"
								image={Empty.PRESENTED_IMAGE_SIMPLE}
							/>
							<Button type="primary" onClick={onRetry}>
								重新加载
							</Button>
						</div>
					) : loading && dataSource.length === 0 ? (
						<div className="h-64" />
					) : dataSource.length === 0 ? (
						<div className="flex h-64 items-center justify-center">
							<Empty description="暂无数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
						</div>
					) : (
						<div className="grid grid-cols-1 gap-4 pt-4 md:grid-cols-2 xl:grid-cols-3">
							{dataSource.map((record) => (
								<div
									key={record.userId}
									className="cursor-pointer rounded border bg-white p-4 transition-all duration-200 hover:-translate-y-1 hover:border-[rgb(var(--oo-colorPrimary))] hover:shadow-md"
									onClick={() => onViewArchive?.(record)}
								>
									{/* 头像和基本信息区域 */}
									<div className="mb-4 flex items-start gap-3">
										<Avatar
											size={64}
											className="flex-shrink-0 border border-[rgb(var(--oo-colorPrimaryHover))] [&_img]:object-cover [&_img]:object-center"
											src={record.avatar}
											style={{
												backgroundColor:
													"rgb(var(--oo-colorPrimary) / 0.12)",
												color: "rgb(var(--oo-colorPrimary))",
											}}
										>
											{record.name?.[0]}
										</Avatar>
										<div className="min-w-0 flex-1">
											<div className="mb-1">
												<Link
													onClick={(e) => {
														e.stopPropagation();
														onViewArchive?.(record);
													}}
													className="text-base font-medium"
												>
													{record.name}
												</Link>
											</div>
											<div className="text-xs text-gray-500">
												<Paragraph
													ellipsis={{
														rows: 2,
														tooltip: formatOrganizationPath(
															record.orgFullName || record.orgName,
														),
													}}
													className="!mb-0"
													style={{ fontSize: "12px", color: "#6b7280" }}
												>
													{`所属组织：${formatOrganizationPath(record.orgFullName || record.orgName)}`}
												</Paragraph>
											</div>
										</div>
									</div>

									{/* 详细信息区域 - 使用 ProDescriptions */}
									<ProDescriptions
										column={2}
										size="small"
										dataSource={record}
										columns={[
											{
												title: "工号",
												dataIndex: "userCode",
												key: "userCode",
											},
											{
												title: "岗位",
												dataIndex: "jobName",
												key: "jobName",
											},
											{
												title: "职位",
												dataIndex: "postName",
												key: "postName",
												render: (_text, record) =>
													record.postgradeName
														? `${record.postName} - ${record.postgradeName}`
														: record.postName,
											},
											{
												title: "入职日期",
												dataIndex: "joinDate",
												key: "joinDate",
											},
										]}
									/>
								</div>
							))}
						</div>
					)}
				</Spin>
			</div>
			{pagination && (
				<div className="flex justify-end pt-4">
					<Pagination
						current={pagination.current}
						pageSize={pagination.pageSize}
						total={pagination.total}
						onChange={pagination.onChange}
						showSizeChanger
						showQuickJumper
						showTotal={(total) => `共 ${total} 条`}
						size="small"
					/>
				</div>
			)}
		</div>
	);
}
