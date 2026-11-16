/**
 * 组织审核列表表格列配置
 */

import type { ColumnsType } from "antd/es/table";
import type { OrgApprovalRecord } from "../types";
import { Typography } from "antd";
import { formatOrgApprovalDateTime } from "../utils";

export function getColumns(
	_handleOpenApprovalProcess: (fdId?: string) => void,
): ColumnsType<OrgApprovalRecord> {
	return [
		{
			title: "流程编号",
			dataIndex: "approvalCode",
			key: "approvalCode",
			width: 160,
			render: (text: string | undefined) => {
				const canOpen = Boolean(text && text !== "-");

				return (
					<Typography.Text
						style={{
							color: canOpen ? "#1677ff" : "inherit",
							width: "100%",
							cursor: canOpen ? "pointer" : "default",
						}}
						ellipsis={{ tooltip: true }}
					>
						{text || "--"}
					</Typography.Text>
				);
			},
		},
		{
			title: "任务名称",
			dataIndex: "approvalName",
			key: "approvalName",
			width: 220,
			ellipsis: true,
			render: (text: string) => <span title={text}>{text}</span>,
		},
		{
			title: "版本号",
			dataIndex: "businessVersion",
			key: "businessVersion",
			width: 140,
		},
		{
			title: "状态",
			dataIndex: "statusStr",
			key: "statusStr",
			width: 120,
		},
		{
			title: "当前审批人",
			dataIndex: "currentApprover",
			key: "currentApprover",
			width: 120,
			ellipsis: true,
		},
		{
			title: "发起日期",
			dataIndex: "startTime",
			key: "startTime",
			width: 180,
			render: (value: OrgApprovalRecord["startTime"]) => (
				<span className="text-xs text-gray-500">
					{formatOrgApprovalDateTime(value) || "--"}
				</span>
			),
		},
		{
			title: "发起人",
			dataIndex: "initiatorUserName",
			key: "initiatorUserName",
			width: 120,
		},
	];
}
