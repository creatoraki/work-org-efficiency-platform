import type { ActionType, ProColumns } from "@ant-design/pro-components";
import type { TagCenterItem } from "./types";
import {
	batchOperateTagCenter,
	deleteTagCenter,
	fetchAllSearchOptions,
	fetchTagCenterList,
	offlineTagCenter,
	onlineTagCenter,
} from "#src/api/tag-management/tag-center";
import ExpandIcon from "#src/assets/svg/expand.svg?react";

import { BasicButton, BasicContent, BasicTable } from "#src/components";
import { useDict } from "#src/hooks";
// TODO: 二期实现 - 导入标签功能
// import { UploadOutlined } from "@ant-design/icons";

import { ExclamationCircleFilled } from "@ant-design/icons";
import { useRequest } from "ahooks";
import { Badge, Button, Divider, Dropdown, message, Modal, Space, Typography } from "antd";
import dayjs from "dayjs";
import { useEffectOnActive } from "keepalive-for-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { TagFormDrawer } from "../../components/tag-form-drawer";
import { FORM_MODE } from "../../components/tag-form-drawer/constants";
import { TagViewDrawer } from "../../components/tag-view-drawer";
import {
	BATCH_OPERATION_TEXT,
	IS_REQUIRED_OPTIONS,
	OPERATION_BUTTON_TEXT,
	TABLE_CONFIG,
	TAG_CENTER_BATCH_OPERATION_CONFIG,
	TAG_CENTER_OPERATION_BUTTON_MAPPING,
	TAG_CENTER_STATUS_DICT,
	TAG_CENTER_STATUS_OPTIONS,
	TAG_DICT_KEYS,
	TAG_RULE_TYPE_DICT,
	TAG_TYPE,
} from "../../config";
import { buildDictTree } from "../../utils";
// TODO: 二期实现 - 导入标签功能
// import { ImportTagModal } from "../../components/import-tag-modal";

const { confirm } = Modal;
const { Text, Link } = Typography;

/**
 * 表格列操作处理器接口
 */
interface TagCenterColumnHandlers {
	/** 查看标签详情 */
	onView: (record: TagCenterItem) => void;
	/** 编辑标签 */
	onEdit: (record: TagCenterItem) => void;
	/** 删除标签 */
	onDelete: (record: TagCenterItem) => void;
	/** 切换标签状态 */
	onToggleStatus: (record: TagCenterItem, action: string) => void;
	/** 点击规则 */
	onRuleClick: (record: TagCenterItem) => void;
}

/**
 * 搜索选项数据接口
 */
interface TagCenterSearchOptions {
	/** 业务类别选项 */
	businessCategoryOptions: Array<{ label: string; value: string; children?: any[] }>;
	/** 创建人选项 */
	creatorOptions: Array<{ userId: string; userName: string }>;
	/** 更新人选项 */
	updaterOptions: Array<{ userId: string; userName: string }>;
	/** 标签类型选项 */
	tagTypeOptions?: Array<{ label: string; value: string }>;
	/** 更新频次选项 */
	updateFrequencyOptions?: Array<{ label: string; value: string }>;
}

