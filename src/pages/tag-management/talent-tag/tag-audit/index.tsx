import type { TagAuditListItem } from "#src/api/tag-management/tag-audit";
import type { ActionType } from "@ant-design/pro-components";
import {
	batchAuditTags,
	fetchSearchOptions,
	fetchTagAuditList,
	fetchTagAuditStatistics,
} from "#src/api/tag-management/tag-audit";
import { BasicButton } from "#src/components/basic-button";
import { BasicContent } from "#src/components/basic-content";
import { BasicTable } from "#src/components/basic-table";
import { useDict } from "#src/hooks";
import { ExclamationCircleFilled } from "@ant-design/icons";
import { useRequest } from "ahooks";
import { Button, message, Modal } from "antd";
import { useEffectOnActive } from "keepalive-for-react";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { StatisticsCards } from "../../components/tag-audit/StatisticsCards";
import { useBatchAudit } from "../../components/tag-audit/useBatchAudit";
import { useTableColumns } from "../../components/tag-audit/useTableColumns";
import { TagViewDrawer } from "../../components/tag-view-drawer";
import { TABLE_CONFIG, TAG_DICT_KEYS, TAG_MANAGEMENT_PERMISSIONS } from "../../config";
import { buildDictTree } from "../../utils";

/**
 * 人才标签审核页面
 *
 * 提供标签审核、批量审核、审核详情查看等功能
 *
 * @returns 人才标签审核页面组件
 */
