import type { ActionType, ProColumns } from "@ant-design/pro-components";
import type { JobDescAuditBatchParams, JobDescAuditItem, JobDescAuditStatus } from "./types";
import { fetchOrganizationTree } from "#src/api/common";
import {
	batchAuditJobDescAudit,
	fetchJobDescAuditList,
	fetchJobDescAuditSearchOptions,
	fetchJobDescAuditStatistics,
} from "#src/api/tag-management/job-desc/audit";
import AuditApprovedStatusIcon from "#src/assets/svg/audit_approved_status.svg?react";
import AuditPendingReviewStatusIcon from "#src/assets/svg/audit_pending_review_status.svg?react";
import AuditRejectedStatusIcon from "#src/assets/svg/audit_rejected_status.svg?react";
import ExpandIcon from "#src/assets/svg/expand.svg?react";
import { BasicButton } from "#src/components/basic-button";
import { BasicContent } from "#src/components/basic-content";
import { BasicTable } from "#src/components/basic-table";
import { useDict } from "#src/hooks";
import { ExclamationCircleFilled } from "@ant-design/icons";
import { useRequest } from "ahooks";
import {
	Badge,
	Button,
	Card,
	Divider,
	Dropdown,
	Form,
	Input,
	message,
	Modal,
	Space,
	Statistic,
	Typography,
} from "antd";
import { useEffectOnActive } from "keepalive-for-react";
import React, { useCallback, useRef, useState } from "react";
import CountUp from "react-countup";
import { TABLE_CONFIG, TAG_DICT_KEYS, TAG_MANAGEMENT_PERMISSIONS } from "../../config";
import { JobDescDrawer } from "../components/job-desc-drawer";
import { formatDescription, formatDescriptionForTooltip } from "../utils";
import { JOB_DESC_AUDIT_STATUS } from "./types";

const { TextArea } = Input;
const { Link } = Typography;

/**
 * 岗位描述管理 - 岗位描述审核
 */