// 获取标签中心表格列配置
function getTagCenterColumns(
	handlers: TagCenterColumnHandlers,
	searchOptions: TagCenterSearchOptions,
	statusValueMap: Map<string, { listClass?: string | null }>,
): ProColumns<TagCenterItem>[] {
	return [
		{
			title: "标签名称",
			dataIndex: "tagName",
			key: "tagName",
			width: 200,
			hideInSearch: false,
			valueType: "text",
			formItemProps: {
				colon: false,
				className: "rounded border-[1px] border-[#DCDFE6]",
			},
			fieldProps: {
				placeholder: "请输入标签名称",
				variant: "borderless",
			},
			render: (_, record) => (
				<Text ellipsis={{ tooltip: record.tagName }}>
					<Link onClick={() => handlers.onView(record)}>{record.tagName}</Link>
				</Text>
			),
		},
		{
			title: "标签值",
			dataIndex: "tagValue",
			key: "tagValue",
			width: 200,
			ellipsis: true,
			hideInSearch: false,
			valueType: "text",
			formItemProps: {
				colon: false,
				className: "rounded border-[1px] border-[#DCDFE6]",
			},
			fieldProps: {
				placeholder: "请输入标签值",
				variant: "borderless",
			},
		},
		{
			title: "标签描述",
			dataIndex: "tagDescription",
			key: "tagDescription",
			width: 200,
			ellipsis: true,
			hideInSearch: false,
			valueType: "text",
			formItemProps: {
				colon: false,
				className: "rounded border-[1px] border-[#DCDFE6]",
			},
			fieldProps: {
				placeholder: "请输入标签描述",
				variant: "borderless",
			},
		},
		{
			title: "标签类型",
			dataIndex: "tagTypeName",
			key: "tagType",
			width: 120,
			hideInSearch: false,
			valueType: "select",
			formItemProps: {
				name: "tagType",
				colon: false,
				className: "rounded border-[1px] border-[#DCDFE6]",
			},
			fieldProps: {
				mode: "multiple",
				showSearch: true,
				optionFilterProp: "label",
				options: searchOptions.tagTypeOptions,
				variant: "borderless",
			},
		},
		{
			title: "业务类别",
			dataIndex: "businessCategoryName",
			key: "businessCategory",
			width: 120,
			hideInSearch: false,
			valueType: "cascader",
			formItemProps: {
				name: "businessCategory",
				colon: false,
				className: "rounded border-[1px] border-[#DCDFE6]",
			},
			fieldProps: {
				options: searchOptions.businessCategoryOptions,
				showSearch: true,
				changeOnSelect: true,
				variant: "borderless",
			},
		},
		{
			title: "是否必填",
			width: 80,
			dataIndex: "isRequiredName",
			key: "isRequired",
			hideInSearch: false,
			valueType: "select",
			formItemProps: {
				name: "isRequired",
				colon: false,
				className: "rounded border-[1px] border-[#DCDFE6]",
			},
			fieldProps: {
				mode: "multiple",
				showSearch: true,
				optionFilterProp: "label",
				options: IS_REQUIRED_OPTIONS,
				variant: "borderless",
			},
		},
		{
			title: "到期时间",
			dataIndex: "existenceCycle",
			key: "existenceCycle",
			width: 120,
			hideInSearch: false,
			valueType: "date",
			formItemProps: {
				colon: false,
				className: "rounded border-[1px] border-[#DCDFE6]",
			},
			fieldProps: {
				format: "YYYY-MM-DD",
				variant: "borderless",
			},
		},
		{
			title: "状态",
			dataIndex: "statusName",
			key: "status",
			width: 100,
			hideInSearch: false,
			valueType: "select",
			formItemProps: {
				name: "status",
				colon: false,
				className: "rounded border-[1px] border-[#DCDFE6]",
			},
			fieldProps: {
				mode: "multiple",
				showSearch: true,
				optionFilterProp: "label",
				options: TAG_CENTER_STATUS_OPTIONS,
				variant: "borderless",
			},
			render: (_, record) => {
				const dictItem = statusValueMap.get(record.status);
				const status = dictItem?.listClass as
					| "default"
					| "success"
					| "processing"
					| "error"
					| "warning"
					| undefined;
				return <Badge status={status} text={record.statusName} />;
			},
		},
		{
			title: "更新频次",
			dataIndex: "updateFrequencyName",
			key: "updateFrequency",
			hideInSearch: false,
			width: 80,
			valueType: "select",
			formItemProps: {
				name: "updateFrequency",
				colon: false,
				className: "rounded border-[1px] border-[#DCDFE6]",
			},
			fieldProps: {
				mode: "multiple",
				showSearch: true,
				optionFilterProp: "label",
				options: searchOptions.updateFrequencyOptions,
				variant: "borderless",
			},
		},
		{
			title: "创建人",
			dataIndex: "createByName",
			key: "createBy",
			width: 80,
			hideInSearch: false,
			valueType: "select",
			formItemProps: {
				name: "createBy",
				colon: false,
				className: "rounded border-[1px] border-[#DCDFE6]",
			},
			fieldProps: {
				options: searchOptions.creatorOptions,
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
			width: 80,
			hideInSearch: false,
			valueType: "select",
			formItemProps: {
				name: "updateBy",
				colon: false,
				className: "rounded border-[1px] border-[#DCDFE6]",
			},
			fieldProps: {
				options: searchOptions.updaterOptions,
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
			key: "updateTime",
			width: 160,
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
				const operations = TAG_CENTER_OPERATION_BUTTON_MAPPING[record.status] || [];

				return (
					<Space size={0} split={<Divider type="vertical" />}>
						{operations.map((operation) => (
							<Link
								key={`${record.id}-${operation}`}
								onClick={() => {
									if (operation === "edit") {
										handlers.onEdit(record);
									} else if (operation === "delete") {
										handlers.onDelete(record);
									} else if (operation === "online" || operation === "offline") {
										handlers.onToggleStatus(record, operation);
									}
								}}
							>
								{OPERATION_BUTTON_TEXT[operation]}
							</Link>
						))}
					</Space>
				);
			},
		},
	];
}

/**
 * 组织标签中心页面
 *
 * 提供标签的增删改查、批量操作、状态管理等功能
 *
 * @returns 组织标签中心页面组件
 */
export default function OrgTagCenter() {
	const actionRef = useRef<ActionType>();
	const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
	const [selectedRows, setSelectedRows] = useState<TagCenterItem[]>([]);
	const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
	const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
	const [isViewDrawerOpen, setIsViewDrawerOpen] = useState(false);
	const [editingRecord, setEditingRecord] = useState<TagCenterItem | null>(null);
	const [viewingRecord, setViewingRecord] = useState<TagCenterItem | null>(null);
	// TODO: 二期实现 - 导入标签功能
	// const [importModalOpen, setImportModalOpen] = useState(false);

	// 获取字典数据
	const { options: tagTypeOptions } = useDict(TAG_DICT_KEYS.TAG_TYPE);
	const { data: businessCategoryData } = useDict(TAG_DICT_KEYS.ORG_BUSINESS_CATEGORY);
	const { options: updateFrequencyOptions } = useDict(TAG_DICT_KEYS.UPDATE_FREQUENCY);
	const { valueMap: statusValueMap } = useDict(TAG_DICT_KEYS.STATUS);

	// 仅保留系统标签（组织标签类型限制）
	const filteredTagTypeOptions = useMemo(() => {
		return (
			tagTypeOptions?.filter(
				(option) =>
					option.value !== TAG_TYPE.MANUAL && option.value !== TAG_TYPE.INTELLIGENT,
			) || []
		);
	}, [tagTypeOptions]);

	// 构建业务类别树形结构
	const businessCategoryOptions = useMemo(
		() => buildDictTree(businessCategoryData),
		[businessCategoryData],
	);

	// 加载选项数据
	const {
		data: { createByOptions: creatorOptions = [], updateByOptions: updaterOptions = [] } = {},
		refresh: refreshSearchOptions,
	} = useRequest(() => fetchAllSearchOptions("1"), {
		onError: (error) => {
			console.error("加载选项数据失败:", error);
		},
	});

	/**
	 * 页面从其他标签页切回当前缓存页时，主动刷新列表和搜索选项，
	 * 避免标签增删改后筛选项与列表口径不一致。
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

	/**
	 * 刷新当前页列表与搜索选项。
	 *
	 * 标签新增、编辑、删除、上下线或批量操作成功后，
	 * 需要同时刷新列表与筛选项，避免表单下拉和当前列表口径不一致。
	 *
	 * @author 王善能
	 * @since 2026-07-10
	 */
	const refreshPageData = useCallback(() => {
		actionRef.current?.reload();
		refreshSearchOptions();
	}, [refreshSearchOptions]);

	// 检查批量操作按钮是否禁用
	const isBatchOperationDisabled = (operation: "online" | "offline" | "delete") => {
		if (selectedRows.length === 0) {
			return true;
		}

		// 使用操作映射判断：只要选中的行中有任何一行支持该操作，就启用按钮
		return !selectedRows.some((row) => {
			const operations = TAG_CENTER_OPERATION_BUTTON_MAPPING[row.status] || [];
			return operations.includes(operation);
		});
	};

	// 处理搜索
	const handleSearch = async (params: any) => {
		try {
			// 解构搜索参数
			const {
				current = 1,
				pageSize = 10,
				tagType,
				businessCategory,
				isRequired,
				updateFrequency,
				status,
				...restParams
			} = params;

			// 构建搜索参数对象
			const searchParams: any = {
				...restParams,
				pageNum: current,
				pageSize,
				type: "1", // 组织标签
			};

			// 标签类型（多选转字符串）
			if (tagType && Array.isArray(tagType) && tagType.length > 0) {
				searchParams.tagType = tagType.join(",");
			}

			// 业务类别（只传最后的叶子节点，确保为字符串类型）
			if (businessCategory) {
				searchParams.businessCategory = Array.isArray(businessCategory)
					? String(businessCategory[businessCategory.length - 1])
					: String(businessCategory);
			}

			// 是否必填（多选转字符串）
			if (isRequired && Array.isArray(isRequired) && isRequired.length > 0) {
				searchParams.isRequired = isRequired.join(",");
			}

			// 更新频次（多选转字符串）
			if (updateFrequency && Array.isArray(updateFrequency) && updateFrequency.length > 0) {
				searchParams.updateFrequency = updateFrequency.join(",");
			}

			// 状态（多选转字符串）
			if (status && Array.isArray(status) && status.length > 0) {
				searchParams.status = status.join(",");
			}

			const response = await fetchTagCenterList(searchParams);

			return {
				data: response.list || [],
				success: true,
				total: response.total || 0,
			};
		} catch (error) {
			console.error("获取标签中心列表失败:", error);
			return {
				data: [],
				success: false,
				total: 0,
			};
		}
	};

	// 处理规则点击
	const handleRuleClick = (record: TagCenterItem) => {
		if (record.tagRulesId) {
			message.info(`查看规则: ${record.tagRulesId}`);
		}
	};

	// 处理查看
	const handleView = (record: TagCenterItem) => {
		setViewingRecord(record);
		setIsViewDrawerOpen(true);
	};

	// 处理编辑
	const handleEdit = (record: TagCenterItem) => {
		setEditingRecord(record);
		setIsEditDrawerOpen(true);
	};

	// 处理删除
	const handleDelete = async (record: TagCenterItem) => {
		confirm({
			title: "确认删除",
			icon: <ExclamationCircleFilled />,
			content: `确定要删除标签 "${record.tagName}" 吗？`,
			centered: true,
			async onOk() {
				try {
					await deleteTagCenter([String(record.id)]);
					message.success("删除成功");
					refreshPageData();
				} catch (error) {
					console.error("删除失败:", error);
					console.error("删除标签失败:", error);
				}
			},
		});
	};

	/**
	 * 检查到期时间是否过期
	 *
	 * @param existenceCycle - 到期时间（可能是字符串或对象）
	 * @returns 是否过期
	 */
	const checkExpired = (existenceCycle: string | undefined): boolean => {
		if (!existenceCycle) {
			return false;
		}

		// 处理字符串格式的日期
		const dateStr: string = existenceCycle;

		if (!dateStr) {
			return false;
		}

		// 解析日期并比较
		const expireDate = dayjs(dateStr);
		const currentDate = dayjs();

		// 如果到期时间小于当前时间，则已过期
		return expireDate.isBefore(currentDate, "day");
	};

	// 处理状态切换
	const handleToggleStatus = async (record: TagCenterItem, action: string) => {
		const actionText =
			action === "online" ? OPERATION_BUTTON_TEXT.online : OPERATION_BUTTON_TEXT.offline;

		// 如果是上线操作，需要校验到期时间
		if (action === "online") {
			const isExpired = checkExpired(record.existenceCycle);

			if (isExpired) {
				// 到期时间已过期，显示确认弹窗
				Modal.confirm({
					title: "标签已过期",
					icon: <ExclamationCircleFilled />,
					content: "根据存在周期中设置的到期时间，标签已过期，建议重新设置后上线",
					centered: true,
					okText: "仍要上线",
					cancelText: "重新配置",
					maskClosable: true,
					onOk: async () => {
						// 仍要上线
						try {
							await onlineTagCenter([record.id]);
							message.success("上线成功");
							refreshPageData();
						} catch (error) {
							console.error("上线失败:", error);
							console.error("上线标签失败:", error);
						}
					},
					onCancel: () => {
						// 重新配置：打开编辑界面
						handleEdit(record);
					},
				});
				return;
			}
		}

		// 正常的上线/下线确认
		confirm({
			title: `确认${actionText}`,
			icon: <ExclamationCircleFilled />,
			content: `确定要${actionText}标签 "${record.tagName}" 吗？`,
			centered: true,
			async onOk() {
				try {
					if (action === "online") {
						await onlineTagCenter([record.id]);
					} else {
						await offlineTagCenter([record.id]);
					}
					message.success(`${actionText}成功`);
					refreshPageData();
				} catch (error) {
					console.error(`${actionText}标签失败:`, error);
				}
			},
		});
	};

	// 处理新增
	const handleAdd = () => {
		setEditingRecord(null);
		setViewingRecord(null);
		setIsAddDrawerOpen(true);
	};

	// TODO: 二期实现 - 导入标签功能
	// 处理导入标签
	// const handleImport = () => {
	// 	setImportModalOpen(true);
	// };

	// TODO: 二期实现 - 导入标签功能
	// 处理导入确认
	// const handleImportConfirm = async (file: File) => {
	// 	// TODO: 实现实际的文件上传和导入逻辑
	// 	// const formData = new FormData();
	// 	// formData.append('file', file);
	// 	// await uploadTagFile(formData);

	// 	// 模拟上传过程
	// 	await new Promise(resolve => setTimeout(resolve, 2000));

	// 	message.success("标签导入成功");
	// 	actionRef.current?.reload();
	// };

	// TODO: 二期实现 - 导入标签功能
	// 处理模板下载
	// const handleDownloadTemplate = () => {
	// 	// TODO: 实现模板下载功能
	// 	message.info("模板下载功能待实现");
	// };

	// 处理批量操作
	const handleBatchOperation = async (operation: "online" | "offline" | "delete") => {
		if (selectedRowKeys.length === 0) {
			message.warning("请先选择要操作的标签");
			return;
		}

		// 智能过滤：根据操作映射判断哪些行符合条件
		// 使用 TAG_CENTER_OPERATION_BUTTON_MAPPING 来判断，如果状态映射中包含该操作，则符合条件
		const validRows = selectedRows.filter((row) => {
			const operations = TAG_CENTER_OPERATION_BUTTON_MAPPING[row.status] || [];
			return operations.includes(operation);
		});
		const operationText = OPERATION_BUTTON_TEXT[operation];

		if (validRows.length === 0) {
			message.warning(`没有符合${operationText}条件的标签`);
			return;
		}

		// 如果是批量上线操作，需要检查是否有过期的标签
		if (operation === "online") {
			const expiredRows = validRows.filter((row) => checkExpired(row.existenceCycle));
			const validNotExpiredRows = validRows.filter(
				(row) => !checkExpired(row.existenceCycle),
			);

			if (expiredRows.length > 0) {
				// 有过期标签，提示用户
				const expiredCount = expiredRows.length;
				const validCount = validNotExpiredRows.length;
				const totalCount = validRows.length;

				// 根据是否有未过期标签，显示不同的提示文案
				const contentText =
					validCount > 0
						? `选中的 ${totalCount} 个标签中，有 ${expiredCount} 个标签的到期时间已过期，建议重新设置后上线。是否要继续上线所有标签（包括已过期的）？`
						: `选中的 ${totalCount} 个标签的到期时间均已过期，建议重新设置后上线。是否仍要继续上线所有标签？`;

				const modalInstance = Modal.confirm({
					title: "标签已过期",
					icon: <ExclamationCircleFilled />,
					content: contentText,
					centered: true,
					maskClosable: true,
					footer: (
						<div className="mt-4 flex justify-end gap-2">
							<Button onClick={() => modalInstance.destroy()}>取消</Button>
							{/* 只有当存在未过期的标签时，才显示"只上线未过期的"按钮 */}
							{validCount > 0 && (
								<Button
									type="primary"
									onClick={async () => {
										try {
											const validIds = validNotExpiredRows.map(
												(row) => row.id,
											);
											await batchOperateTagCenter({
												ids: validIds,
												operation,
												type: "1", // 组织标签
											});

											message.success(
												`批量${operationText}成功，共处理 ${validCount} 个未过期标签`,
											);
											setSelectedRowKeys([]);
											setSelectedRows([]);
											refreshPageData();
											modalInstance.destroy();
										} catch (error) {
											console.error(`批量${operationText}失败:`, error);
										}
									}}
								>
									只上线未过期的
								</Button>
							)}
							<Button
								type="primary"
								onClick={async () => {
									// 仍要上线全部（包括过期的）
									try {
										const validIds = validRows.map((row) => row.id);
										await batchOperateTagCenter({
											ids: validIds,
											operation,
											type: "1", // 组织标签
										});

										message.success(
											`批量${operationText}成功，共处理 ${totalCount} 个标签`,
										);
										setSelectedRowKeys([]);
										setSelectedRows([]);
										refreshPageData();
										modalInstance.destroy();
									} catch (error) {
										console.error(`批量${operationText}失败:`, error);
										console.error(`批量${operationText}失败:`, error);
									}
								}}
							>
								仍要上线全部
							</Button>
						</div>
					),
					onCancel: () => {
						// 仅用于关闭弹窗
						modalInstance.destroy();
					},
				});
				return;
			}
		}

		const config = TAG_CENTER_BATCH_OPERATION_CONFIG[operation];
		const totalCount = selectedRows.length;
		const validCount = validRows.length;

		// 如果选中的数据中有部分不符合条件，提示用户
		// 对于删除操作，始终显示符合条件的数量
		const contentText =
			totalCount === validCount
				? config.content.replace("{count}", validCount.toString())
				: `选中的 ${totalCount} 个标签中，有 ${validCount} 个符合${operationText}条件，是否要对这 ${validCount} 个标签批量${operationText}？`;

		confirm({
			title: config.title,
			content: contentText,
			icon: <ExclamationCircleFilled />,
			centered: true,
			async onOk() {
				try {
					const validIds = validRows.map((row) => row.id);
					await batchOperateTagCenter({
						ids: validIds,
						operation,
						type: "1", // 组织标签
					});

					message.success(`批量${operationText}成功，共处理 ${validCount} 个标签`);
					setSelectedRowKeys([]);
					setSelectedRows([]);
					refreshPageData();
				} catch (error) {
					console.error(`批量${operationText}失败:`, error);
					console.error(`批量${operationText}失败:`, error);
				}
			},
		});
	};

	/**
	 * 处理标签抽屉提交成功后的页面刷新逻辑。
	 *
	 * 用于统一关闭新增/编辑抽屉，并刷新列表与查询选项数据。
	 *
	 * @author 王善能
	 * @since 2026-06-23
	 */
	const handleSubmitSuccess = async () => {
		setIsAddDrawerOpen(false);
		setIsEditDrawerOpen(false);
		setIsViewDrawerOpen(false);
		setEditingRecord(null);
		setViewingRecord(null);
		refreshPageData();
	};

	// 表格列配置
	const columns = getTagCenterColumns(
		{
			onView: handleView,
			onEdit: handleEdit,
			onDelete: handleDelete,
			onToggleStatus: handleToggleStatus,
			onRuleClick: handleRuleClick,
		},
		{
			businessCategoryOptions,
			creatorOptions,
			updaterOptions,
			tagTypeOptions: filteredTagTypeOptions,
			updateFrequencyOptions,
		},
		statusValueMap,
	);

	return (
		<BasicContent className="flex h-full flex-col">
			{/* 表格容器 */}
			<div className="flex-1">
				<BasicTable<TagCenterItem>
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
								新增标签
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
					toolBarRender={() => [
						// TODO: 二期实现 - 导入标签功能
						// <BasicButton
						// 	key="import"
						// 	type="default"
						// 	onClick={handleImport}
						// 	icon={<UploadOutlined />}
						// >
						// 	导入标签
						// </BasicButton>,
					]}
					rowSelection={{
						selectedRowKeys,
						onChange: (keys, rows) => {
							setSelectedRowKeys(keys.map(String));
							setSelectedRows(rows);
						},
						getCheckboxProps: (record) => ({
							disabled: record.status === TAG_CENTER_STATUS_DICT.REVIEWING,
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

			{/* 新增标签抽屉 */}
			<TagFormDrawer
				open={isAddDrawerOpen}
				onClose={() => setIsAddDrawerOpen(false)}
				onSubmitSuccess={handleSubmitSuccess}
				title="新增标签"
				mode={FORM_MODE.ADD}
				tagLibraryType={TAG_RULE_TYPE_DICT.ORG}
			/>

			{/* 编辑标签抽屉 */}
			{isEditDrawerOpen && editingRecord ? (
				<TagFormDrawer
					open={isEditDrawerOpen}
					onClose={() => {
						setIsEditDrawerOpen(false);
						setEditingRecord(null);
					}}
					onSubmitSuccess={handleSubmitSuccess}
					tagSummary={{
						id: String(editingRecord.id),
						tagName: editingRecord.tagName,
						tagType: editingRecord.tagType as TAG_TYPE,
					}}
					title="编辑标签"
					mode={FORM_MODE.EDIT}
					tagLibraryType={TAG_RULE_TYPE_DICT.ORG}
				/>
			) : null}

			{/* 查看标签抽屉 */}
			<TagViewDrawer
				open={isViewDrawerOpen}
				onClose={() => {
					setIsViewDrawerOpen(false);
					setViewingRecord(null);
				}}
				tagId={viewingRecord?.id || ""}
				tagName={viewingRecord?.tagName || ""}
				libraryType="1"
				mode="view"
			/>

			{/* TODO: 二期实现 - 导入标签功能 */}
			{/* 导入标签弹窗 */}
			{/* <ImportTagModal
				open={importModalOpen}
				onClose={() => setImportModalOpen(false)}
				onImport={handleImportConfirm}
				onDownloadTemplate={handleDownloadTemplate}
			/> */}
		</BasicContent>
	);
}
