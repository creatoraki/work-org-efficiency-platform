import type { ColumnsType } from "antd/es/table";
import type { AdjustmentValidationIssue } from "../types";
import { CloseOutlined } from "@ant-design/icons";
import { Button, Table } from "antd";
import React, { useMemo } from "react";

interface ValidationIssuePanelProps {
	issues: AdjustmentValidationIssue[];
	onClose: () => void;
	onRevertToOriginal: (issue: AdjustmentValidationIssue) => void;
}

export const ValidationIssuePanel: React.FC<ValidationIssuePanelProps> = ({
	issues,
	onClose,
	onRevertToOriginal,
}) => {
	const columns = useMemo<ColumnsType<AdjustmentValidationIssue>>(() => {
		return [
			{
				title: "组织名称",
				dataIndex: "orgName",
				key: "orgName",
				width: 240,
				ellipsis: true,
			},
			{
				title: "主数据编码",
				dataIndex: "code",
				key: "code",
				width: 160,
				render: (value: string) => value || "--",
			},
			{
				title: "原父组织主数据编码",
				dataIndex: "originalParentOrgId",
				key: "originalParentOrgId",
				width: 160,
				ellipsis: true,
				render: (value?: string) => value || "--",
			},
			{
				title: "原父组织名称",
				dataIndex: "originalParentOrgName",
				key: "originalParentOrgName",
				width: 200,
				ellipsis: true,
				render: (value?: string) => value || "--",
			},
			{
				title: "校验内容",
				dataIndex: "message",
				key: "message",
				render: (value: string) => value || "--",
			},
			{
				title: "操作",
				key: "action",
				width: 260,
				render: (_, record) => {
					if (!record.originalParentOrgId) {
						return (
							<Button type="link" size="small" style={{ paddingInline: 0 }} disabled>
								无原父节点
							</Button>
						);
					}

					return (
						<Button
							type="link"
							size="small"
							style={{ paddingInline: 0 }}
							onClick={() => onRevertToOriginal(record)}
						>
							移回
							{record.originalParentOrgName || "原父组织"}
						</Button>
					);
				},
			},
		];
	}, [onRevertToOriginal]);

	return (
		<div
			className="w-full rounded-lg bg-white px-2"
			style={{
				border: "1px solid rgba(0, 0, 0, 0.12)",
				boxShadow: "0 4px 16px rgba(0, 0, 0, 0.12)",
			}}
		>
			<div className="flex items-center justify-between border-b border-[#ebeef5] py-3">
				<div className="flex items-center gap-3">
					<span className="text-sm font-medium text-[#303133]">校验结果</span>
					<span className="text-xs text-[#909399]">共 {issues.length} 项冲突待处理</span>
				</div>
				<Button type="text" icon={<CloseOutlined />} onClick={onClose} />
			</div>
			<Table<AdjustmentValidationIssue>
				rowKey="key"
				columns={columns}
				dataSource={issues}
				size="small"
				pagination={issues.length > 8 ? { pageSize: 8, showSizeChanger: false } : false}
				scroll={{ y: issues.length > 8 ? 320 : undefined }}
			/>
		</div>
	);
};

export default ValidationIssuePanel;
