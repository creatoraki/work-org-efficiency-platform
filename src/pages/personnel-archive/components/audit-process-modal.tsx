/**
 * 审核进程弹窗组件（通用）
 *
 * 注意：
 * - 供「档案管理」和「档案审核」两处共用
 * - 支持 ArchiveAuditItem 和 ArchiveManagementItem 两种记录类型
 */

import type { ApprovalNodeListResponse } from "#src/api/personnel-archive/common";
import { useDict } from "#src/hooks";
import { ProFormSelect } from "@ant-design/pro-components";
import { Badge, Empty, Form, Modal, Spin, Steps, Typography } from "antd";
import { useEffect, useMemo, useState } from "react";

const { Text } = Typography;

/**
 * 审核进程弹窗组件属性
 */
interface AuditProcessModalProps {
	/** 是否打开弹窗 */
	open: boolean;
	/** 关闭回调 */
	onClose: () => void;
	/** 审核节点列表数据 */
	approvalNodeList?: ApprovalNodeListResponse[];
	/** 数据加载状态 */
	loading?: boolean;
	/** 默认选中的标签ID（可选，不传则自动使用第一项） */
	defaultTagId?: number;
}

/**
 * 审核进程弹窗组件
 *
 * @param props - 组件属性
 * @param props.open - 是否打开弹窗
 * @param props.onClose - 关闭回调
 * @param props.approvalNodeList - 审核节点列表数据
 * @param props.loading - 数据加载状态
 */
const EMPTY_ARRAY: ApprovalNodeListResponse[] = [];

