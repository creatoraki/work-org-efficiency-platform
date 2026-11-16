import type { ColumnsType } from "antd/es/table";
import type { ImportRecord } from "../../types";
import { Badge, Typography } from "antd";
import React from "react";
import { formatFileSize } from "../../utils";
import { getImportStatusBadgeStatus, getImportStatusLabel } from "../utils";
import { getLeafModuleName } from "./modules";

export function createImportTaskColumns(
	onNameClick: (record: ImportRecord) => void,
): ColumnsType<ImportRecord> {
	return [
		{
			title: "文件名称",
			dataIndex: "name",
			key: "name",
			width: 300,
			ellipsis: true,
			render: (_: string, record: ImportRecord) => (
				<Typography.Paragraph
					ellipsis={{ rows: 2, tooltip: true }}
					className="!mb-0"
					onClick={() => onNameClick(record)}
				>
					{record.name || "--"}
				</Typography.Paragraph>
			),
		},
		{
			title: "模块名称",
			dataIndex: "module",
			key: "module",
			width: 200,
			render: (module: string) => getLeafModuleName(module),
		},
		{
			title: "文件大小",
			dataIndex: "fileSize",
			key: "fileSize",
			width: 120,
			render: (size: number) => formatFileSize(size),
		},
		{
			title: "已完成",
			dataIndex: "completedTotalNum",
			key: "completedTotalNum",
			width: 110,
			render: (value: number | undefined) => value ?? 0,
		},
		{
			title: "总数",
			dataIndex: "totalNum",
			key: "totalNum",
			width: 110,
			render: (value: number | undefined) => value ?? 0,
		},
		{
			title: "状态",
			dataIndex: "status",
			key: "status",
			width: 150,
			render: (_: any, record: ImportRecord) => {
				const statusText =
					record.status === 1
						? `进行中(${Math.floor(((record.completedTotalNum ?? 0) / (record.totalNum || 1)) * 100)}%)`
						: getImportStatusLabel(record.status);

				return React.createElement(Badge, {
					status: getImportStatusBadgeStatus(record.status),
					text: statusText,
				});
			},
		},
		{
			title: "备注",
			dataIndex: "remark",
			key: "remark",
			width: 200,
			ellipsis: true,
		},
		{
			title: "导入时间",
			dataIndex: "updateTime",
			key: "updateTime",
			width: 180,
		},
	];
}
