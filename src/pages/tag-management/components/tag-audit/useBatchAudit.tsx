import type { TagAuditListItem } from "#src/api/tag-management/tag-audit";
import type { ActionType } from "@ant-design/pro-components";
import { batchAuditTags } from "#src/api/tag-management/tag-audit";
import { ExclamationCircleFilled } from "@ant-design/icons";
import { message, Modal } from "antd";
import { useCallback } from "react";

/**
 * 批量审核 Hook 参数
 */
interface UseBatchAuditParams {
	/** 标签类型：1=组织标签，2=人才标签 */
	type: "1" | "2";
	/** 选中的行键 */
	selectedRowKeys: string[];
	/** 选中的行数据 */
	selectedRows: TagAuditListItem[];
	/** 表格操作引用 */
	actionRef: React.MutableRefObject<ActionType | undefined>;
	/** 刷新统计数据回调 */
	refreshStatistics: () => void;
	/** 设置选中的行键 */
	setSelectedRowKeys: (keys: string[]) => void;
	/** 设置选中的行数据 */
	setSelectedRows: (rows: TagAuditListItem[]) => void;
}

/**
 * 批量审核 Hook 返回值
 */
interface UseBatchAuditReturn {
	/** 判断记录是否可以审核 */
	canAuditRecord: (record: TagAuditListItem) => boolean;
	/** 检查批量审核按钮是否应该禁用 */
	isBatchAuditDisabled: () => boolean;
	/** 处理批量审核 */
	handleBatchAudit: () => void;
}

/**
 * 批量审核 Hook
 *
 * 提供批量审核标签的功能，包括验证、确认和执行批量审核操作
 *
 * @param params - Hook 参数
 * @param params.type - 标签类型：1=组织标签，2=人才标签
 * @param params.selectedRowKeys - 选中的行键
 * @param params.selectedRows - 选中的行数据
 * @param params.actionRef - 表格操作引用
 * @param params.refreshStatistics - 刷新统计数据回调
 * @param params.setSelectedRowKeys - 设置选中的行键
 * @param params.setSelectedRows - 设置选中的行数据
 * @returns 批量审核相关的方法和状态
 */
export function useBatchAudit({
	type,
	selectedRowKeys,
	selectedRows,
	actionRef,
	refreshStatistics,
	setSelectedRowKeys,
	setSelectedRows,
}: UseBatchAuditParams): UseBatchAuditReturn {
	/**
	 * 判断记录是否可以审核
	 *
	 * @param record - 标签审核列表项
	 * @returns 是否可以审核
	 */
	const canAuditRecord = useCallback(
		(record: TagAuditListItem) => record.auditStatus === "0",
		[],
	);

	/**
	 * 检查批量审核按钮是否应该禁用
	 *
	 * @returns 是否禁用
	 */
	const isBatchAuditDisabled = useCallback(() => {
		return selectedRows.length === 0 || !selectedRows.some(canAuditRecord);
	}, [selectedRows, canAuditRecord]);

	/**
	 * 处理批量审核
	 */
	const handleBatchAudit = useCallback(() => {
		if (selectedRowKeys.length === 0) {
			message.warning("请先选择要审核的标签");
			return;
		}

		// 只对"待审核"状态（"0"）的标签进行批量审核
		const validRows = selectedRows.filter(canAuditRecord);

		if (validRows.length === 0) {
			message.warning("选中的标签中没有待审核状态的标签");
			return;
		}

		const totalCount = selectedRowKeys.length;
		const validCount = validRows.length;

		// 如果选中的数据中有部分不符合条件，提示用户
		const contentText =
			totalCount === validCount
				? `确定要对选中的 ${validCount} 个标签进行批量审核吗？`
				: `选中的 ${totalCount} 个标签中，有 ${validCount} 个符合审核条件，是否要对这 ${validCount} 个标签进行批量审核？`;

		Modal.confirm({
			title: "批量审核确认",
			content: contentText,
			icon: <ExclamationCircleFilled />,
			centered: true,
			onOk: async () => {
				try {
					await batchAuditTags({
						ids: validRows.map((row) => row.id),
						auditStatus: "1", // 批量审核默认通过
						type,
					});
					message.success(`批量审核成功，共处理 ${validCount} 个标签`);
					setSelectedRowKeys([]);
					setSelectedRows([]);
					actionRef.current?.reload();
					refreshStatistics(); // 刷新统计数据
				} catch (error) {
					console.error("批量审核失败:", error);
				}
			},
		});
	}, [
		type,
		selectedRowKeys,
		selectedRows,
		canAuditRecord,
		actionRef,
		refreshStatistics,
		setSelectedRowKeys,
		setSelectedRows,
	]);

	return {
		canAuditRecord,
		isBatchAuditDisabled,
		handleBatchAudit,
	};
}
