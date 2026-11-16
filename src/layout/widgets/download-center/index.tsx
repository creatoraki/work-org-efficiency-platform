import type { FetchFileInfoListParams, FileInfoItem } from "#src/api/file/export-task";
import type { ImportRecord } from "#src/pages/file-center/types";
import type { TaskNotificationMessage } from "#src/utils/websocket/task-ws-service";
import type { ColumnsType } from "antd/es/table";
import { cancelExportById, fetchFileInfoList } from "#src/api/file/export-task";
import {
	cancel as cancelImport,
	download as downloadImport,
	fetchImportTableData,
} from "#src/api/file/import-task";
import { downloadFileFromOss } from "#src/api/file/index.js";
import { confirm } from "#src/components/custom-confirm/index.js";
import { SectionTitle } from "#src/components/index.js";
import { mapImportTaskItem } from "#src/pages/file-center/import-center/utils";
import { downloadBlob } from "#src/utils/index.js";
import { notification } from "#src/utils/static-antd";
import { TaskNotificationType, taskWsService } from "#src/utils/websocket/task-ws-service";
import { Badge, Button, message, Popover, Table } from "antd";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";

/**
 * 将导出API数据转换为ImportRecord格式
 */
function adaptExportApiToRecord(item: FileInfoItem): ImportRecord {
	return {
		id: item.id,
		name: item.name,
		module: item.module,
		fileSize: item.fileSize,
		fileSizeStr: item.fileSizeStr,
		status: item.status,
		statusFormat: item.statusStr,
		progress: item.progress ? Number(item.progress.toString().replace("%", "")) : undefined,
		bucketName: item.bucketName,
		updateTime: item.updateTime,
		createTime: item.createTime,
		errorMessage: item.errorMessage,
		remark: item.remark,
	};
}

/**
 * 导出状态徽章映射
 */
const exportStatusMap: { [key: number]: "success" | "processing" | "error" | "default" } = {
	"-1": "error",
	"0": "default",
	"1": "processing",
	"2": "processing",
	"3": "success",
};

/**
 * 导出状态文本映射
 */
const exportStatusTextMap: { [key: number]: string } = {
	"-1": "导出失败",
	"0": "已取消",
	"1": "排队中",
	"2": "导出中",
	"3": "导出成功",
};

/**
 * 导入状态文本映射
 */
const importStatusTextMap: { [key: number]: string } = {
	0: "排队中",
	1: "进行中",
	2: "成功",
	3: "失败",
	6: "已取消",
};

function getExportStatusText(status: number, fallbackText?: string) {
	return exportStatusTextMap[status] ?? fallbackText ?? "--";
}

function getImportStatusText(status: number, fallbackText?: string) {
	return importStatusTextMap[status] ?? fallbackText ?? "--";
}

function resolveExportStatus(msg: TaskNotificationMessage, fallbackStatus: number) {
	switch (msg.type) {
		case TaskNotificationType.TASK_SUCCESS:
			return 3;
		case TaskNotificationType.TASK_FAILED:
			return -1;
		case TaskNotificationType.TASK_CANCELLED:
			return 0;
		case TaskNotificationType.TASK_PROCESSING:
		case TaskNotificationType.TASK_PROGRESS:
			return 2;
		case TaskNotificationType.TASK_CREATED:
			return 1;
		default:
			return msg.status ?? fallbackStatus;
	}
}

function resolveImportStatus(msg: TaskNotificationMessage, fallbackStatus: number) {
	switch (msg.type) {
		case TaskNotificationType.TASK_SUCCESS:
			return 2;
		case TaskNotificationType.TASK_FAILED:
			return 3;
		case TaskNotificationType.TASK_CANCELLED:
			return 6;
		case TaskNotificationType.TASK_PROCESSING:
		case TaskNotificationType.TASK_PROGRESS:
			return 1;
		case TaskNotificationType.TASK_CREATED:
			return 0;
		default:
			return msg.status ?? fallbackStatus;
	}
}

