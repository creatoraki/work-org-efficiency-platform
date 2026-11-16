import type {
	ApprovalData,
	ApprovalDetailRow,
	ApprovalDistributionRow,
	ApprovalEmployee,
	ApprovalEmployeeQuery,
} from "#src/api/performance-management/approval";
import type { RatingOrgNode } from "#src/api/performance-management/todo";
import type { TableColumnsType } from "antd";

import {
	ApprovalTab,
	fetchApprovalDetail,
	filterApprovalDetails,
	filterApprovalEmployees,
	saveApprovalDraft,
} from "#src/api/performance-management/approval";
import {
	fetchRatingOrgTree,
	RatingNodeType,
	RatingTodoStatus,
} from "#src/api/performance-management/todo";
import { SectionTitle } from "#src/pages/performance-management/annual-rating/components/section-title";
import { useAnnualRatingDict } from "#src/pages/performance-management/annual-rating/hooks/use-annual-rating-dict";
import {
	CloseCircleOutlined,
	DownOutlined,
	FileTextOutlined,
	InfoCircleOutlined,
	LeftOutlined,
	RightOutlined,
} from "@ant-design/icons";
import {
	Button,
	ConfigProvider,
	Drawer,
	Dropdown,
	Input,
	message,
	Select,
	Table,
	Tree,
} from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ApprovalAuditDrawer } from "./approval-audit-drawer";
import {
	APPROVAL_TABLE_CLASS,
	APPROVAL_TABLE_THEME,
	approvalStatusTagClass,
} from "./approval-constants";
import {
	ApprovalEmployeeFilterBar,
	ApprovalExportButton,
	ApprovalStatus,
	DistributionBasisRule,
	OrgTreeSearchInput,
} from "./approval-shared";
import { ApprovalSubmitDrawer } from "./approval-submit-drawer";
import { getApprovalDistributionColumns, getApprovalEmployeeColumns } from "./columns";
import { FillerPickerModal } from "./filler-picker-modal";

const EMPLOYEE_COLUMNS = getApprovalEmployeeColumns(true);

/** 状态页签配置 */
const TAB_ITEMS: Array<{ key: ApprovalTab; label: string }> = [
	{ key: ApprovalTab.SHOULD_FINISH, label: "应完成" },
	{ key: ApprovalTab.PENDING, label: "待完成" },
	{ key: ApprovalTab.SUBMITTED, label: "已提交-待审核" },
	{ key: ApprovalTab.REJECTED, label: "被驳回" },
	{ key: ApprovalTab.FINISHED, label: "已完成" },
];

/**
 * 审批抽屉属性
 */
interface ApprovalDrawerProps {
	/** 待办标识 */
	todoId: string;
	/** 是否可见 */
	open: boolean;
	/** 是否只读（已完成 / 查看） */
	readonly?: boolean;
	/** 节点类型（审批 / 审定），来自待办行 */
	nodeType?: RatingNodeType;
	/** 关闭回调 */
	onClose: () => void;
	/** 提交完成回调 */
	onSubmitted?: () => void;
}

/**
 * 审批抽屉
 *
 * 左侧组织树，右侧依次为评级信息、状态页签、完成明细、等级分布、审批名单；
 * 底部提供取消 / 暂存 / 提交，完成明细可进入审核抽屉或查看只读详情。
 *
 * @param props - 组件属性
 * @param props.todoId - 待办标识
 * @param props.open - 是否可见
 * @param props.readonly - 是否只读
 * @param props.nodeType - 节点类型（审批 / 审定）
 * @param props.onClose - 关闭回调
 * @param props.onSubmitted - 提交完成回调
 * @returns 审批抽屉
 *
 * @author 王善能
 * @since 2026-11-12
 */
