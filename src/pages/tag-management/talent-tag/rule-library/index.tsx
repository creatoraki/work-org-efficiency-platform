import type { SearchOptionsResponse } from "#src/api/tag-management/rule-library/types";
import type { ActionType, ProColumns } from "@ant-design/pro-components";

import type { ModalMode, TagRuleFormData } from "./components";

import type { TagRuleLibraryItem } from "./types";
import {
	batchUpdateStatus,
	createRuleLibrary,
	deleteRuleLibrary,
	fetchRuleLibraryList,
	getSearchOptions,
	offlineRuleLibrary,
	updateRuleLibrary,
} from "#src/api/tag-management/rule-library";
import { fetchTagDetailByName } from "#src/api/tag-management/tag-center";
import ExpandIcon from "#src/assets/svg/expand.svg?react";

import { BasicButton, BasicTable } from "#src/components";
import { BasicContent } from "#src/components/basic-content";

import { useDict } from "#src/hooks";
import { ExclamationCircleFilled } from "@ant-design/icons";
import { useRequest } from "ahooks";
import { Badge, Button, Divider, Dropdown, message, Modal, Space, Typography } from "antd";
import { useCallback, useRef, useState } from "react";
import { ViewTalentTagRuleDrawer } from "../../components/shared";
import { TagViewDrawer } from "../../components/tag-view-drawer";
import {
	BATCH_OPERATION_TEXT,
	OPERATION_BUTTON_TEXT,
	RULE_LIBRARY_BATCH_OPERATION_CONFIG,
	TABLE_CONFIG,
	TAG_DICT_KEYS,
	TAG_RULE_BATCH_OPERATION_FILTER,
	TAG_RULE_ONLINE_STATUS_DICT,
	TAG_RULE_ONLINE_STATUS_OPTIONS,
	TAG_RULE_OPERATION_MAPPING,
	TAG_RULE_TYPE_DICT,
} from "../../config";
import { RuleFormModal } from "./components";

const { confirm } = Modal;
const { Text, Link } = Typography;

/**
 * 人才标签规则库页面
 *
 * 提供规则的增删改查、批量操作、状态管理等功能
 *
 * @returns 人才标签规则库页面组件
 */