export function AuditProcessModal({
	open,
	onClose,
	approvalNodeList = EMPTY_ARRAY,
	loading = false,
	defaultTagId: propDefaultTagId,
}: AuditProcessModalProps) {
	const { valueMap: statusValueMap, translate: translateStatus } = useDict(
		"user_tag_approval_status",
	);

	// 获取有效的标签列表（过滤掉无效的标签）
	const validTagOptions = useMemo(() => {
		return approvalNodeList.filter((item) => item.tagId != null && item.tagName != null);
	}, [approvalNodeList]);

	// 计算默认选中的标签ID：优先使用 props 传入的，否则使用第一项
	const defaultTagId = useMemo(() => {
		return propDefaultTagId ?? validTagOptions[0]?.tagId;
	}, [propDefaultTagId, validTagOptions]);

	// 用户手动选择的标签ID
	const [userSelectedTagId, setUserSelectedTagId] = useState<number | undefined>(undefined);

	// 弹窗打开时自动选中第一项，关闭时重置
	useEffect(() => {
		if (open && !loading && defaultTagId !== undefined) {
			setUserSelectedTagId(defaultTagId);
		}
		if (!open) {
			setUserSelectedTagId(undefined);
		}
	}, [open, loading, defaultTagId]);

	// 实际使用的标签ID：优先使用用户选择（需在有效选项中），否则使用默认值
	const actualSelectedTagId = useMemo(() => {
		if (
			userSelectedTagId !== undefined &&
			validTagOptions.some((tag) => tag.tagId === userSelectedTagId)
		) {
			return userSelectedTagId;
		}
		return defaultTagId;
	}, [userSelectedTagId, defaultTagId, validTagOptions]);

	// 获取当前选中标签的信息和节点列表
	const currentTagInfo = useMemo(() => {
		if (!actualSelectedTagId) {
			return null;
		}
		return approvalNodeList.find((item) => item.tagId === actualSelectedTagId) ?? null;
	}, [actualSelectedTagId, approvalNodeList]);

	const currentNodes = currentTagInfo?.nodeList ?? [];

	// 判断空状态的类型
	const emptyStateType = useMemo(() => {
		if (loading) {
			return "loading";
		}
		if (validTagOptions.length === 0) {
			return "noTags";
		}
		if (actualSelectedTagId && currentNodes.length === 0) {
			return "noNodes";
		}
		return null;
	}, [loading, validTagOptions.length, actualSelectedTagId, currentNodes.length]);

	// 渲染空状态
	const renderEmptyState = () => {
		switch (emptyStateType) {
			case "loading":
				return (
					<div className="flex items-center justify-center py-12">
						<Spin size="large" />
					</div>
				);
			case "noTags":
				return (
					<Empty
						image={Empty.PRESENTED_IMAGE_SIMPLE}
						description={
							<div className="flex flex-col items-center gap-2">
								<Text type="secondary">该员工暂无审核标签</Text>
								<Text type="secondary" className="text-xs">
									请先完善档案信息或等待审核流程启动
								</Text>
							</div>
						}
					/>
				);
			case "noNodes":
				return (
					<Empty
						image={Empty.PRESENTED_IMAGE_SIMPLE}
						description={
							<div className="flex flex-col items-center gap-2">
								<Text type="secondary">
									标签「
									{currentTagInfo?.tagName || "未知"}
									」暂无审核流程记录
								</Text>
							</div>
						}
					/>
				);
			default:
				return null;
		}
	};

	return (
		<Modal
			key={open ? "open" : "closed"}
			title="审核进程"
			open={open}
			onCancel={onClose}
			centered
			width={600}
			styles={{
				body: {
					minHeight: "300px",
					maxHeight: "50vh",
					display: "flex",
					flexDirection: "column",
				},
			}}
			footer={null}
			destroyOnHidden
		>
			{/* 固定表单区域 */}
			<div className="flex-shrink-0">
				<Form.Item label="标签" required className="mb-0" colon={false}>
					<ProFormSelect
						name="tagId"
						placeholder="请选择标签"
						options={validTagOptions}
						fieldProps={{
							value: actualSelectedTagId,
							onChange: (value) => {
								setUserSelectedTagId(value ?? undefined);
							},
							fieldNames: { label: "tagName", value: "tagId" },
							disabled: validTagOptions.length === 0,
						}}
						showSearch
					/>
				</Form.Item>
			</div>

			{/* 可滚动内容区域 */}
			<div className="flex-1 overflow-y-auto rounded border p-4">
				{emptyStateType ? (
					renderEmptyState()
				) : (
					<Steps
						className="w-full [&_.ant-steps-item-title]:w-full [&_.ant-steps-item-title]:!pe-0"
						progressDot
						direction="vertical"
						size="small"
						items={currentNodes.map((node) => {
							// 处理可能为null的字段
							const auditTime = node.updateTime || "";
							const statusKey = String(node.status || "2");
							const dictItem = statusValueMap.get(statusKey);
							const statusLabel = translateStatus(statusKey) || "待审核";
							const listClass = dictItem?.listClass as
								| "default"
								| "success"
								| "processing"
								| "error"
								| "warning"
								| undefined;
							const isRejected = statusKey === "4";

							// 兼容null值，设置默认值
							const nodeName = node.nodeName || "-";
							const approverName = node.approverName || "-";
							const approvalComments = node.approvalComments || "";
							const approvalId = String(node.approvalId ?? "");
							const nodeId = String(node.nodeId ?? "");

							return {
								key: `${approvalId}_${nodeId}`,
								status: "finish",
								title: (
									<div className="flex w-full flex-col gap-2">
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-2">
												<Text strong>{nodeName}</Text>
												<Text type="secondary" className="text-sm">
													{auditTime}
												</Text>
											</div>
											<Text className="text-sm">{approverName}</Text>
										</div>

										<div className="mb-4 flex justify-between gap-8 rounded bg-gray-100 p-2">
											<div className="flex-1 text-sm">
												<Typography.Paragraph
													ellipsis={{
														rows: 2,
														expandable: "collapsible",
													}}
													style={{
														marginBottom: 0,
													}}
												>
													{isRejected
														? `驳回原因: ${approvalComments || "-"}`
														: approvalComments || "/"}
												</Typography.Paragraph>
											</div>
											<div className="flex-shrink-0">
												<Badge
													status={listClass || "default"}
													color={listClass || "default"}
													text={statusLabel}
												/>
											</div>
										</div>
									</div>
								),
							};
						})}
					/>
				)}
			</div>
		</Modal>
	);
}
