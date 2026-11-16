/**
 * 岗位描述管理页面
 */

import type { UpdateJobDescPayload } from "#src/api/tag-management/job-desc/management";
import type { ActionType, ProColumns } from "@ant-design/pro-components";
import type { Key } from "react";
import type { OperationType } from "../../config";
import type { DrawerMode, JobDescManagementItem } from "./types";
import {
	deleteJobDescManagement,
	fetchJobDescManagementList,
	fetchJobDescSearchOptions,
	offlineJobDescManagement,
	onlineJobDescManagement,
	updateJobDescManagement,
} from "#src/api/tag-management/job-desc/management";

import { getUserDataScopeTree } from "#src/api/user/sys";
import ExpandIcon from "#src/assets/svg/expand.svg?react";
import { BasicButton, BasicContent, BasicTable } from "#src/components";
import { useDict } from "#src/hooks";
import { ExclamationCircleFilled, UploadOutlined } from "@ant-design/icons";
import { useRequest } from "ahooks";
import { Badge, Button, Divider, Dropdown, message, Modal, Popover, Space, Typography } from "antd";
import { useEffectOnActive } from "keepalive-for-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { TABLE_CONFIG, TAG_DICT_KEYS, TAG_MANAGEMENT_PERMISSIONS } from "../../config";
import { ImportJobDescModal } from "../components/import-job-desc-modal";
import { JobDescDrawer } from "../components/job-desc-drawer";
import { formatDescription, parseDescriptionField } from "../utils";
import { JOB_DESC_STATUS } from "./types";

const { confirm } = Modal;
const { Text, Link } = Typography;

/**
 * 操作按钮映射（使用字典值常量）
 */
const OPERATION_BUTTON_MAPPING: Record<string, readonly OperationType[]> = {
	[JOB_DESC_STATUS.ONLINE]: ["offline"] as const satisfies readonly OperationType[], // 已上线：下线
	[JOB_DESC_STATUS.OFFLINE]: [
		"online",
		"edit",
		"delete",
	] as const satisfies readonly OperationType[], // 已下线：上线、编辑、删除
	[JOB_DESC_STATUS.REVIEWING]: [] as const satisfies readonly OperationType[], // 审核中：无操作
	[JOB_DESC_STATUS.PENDING]: [
		"online",
		"edit",
		"delete",
	] as const satisfies readonly OperationType[], // 待上线：上线、编辑、删除
	[JOB_DESC_STATUS.REJECTED]: [
		"online",
		"edit",
		"delete",
	] as const satisfies readonly OperationType[], // 已拒绝：上线、编辑、删除
};

/**
 * 操作按钮文本
 */
const OPERATION_BUTTON_TEXT: Record<OperationType, string> = {
	edit: "编辑",
	delete: "删除",
	online: "上线",
	offline: "下线",
};

/**
 * 批量操作配置
 */
const BATCH_OPERATION_CONFIG = {
	online: {
		title: "确认批量上线",
		content: "确定要批量上线选中的 {count} 个岗位描述吗？",
	},
	offline: {
		title: "确认批量下线",
		content: "确定要批量下线选中的 {count} 个岗位描述吗？",
	},
	delete: {
		title: "确认批量删除",
		content: "确定要批量删除选中的 {count} 个岗位描述吗？删除后将无法恢复。",
	},
};

/**
 * 获取记录的唯一标识（优先使用 id，其次 jobId）
 */
function getRecordIdValue(record: JobDescManagementItem): string | null {
	if (record.id !== undefined && record.id !== null) {
		return String(record.id);
	}
	if (record.jobId !== undefined && record.jobId !== null) {
		return String(record.jobId);
	}
	return null;
}

/**
 * 岗位描述管理页面
 */
