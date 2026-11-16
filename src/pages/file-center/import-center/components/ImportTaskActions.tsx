import type { ImportRecord } from "../../types";
import { cancel, download } from "#src/api/file/import-task";
import { confirm } from "#src/components/custom-confirm/index.js";
import { downloadBlob } from "#src/utils";
import { message, Space, Typography } from "antd";
import React from "react";
import { ImportStatus } from "../../types";

interface ImportTaskActionsProps {
	record: ImportRecord;
	onActionComplete?: () => void;
}

// function getSuccessFileName(record: ImportRecord) {
// 	return record.sourceFile;
// }

function getErrorFileName(record: ImportRecord) {
	return record.errorFile;
}

export const ImportTaskActions: React.FC<ImportTaskActionsProps> = React.memo(
	({ record, onActionComplete }) => {
		const { status } = record;

		const handleDownload = async (fileName: string | undefined, emptyMessage: string) => {
			try {
				if (!fileName) {
					message.warning(emptyMessage);
					return;
				}
				const blob = await download(fileName);
				downloadBlob(blob, fileName);
			} catch (error) {
				console.error("handleDownload failed", error);
				message.error("下载失败");
			}
		};

		const handleCancel = async () => {
			confirm({
				title: "请确认是否取消任务",
				icon: "yellow",
				content: "取消后任务将停止执行",
				centered: true,
				onOk: async () => {
					try {
						const resp = await cancel(Number(record.id));
						if (resp?.code !== 200) {
							throw new Error(resp?.msg || "取消失败");
						}
						message.success("任务已取消");
						onActionComplete?.();
					} catch (error) {
						console.error("handleCancel failed", error);
						message.error("取消失败");
					}
				},
			});
		};

		if (status === ImportStatus.SUCCESS) {
			return <span style={{ color: "#909399" }}>--</span>;
		}

		if (status === ImportStatus.FAILED) {
			return (
				<Space size={8} split={<span className="text-[rgba(235,238,245,1)]">|</span>}>
					{/* <Typography.Link
						onClick={() => handleDownload(getSuccessFileName(record), "未找到成功文件")}
					>
						下载成功文件
					</Typography.Link> */}
					<Typography.Link
						onClick={() => handleDownload(getErrorFileName(record), "未找到失败文件")}
					>
						下载失败文件
					</Typography.Link>
				</Space>
			);
		}

		if (status === ImportStatus.QUEUED || status === ImportStatus.IN_PROGRESS) {
			return <Typography.Link onClick={handleCancel}>取消</Typography.Link>;
		}

		return <span style={{ color: "#909399" }}>--</span>;
	},
);

ImportTaskActions.displayName = "ImportTaskActions";