const JobDescAudit: React.FC = React.memo(() => {
	const actionRef = useRef<ActionType>();

	// 抽屉状态管理
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);
	const [selectedJobDescData, setSelectedJobDescData] = useState<JobDescAuditItem | null>(null);
	const [mode, setMode] = useState<"view" | "audit">("view"); // 抽屉模式：查看详情或审核

	// 审核弹窗状态管理
	const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
	const [pendingAuditStatus, setPendingAuditStatus] = useState<Exclude<JobDescAuditStatus, "0">>(
		JOB_DESC_AUDIT_STATUS.APPROVED,
	);
	const [auditForm] = Form.useForm();
	const [batchAuditForm] = Form.useForm();

	// 批量操作状态管理
	const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
	const [selectedRows, setSelectedRows] = useState<JobDescAuditItem[]>([]);
	const [isBatchAuditModalOpen, setIsBatchAuditModalOpen] = useState(false);

	// 审核操作请求
	const { runAsync: runAuditRequest, loading: auditActionLoading } = useRequest(
		async (payload: JobDescAuditBatchParams) => {
			await batchAuditJobDescAudit(payload);
			return true;
		},
		{ manual: true },
	);

	// 批量审核请求
	const { runAsync: runBatchAuditRequest, loading: batchAuditLoading } = useRequest(
		async (payload: JobDescAuditBatchParams) => {
			// axios-request 拦截器已处理 code 检查，成功时返回 data（boolean）
			await batchAuditJobDescAudit(payload);
			return true;
		},
		{ manual: true },
	);

	// 获取审核状态字典
	const { valueMap: auditStatusValueMap, options: auditStatusDictOptions } = useDict(
		TAG_DICT_KEYS.AUDIT_STATUS,
	);
	const { options: auditDeptDictOptions = [], valueMap: auditDeptValueMap } = useDict(
		TAG_DICT_KEYS.JOB_AUDIT_DEPT,
	);

	// 加载统计数据（使用 useRequest）
	const {
		data: {
			pendingCount = 0,
			passedCount = 0,
			rejectedCount = 0,
			passedThisMonthCount = 0,
			rejectedThisMonthCount = 0,
		} = {},
		refresh: refreshStatistics,
	} = useRequest(
		async () => {
			const res = await fetchJobDescAuditStatistics();
			return res;
		},
		{
			onError: (error) => {
				console.error("加载统计数据失败:", error);
			},
		},
	);

	// 加载搜索下拉选项
	const {
		data: searchOptions,
		loading: searchOptionsLoading,
		refresh: refreshSearchOptions,
	} = useRequest(fetchJobDescAuditSearchOptions, {
		onError: (error) => {
			console.error("加载搜索选项失败:", error);
		},
	});
	const {
		positionOptions = [],
		postGradeOptions = [],
		submitterOptions = [],
		auditDeptOptions = [],
		auditorOptions = [],
	} = searchOptions ?? {};
	const { data: organizationTreeOptions = [] } = useRequest(
		async () => {
			const result = await fetchOrganizationTree();
			if (Array.isArray(result)) {
				return result;
			}
			if (result) {
				return [result];
			}
			return [];
		},
		{
			cacheKey: "job-desc-audit-dept-tree",
			cacheTime: 5 * 60 * 1000,
			staleTime: 5 * 60 * 1000,
		},
	);

	/**
	 * 页面从其他标签页切回当前缓存页时，主动刷新列表和统计，
	 * 避免从人员档案等页面返回后仍展示旧数据。
	 *
	 * @returns void
	 * @author 王善能
	 * @since 2026-07-07
	 */
	useEffectOnActive(
		() => {
			actionRef.current?.reload();
			refreshStatistics();
			refreshSearchOptions();
		},
		[],
		true,
	);

	// 处理搜索
	const handleSearch = async (params: any) => {
		try {
			const { current, pageSize, ...searchParams } = params;

			const searchParamsForApi = {
				...searchParams,
				pageNum: current || 1,
				pageSize: pageSize || 10,
			};

			const response = await fetchJobDescAuditList(searchParamsForApi);

			return {
				data: response.list || [],
				success: true,
				total: response.total || 0,
			};
		} catch (error) {
			console.error("获取标签审核列表失败:", error);
			return {
				data: [],
				success: false,
				total: 0,
			};
		}
	};

	// 审核操作 - 打开审核抽屉
	const handleAudit = (record: JobDescAuditItem) => {
		setSelectedJobDescData(record);
		setMode("audit");
		setIsDrawerOpen(true);
	};

	// 查看审核详情 - 打开详情抽屉
	const handleViewRecords = useCallback((record: JobDescAuditItem) => {
		setSelectedJobDescData(record);
		setMode("view");
		setIsDrawerOpen(true);
	}, []);

	// 关闭抽屉
	const handleCloseDrawer = useCallback(() => {
		setIsDrawerOpen(false);
		setSelectedJobDescData(null);
		setMode("view");
	}, []);

	const submitAudit = useCallback(
		async (status: Exclude<JobDescAuditStatus, "0">, comment?: string) => {
			if (!selectedJobDescData) {
				message.warning("请选择要审核的岗位描述");
				return false;
			}
			setPendingAuditStatus(status);
			try {
				await runAuditRequest({
					ids: [selectedJobDescData.id],
					auditStatus: status,
					auditComment: comment,
				});
				message.success(
					status === JOB_DESC_AUDIT_STATUS.APPROVED ? "审核通过成功" : "审核驳回成功",
				);
				setIsAuditModalOpen(false);
				auditForm.resetFields();
				handleCloseDrawer();
				actionRef.current?.reload();
				refreshStatistics();
				refreshSearchOptions();
				return true;
			} catch (error) {
				console.error("审核操作失败:", error);
				return false;
			}
		},
		[
			selectedJobDescData,
			runAuditRequest,
			auditForm,
			handleCloseDrawer,
			refreshStatistics,
			refreshSearchOptions,
		],
	);

	// 处理审核操作
	const handleAuditAction = useCallback(
		(status: Exclude<JobDescAuditStatus, "0">) => {
			if (!selectedJobDescData) {
				message.warning("请选择要审核的岗位描述");
				return;
			}
			if (status === JOB_DESC_AUDIT_STATUS.APPROVED) {
				Modal.confirm({
					title: "请确认是否通过",
					content: `通过对象： ${selectedJobDescData.jobName || "-"}`,
					icon: <ExclamationCircleFilled />,
					centered: true,
					okText: "确认",
					cancelText: "取消",
					onOk: () => submitAudit(status),
				});
				return;
			}
			setPendingAuditStatus(status);
			setIsAuditModalOpen(true);
		},
		[selectedJobDescData, submitAudit],
	);

	// 提交审核
	const handleSubmitAudit = useCallback(async () => {
		try {
			const values = await auditForm.validateFields();
			await submitAudit(pendingAuditStatus, values.auditComment);
		} catch (error) {
			console.error("表单验证失败:", error);
		}
	}, [auditForm, pendingAuditStatus, submitAudit]);

	const canAuditRecord = useCallback(
		(record: JobDescAuditItem) => record.auditStatus === JOB_DESC_AUDIT_STATUS.PENDING,
		[],
	);

	// 取消审核弹窗
	const handleCancelAudit = useCallback(() => {
		if (auditActionLoading) {
			return;
		}
		setIsAuditModalOpen(false);
		auditForm.resetFields();
	}, [auditActionLoading, auditForm]);

	// 检查批量审核按钮是否应该禁用
	const isBatchAuditDisabled = () =>
		selectedRows.length === 0 || !selectedRows.some(canAuditRecord);

	/**
	 * 执行批量审核
	 *
	 * 仅提交当前仍处于待审核状态的记录；服务端会再次校验，避免列表状态过期时误处理。
	 *
	 * @param status 审核结果
	 * @param auditComment 审核意见，驳回时必填
	 * @returns 无返回值
	 *
	 * @author 王善能
	 * @since 2026-08-10
	 */
	const submitBatchAudit = useCallback(
		async (status: Exclude<JobDescAuditStatus, "0">, auditComment?: string) => {
			if (selectedRowKeys.length === 0) {
				message.warning("请先选择要审核的岗位描述");
				return;
			}

			// 只对"待审核"状态的岗位描述进行批量审核
			const validRows = selectedRows.filter(canAuditRecord);

			if (validRows.length === 0) {
				message.warning("选中的岗位描述中没有待审核状态的记录");
				return;
			}

			const validCount = validRows.length;

			const executeAudit = async () => {
				try {
					await runBatchAuditRequest({
						ids: validRows.map((row) => String(row.id)),
						auditStatus: status,
						auditComment,
					});
					message.success(
						`批量${status === JOB_DESC_AUDIT_STATUS.APPROVED ? "通过" : "驳回"}成功，共处理 ${validCount} 个岗位描述`,
					);
					setSelectedRowKeys([]);
					setSelectedRows([]);
					setIsBatchAuditModalOpen(false);
					batchAuditForm.resetFields();
					actionRef.current?.reload();
					refreshStatistics(); // 刷新统计数据
					refreshSearchOptions();
				} catch (error) {
					console.error("批量审核操作失败:", error);
					throw error;
				}
			};

			await executeAudit();
		},
		[
			selectedRowKeys,
			selectedRows,
			canAuditRecord,
			runBatchAuditRequest,
			batchAuditForm,
			refreshStatistics,
			refreshSearchOptions,
		],
	);

	const handleBatchAudit = useCallback(
		(status: Exclude<JobDescAuditStatus, "0">) => {
			if (selectedRows.length === 0 || !selectedRows.some(canAuditRecord)) {
				return;
			}
			if (status === JOB_DESC_AUDIT_STATUS.APPROVED) {
				const jobNames = selectedRows
					.filter(canAuditRecord)
					.map((row) => row.jobName)
					.join("、");
				Modal.confirm({
					title: "请确认是否批量通过",
					content: `通过对象： ${jobNames}`,
					icon: <ExclamationCircleFilled />,
					centered: true,
					okText: "确认",
					cancelText: "取消",
					onOk: () => submitBatchAudit(status),
				});
				return;
			}
			batchAuditForm.resetFields();
			setIsBatchAuditModalOpen(true);
		},
		[selectedRows, canAuditRecord, batchAuditForm, submitBatchAudit],
	);

	const handleSubmitBatchAction = useCallback(
		async (status: Exclude<JobDescAuditStatus, "0">) => {
			const auditComment = batchAuditForm.getFieldValue("auditComment");
			if (status === JOB_DESC_AUDIT_STATUS.REJECTED) {
				try {
					await batchAuditForm.validateFields(["auditComment"]);
				} catch {
					return;
				}
			}
			if (status === JOB_DESC_AUDIT_STATUS.REJECTED && !String(auditComment || "").trim()) {
				batchAuditForm.setFields([{ name: "auditComment", errors: ["请填写驳回原因"] }]);
				return;
			}
			await submitBatchAudit(status, auditComment);
		},
		[batchAuditForm, submitBatchAudit],
	);

	// 表格列配置
	const columns: ProColumns<JobDescAuditItem>[] = [
		{
			title: "岗位名称",
			dataIndex: "jobName",
			key: "jobName",
			width: 150,
			ellipsis: true,
			hideInSearch: false,
			valueType: "text",
			formItemProps: {
				colon: false,
				className: "rounded border-[1px] border-[#DCDFE6]",
			},
			fieldProps: {
				placeholder: "请输入岗位名称",
				variant: "borderless",
			},
		},
		{
			title: "组织名称",
			dataIndex: "deptName",
			key: "deptName",
			width: 200,
			ellipsis: true,
			hideInSearch: false,
			formItemProps: {
				name: "deptCode",
				colon: false,
				className: "rounded border-[1px] border-[#DCDFE6]",
			},
			fieldProps: {
				options: organizationTreeOptions,
				fieldNames: { label: "name", value: "code", children: "children" },
				allowClear: true,
				showSearch: true,
				treeNodeFilterProp: "name",
				variant: "borderless",
				placeholder: "请选择组织",
				styles: {
					popup: {
						root: { minWidth: "26rem" },
					},
				},
			},
			valueType: "treeSelect",
		},
		{
			title: "职位",
			dataIndex: "positionName",
			key: "positionName",
			width: 100,
			hideInSearch: false,
			valueType: "select",
			formItemProps: {
				colon: false,
				className: "rounded border-[1px] border-[#DCDFE6]",
			},
			fieldProps: {
				options: positionOptions,
				fieldNames: { label: "positionName", value: "positionName" },
				allowClear: true,
				showSearch: true,
				optionFilterProp: "positionName",
				variant: "borderless",
				placeholder: "请选择职位名称",
				loading: searchOptionsLoading,
			},
		},
		{
			title: "职级",
			dataIndex: "postGrade",
			key: "postGrade",
			width: 100,
			hideInSearch: false,
			valueType: "select",
			formItemProps: {
				colon: false,
				className: "rounded border-[1px] border-[#DCDFE6]",
			},
			fieldProps: {
				options: postGradeOptions,
				fieldNames: { label: "postGradeName", value: "postGrade" },
				allowClear: true,
				showSearch: true,
				optionFilterProp: "postGradeName",
				variant: "borderless",
				placeholder: "请选择职级",
				loading: searchOptionsLoading,
			},
		},
		{
			title: "岗位个性描述",
			dataIndex: "personalizedDesc",
			key: "personalizedDesc",
			width: 250,
			hideInSearch: false,
			formItemProps: {
				colon: false,
				className: "rounded border-[1px] border-[#DCDFE6]",
				labelCol: { span: 10 },
				wrapperCol: { span: 14 },
			},
			valueType: "text",
			fieldProps: {
				placeholder: "请输入岗位个性描述",
				allowClear: true,
				variant: "borderless",
			},
			render: (_, record) => (
				<Typography.Text
					ellipsis={{
						tooltip: formatDescriptionForTooltip(record.personalizedDesc),
					}}
				>
					{formatDescription(record.personalizedDesc)}
				</Typography.Text>
			),
		},
		{
			title: "状态",
			dataIndex: "auditStatus",
			key: "auditStatus",
			width: 100,
			hideInSearch: false,
			valueType: "select",
			formItemProps: {
				colon: false,
				className: "rounded border-[1px] border-[#DCDFE6]",
			},
			fieldProps: {
				showSearch: true,
				allowClear: true,
				optionFilterProp: "auditStatusName",
				options: auditStatusDictOptions,
				variant: "borderless",
				placeholder: "请选择状态",
				loading: searchOptionsLoading,
			},
			initialValue: [JOB_DESC_AUDIT_STATUS.PENDING],
			render: (_, record: JobDescAuditItem) => {
				const dictItem = auditStatusValueMap.get(record.auditStatus);
				const status = dictItem?.listClass as
					| "default"
					| "success"
					| "processing"
					| "error"
					| "warning"
					| undefined;
				return <Badge status={status} text={dictItem?.dictLabel} />;
			},
		},
		{
			title: "提交人",
			dataIndex: "submitter",
			key: "submitter",
			width: 100,
			hideInSearch: false,
			valueType: "select",
			formItemProps: {
				colon: false,
				className: "rounded border-[1px] border-[#DCDFE6]",
			},
			fieldProps: {
				variant: "borderless",
				allowClear: true,
				showSearch: true,
				optionFilterProp: "userName",
				options: submitterOptions,
				fieldNames: { label: "userName", value: "userId" },
				loading: searchOptionsLoading,
				placeholder: "请选择提交人",
			},
			render: (_, record: JobDescAuditItem) =>
				record.submitterName || record.submitter || "-",
		},
		{
			title: "审核部门",
			dataIndex: "auditDeptName",
			key: "auditDeptName",
			width: 120,
			hideInSearch: false,
			valueType: "select",
			formItemProps: {
				colon: false,
				className: "rounded border-[1px] border-[#DCDFE6]",
				name: "auditDept",
			},
			fieldProps: {
				name: "auditDept",
				variant: "borderless",
				allowClear: true,
				showSearch: true,
				optionFilterProp: "auditDeptName",
				options: auditDeptOptions.length > 0 ? auditDeptOptions : auditDeptDictOptions,
				fieldNames: { label: "auditDeptName", value: "auditDept" },
				placeholder: "请选择审核部门",
				loading: searchOptionsLoading,
			},
			render: (_, record: JobDescAuditItem) => {
				// 优先使用接口返回的审核部门名称，否则使用字典
				const apiOption = searchOptions?.auditDeptOptions?.find(
					(opt) => opt.auditDept === record.auditDept,
				);
				return (
					apiOption?.auditDeptName ||
					auditDeptValueMap.get(record.auditDept)?.dictLabel ||
					record.auditDept ||
					"-"
				);
			},
		},
		{
			title: "实际审核人",
			dataIndex: "auditorName",
			key: "auditorName",
			width: 100,
			hideInSearch: false,
			valueType: "select",
			formItemProps: {
				name: "auditor",
				colon: false,
				className: "rounded border-[1px] border-[#DCDFE6]",
				labelCol: { span: 9 },
				wrapperCol: { span: 15 },
			},
			fieldProps: {
				variant: "borderless",
				allowClear: true,
				showSearch: true,
				optionFilterProp: "userName",
				options: auditorOptions,
				fieldNames: { label: "userName", value: "userId" },
				loading: searchOptionsLoading,
				placeholder: "请选择实际审核人",
			},
			render: (_, record: JobDescAuditItem) => record.auditorName || record.auditor || "-",
		},
		{
			title: "更新时间",
			dataIndex: "updateTime",
			key: "updateTime",
			width: 150,
			valueType: "dateTime",
			hideInSearch: true,
			render: (_, record: JobDescAuditItem) => record.createTime || "-",
		},
		{
			title: "操作",
			valueType: "option",
			fixed: "right",
			width: 80,
			render: (_: any, record: JobDescAuditItem) => {
				const isPending = record.auditStatus === JOB_DESC_AUDIT_STATUS.PENDING;
				const isApproved = record.auditStatus === JOB_DESC_AUDIT_STATUS.APPROVED;
				const isRejected = record.auditStatus === JOB_DESC_AUDIT_STATUS.REJECTED;

				const operations: React.ReactElement[] = [];
				if (isPending) {
					operations.push(
						<BasicButton
							key="audit"
							type="link"
							onClick={() => handleAudit(record)}
							auth={TAG_MANAGEMENT_PERMISSIONS.JOB_AUDIT_APPROVE}
						>
							审核
						</BasicButton>,
					);
				}
				if (isApproved || isRejected) {
					operations.push(
						<Link key="view" onClick={() => handleViewRecords(record)}>
							审核详情
						</Link>,
					);
				}

				return (
					<Space size={0} split={<Divider type="vertical" />}>
						{operations.map((operation) => (
							<React.Fragment key={`${record.id}-${operation.key}`}>
								{operation}
							</React.Fragment>
						))}
					</Space>
				);
			},
		},
	];

	// 渲染列表视图
	const renderListView = () => (
		<div className="flex h-full flex-col">
			{/* 统计卡片 */}
			<div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
				{[
					{
						title: "待审核描述",
						value: pendingCount,
						icon: <AuditPendingReviewStatusIcon className="h-7 w-7" />,
						color: "#FF7D00",
						bgColor: "#F5F7FA",
						description: "请及时处理",
						showTrend: false,
						trendValue: 0,
					},
					{
						title: "已通过描述",
						value: passedCount,
						icon: <AuditApprovedStatusIcon className="h-7 w-7" />,
						color: "#14B968",
						bgColor: "#F5F7FA",
						description: "审核通过",
						showTrend: true,
						trendValue: passedThisMonthCount,
					},
					{
						title: "已拒绝描述",
						value: rejectedCount,
						icon: <AuditRejectedStatusIcon className="h-7 w-7" />,
						color: "#F5222D",
						bgColor: "#F5F7FA",
						description: "审核拒绝",
						showTrend: true,
						trendValue: rejectedThisMonthCount,
					},
				].map((item) => (
					<Card
						key={item.title}
						className="h-full transition-all duration-300 hover:scale-[1.01] hover:shadow-md"
						style={{
							borderRadius: "8px",
							border: "none",
							backgroundColor: item.bgColor,
						}}
						styles={{ body: { padding: "16px" } }}
					>
						{/* 顶部：标题 + 图标 */}
						<div className="mb-2 flex items-center justify-between">
							<span className="text-sm font-medium text-gray-700">{item.title}</span>
							<div>{item.icon}</div>
						</div>

						{/* 底部：大数字 + 右侧趋势信息 */}
						<div className="flex items-end justify-between">
							{/* 左侧大数字 */}
							<div>
								<Statistic
									value={item.value}
									valueStyle={{
										fontSize: "26px",
										fontWeight: "bold",
										lineHeight: 1,
									}}
									formatter={(value) => (
										<CountUp
											start={0}
											end={value as number}
											duration={2}
											separator=","
										/>
									)}
								/>
							</div>

							{/* 右侧趋势信息 */}
							<div className="text-right">
								{item.showTrend ? (
									<Statistic
										value={item.trendValue}
										precision={0}
										valueStyle={{
											fontSize: "14px",
											color: item.color,
											fontWeight: "500",
											lineHeight: 1,
										}}
										prefix={
											<span
												className="mt-1 text-sm"
												style={{ color: item.color }}
											>
												{" "}
												本月新增
											</span>
										}
										suffix={
											<span
												className="mt-1 text-sm"
												style={{ color: item.color }}
											>
												{" "}
												个
											</span>
										}
									/>
								) : (
									<span
										className="text-sm text-gray-500"
										style={{ color: item.color }}
									>
										{item.description}
									</span>
								)}
							</div>
						</div>
					</Card>
				))}
			</div>

			{/* 表格容器 */}
			<div className="flex-1">
				<BasicTable
					actionRef={actionRef}
					columns={columns}
					request={handleSearch}
					rowKey={(record) => `${record.id}-${record.updateTime || ""}`}
					cardBordered={false}
					toolbar={{
						className: "border-t",
					}}
					search={{
						filterType: "query",
						className:
							"!mb-0 [&_.ant-pro-query-filter_.ant-form-item-label>label]:!whitespace-nowrap",
						searchGutter: 12,
						defaultCollapsed: false,
						// 自定义查询和重置按钮，禁用展开收起功能
						optionRender: (searchConfig) => [
							<Button
								key="submit"
								type="primary"
								onClick={() => searchConfig.form?.submit()}
							>
								查询
							</Button>,
							<Button
								type="text"
								key="reset"
								onClick={() => {
									searchConfig.form?.resetFields();
									// 重置后重新提交表单以刷新数据
									searchConfig.form?.submit();
								}}
							>
								重置
							</Button>,
						],
					}}
					form={{
						className: "!p-0 !pb-4",
					}}
					cardProps={{
						bodyStyle: {
							padding: 0,
						},
					}}
					adaptive
					scroll={{ x: "1600" }}
					tableAlertRender={false}
					headerTitle={
						<Dropdown
							menu={{
								items: [
									{
										key: "approve",
										label: "批量通过",
										disabled: isBatchAuditDisabled() || batchAuditLoading,
										onClick: () =>
											handleBatchAudit(JOB_DESC_AUDIT_STATUS.APPROVED),
									},
									{
										key: "reject",
										label: "批量驳回",
										disabled: isBatchAuditDisabled() || batchAuditLoading,
										onClick: () =>
											handleBatchAudit(JOB_DESC_AUDIT_STATUS.REJECTED),
										danger: true,
									},
								],
							}}
						>
							<BasicButton
								type="default"
								className="group"
								auth={TAG_MANAGEMENT_PERMISSIONS.JOB_AUDIT_APPROVE}
							>
								<span className="flex items-center gap-0.5">
									批量操作
									<ExpandIcon className="transition-transform duration-300 group-hover:rotate-180" />
								</span>
							</BasicButton>
						</Dropdown>
					}
					rowSelection={{
						selectedRowKeys,
						onChange: (keys, rows) => {
							setSelectedRowKeys(keys);
							setSelectedRows(rows);
						},
						getCheckboxProps: (record) => ({
							disabled: record.auditStatus !== JOB_DESC_AUDIT_STATUS.PENDING, // 只有待审核状态可以选择
						}),
					}}
					options={{
						...TABLE_CONFIG.OPTIONS,
						setting: {
							settingIcon: <BasicButton>列表选项</BasicButton>,
						},
					}}
					pagination={TABLE_CONFIG.PAGINATION}
				/>
			</div>
		</div>
	);

	return (
		<BasicContent className="flex h-full flex-col">
			{renderListView()}

			<JobDescDrawer
				open={isDrawerOpen}
				mode="readonly"
				record={selectedJobDescData}
				onClose={handleCloseDrawer}
				statusDictKey={TAG_DICT_KEYS.AUDIT_STATUS}
				auditActions={
					mode === "audit" && selectedJobDescData
						? {
								onReject: () => handleAuditAction(JOB_DESC_AUDIT_STATUS.REJECTED),
								onApprove: () => handleAuditAction(JOB_DESC_AUDIT_STATUS.APPROVED),
								rejectLoading:
									pendingAuditStatus === JOB_DESC_AUDIT_STATUS.REJECTED &&
									auditActionLoading,
								approveLoading:
									pendingAuditStatus === JOB_DESC_AUDIT_STATUS.APPROVED &&
									auditActionLoading,
								rejectDisabled: auditActionLoading,
								approveDisabled:
									auditActionLoading &&
									pendingAuditStatus === JOB_DESC_AUDIT_STATUS.REJECTED,
							}
						: undefined
				}
			/>

			{/* 驳回审核意见弹窗 */}
			<Modal
				title="驳回审核"
				open={isAuditModalOpen}
				onOk={handleSubmitAudit}
				onCancel={handleCancelAudit}
				okText="确认"
				cancelText="取消"
				centered
				okButtonProps={{ loading: auditActionLoading }}
				cancelButtonProps={{ disabled: auditActionLoading }}
			>
				<Form
					form={auditForm}
					layout="horizontal"
					colon
					labelCol={{ flex: "80px" }}
					wrapperCol={{ flex: "auto" }}
				>
					<Form.Item label="驳回对象" className="mb-3">
						<span>{selectedJobDescData?.jobName || "-"}</span>
					</Form.Item>
					<Form.Item
						label="审核意见"
						name="auditComment"
						rules={[
							{ required: true, message: "请填写驳回原因" },
							{ max: 100, message: "驳回原因不能超过100个字符" },
						]}
					>
						<TextArea
							rows={4}
							placeholder="请输入驳回原因..."
							showCount={{
								formatter: ({ count, maxLength }) =>
									`${count}${maxLength ? `/${maxLength}` : ""}`,
							}}
							maxLength={100}
						/>
					</Form.Item>
				</Form>
			</Modal>

			<Modal
				title="批量驳回审核"
				open={isBatchAuditModalOpen}
				onCancel={() => {
					if (!batchAuditLoading) {
						setIsBatchAuditModalOpen(false);
						batchAuditForm.resetFields();
					}
				}}
				okText="确认"
				cancelText="取消"
				centered
				onOk={() => handleSubmitBatchAction(JOB_DESC_AUDIT_STATUS.REJECTED)}
				okButtonProps={{ loading: batchAuditLoading }}
				cancelButtonProps={{ disabled: batchAuditLoading }}
			>
				<Form
					form={batchAuditForm}
					layout="horizontal"
					colon
					labelCol={{ flex: "80px" }}
					wrapperCol={{ flex: "auto" }}
				>
					<Form.Item label="驳回对象" className="mb-3">
						<span>
							{selectedRows
								.filter(canAuditRecord)
								.map((row) => row.jobName)
								.join("、")}
						</span>
					</Form.Item>
					<Form.Item
						label="审核意见"
						name="auditComment"
						rules={[
							{ required: true, message: "请填写驳回原因" },
							{ max: 100, message: "驳回原因不能超过100个字符" },
						]}
					>
						<TextArea
							rows={4}
							placeholder="请输入驳回原因..."
							maxLength={100}
							showCount
						/>
					</Form.Item>
				</Form>
			</Modal>
		</BasicContent>
	);
});

export default JobDescAudit;