export function ApprovalDrawer({
	todoId,
	open,
	readonly = false,
	nodeType,
	onClose,
	onSubmitted,
}: ApprovalDrawerProps) {
	const [data, setData] = useState<ApprovalData>();
	const [tab, setTab] = useState<ApprovalTab>(ApprovalTab.SHOULD_FINISH);
	const [versionId, setVersionId] = useState<string>();
	const [detailQuery, setDetailQuery] = useState<{ submitter?: string; status?: string }>({});
	const [employeeQuery, setEmployeeQuery] = useState<ApprovalEmployeeQuery>({});
	const [appliedEmployeeQuery, setAppliedEmployeeQuery] = useState<ApprovalEmployeeQuery>({});
	const [auditOpen, setAuditOpen] = useState(false);
	const [auditDetail, setAuditDetail] = useState<ApprovalDetailRow>();
	const [auditReadonly, setAuditReadonly] = useState(false);
	const [submitOpen, setSubmitOpen] = useState(false);
	const [fillerOpen, setFillerOpen] = useState(false);
	const [collaborators, setCollaborators] = useState<string[]>([]);
	const [saving, setSaving] = useState(false);
	const [selectedOrgKey, setSelectedOrgKey] = useState<string>();
	const [treeCollapsed, setTreeCollapsed] = useState(false);
	const [orgTree, setOrgTree] = useState<RatingOrgNode[]>([]);
	const { statusOptions, statusLabel, nodeTypeLabel, assessTypeLabel } = useAnnualRatingDict();

	const handleSaveDraft = async () => {
		if (!data) return;
		setSaving(true);
		try {
			await saveApprovalDraft({
				todoId: data.todoId,
				versionId: data.currentVersionId,
				distributionExceptionNote: data.distributionExceptionNote,
				collaborators,
				employees: data.employees.map((item) => ({
					id: item.id,
					submitScore: item.submitScore,
					submitLevel: item.submitLevel,
					exceptionNote: item.exceptionNote,
				})),
			});
			message.success("已暂存");
		} finally {
			setSaving(false);
		}
	};

	useEffect(() => {
		if (!open || !todoId) {
			setVersionId(undefined);
			return;
		}
		setData(undefined);
		if (versionId === undefined) {
			setTab(ApprovalTab.SHOULD_FINISH);
		}
		fetchApprovalDetail({ todoId, versionId }).then((result) => {
			setData(result);
			setCollaborators(result.ratingInfo.collaborators);
		});
	}, [open, todoId, versionId]);

	/** 组织树与任务详情并行加载 */
	useEffect(() => {
		if (!open) {
			return;
		}
		let cancelled = false;
		fetchRatingOrgTree()
			.then((tree) => {
				if (cancelled) {
					return;
				}
				setOrgTree(tree);
				setSelectedOrgKey(tree[0]?.id);
			})
			.catch(() => {
				if (!cancelled) {
					setOrgTree([]);
				}
			});
		return () => {
			cancelled = true;
		};
	}, [open]);

	const detailRows = useMemo(() => {
		if (!data) return [];
		const byTab = data.details.filter((row) => {
			if (tab === ApprovalTab.SHOULD_FINISH) return true;
			const map: Record<string, RatingTodoStatus> = {
				[ApprovalTab.PENDING]: RatingTodoStatus.PENDING,
				[ApprovalTab.SUBMITTED]: RatingTodoStatus.SUBMITTED,
				[ApprovalTab.REJECTED]: RatingTodoStatus.REJECTED,
				[ApprovalTab.FINISHED]: RatingTodoStatus.COMPLETED,
			};
			return row.status === map[tab];
		});
		return filterApprovalDetails(byTab, detailQuery);
	}, [data, tab, detailQuery]);

	const employees = useMemo(
		() => (data ? filterApprovalEmployees(data.employees, appliedEmployeeQuery) : []),
		[data, appliedEmployeeQuery],
	);

	const visibleTabs = useMemo(
		() =>
			nodeType === RatingNodeType.FINALIZE
				? TAB_ITEMS.filter((item) => item.key !== ApprovalTab.REJECTED)
				: TAB_ITEMS,
		[nodeType],
	);

	/**
	 * 点击等级分布的实际人数单元格时，联动筛选提报名单。
	 *
	 * @param level - 点击的等级（A / B+ / B / C/D）
	 * @param record - 当前等级分布行
	 */
	const handleActualClick = useCallback(
		(level: string, record: ApprovalDistributionRow) => {
			const next: ApprovalEmployeeQuery = {
				...employeeQuery,
				submitLevel: level,
				positionCategory: record.isTotal ? undefined : record.positionCategory,
			};
			setEmployeeQuery(next);
			setAppliedEmployeeQuery(next);
		},
		[employeeQuery],
	);

	const distributionColumns = useMemo(
		() => getApprovalDistributionColumns({ onActualClick: handleActualClick }),
		[handleActualClick],
	);

	const detailColumns = useMemo<TableColumnsType<ApprovalDetailRow>>(
		() => [
			{ title: "组织名称", dataIndex: "orgName", key: "orgName", width: 220 },
			{ title: "提交人", dataIndex: "submitter", key: "submitter", width: 90 },
			{ title: "人数", dataIndex: "totalCount", key: "totalCount", width: 70 },
			...(nodeType === RatingNodeType.FINALIZE
				? [
						{
							title: "流程编号",
							dataIndex: "processNo",
							key: "processNo",
							width: 160,
							render: (value?: string) =>
								value ? (
									<button
										type="button"
										className="cursor-pointer border-0 bg-transparent p-0 text-sm leading-[22px] text-[#0075FF]"
										onClick={() =>
											message.info("跳转 OA 查看流程（功能开发中）")
										}
									>
										{value}
									</button>
								) : (
									""
								),
						} satisfies TableColumnsType<ApprovalDetailRow>[number],
					]
				: []),
			{
				title: "分布校验",
				key: "distributionCheck",
				width: 130,
				// 接口暂未下发分布校验结果，先按驳回状态推导，待接口补齐后替换
				render: (_value: unknown, record: ApprovalDetailRow) => {
					const passed = record.status !== RatingTodoStatus.REJECTED;
					const color = passed ? "#14B968" : "#F5222D";
					return (
						<span
							className="flex items-center gap-1 whitespace-nowrap"
							style={{ color }}
						>
							<span
								className="size-1.5 shrink-0 rounded-full"
								style={{ backgroundColor: color }}
							/>
							{passed ? "校验通过" : "校验异常"}
						</span>
					);
				},
			},
			{
				title: "分布情况",
				dataIndex: "distribution",
				key: "distribution",
				width: 190,
				render: (value: string) => (
					<span className="flex flex-wrap gap-1">
						{value
							.split(" ")
							.filter(Boolean)
							.map((part) => (
								<span
									key={part}
									className="rounded-[2px] bg-[#EBEEF5] px-2 text-xs leading-5 text-[#323233]"
								>
									{part}
								</span>
							))}
					</span>
				),
			},
			{
				title: "异常情况说明",
				dataIndex: "exceptionNote",
				key: "exceptionNote",
				ellipsis: true,
			},
			{
				title: "状态",
				dataIndex: "status",
				fixed: "right",
				key: "status",
				width: 100,
				render: (value: string) => <ApprovalStatus status={value} />,
			},
			{
				title: "操作",
				key: "action",
				width: 90,
				render: (_value: unknown, record: ApprovalDetailRow) =>
					record.action === "audit" && !readonly ? (
						<button
							type="button"
							className="cursor-pointer border-0 bg-transparent p-0 text-sm leading-[22px] text-[#0075FF]"
							onClick={() => {
								setAuditDetail(record);
								setAuditReadonly(false);
								setAuditOpen(true);
							}}
						>
							审核
						</button>
					) : (
						<button
							type="button"
							className="cursor-pointer border-0 bg-transparent p-0 text-sm leading-[22px] text-[#0075FF]"
							onClick={() => {
								setAuditDetail(record);
								setAuditReadonly(true);
								setAuditOpen(true);
							}}
						>
							查看
						</button>
					),
			},
		],
		[readonly, nodeType],
	);

	return (
		<>
			<Drawer
				open={open}
				onClose={onClose}
				width={1536}
				closable={{ closeIcon: <CloseCircleOutlined style={{ fontSize: 26 }} /> }}
				styles={{
					// 抽屉主体不再整体滚动，交给左右两栏各自内部滚动
					body: { display: "flex", flexDirection: "column", overflow: "hidden" },
				}}
				title={
					<span className="flex items-center gap-3 text-[20px] font-semibold leading-[28px] text-[#323233]">
						{data ? `${data.ratingInfo.planName}-审批` : (nodeType ?? "审批")}
						{data && data.versions.length > 0 ? (
							<Dropdown
								menu={{
									items: data.versions.map((version) => ({
										key: version.id,
										label: version.name,
									})),
									selectedKeys: [versionId ?? data.currentVersionId],
									onClick: ({ key }) => setVersionId(key),
								}}
							>
								<button
									type="button"
									className="flex h-8 cursor-pointer items-center gap-1 rounded-[3px] border border-[#E4E7ED] bg-white px-4 text-sm font-normal leading-[22px] text-[#323233]"
								>
									<FileTextOutlined className="text-base" />
									查看提交版本
								</button>
							</Dropdown>
						) : null}
					</span>
				}
				footer={
					readonly ? (
						<div className="flex justify-end">
							<Button className="rounded-[3px] border-[#E4E7ED]" onClick={onClose}>
								关闭
							</Button>
						</div>
					) : (
						<div className="flex justify-end gap-2">
							<Button className="rounded-[3px] border-[#E4E7ED]" onClick={onClose}>
								取消
							</Button>
							<Button
								className="rounded-[3px] border-[#E4E7ED]"
								loading={saving}
								onClick={handleSaveDraft}
							>
								暂存
							</Button>
							<Button
								type="primary"
								className="rounded-[3px] bg-[#0075FF]"
								onClick={() => setSubmitOpen(true)}
							>
								提交
							</Button>
						</div>
					)
				}
			>
				<ConfigProvider theme={APPROVAL_TABLE_THEME}>
					<div className="flex min-h-0 flex-1 gap-6">
						{/* 左侧组织树 */}
						<div
							className={`relative flex min-h-0 shrink-0 flex-col ${treeCollapsed ? "w-0" : "w-[380px]"}`}
						>
							{treeCollapsed ? null : (
								<div className="flex min-h-0 flex-1 flex-col rounded border border-[#EBEEF5] p-4">
									<div className="shrink-0">
										<OrgTreeSearchInput placeholder="支持模糊搜索" />
									</div>
									{/* 树内容超出时在左栏内部滚动，不再撑高整行 */}
									<div className="min-h-0 flex-1 overflow-auto">
										<Tree
											// antd 原生连线：叶子节点用折线端点，不用默认文件图标
											showLine={{ showLeafIcon: false }}
											defaultExpandAll
											treeData={toAntdTree(orgTree)}
											selectedKeys={selectedOrgKey ? [selectedOrgKey] : []}
											onSelect={(keys) =>
												setSelectedOrgKey(
													keys.length ? String(keys[0]) : undefined,
												)
											}
											blockNode
											className="text-sm [&_.ant-tree-node-selected]:!bg-transparent [&_.ant-tree-node-selected]:!text-[#0075FF] [&_.ant-tree-treenode]:min-h-[30px]"
										/>
									</div>
								</div>
							)}
							<button
								type="button"
								aria-label={treeCollapsed ? "展开组织树" : "收起组织树"}
								className="absolute -right-3 top-1/2 z-10 flex size-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-[#E4E7ED] bg-white text-[#606266]"
								onClick={() => setTreeCollapsed((current) => !current)}
							>
								{treeCollapsed ? (
									<RightOutlined className="text-[10px]" />
								) : (
									<LeftOutlined className="text-[10px]" />
								)}
							</button>
						</div>
						{/* 右侧内容 */}
						<div className="flex min-h-0 min-w-0 flex-1 flex-col">
							{/* 评级信息 */}
							<div className="mb-3 shrink-0">
								<SectionTitle
									title="评级信息"
									extra={
										data ? (
											<span className="text-sm leading-[22px] text-[#606266]">
												总人数：{data.totalCount.toLocaleString()}
											</span>
										) : null
									}
								/>
								<div className="flex gap-3">
									<div className="grid flex-1 grid-cols-8 gap-x-6 gap-y-4 rounded-[3px] bg-[#F5F7FA] p-3">
										{data
											? [
													["计划名称", data.ratingInfo.planName],
													["周期", data.ratingInfo.cycle],
													[
														"考核类型",
														assessTypeLabel(data.ratingInfo.assessType),
													],
													[
														"节点类型",
														nodeTypeLabel(
															nodeType ?? data.ratingInfo.nodeType,
														),
													],
													["执行范围", data.ratingInfo.executeScope],
													["执行人", data.ratingInfo.executor],
													["有效期", data.ratingInfo.validDate],
												].map(([label, value]) => (
													<div
														key={label}
														className="flex flex-col gap-1"
													>
														<span className="text-sm leading-[22px] text-[#606266]">
															{label}
														</span>
														<span className="text-sm leading-[22px] text-black">
															{value}
														</span>
													</div>
												))
											: null}
										<div className="flex flex-col gap-1">
											<span className="text-sm leading-[22px] text-[#606266]">
												状态
											</span>
											<span
												className={`w-fit rounded-[3px] px-2 text-xs leading-5 ${approvalStatusTagClass(data?.ratingInfo.status ?? "")}`}
											>
												{statusLabel(data?.ratingInfo.status)}
											</span>
										</div>
									</div>
									{nodeType === RatingNodeType.FINALIZE ? (
										<div className="w-[320px] shrink-0 rounded-[3px] bg-[#F7F8FA] px-4 py-3">
											<span className="flex items-center gap-1 text-sm leading-[22px] text-[#606266]">
												协作人
												<InfoCircleOutlined className="text-xs text-[#909399]" />
											</span>
											{readonly ? (
												<span className="mt-1 block text-sm leading-[22px] text-black">
													{collaborators.length
														? collaborators.join("、")
														: "无"}
												</span>
											) : (
												<button
													type="button"
													className="mt-1 flex h-8 w-full cursor-pointer items-center justify-between rounded-[3px] border border-[#E4E7ED] bg-white px-3 text-left text-sm leading-[22px] text-[#606266]"
													onClick={() => setFillerOpen(true)}
												>
													<span className="truncate">
														{collaborators.length
															? collaborators.join("、")
															: "请选择"}
													</span>
													<DownOutlined className="text-[10px] text-[#909399]" />
												</button>
											)}
										</div>
									) : null}
								</div>
							</div>
							{/* 状态页签 */}
							<div className="mb-4 flex shrink-0 items-center border-b border-[#EBEEF5]">
								{visibleTabs.map((item) => (
									<button
										key={item.key}
										type="button"
										className={`-mb-px h-12 shrink-0 cursor-pointer border-0 border-b-2 border-solid bg-transparent px-4 text-sm leading-[22px] ${
											tab === item.key
												? "border-[#0075FF] font-medium text-[#0075FF]"
												: "border-transparent text-[#606266]"
										}`}
										onClick={() => setTab(item.key)}
									>
										{item.label}
										{data
											? `（${data.tabCounts[item.key].toLocaleString()}）`
											: ""}
									</button>
								))}
							</div>
							{/* 页签之下：仅该区域滚动，评级信息与页签保持固定 */}
							<div className="min-h-0 flex-1 overflow-y-auto pr-2">
								{/* 完成明细 */}
								<div className="mb-4">
									<SectionTitle title="完成明细" />
									<div className="mb-4 flex items-center gap-3 border-b border-[#EBEEF5] pb-4">
										<div className="flex h-8 w-[280px] items-center rounded-[3px] border border-[#DCDFE6] bg-white pl-3">
											<span className="mr-3 shrink-0 text-sm leading-[22px] text-[#606266]">
												提交人
											</span>
											<Input
												allowClear
												bordered={false}
												placeholder="支持模糊搜索"
												value={detailQuery.submitter}
												onChange={(e) =>
													setDetailQuery((current) => ({
														...current,
														submitter: e.target.value || undefined,
													}))
												}
											/>
										</div>
										<div className="flex h-8 w-[240px] items-center rounded-[3px] border border-[#E4E7ED] bg-white pl-3">
											<span className="mr-3 shrink-0 text-sm leading-[22px] text-[#606266]">
												状态
											</span>
											<Select
												allowClear
												bordered={false}
												className="flex-1"
												placeholder="请选择"
												options={statusOptions}
												value={detailQuery.status}
												onChange={(value) =>
													setDetailQuery((current) => ({
														...current,
														status: value,
													}))
												}
											/>
										</div>
										<div className="flex flex-1 items-center justify-end gap-2">
											<Button
												type="primary"
												className="rounded-[3px] bg-[#0075FF]"
											>
												查询
											</Button>
											<Button
												type="text"
												className="px-2 text-[#606266]"
												onClick={() => setDetailQuery({})}
											>
												重置
											</Button>
										</div>
									</div>
									<Table<ApprovalDetailRow>
										rowKey="key"
										size="middle"
										columns={detailColumns}
										dataSource={detailRows}
										pagination={false}
										className={APPROVAL_TABLE_CLASS}
									/>
								</div>
								{/* 等级分布 */}
								<div className="mb-4">
									<SectionTitle
										title="等级分布"
										badge={
											<span className="rounded-[3px] bg-[#FEE4E6] px-2 text-xs leading-5 text-[#F5222D]">
												校验异常
											</span>
										}
										extra={
											data ? (
												<span className="flex items-center text-base leading-6 text-[#323233]">
													总人数：
													{data.totalCount.toLocaleString()}
													<span
														className="mx-3 h-[17px] w-0.5 bg-[#E4E7ED]"
														aria-hidden
													/>
													已填报人数：
													{data.filledCount.toLocaleString()}
												</span>
											) : null
										}
									/>
									<Table
										rowKey="key"
										size="middle"
										pagination={false}
										bordered
										className={APPROVAL_TABLE_CLASS}
										dataSource={data?.distributionRows ?? []}
										columns={distributionColumns}
										onRow={(record) =>
											record.isTotal ? { className: "font-medium" } : {}
										}
									/>
									<div className="mt-2">
										<DistributionBasisRule />
									</div>
								</div>
								{/* 审批名单 */}
								<div>
									<SectionTitle
										title="审批名单"
										extra={<ApprovalExportButton employees={employees} />}
									/>
									<ApprovalEmployeeFilterBar
										value={employeeQuery}
										onChange={(patch) =>
											setEmployeeQuery((current) => ({
												...current,
												...patch,
											}))
										}
										onSearch={() => setAppliedEmployeeQuery(employeeQuery)}
										onReset={() => {
											setEmployeeQuery({});
											setAppliedEmployeeQuery({});
										}}
									/>
									<Table<ApprovalEmployee>
										rowKey="id"
										size="middle"
										columns={EMPLOYEE_COLUMNS}
										dataSource={employees}
										scroll={{ x: 1384 }}
										pagination={{
											defaultPageSize: 20,
											showSizeChanger: true,
											showTotal: (total) => `共${total}条`,
										}}
										className={APPROVAL_TABLE_CLASS}
									/>
								</div>
							</div>
						</div>
					</div>
				</ConfigProvider>
			</Drawer>
			<ApprovalAuditDrawer
				open={auditOpen}
				data={data}
				detail={auditDetail}
				readonly={auditReadonly}
				onClose={() => setAuditOpen(false)}
				onAudited={() => {
					if (todoId) {
						fetchApprovalDetail({ todoId, versionId }).then(setData);
					}
				}}
			/>
			<FillerPickerModal
				open={fillerOpen}
				onClose={() => setFillerOpen(false)}
				onOk={(members) => setCollaborators(members.map((item) => item.name))}
			/>
			<ApprovalSubmitDrawer
				open={submitOpen}
				data={data}
				collaborators={collaborators}
				onClose={() => setSubmitOpen(false)}
				onVersionChange={(next) => setVersionId(next)}
				onSubmitted={() => {
					if (todoId) {
						fetchApprovalDetail({ todoId, versionId }).then(setData);
					}
					onSubmitted?.();
				}}
			/>
		</>
	);
}

/**
 * 组织树转换为 antd Tree 数据
 *
 * @param nodes - 接口组织树
 * @returns antd Tree 节点
 */
function toAntdTree(
	nodes: RatingOrgNode[],
): Array<{ key: string; title: string; children?: ReturnType<typeof toAntdTree> }> {
	return nodes.map((node) => ({
		key: node.id,
		title: node.name,
		children: node.children ? toAntdTree(node.children) : undefined,
	}));
}