/**
 * 计算正在进行中的任务数量
 */
function calculateTaskStats(exportList: ImportRecord[], importList: ImportRecord[]): number {
	const importOngoingCount = importList.filter(
		(task) => task.status === 0 || task.status === 1,
	).length;
	const exportOngoingCount = exportList.filter(
		(task) => task.status === 1 || task.status === 2,
	).length;
	return importOngoingCount + exportOngoingCount;
}

export interface DownloadCenterPopupProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onTaskCountChange?: (count: number) => void;
	children?: React.ReactNode;
}

/**
 * 下载中心 Popover 组件
 * 通过 WebSocket 实时接收任务状态更新
 */
export function DownloadCenterPopup({
	open,
	onOpenChange,
	onTaskCountChange,
	children,
}: DownloadCenterPopupProps) {
	const navigate = useNavigate();
	const [exportTasks, setExportTasks] = useState<ImportRecord[]>([]);
	const [importTasks, setImportTasks] = useState<ImportRecord[]>([]);
	const [loading, setLoading] = useState(false);
	const [pagination] = useState({ current: 1, pageSize: 5, total: 0 });
	const [refreshTrigger, setRefreshTrigger] = useState(0);
	const fallbackIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const loadAllDataPromiseRef = useRef<Promise<void> | null>(null);

	const triggerRefresh = useCallback(() => {
		setRefreshTrigger((prev) => prev + 1);
	}, []);

	// ==================== 操作处理 ====================

	const handleExportDownload = useCallback(async (record: ImportRecord) => {
		try {
			const blob = await downloadFileFromOss(record.bucketName || "", record.name);
			downloadBlob(blob, record.name);
		} catch (error) {
			console.error("导出文件下载失败:", error);
			message.error("下载失败");
		}
	}, []);

	const renderExportSuccessDescription = useCallback(
		(record: ImportRecord, taskName: string) => (
			<div>
				<div>{`导出任务「${taskName}」已完成`}</div>
				<div style={{ marginTop: 4 }}>
					<Button
						type="link"
						size="small"
						style={{ padding: 0, height: "auto" }}
						onClick={() => {
							void handleExportDownload(record);
						}}
					>
						直接下载
					</Button>
				</div>
			</div>
		),
		[handleExportDownload],
	);

	const handleExportCancel = useCallback(
		async (record: ImportRecord) => {
			confirm({
				title: "请确认是否取消任务",
				icon: "yellow",
				content: "取消后任务将停止执行",
				centered: true,
				onOk: async () => {
					try {
						await cancelExportById(Number(record.id));
						message.success("任务已取消");
						triggerRefresh();
					} catch (error) {
						console.error("取消导出任务失败:", error);
						message.error("取消失败");
					}
				},
			});
		},
		[triggerRefresh],
	);

	const handleImportDownload = useCallback(async (record: ImportRecord) => {
		try {
			if (!record.errorFile) {
				message.warning("未找到失败文件");
				return;
			}
			const blob = await downloadImport(record.errorFile);
			downloadBlob(blob, record.errorFile);
		} catch (error) {
			console.error("导入失败文件下载失败:", error);
			message.error("下载失败");
		}
	}, []);

	const handleImportCancel = useCallback(
		async (record: ImportRecord) => {
			confirm({
				title: "请确认是否取消任务",
				icon: "yellow",
				content: "取消后任务将停止执行",
				centered: true,
				onOk: async () => {
					try {
						const resp = await cancelImport(Number(record.id));
						if (resp?.code !== 200) {
							throw new Error(resp?.msg || "取消失败");
						}
						message.success("任务已取消");
						triggerRefresh();
					} catch (error) {
						console.error("取消导入任务失败:", error);
						message.error("取消失败");
					}
				},
			});
		},
		[triggerRefresh],
	);

	// ==================== 数据加载 ====================

	const fetchExportTasks = useCallback(async () => {
		try {
			const params: FetchFileInfoListParams = { pageNum: 1, pageSize: 5 };
			const resp = await fetchFileInfoList(params);
			return resp.data.list.map(adaptExportApiToRecord);
		} catch (error) {
			console.error("获取导出任务失败:", error);
			return [];
		}
	}, []);

	const fetchImportTasks = useCallback(async () => {
		try {
			const resp = await fetchImportTableData({ pageNum: 1, pageSize: 5, searchCount: true });
			return resp.data.list.map(mapImportTaskItem);
		} catch (error) {
			console.error("获取导入任务失败:", error);
			return [];
		}
	}, []);

	const loadAllData = useCallback(
		async (showLoading = true) => {
			if (loadAllDataPromiseRef.current) {
				return loadAllDataPromiseRef.current;
			}

			const loadPromise = (async () => {
				if (showLoading) setLoading(true);
				try {
					const [exportList, importList] = await Promise.all([
						fetchExportTasks(),
						fetchImportTasks(),
					]);
					setExportTasks(exportList);
					setImportTasks(importList);
				} finally {
					if (showLoading) setLoading(false);
				}
			})();

			loadAllDataPromiseRef.current = loadPromise;
			try {
				await loadPromise;
			} finally {
				loadAllDataPromiseRef.current = null;
			}
		},
		[fetchExportTasks, fetchImportTasks],
	);

	// ==================== WebSocket 消息处理 ====================

	/**
	 * 处理 WebSocket 推送的任务状态消息
	 * 根据消息类型增量更新本地列表，避免全量 HTTP 请求
	 */
	useEffect(() => {
		const unsubMessage = taskWsService.onMessage((msg: TaskNotificationMessage) => {
			if (msg.category === "export") {
				handleExportWsMessage(msg);
			} else if (msg.category === "import") {
				handleImportWsMessage(msg);
			}
		});

		return unsubMessage;
	}, []);

	/**
	 * 处理导出任务 WebSocket 消息
	 */
	function handleExportWsMessage(msg: TaskNotificationMessage) {
		if (msg.type === TaskNotificationType.TASK_CREATED) {
			loadAllData(false);
			return;
		}

		setExportTasks((prev) => {
			const existing = prev.find((t) => t.id === msg.taskId);

			if (!existing) {
				loadAllData(false);
				return prev;
			}

			// 通知完成/失败（在 setState 外用 setTimeout 延迟执行）
			if (msg.type === TaskNotificationType.TASK_SUCCESS) {
				setTimeout(() =>
					notification.success({
						message: "导出成功",
						description: renderExportSuccessDescription(
							existing,
							msg.taskName || existing.name,
						),
						duration: 5,
						showProgress: true,
					}),
				);
			} else if (msg.type === TaskNotificationType.TASK_FAILED) {
				setTimeout(() =>
					notification.error({
						message: "导出失败",
						description: `导出任务「${msg.taskName || existing.name}」失败${msg.errorMessage ? `：${msg.errorMessage}` : ""}`,
						duration: 8,
						showProgress: true,
					}),
				);
			}

			return prev.map((t) => {
				if (t.id !== msg.taskId) return t;
				const nextStatus = resolveExportStatus(msg, t.status);
				return {
					...t,
					status: nextStatus,
					statusFormat:
						nextStatus != null
							? (exportStatusTextMap[nextStatus] ?? t.statusFormat)
							: t.statusFormat,
					progress: msg.progress ?? (nextStatus === 3 ? 100 : t.progress),
					fileSize: msg.fileSize ?? t.fileSize,
					errorMessage: msg.errorMessage ?? t.errorMessage,
				};
			});
		});
	}

	/**
	 * 处理导入任务 WebSocket 消息
	 */
	function handleImportWsMessage(msg: TaskNotificationMessage) {
		if (msg.type === TaskNotificationType.TASK_CREATED) {
			loadAllData(false);
			return;
		}

		setImportTasks((prev) => {
			const existing = prev.find((t) => t.id === msg.taskId);

			if (!existing) {
				loadAllData(false);
				return prev;
			}

			if (msg.type === TaskNotificationType.TASK_SUCCESS) {
				setTimeout(() =>
					notification.success({
						message: "导入完成",
						description: `导入任务「${msg.taskName || existing.name}」已完成`,
						duration: 5,
						placement: "topLeft",
					}),
				);
			} else if (msg.type === TaskNotificationType.TASK_FAILED) {
				setTimeout(() =>
					notification.error({
						message: "导入失败",
						description: `导入任务「${msg.taskName || existing.name}」失败${msg.errorMessage ? `：${msg.errorMessage}` : ""}`,
						duration: 8,
						placement: "topLeft",
					}),
				);
			}

			return prev.map((t) => {
				if (t.id !== msg.taskId) return t;
				const nextStatus = resolveImportStatus(msg, t.status);
				return {
					...t,
					status: nextStatus,
					statusFormat:
						nextStatus != null
							? (importStatusTextMap[nextStatus] ?? t.statusFormat)
							: t.statusFormat,
					progress: msg.progress ?? (nextStatus === 2 ? 100 : t.progress),
					errorMessage: msg.errorMessage ?? t.errorMessage,
				};
			});
		});
	}

	/**
	 * 自动更新 badge 计数（响应任务列表变化）
	 */
	useEffect(() => {
		if (onTaskCountChange) {
			onTaskCountChange(calculateTaskStats(exportTasks, importTasks));
		}
	}, [exportTasks, importTasks, onTaskCountChange]);

	// ==================== 连接恢复同步 / 断线兜底 ====================

	/**
	 * WebSocket 重连成功后补一次快照；断线时退化为定时刷新，避免状态长期停滞。
	 */
	useEffect(() => {
		const stopFallback = () => {
			if (fallbackIntervalRef.current) {
				clearInterval(fallbackIntervalRef.current);
				fallbackIntervalRef.current = null;
			}
		};

		const startFallback = () => {
			if (fallbackIntervalRef.current) {
				return;
			}
			fallbackIntervalRef.current = setInterval(() => {
				loadAllData(false);
			}, 10000);
		};

		const unsubConnection = taskWsService.onConnectionChange((connected) => {
			if (connected) {
				stopFallback();
				loadAllData(false);
			} else {
				startFallback();
			}
		});

		if (!taskWsService.connected) {
			startFallback();
		}

		return () => {
			stopFallback();
			unsubConnection();
		};
	}, [loadAllData]);

	/**
	 * 组件挂载时加载一次数据
	 */
	useEffect(() => {
		loadAllData(false);
	}, [refreshTrigger]);

	/**
	 * 弹窗打开时刷新数据（显示loading）
	 */
	useEffect(() => {
		if (open) {
			loadAllData(true);
		}
	}, [open, loadAllData]);

	// ==================== 表格列定义 ====================

	const exportColumns: ColumnsType<ImportRecord> = [
		{
			title: "报表名称",
			dataIndex: "name",
			key: "name",
			ellipsis: true,
			width: 200,
		},
		{
			title: "状态",
			dataIndex: "status",
			key: "status",
			width: 120,
			render: (status: number, record: ImportRecord) => {
				const statusText = getExportStatusText(status, record.statusFormat);
				const text =
					status === 2 && record.progress !== undefined
						? `${statusText}(${Math.round(record.progress)}%)`
						: statusText;

				return <Badge status={exportStatusMap[status] || "default"} text={text} />;
			},
		},
		{
			title: "导出时间",
			dataIndex: "createTime",
			key: "createTime",
			ellipsis: true,
			width: 160,
		},
		{
			title: "操作",
			key: "action",
			width: 80,
			fixed: "right" as const,
			render: (_, record: ImportRecord) => {
				if (record.status === 3) {
					return (
						<a
							onClick={() => handleExportDownload(record)}
							className="cursor-pointer text-primary"
						>
							下载
						</a>
					);
				}
				if (record.status === 1 || record.status === 2) {
					return (
						<a
							onClick={() => handleExportCancel(record)}
							className="cursor-pointer text-primary"
						>
							取消
						</a>
					);
				}
				return <span className="text-gray-500">--</span>;
			},
		},
	];

	const importColumns: ColumnsType<ImportRecord> = [
		{
			title: "任务名称",
			dataIndex: "name",
			key: "name",
			ellipsis: true,
			width: 200,
		},
		{
			title: "状态",
			dataIndex: "status",
			key: "status",
			width: 120,
			render: (status: number, record: ImportRecord) => {
				const badgeStatus = (() => {
					switch (status) {
						case 1:
							return "processing";
						case 2:
							return "success";
						case 3:
							return "error";
						case 0:
						case 6:
							return "default";
						default:
							return "default";
					}
				})();
				const statusText = getImportStatusText(status, record.statusFormat);
				const text =
					status === 1 && record.progress !== undefined
						? `${statusText}(${Math.round(record.progress)}%)`
						: statusText;

				return <Badge status={badgeStatus} text={text} />;
			},
		},
		{
			title: "导入时间",
			dataIndex: "updateTime",
			key: "updateTime",
			ellipsis: true,
			width: 160,
		},
		{
			title: "操作",
			key: "action",
			width: 80,
			fixed: "right" as const,
			render: (_, record: ImportRecord) => {
				if (record.status === 3) {
					return (
						<a
							onClick={() => handleImportDownload(record)}
							className="cursor-pointer text-primary"
						>
							下载
						</a>
					);
				}
				if (record.status === 0 || record.status === 1) {
					return (
						<a
							onClick={() => handleImportCancel(record)}
							className="cursor-pointer text-primary"
						>
							取消
						</a>
					);
				}
				return <span className="text-gray-500">--</span>;
			},
		},
	];

	// ==================== 渲染 ====================

	const handleJump = useCallback(
		(path: string) => {
			onOpenChange(false);
			navigate(path);
		},
		[navigate, onOpenChange],
	);

	const title = (
		<div className="flex h-7 w-full items-center gap-3 leading-7">
			<span className="text-base font-semibold">文件中心</span>
			<span className="ml-2 text-gray-600">
				点击跳转至
				<a
					onClick={() => handleJump("/file-center/export")}
					className="ml-1 cursor-pointer"
				>
					导出中心
				</a>
				/
				<a
					onClick={() => handleJump("/file-center/import")}
					className="ml-1 cursor-pointer"
				>
					导入中心
				</a>
			</span>
		</div>
	);

	const content = (
		<div className="w-[600px]">
			<SectionTitle title="导出列表" className="mb-2" />
			<Table
				columns={exportColumns}
				dataSource={exportTasks}
				rowKey="id"
				pagination={{
					...pagination,
					showTotal: (total) => `共 ${total} 条`,
					size: "small",
				}}
				size="small"
				scroll={{ x: 550 }}
				loading={loading}
			/>
			<SectionTitle title="导入列表" className="my-2" />
			<Table
				columns={importColumns}
				dataSource={importTasks}
				rowKey="id"
				pagination={{
					...pagination,
					showTotal: (total) => `共 ${total} 条`,
					size: "small",
				}}
				size="small"
				scroll={{ x: 550 }}
				loading={loading}
			/>
		</div>
	);

	return (
		<Popover
			placement="leftBottom"
			open={open}
			onOpenChange={onOpenChange}
			trigger="click"
			title={title}
			content={content}
			styles={{
				root: {
					width: 620,
				},
			}}
		>
			{children}
		</Popover>
	);
}

export default DownloadCenterPopup;
