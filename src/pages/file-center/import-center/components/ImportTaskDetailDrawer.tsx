import type { ImportTaskDetail } from "#src/api/file/import-task/types";
import { download, getInfo } from "#src/api/file/import-task";
import { commonDrawerProps } from "#src/pages/strategy/target-management/constants/base.js";
import { downloadBlob } from "#src/utils";
import { ProDescriptions } from "@ant-design/pro-components";
import { Alert, Drawer, message, Spin, Typography } from "antd";
import React from "react";
import { formatFileSize } from "../../utils";
import { formatApiTime, getImportStatusLabel } from "../utils";

interface ImportTaskDetailDrawerProps {
	open: boolean;
	id?: number | string;
	onClose: () => void;
}

export const ImportTaskDetailDrawer: React.FC<ImportTaskDetailDrawerProps> = ({
	open,
	id,
	onClose,
}) => {
	const [loading, setLoading] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);
	const [detail, setDetail] = React.useState<ImportTaskDetail | null>(null);

	React.useEffect(() => {
		if (!open || id === undefined || id === null) return;

		let active = true;
		setLoading(true);
		setError(null);

		getInfo(Number(id))
			.then((resp) => {
				if (!active) return;
				if (resp?.code !== 200) {
					throw new Error(resp?.msg || "获取详情失败");
				}
				setDetail(resp.data);
			})
			.catch((err) => {
				if (!active) return;
				setError(err?.message || "获取详情失败");
				setDetail(null);
			})
			.finally(() => {
				if (active) setLoading(false);
			});

		return () => {
			active = false;
		};
	}, [open, id]);

	const handleDownload = React.useCallback(async (fileName?: string) => {
		if (!fileName) {
			message.warning("未找到可下载的文件");
			return;
		}
		try {
			const blob = await download(fileName);
			downloadBlob(blob, fileName);
		} catch (err) {
			console.error("download file failed", err);
			message.error("下载失败");
		}
	}, []);

	return (
		<Drawer
			title="导入任务详情"
			width={640}
			open={open}
			destroyOnHidden
			{...commonDrawerProps(onClose)}
		>
			{loading && (
				<div className="flex justify-center py-10">
					<Spin />
				</div>
			)}
			{!loading && error && <Alert type="error" message={error} showIcon />}
			{!loading && !error && detail && (
				<ProDescriptions
					colon={false}
					column={1}
					layout="horizontal"
					styles={{ label: { color: "#909399", width: 110 } }}
					dataSource={detail}
					bordered={false}
					columns={[
						{
							title: "任务名称",
							dataIndex: "taskName",
							renderText: (value) => value || "--",
						},
						{
							title: "任务状态",
							dataIndex: "status",
							renderText: (value) => getImportStatusLabel(Number(value)),
						},
						{
							title: "模块名称",
							dataIndex: "moduleName",
							renderText: (value) => value || "--",
						},
						{
							title: "文件大小",
							dataIndex: "fileSize",
							renderText: (value) => formatFileSize(Number(value)),
						},
						{
							title: "源文件",
							dataIndex: "sourceFile",
							render: (_, record) =>
								record.sourceFile ? (
									<Typography.Link
										onClick={() => handleDownload(record.sourceFile)}
									>
										{record.sourceFile}
									</Typography.Link>
								) : (
									"--"
								),
						},
						{
							title: "失败反馈文件",
							dataIndex: "errorFile",
							render: (_, record) =>
								record.errorFile ? (
									<Typography.Link
										onClick={() => handleDownload(record.errorFile)}
									>
										{record.errorFile}
									</Typography.Link>
								) : (
									"--"
								),
						},
						{
							title: "总数",
							dataIndex: "totalNum",
							renderText: (value) => (value ?? 0) as number,
						},
						{
							title: "成功数量",
							dataIndex: "successNum",
							renderText: (value) => (value ?? 0) as number,
						},
						{
							title: "失败数量",
							dataIndex: "errorNum",
							renderText: (value) => (value ?? 0) as number,
						},
						{
							title: "任务开始时间",
							dataIndex: "startTime",
							renderText: (value) => formatApiTime(value),
						},
						{
							title: "任务结束时间",
							dataIndex: "endTime",
							renderText: (value) => formatApiTime(value),
						},
						{
							title: "失败原因",
							dataIndex: "failureReason",
							renderText: (value) => value || "--",
						},
						{
							title: "备注",
							dataIndex: "remark",
							renderText: (value) => value || "--",
						},
					]}
				/>
			)}
		</Drawer>
	);
};