export default function TalentRuleLibraryPage() {
	const actionRef = useRef<ActionType>();
	const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
	const [selectedRows, setSelectedRows] = useState<TagRuleLibraryItem[]>([]);

	// 统一的弹窗状态管理
	const [isRuleFormModalOpen, setIsRuleFormModalOpen] = useState(false);
	const [ruleFormModalMode, setRuleFormModalMode] = useState<ModalMode>("create");
	const [isRuleViewModalOpen, setIsRuleViewModalOpen] = useState(false);
	const [currentRecordId, setCurrentRecordId] = useState<string | undefined>(undefined);
	const [currentRecord, setCurrentRecord] = useState<TagRuleLibraryItem | null>(null);

	const [isViewPersonnelModalOpen, setIsViewPersonnelModalOpen] = useState(false);

	// 标签查看弹窗状态
	const [isTagViewDrawerOpen, setIsTagViewDrawerOpen] = useState(false);
	const [currentTag, setCurrentTag] = useState<{ id: string; name: string } | null>(null);

	// 获取上线状态字典
	const { valueMap: onlineStatusValueMap } = useDict(TAG_DICT_KEYS.ONLINE_STATUS);

	// 加载所有搜索选项（使用 useRequest，自动在初始化时调用，直接解构 data）
	const {
		data: {
			tagOptions = [],
			createByOptions = [],
			updateByOptions = [],
		} = {} as SearchOptionsResponse,
		run: refreshSearchOptions,
	} = useRequest(() => getSearchOptions(TAG_RULE_TYPE_DICT.TALENT), {
		onError: (error) => {
			console.error("加载搜索选项失败:", error);
		},
	});

	/**
	 * 处理查看操作
	 *
	 * @param record - 规则数据
	 */
	const handleView = (record: TagRuleLibraryItem) => {
		setCurrentRecordId(record.id);
		setCurrentRecord(record);
		setIsRuleViewModalOpen(true);
	};

	/**
	 * 处理编辑操作
	 *
	 * @param record - 规则数据
	 */
	const handleEdit = (record: TagRuleLibraryItem) => {
		setCurrentRecordId(record.id);
		setCurrentRecord(record);
		setRuleFormModalMode("edit");
		setIsRuleFormModalOpen(true);
	};

	/**
	 * 处理标签点击
	 *
	 * @param tagName - 标签名称
	 */
	const handleTagClick = async (tagName: string) => {
		try {
			// 根据标签名称获取标签ID
			const tagItem = await fetchTagDetailByName(tagName, TAG_RULE_TYPE_DICT.TALENT);

			if (!tagItem || !tagItem.id) {
				message.error("未找到该标签");
				return;
			}

			setCurrentTag({
				id: String(tagItem.id),
				name: tagName,
			});
			setIsTagViewDrawerOpen(true);
		} catch (error) {
			message.error("获取标签详情失败");
			console.error("获取标签详情失败:", error);
		}
	};

	// 处理查看配置人员
	const handleViewPersonnel = () => {
		setIsViewPersonnelModalOpen(true);
	};

	/**
	 * 处理规则操作
	 *
	 * @param operation - 操作类型：edit（编辑）、offline（下线）、online（上线）、delete（删除）
	 * @param record - 规则数据
	 */
	const handleOperation = async (operation: string, record: TagRuleLibraryItem) => {
		try {
			switch (operation) {
				case "edit":
					handleEdit(record);
					break;
				case "offline":
					confirm({
						title: "确认下线",
						content: `确定要下线规则 "${record.ruleName}" 吗？下线后该规则将停止生效。`,
						icon: <ExclamationCircleFilled />,
						centered: true,
						onOk: async () => {
							await offlineRuleLibrary([record.id]);
							message.success(`${record.ruleName} 下线成功`);
							actionRef.current?.reload();
						},
					});
					break;
				case "online": {
					// 根据配置方式确定目标状态：1-数据开发改为开发中，2-现有标签配置改为已上线
					// 使用花括号创建块作用域，避免变量声明冲突
					const targetStatus =
						record.configType === "1"
							? TAG_RULE_ONLINE_STATUS_DICT.DEVELOPING
							: TAG_RULE_ONLINE_STATUS_DICT.ONLINE;
					const statusText = record.configType === "1" ? "开发中" : "已上线";

					confirm({
						title: "确认上线",
						content: `确定要上线规则 "${record.ruleName}" 吗？上线后该规则状态将变为 ${statusText}。`,
						icon: <ExclamationCircleFilled />,
						centered: true,
						onOk: async () => {
							await batchUpdateStatus({
								ids: [record.id],
								onlineStatus: targetStatus,
							});
							message.success(
								`${record.ruleName} 上线成功，状态已变为 ${statusText}`,
							);
							actionRef.current?.reload();
						},
					});
					break;
				}
				case "delete":
					confirm({
						title: "确认删除",
						content: `确定要删除规则 "${record.ruleName}" 吗？删除后将无法恢复。`,
						icon: <ExclamationCircleFilled />,
						centered: true,
						onOk: async () => {
							await deleteRuleLibrary(record.id);
							message.success(`${record.ruleName} 删除成功`);
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

	// 获取表格列配置
	const getConstantColumns = useCallback((): ProColumns<TagRuleLibraryItem>[] => {
		return [
			{
				title: "规则名称",
				dataIndex: "ruleName",
				width: 200,
				hideInSearch: false,
				valueType: "text",
				formItemProps: {
					colon: false,
					className: "rounded border-[1px] border-[#DCDFE6]",
				},
				fieldProps: {
					placeholder: "请输入规则名称",
					variant: "borderless",
				},
				render: (_, record) => (
					<Text ellipsis={{ tooltip: record.ruleName }}>
						<Link onClick={() => handleView(record)}>{record.ruleName}</Link>
					</Text>
				),
			},
			{
				title: "规则定义",
				dataIndex: "ruleDefinition",
				width: 250,
				ellipsis: true,
				hideInSearch: false,
				valueType: "text",
				formItemProps: {
					colon: false,
					className: "rounded border-[1px] border-[#DCDFE6]",
				},
				fieldProps: {
					placeholder: "请输入规则定义",
					variant: "borderless",
				},
			},
			{
				title: "上线状态",
				dataIndex: "onlineStatusName",
				key: "onlineStatus",
				width: 100,
				hideInSearch: false,
				valueType: "select",
				formItemProps: {
					name: "onlineStatus",
					colon: false,
					className: "rounded border-[1px] border-[#DCDFE6]",
				},
				fieldProps: {
					showSearch: true,
					optionFilterProp: "label",
					options: TAG_RULE_ONLINE_STATUS_OPTIONS,
					variant: "borderless",
				},
				render: (_, record) => {
					const dictItem = onlineStatusValueMap.get(record.onlineStatus);
					const status = dictItem?.listClass as
						| "default"
						| "success"
						| "processing"
						| "error"
						| "warning"
						| undefined;
					return <Badge status={status} text={record.onlineStatusName} />;
				},
			},
			{
				title: "关联标签",
				dataIndex: "tagName",
				key: "tagId",
				width: 120,
				hideInSearch: false,
				valueType: "select",
				render: (_, record) =>
					record.tagName ? (
						<Typography.Text
							onClick={() => handleTagClick(record.tagName!)}
							ellipsis={{
								tooltip: record.tagName,
							}}
							className="cursor-pointer text-[#1890ff]"
						>
							{record.tagName}
						</Typography.Text>
					) : (
						"-"
					),
				formItemProps: {
					colon: false,
					className: "rounded border-[1px] border-[#DCDFE6]",
				},
				fieldProps: {
					options: tagOptions,
					fieldNames: { label: "tagName", value: "tagId" },
					allowClear: true,
					showSearch: true,
					optionFilterProp: "tagName",
					variant: "borderless",
				},
			},
			{
				title: "创建人",
				dataIndex: "createByName",
				key: "createBy",
				width: 100,
				hideInSearch: false,
				valueType: "select",
				formItemProps: {
					name: "createBy",
					colon: false,
					className: "rounded border-[1px] border-[#DCDFE6]",
				},
				fieldProps: {
					options: createByOptions,
					fieldNames: { label: "userName", value: "userId" },
					allowClear: true,
					showSearch: true,
					optionFilterProp: "userName",
					variant: "borderless",
				},
			},
			{
				title: "更新人",
				dataIndex: "updateByName",
				key: "updateBy",
				width: 100,
				hideInSearch: false,
				valueType: "select",
				formItemProps: {
					name: "updateBy",
					colon: false,
					className: "rounded border-[1px] border-[#DCDFE6]",
				},
				fieldProps: {
					options: updateByOptions,
					fieldNames: { label: "userName", value: "userId" },
					allowClear: true,
					showSearch: true,
					optionFilterProp: "userName",
					variant: "borderless",
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
				key: "action",
				valueType: "option",
				width: 150,
				fixed: "right",
				render: (_, record) => {
					// 使用统一的操作映射规则
					const operations = TAG_RULE_OPERATION_MAPPING[record.onlineStatus] || [];
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
	}, [tagOptions, createByOptions, updateByOptions, onlineStatusValueMap]);

	// 获取表格列配置
	const columns = getConstantColumns();

	const handleSearch = async (params: any) => {
		try {
			// 解构搜索参数
			const { current = 1, pageSize = 10 } = params;

			// 构建搜索参数对象
			const searchParams: any = {
				...params,
				pageNum: current,
				pageSize,
				type: TAG_RULE_TYPE_DICT.TALENT,
			};

			const response = await fetchRuleLibraryList(searchParams);

			// axios-request 拦截器已处理 code 检查，这里直接使用数据
			return {
				data: response.list || [],
				success: true,
				total: response.total || 0,
			};
		} catch (error) {
			console.error("获取规则库列表失败:", error);
			return {
				data: [],
				success: false,
				total: 0,
			};
		}
	};

	// 处理新增
	const handleAdd = () => {
		setCurrentRecordId(undefined);
		setCurrentRecord(null);
		setRuleFormModalMode("create");
		setIsRuleFormModalOpen(true);
	};

	// 检查批量操作按钮是否应该禁用（智能判断：选中多行时自动分类，只要有符合条件的数据就放开操作）
	const isBatchOperationDisabled = (operation: "online" | "offline" | "delete") => {
		if (selectedRows.length === 0) {
			return true;
		}

		// 使用统一的批量操作过滤规则
		const allowedStatuses = TAG_RULE_BATCH_OPERATION_FILTER[operation] || [];
		return !selectedRows.some((row) => allowedStatuses.includes(row.onlineStatus));
	};

	// 处理批量操作
	const handleBatchOperation = (operation: "online" | "offline" | "delete") => {
		if (selectedRowKeys.length === 0) {
			message.warning("请先选择要操作的规则");
			return;
		}

		// 智能过滤：只对符合条件的数据进行操作
		let validRows: TagRuleLibraryItem[] = [];
		let operationText = "";

		// 使用统一的批量操作过滤规则
		const allowedStatuses = TAG_RULE_BATCH_OPERATION_FILTER[operation] || [];
		validRows = selectedRows.filter((row) => allowedStatuses.includes(row.onlineStatus));
		operationText = OPERATION_BUTTON_TEXT[operation];

		if (validRows.length === 0) {
			message.warning(`没有符合${operationText}条件的规则`);
			return;
		}

		const config = RULE_LIBRARY_BATCH_OPERATION_CONFIG[operation];
		const totalCount = selectedRowKeys.length;
		const validCount = validRows.length;

		// 如果选中的数据中有部分不符合条件，提示用户
		const contentText =
			totalCount === validCount
				? config.content.replace("{count}", validCount.toString())
				: `选中的 ${totalCount} 个规则中，有 ${validCount} 个符合${operationText}条件，是否要对这 ${validCount} 个规则批量${operationText}？`;

		confirm({
			title: config.title,
			content: contentText,
			icon: <ExclamationCircleFilled />,
			centered: true,
			onOk: async () => {
				try {
					switch (operation) {
						case "online": {
							// 根据配置方式分组：1-数据开发改为开发中，2-现有标签配置改为已上线
							const developingIds: string[] = [];
							const onlineIds: string[] = [];

							validRows.forEach((row) => {
								if (row.configType === "1") {
									developingIds.push(row.id);
								} else {
									onlineIds.push(row.id);
								}
							});

							// 分别批量更新状态
							const promises = [];
							if (developingIds.length > 0) {
								promises.push(
									batchUpdateStatus({
										ids: developingIds,
										onlineStatus: TAG_RULE_ONLINE_STATUS_DICT.DEVELOPING,
									}),
								);
							}
							if (onlineIds.length > 0) {
								promises.push(
									batchUpdateStatus({
										ids: onlineIds,
										onlineStatus: TAG_RULE_ONLINE_STATUS_DICT.ONLINE,
									}),
								);
							}

							await Promise.all(promises);
							break;
						}
						case "offline": {
							const ids = validRows.map((row) => row.id);
							await offlineRuleLibrary(ids);
							break;
						}
						case "delete": {
							const ids = validRows.map((row) => row.id);
							await deleteRuleLibrary(ids.join(","));
							break;
						}
					}
					message.success(`批量${operationText}成功，共处理 ${validCount} 个规则`);
					setSelectedRowKeys([]);
					setSelectedRows([]);
					actionRef.current?.reload();
				} catch (error) {
					console.error("批量操作失败:", error);
				}
			},
		});
	};

	// 处理表单提交
	const handleFormSubmit = async (values: TagRuleFormData) => {
		try {
			const apiParams = {
				...values,
				onlineStatus: TAG_RULE_ONLINE_STATUS_DICT.NOT_ONLINE,
				type: TAG_RULE_TYPE_DICT.TALENT,
			} as const;

			if (ruleFormModalMode === "create") {
				// 新增
				await createRuleLibrary(apiParams as any);
				message.success("新增规则成功");
			} else if (ruleFormModalMode === "edit" && currentRecord) {
				// 编辑
				await updateRuleLibrary(currentRecord.id, {
					...apiParams,
					id: currentRecord.id,
				} as any);
				message.success("编辑规则成功");
			}

			setIsRuleFormModalOpen(false);
			actionRef.current?.reload();
			// 刷新搜索选项
			refreshSearchOptions();
			return true;
		} catch (error) {
			message.error(`操作失败：${(error as any)?.message ?? "请稍后重试"}`);
			return false;
		}
	};

	// 处理配置规则点击
	const handleConfigRuleClick = () => {
		message.info("涉及阿里AI部分，暂未实现");
	};

	return (
		<BasicContent className="flex h-full flex-col">
			{/* 数据表格 */}
			<div className="flex-1">
				<BasicTable<TagRuleLibraryItem>
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
						<div className="flex gap-2">
							<BasicButton key="add" type="primary" onClick={handleAdd}>
								新增规则
							</BasicButton>
							<Dropdown
								menu={{
									items: [
										{
											key: "online",
											label: BATCH_OPERATION_TEXT.online,
											disabled: isBatchOperationDisabled("online"),
											onClick: () => handleBatchOperation("online"),
										},
										{
											key: "offline",
											label: BATCH_OPERATION_TEXT.offline,
											disabled: isBatchOperationDisabled("offline"),
											onClick: () => handleBatchOperation("offline"),
										},
										{
											key: "delete",
											label: BATCH_OPERATION_TEXT.delete,
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
							setSelectedRowKeys(keys.map(String));
							setSelectedRows(rows);
						},
						getCheckboxProps: (record) => ({
							disabled:
								record.onlineStatus === TAG_RULE_ONLINE_STATUS_DICT.DEVELOPING,
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

			{/* 查看模式：使用表单组件的 readonly 模式 */}
			<RuleFormModal
				mode="readonly"
				open={isRuleViewModalOpen}
				onOpenChange={setIsRuleViewModalOpen}
				id={currentRecordId}
				onViewPersonnel={handleViewPersonnel}
			/>

			{/* 创建和编辑模式：使用表单组件 */}
			<RuleFormModal
				mode={ruleFormModalMode}
				open={isRuleFormModalOpen}
				onOpenChange={setIsRuleFormModalOpen}
				onFinish={handleFormSubmit}
				id={currentRecordId}
				onViewPersonnel={handleViewPersonnel}
				onConfigRule={handleConfigRuleClick}
				type={TAG_RULE_TYPE_DICT.TALENT}
			/>

			{/* 查看符合规则人员 */}
			<ViewTalentTagRuleDrawer
				open={isViewPersonnelModalOpen}
				onClose={() => setIsViewPersonnelModalOpen(false)}
				tagRuleId={currentRecord?.id}
				jobPositionList={currentRecord?.tagRulePositionList ?? []}
			/>

			{/* 标签查看弹窗 */}
			{currentTag && (
				<TagViewDrawer
					open={isTagViewDrawerOpen}
					onClose={() => {
						setIsTagViewDrawerOpen(false);
						setCurrentTag(null);
					}}
					tagId={currentTag.id}
					tagName={currentTag.name}
					libraryType={TAG_RULE_TYPE_DICT.TALENT}
					mode="view"
				/>
			)}
		</BasicContent>
	);
}