export default function JobDescManagement() {
	const actionRef = useRef<ActionType>();
	const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
	const [selectedRows, setSelectedRows] = useState<JobDescManagementItem[]>([]);

	// 抽屉状态管理
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);
	const [drawerMode, setDrawerMode] = useState<DrawerMode>("edit");
	const [currentRecord, setCurrentRecord] = useState<JobDescManagementItem | null>(null);

	// 导入弹窗状态
	const [isImportModalOpen, setIsImportModalOpen] = useState(false);

	// 选项数据状态
	const { data: searchOptionsResponse, refresh: refreshSearchOptions } = useRequest(
		fetchJobDescSearchOptions,
		{
			onError: (error) => {
				console.error("加载搜索选项失败:", error);
			},
		},
	);
	const {
		updateByOptions = [],
		positionOptions = [],
		postGradeOptions = [],
	} = searchOptionsResponse ?? {};

	/**
	 * 页面从其他标签页切回当前缓存页时，主动刷新列表和搜索选项，
	 * 避免岗位描述状态和筛选下拉仍停留在旧口径。
	 *
	 * @returns void
	 * @author 王善能
	 * @since 2026-07-07
	 */
	useEffectOnActive(
		() => {
			actionRef.current?.reload();
			refreshSearchOptions();
		},
		[],
		true,
	);

	// 获取审核部门字典
	const { options: auditDeptOptions } = useDict(TAG_DICT_KEYS.JOB_AUDIT_DEPT);

	// 获取状态字典
	const { valueMap: statusValueMap, options: statusOptions } = useDict(TAG_DICT_KEYS.STATUS);

	// 获取组织树形数据
	const { data: organizationTreeOptions = [] } = useRequest(
		async () => {
			const result = await getUserDataScopeTree();
			if (Array.isArray(result?.data)) {
				return result.data;
			}
			if (result?.data) {
				return [result.data];
			}
			return [];
		},
		{
			cacheKey: "job-desc-user-data-scope-tree",
			cacheTime: 5 * 60 * 1000,
			staleTime: 5 * 60 * 1000,
		},
	);

	// 处理查看
	const handleView = (record: JobDescManagementItem) => {
		setCurrentRecord(record);
		setDrawerMode("readonly");
		setIsDrawerOpen(true);
	};

	// 处理编辑
	const handleEdit = (record: JobDescManagementItem) => {
		setCurrentRecord(record);
		setDrawerMode("edit");
		setIsDrawerOpen(true);
	};

	// 处理操作
	const handleOperation = async (operation: string, record: JobDescManagementItem) => {
		const recordId = getRecordIdValue(record);
		if (!recordId) {
			message.warning("当前记录缺少ID，无法执行操作");
			return;
		}

		try {
			switch (operation) {
				case "edit":
					handleEdit(record);
					break;
				case "online":
					confirm({
						title: "确认上线",
						content: `确定要上线岗位描述 "${record.jobName ?? "-"}" 吗？上线后该岗位描述将立即生效。`,
						icon: <ExclamationCircleFilled />,
						centered: true,
						onOk: async () => {
							await onlineJobDescManagement([recordId]);
							message.success(`${record.jobName ?? "-"} 上线成功`);
							actionRef.current?.reload();
						},
					});
					break;
				case "offline":
					confirm({
						title: "确认下线",
						content: `确定要下线岗位描述 "${record.jobName ?? "-"}" 吗？下线后该岗位描述将停止生效。`,
						icon: <ExclamationCircleFilled />,
						centered: true,
						onOk: async () => {
							await offlineJobDescManagement([recordId]);
							message.success(`${record.jobName ?? "-"} 下线成功`);
							actionRef.current?.reload();
						},
					});
					break;
				case "delete":
					confirm({
						title: "确认删除",
						content: `确定要删除岗位描述 "${record.jobName ?? "-"}" 吗？删除后将无法恢复。`,
						icon: <ExclamationCircleFilled />,

						centered: true,
						onOk: async () => {
							const ids = [recordId];
							await deleteJobDescManagement(ids);
							message.success(`${record.jobName ?? "-"} 删除成功`);
							actionRef.current?.reload();
						},
					});
					break;
				default:
					message.info("未知操作");
			}
		} catch (error) {
			console.error("操作失败:", error);
		}
	};

	const canPerformOperation = useCallback(
		(record: JobDescManagementItem, operation: "online" | "offline" | "delete") => {
			const operations = OPERATION_BUTTON_MAPPING[record.status] ?? [];
			return operations.includes(operation);
		},
		[],
	);

	// 渲染描述字段（使用 Popover）
	const renderDescriptionField = useCallback((desc?: string | null) => {
		const formattedText = formatDescription(desc);
		const description = parseDescriptionField(desc);
		const hasContent = Object.keys(description).length > 0;

		if (!hasContent) {
			return <span className="text-gray-400">-</span>;
		}

		const content = (
			<div className="max-h-96 overflow-y-auto py-1">
				{Object.entries(description).map(([dimension, contentValue], index) => {
					// 处理内容：将换行符转换为空格，避免乱换行
					const processedContent = contentValue
						? String(contentValue).replace(/\n+/g, " ").trim()
						: "-";

					const isLast = index === Object.keys(description).length - 1;

					return (
						<div
							key={`${dimension}-${index}`}
							className={`text-xs leading-relaxed ${!isLast ? "mb-2 border-b border-gray-200 pb-2" : ""}`}
						>
							<span className="font-medium text-primary">{dimension}</span>
							<span className="ml-1 text-gray-600">：</span>
							<span className="whitespace-normal break-words text-gray-600">
								{processedContent}
							</span>
						</div>
					);
				})}
			</div>
		);

		return (
			<Popover
				content={content}
				trigger="hover"
				placement="topLeft"
				styles={{ body: { maxWidth: 500 } }}
			>
				<Typography.Text className="line-clamp-1 w-full max-w-full cursor-pointer transition-colors hover:text-primary">
					{formattedText}
				</Typography.Text>
			</Popover>
		);
	}, []);

	// 获取表格列配置
	const getColumns = useCallback((): ProColumns<JobDescManagementItem>[] => {
		return [
			{
				title: "岗位名称",
				dataIndex: "jobName",
				width: 150,
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
				render: (_, record) => (
					<Text ellipsis={{ tooltip: record.jobName }}>
						<Link onClick={() => handleView(record)}>{record.jobName}</Link>
					</Text>
				),
			},
			{
				title: "组织名称",
				dataIndex: "deptName",
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
					fieldNames: { label: "deptName", value: "deptCode", children: "children" },
					allowClear: true,
					showSearch: true,
					treeNodeFilterProp: "deptName",
					variant: "borderless",
					placeholder: "请选择组织名称",
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
				width: 80,
				hideInSearch: false,
				valueType: "select",
				formItemProps: {
					colon: false,
					className: "rounded border-[1px] border-[#DCDFE6]",
				},
				fieldProps: {
					allowClear: true,
					showSearch: true,
					optionFilterProp: "positionName",
					options: positionOptions,
					variant: "borderless",
					fieldNames: {
						label: "positionName",
						value: "positionName",
					},
					placeholder: "请选择职位名称",
				},
			},
			{
				title: "职级",
				dataIndex: "postGrade",
				width: 60,
				hideInSearch: false,
				valueType: "select",
				formItemProps: {
					colon: false,
					className: "rounded border-[1px] border-[#DCDFE6]",
				},
				fieldProps: {
					allowClear: true,
					showSearch: true,
					optionFilterProp: "postGradeName",
					options: postGradeOptions,
					variant: "borderless",
					fieldNames: {
						label: "postGradeName",
						value: "postGrade",
					},
					placeholder: "请选择职级",
				},
			},
			{
				title: "岗位基本描述",
				dataIndex: "basicDesc",
				width: 250,
				hideInSearch: false,
				formItemProps: {
					colon: false,
					className: "rounded border-[1px] border-[#DCDFE6]",
					labelCol: { span: 10 },
					wrapperCol: { span: 14 },
				},
				fieldProps: {
					variant: "borderless",
					allowClear: true,
					placeholder: "请输入岗位基本描述",
				},
				valueType: "text",
				render: (_, record) => renderDescriptionField(record.basicDesc),
			},
			{
				title: "岗位个性描述",
				dataIndex: "personalizedDesc",
				width: 250,
				hideInSearch: false,
				formItemProps: {
					colon: false,
					className: "rounded border-[1px] border-[#DCDFE6]",
					labelCol: { span: 10 },
					wrapperCol: { span: 14 },
				},
				fieldProps: {
					placeholder: "请输入岗位个性描述",
					variant: "borderless",
					allowClear: true,
				},
				valueType: "textarea",
				render: (_, record) => renderDescriptionField(record.personalizedDesc),
			},
			{
				title: "审核部门",
				dataIndex: "auditDeptName",
				width: 120,
				hideInSearch: false,
				valueType: "select",
				formItemProps: {
					name: "auditDept",
					colon: false,
					className: "rounded border-[1px] border-[#DCDFE6]",
				},
				fieldProps: {
					allowClear: true,
					showSearch: true,
					optionFilterProp: "label",
					options: auditDeptOptions,
					variant: "borderless",
					placeholder: "请选择审核部门",
				},
			},
			{
				title: "状态",
				dataIndex: "status",
				width: 80,
				hideInSearch: false,
				valueType: "select",
				formItemProps: {
					colon: false,
					className: "rounded border-[1px] border-[#DCDFE6]",
				},
				fieldProps: {
					allowClear: true,
					showSearch: true,
					optionFilterProp: "label",
					options: statusOptions,
					variant: "borderless",
					placeholder: "请选择状态",
				},
				render: (_, record) => {
					const dictItem = statusValueMap.get(record.status);
					if (!dictItem) {
						return "-";
					}
					const status = dictItem.listClass as
						| "default"
						| "success"
						| "processing"
						| "error"
						| "warning"
						| undefined;
					return <Badge status={status} text={dictItem.dictLabel} />;
				},
			},
			{
				title: "更新人",
				dataIndex: "updateByName",
				width: 100,
				hideInSearch: false,
				valueType: "select",
				formItemProps: {
					name: "updateBy",
					colon: false,
					className: "rounded border-[1px] border-[#DCDFE6]",
				},
				fieldProps: {
					allowClear: true,
					showSearch: true,
					optionFilterProp: "userName",
					placeholder: "请选择更新人",
					variant: "borderless",
					options: updateByOptions,
					fieldNames: { label: "userName", value: "userId" },
				},
			},
			{
				title: "更新时间",
				dataIndex: "updateTime",
				width: 150,
				valueType: "dateTime",
				hideInSearch: true,
			},
			{
				title: "操作",
				valueType: "option",
				width: 150,
				fixed: "right",
				render: (_, record) => {
					const operations = OPERATION_BUTTON_MAPPING[record.status] || [];

					return (
						<Space size={0} split={<Divider type="vertical" />}>
							{operations.map((operation) => (
								<Link
									key={`${record.id}-${operation}`}
									onClick={() => handleOperation(operation, record)}
								>
									{OPERATION_BUTTON_TEXT[operation]}
								</Link>
							))}
						</Space>
					);
				},
			},
		];
	}, [
		organizationTreeOptions,
		updateByOptions,
		auditDeptOptions,
		positionOptions,
		postGradeOptions,
		statusOptions,
		statusValueMap,
		renderDescriptionField,
	]);

	// 处理搜索
	const handleSearch = async (params: any) => {
		try {
			const { current, pageSize, ...restParams } = params;
			const searchParams: Record<string, unknown> = {
				...restParams,
				pageNum: current || 1,
				pageSize: pageSize || 10,
			};

			const response = await fetchJobDescManagementList(searchParams);

			const list = Array.isArray(response.list) ? response.list : [];

			return {
				data: list,
				success: true,
				total: response.total || 0,
			};
		} catch (error) {
			console.error("获取数据失败:", error);
			return {
				data: [],
				success: false,
				total: 0,
			};
		}
	};

	// 移除新增功能 - 根据需求文档，没有新增按钮

	// 检查批量操作按钮是否应该禁用
	const isBatchOperationDisabled = (operation: "online" | "offline" | "delete") => {
		if (selectedRows.length === 0) {
			return true;
		}

		return !selectedRows.some((row) => canPerformOperation(row, operation));
	};

	// 处理批量操作
	const handleBatchOperation = (operation: "online" | "offline" | "delete") => {
		if (selectedRowKeys.length === 0) {
			message.warning("请先选择要操作的岗位描述");
			return;
		}

		const validRows = selectedRows.filter((row) => canPerformOperation(row, operation));
		const operationText = OPERATION_BUTTON_TEXT[operation];

		if (validRows.length === 0) {
			message.warning(`没有符合${operationText}条件的岗位描述`);
			return;
		}

		const config = BATCH_OPERATION_CONFIG[operation];
		const totalCount = selectedRowKeys.length;
		const validCount = validRows.length;

		const contentText =
			totalCount === validCount
				? config.content.replace("{count}", validCount.toString())
				: `选中的 ${totalCount} 个岗位描述中，有 ${validCount} 个符合${operationText}条件，是否要对这 ${validCount} 个岗位描述批量${operationText}？`;

		confirm({
			title: config.title,
			content: contentText,
			icon: <ExclamationCircleFilled />,
			centered: true,
			onOk: async () => {
				try {
					const ids = validRows
						.map((row) => getRecordIdValue(row))
						.filter((id): id is string => Boolean(id));
					if (ids.length === 0) {
						message.warning("选中的岗位描述缺少ID，无法执行操作");
						return;
					}
					switch (operation) {
						case "online":
							await onlineJobDescManagement(ids);
							break;
						case "offline":
							await offlineJobDescManagement(ids);
							break;
						case "delete":
							await deleteJobDescManagement(ids);
							break;
					}
					message.success(`批量${operationText}成功，共处理 ${validCount} 个岗位描述`);
					setSelectedRowKeys([]);
					setSelectedRows([]);
					actionRef.current?.reload();
				} catch (error) {
					console.error("批量操作失败:", error);
				}
			},
		});
	};

	// 处理表单提交（payload 含 existingAttachments/newFiles，由抽屉组装）
	const handleFormSubmit = async (values: UpdateJobDescPayload) => {
		if (!currentRecord?.id) {
			message.warning("当前记录缺少ID，无法保存");
			return;
		}
		await updateJobDescManagement(currentRecord.id, values);
		actionRef.current?.reload();
		refreshSearchOptions();
	};

	// 处理导入
	const handleImport = () => {
		setIsImportModalOpen(true);
	};

	// 重置导入弹窗状态
	const resetImportModal = () => {
		setIsImportModalOpen(false);
	};

	// 初始化选项数据
	const columns = useMemo(() => getColumns(), [getColumns]);

	return (
		<BasicContent className="flex h-full flex-col">
			{/* 数据表格 */}
			<div className="flex-1">
				<BasicTable<JobDescManagementItem>
					actionRef={actionRef}
					columns={columns}
					request={handleSearch}
					rowKey={(record) =>
						getRecordIdValue(record) ??
						`${record.deptCode ?? "dept"}-${record.positionId ?? record.jobId ?? "unknown"}`
					}
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
						<div className="flex gap-2">
							<BasicButton
								type="default"
								key="import"
								onClick={handleImport}
								icon={<UploadOutlined />}
								auth={TAG_MANAGEMENT_PERMISSIONS.JOB_DESCRIPTION_IMPORT}
							>
								导入岗位描述
							</BasicButton>
							<Dropdown
								menu={{
									items: [
										{
											key: "online",
											label: "批量上线",
											disabled: isBatchOperationDisabled("online"),
											onClick: () => handleBatchOperation("online"),
										},
										{
											key: "offline",
											label: "批量下线",
											disabled: isBatchOperationDisabled("offline"),
											onClick: () => handleBatchOperation("offline"),
										},
										{
											key: "delete",
											label: "批量删除",
											disabled: isBatchOperationDisabled("delete"),
											onClick: () => handleBatchOperation("delete"),
											danger: true,
										},
									],
								}}
							>
								<BasicButton type="default" className="group">
									<span className="flex items-center gap-0.5">
										批量操作
										<ExpandIcon className="transition-transform duration-300 group-hover:rotate-180" />
									</span>
								</BasicButton>
							</Dropdown>
						</div>
					}
					rowSelection={{
						selectedRowKeys,
						onChange: (keys, rows) => {
							setSelectedRowKeys(keys);
							setSelectedRows(rows);
						},
						getCheckboxProps: (record) => ({
							disabled: record.status === JOB_DESC_STATUS.REVIEWING, // 审核中状态不可选择
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

			{/* 岗位描述抽屉 */}
			<JobDescDrawer
				open={isDrawerOpen}
				mode={drawerMode}
				record={currentRecord}
				onClose={() => setIsDrawerOpen(false)}
				onSubmit={handleFormSubmit}
			/>

			{/* 导入岗位描述弹窗 */}
			<ImportJobDescModal
				open={isImportModalOpen}
				onClose={resetImportModal}
				onSuccess={() => {
					actionRef.current?.reload();
					refreshSearchOptions();
				}}
			/>
		</BasicContent>
	);
}