const TalentTagAudit: React.FC = React.memo(() => {
	const actionRef = useRef<ActionType>();

	// 抽屉状态管理
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);
	const [selectedTagData, setSelectedTagData] = useState<TagAuditListItem | null>(null);
	const [mode, setMode] = useState<"view" | "audit">("view");

	// 批量操作状态管理
	const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
	const [selectedRows, setSelectedRows] = useState<TagAuditListItem[]>([]);

	// 获取标签类型字典
	const { options: tagTypeOptions } = useDict(TAG_DICT_KEYS.TAG_TYPE);

	// 获取业务类别字典数据
	const { data: businessCategoryData } = useDict(TAG_DICT_KEYS.BUSINESS_CATEGORY);

	// 构建业务类别树形结构
	const businessCategoryOptions = useMemo(
		() => buildDictTree(businessCategoryData),
		[businessCategoryData],
	);

	// 获取审核状态字典
	const { valueMap: auditStatusValueMap, options: auditStatusOptions } = useDict(
		TAG_DICT_KEYS.AUDIT_STATUS,
	);

	// 加载统计数据
	const { data: statisticsData, refresh: refreshStatistics } = useRequest(
		async () => {
			const res = await fetchTagAuditStatistics("2");
			return res;
		},
		{
			onError: (error) => {
				console.error("加载统计数据失败:", error);
			},
		},
	);

	const {
		pendingCount: pending = 0,
		passedCount: approved = 0,
		rejectedCount: rejected = 0,
		passedThisMonthCount: approvedThisMonth = 0,
		rejectedThisMonthCount: rejectedThisMonth = 0,
	} = statisticsData || {};

	// 加载提交人和审核人选项
	const { data: searchOptionsData, refresh: refreshSearchOptions } = useRequest(
		async () => {
			const res = await fetchSearchOptions({ type: "2" });
			return res;
		},
		{
			onError: (error) => {
				console.error("加载搜索选项失败:", error);
			},
		},
	);

	const { submitterOptions = [], auditorOptions = [] } = searchOptionsData || {};

	/**
	 * 页面从其他标签页切回当前缓存页时，主动刷新列表、统计和搜索选项，
	 * 避免审核结果变化后仍展示旧数据。
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

	/**
	 * 处理搜索
	 *
	 * @param params - 搜索参数
	 * @returns 搜索结果
	 */
	const handleSearch = async (params: any) => {
		try {
			// 解构搜索参数
			const {
				current = 1,
				pageSize = 10,
				businessCategory,
				isRequired,
				auditStatus,
				...restParams
			} = params;

			// 构建搜索参数对象
			const searchParams: any = {
				...restParams,
				pageNum: current,
				pageSize,
				type: "2", // 人才标签
			};

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

			// 审核状态（多选转字符串）
			if (auditStatus && Array.isArray(auditStatus) && auditStatus.length > 0) {
				searchParams.auditStatusArr = auditStatus.join(",");
			}

			const response = await fetchTagAuditList(searchParams);

			// axios-request 拦截器已处理 code 检查，这里直接使用数据
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

	/**
	 * 审核操作 - 打开审核抽屉
	 *
	 * @param record - 标签审核列表项
	 */
	const handleAudit = (record: TagAuditListItem) => {
		setSelectedTagData(record);
		setMode("audit");
		setIsDrawerOpen(true);
	};

	/**
	 * 查看审核详情 - 打开详情抽屉
	 *
	 * @param record - 标签审核列表项
	 */
	const handleViewRecords = useCallback((record: TagAuditListItem) => {
		setSelectedTagData(record);
		setMode("view");
		setIsDrawerOpen(true);
	}, []);

	/**
	 * 关闭抽屉
	 */
	const handleCloseDrawer = useCallback(() => {
		setIsDrawerOpen(false);
		setSelectedTagData(null);
		setMode("view");
	}, []);

	// 使用批量审核 Hook
	const { isBatchAuditDisabled, handleBatchAudit } = useBatchAudit({
		type: "2", // 人才标签
		selectedRowKeys,
		selectedRows,
		actionRef,
		refreshStatistics,
		setSelectedRowKeys,
		setSelectedRows,
	});

	// 使用表格列配置 Hook
	const columns = useTableColumns({
		tagTypeOptions,
		businessCategoryOptions,
		auditStatusOptions: auditStatusOptions || [],
		auditStatusValueMap,
		submitterOptions: submitterOptions || [],
		auditorOptions: auditorOptions || [],
		onAudit: handleAudit,
		onViewRecords: handleViewRecords,
	});

	/**
	 * 处理审核通过
	 */
	const handleApprove = useCallback(async () => {
		if (!selectedTagData) {
			return;
		}
		Modal.confirm({
			title: "请确认是否通过",
			content: `通过对象:${selectedTagData.tagName}`,
			icon: <ExclamationCircleFilled />,
			centered: true,
			onOk: async () => {
				try {
					await batchAuditTags({
						ids: [selectedTagData.id],
						auditStatus: "1", // 1=已通过
						type: "2", // 人才标签
					});
					message.success("审核通过成功");
					handleCloseDrawer();
					actionRef.current?.reload();
					refreshStatistics();
				} catch (error) {
					console.error("审核操作失败:", error);
				}
			},
		});
	}, [selectedTagData, handleCloseDrawer, refreshStatistics]);

	/**
	 * 处理审核驳回
	 *
	 * @param auditComment - 审核意见
	 */
	const handleReject = useCallback(
		async (auditComment: string) => {
			if (!selectedTagData) {
				return;
			}
			try {
				await batchAuditTags({
					ids: [selectedTagData.id],
					auditStatus: "2", // 2=已拒绝
					auditComment,
					type: "2", // 人才标签
				});
				message.success("审核驳回成功");
				handleCloseDrawer();
				actionRef.current?.reload();
				refreshStatistics();
			} catch (error) {
				console.error("审核操作失败:", error);
			}
		},
		[selectedTagData, handleCloseDrawer, refreshStatistics],
	);

	return (
		<BasicContent className="flex h-full flex-col">
			<div className="flex h-full flex-col">
				{/* 统计卡片 */}
				<StatisticsCards
					pending={pending}
					approved={approved}
					rejected={rejected}
					approvedThisMonth={approvedThisMonth}
					rejectedThisMonth={rejectedThisMonth}
				/>

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
						tableAlertRender={false}
						headerTitle={
							<BasicButton
								onClick={handleBatchAudit}
								disabled={isBatchAuditDisabled()}
								auth={TAG_MANAGEMENT_PERMISSIONS.TAG_APPROVE_APPROVE}
							>
								批量审核
							</BasicButton>
						}
						rowSelection={{
							selectedRowKeys,
							onChange: (keys, rows) => {
								setSelectedRowKeys(keys.map(String));
								setSelectedRows(rows);
							},
							getCheckboxProps: (record) => ({
								disabled: record.auditStatus !== "0",
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

			{/* 标签详情/审核抽屉 */}
			<TagViewDrawer
				open={isDrawerOpen}
				onClose={handleCloseDrawer}
				tagId={selectedTagData?.id ?? ""}
				tagName={selectedTagData?.tagName || ""}
				libraryType="2"
				mode={mode === "audit" ? "audit" : "auditDetail"}
				auditStatusValueMap={auditStatusValueMap}
				onApprove={handleApprove}
				onSubmitAudit={handleReject}
			/>
		</BasicContent>
	);
});

export default TalentTagAudit;
