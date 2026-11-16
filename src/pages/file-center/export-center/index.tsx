import type { FetchFileInfoListParams, FileInfoItem } from "#src/api/file/export-task";
import type { TaskNotificationMessage } from "#src/utils/websocket/task-ws-service";
import type { ImportRecord } from "../types";
import { cancelExportById, fetchFileInfoList } from "#src/api/file/export-task";
import { downloadFileFromOss } from "#src/api/file/index.js";
import { confirm } from "#src/components/custom-confirm/index.js";
import SearchableTable from "#src/components/searchable-table";
import { downloadBlob } from "#src/utils/index.js";
import { TaskNotificationType, taskWsService } from "#src/utils/websocket/task-ws-service";
import { Badge, Button, message, Space, Tooltip } from "antd";
import React, { useCallback, useEffect, useMemo, useRef } from "react";

const EXPORT_STATUS_TEXT_MAP: Record<number, string> = {
	[-1]: "导出失败",
	0: "已取消",
	1: "排队中",
	2: "导出中",
	3: "导出成功",
};

const EXPORT_STATUS_OPTIONS: { label: string; value: number }[] = [
	{ label: "排队中", value: 1 },
	{ label: "导出中", value: 2 },
	{ label: "导出成功", value: 3 },
	{ label: "导出失败", value: -1 },
	{ label: "已取消", value: 0 },
];

const EXPORT_STATUS_BADGE_MAP: Record<number, "error" | "default" | "processing" | "success"> = {
	[-1]: "error",
	0: "default",
	1: "processing",
	2: "processing",
	3: "success",
};

const EXPORT_STATUS_THEME_MAP: Record<
	number,
	{
		accent: string;
		text: string;
		track: string;
		background: string;
		glow: string;
	}
> = {
	[-1]: {
		accent: "#F56C6C",
		text: "#C45656",
		track: "rgba(245,108,108,0.18)",
		background: "rgba(245,108,108,0.08)",
		glow: "rgba(245,108,108,0.22)",
	},
	0: {
		accent: "#B4BCCC",
		text: "#909399",
		track: "rgba(180,188,204,0.16)",
		background: "rgba(180,188,204,0.08)",
		glow: "rgba(180,188,204,0.18)",
	},
	1: {
		accent: "#E6A23C",
		text: "#B88230",
		track: "rgba(230,162,60,0.18)",
		background: "rgba(230,162,60,0.10)",
		glow: "rgba(230,162,60,0.20)",
	},
	2: {
		accent: "#2F6BFF",
		text: "#1F4FCC",
		track: "rgba(47,107,255,0.12)",
		background: "rgba(47,107,255,0.08)",
		glow: "rgba(47,107,255,0.20)",
	},
	3: {
		accent: "#52C41A",
		text: "#389E0D",
		track: "rgba(82,196,26,0.16)",
		background: "rgba(82,196,26,0.08)",
		glow: "rgba(82,196,26,0.18)",
	},
};

/**
 * 创建分层模块结构用于 Cascader
 */
function createModuleHierarchy() {
	// 所有模块（平铺形式）
	const allModules = [
		// 战略拆解
		["战略拆解", "目标管理", "指标库"],
		["战略拆解", "目标管理", "目标计划"],
		["战略拆解", "目标拆解", "指标配置"],
		["战略拆解", "目标拆解", "目标填报"],
		["战略拆解", "目标拆解", "目标确认"],
		["战略拆解", "目标拆解", "流程跟进"],
		// 标签管理
		["标签管理", "组织标签管理", "标签规则库"],
		["标签管理", "组织标签管理", "标签中心"],
		["标签管理", "组织标签管理", "标签审核"],
		["标签管理", "人才标签管理", "标签规则库"],
		["标签管理", "人才标签管理", "标签中心"],
		["标签管理", "人才标签管理", "标签审核"],
		["标签管理", "岗位描述管理", "岗位描述管理"],
		["标签管理", "岗位描述管理", "岗位描述审核"],
		["标签管理", "标签匹配管理", "匹配模型"],
		// 人员档案
		["人员档案", "档案管理"],
		["人员档案", "档案审核"],
		["人员档案", "面谈管理"],
	];

	// 构建树形结构
	const rootMap = new Map<string, any>();

	allModules.forEach((path) => {
		const [first, second, third] = path;

		if (!rootMap.has(first)) {
			rootMap.set(first, {
				label: first,
				value: first,
				children: [],
			});
		}

		const firstNode = rootMap.get(first);
		let secondNode = firstNode.children.find((c: any) => c.value === second);

		if (!secondNode) {
			secondNode = {
				label: second,
				value: second,
				children: [],
			};
			firstNode.children.push(secondNode);
		}

		// 如果有三级，添加到二级下面
		if (third) {
			if (!secondNode.children.find((c: any) => c.value === third)) {
				secondNode.children.push({
					label: third,
					value: third,
				});
			}
		}
	});

	return Array.from(rootMap.values());
}

function getLeafModuleName(fullPath: string): string {
	const parts = fullPath.split("/").map((p) => p.trim());
	return parts[parts.length - 1] || fullPath;
}

function parseProgress(progress?: string): number | undefined {
	if (!progress) return undefined;

	const parsed = Number.parseFloat(progress);

	return Number.isFinite(parsed) ? parsed : undefined;
}

function formatFileSizeFromKb(fileSizeKb?: number): string | undefined {
	if (fileSizeKb == null || Number.isNaN(fileSizeKb)) {
		return undefined;
	}
	if (fileSizeKb >= 1024) {
		return `${(fileSizeKb / 1024).toFixed(2)} MB`;
	}
	return `${fileSizeKb.toFixed(2)} KB`;
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
		default:
			return msg.status ?? fallbackStatus;
	}
}

function getExportStatusText(status: number, fallbackText?: string) {
	return EXPORT_STATUS_TEXT_MAP[status] ?? fallbackText ?? "--";
}

function patchRecordByTaskMessage(
	record: ImportRecord,
	msg: TaskNotificationMessage,
): ImportRecord {
	const nextStatus = resolveExportStatus(msg, record.status);
	const nextProgress = msg.progress ?? (nextStatus === 3 ? 100 : record.progress);

	return {
		...record,
		status: nextStatus,
		statusFormat: EXPORT_STATUS_TEXT_MAP[nextStatus] ?? record.statusFormat,
		progress: nextProgress,
		fileSize: msg.fileSize ?? record.fileSize,
		fileSizeStr: msg.fileSize != null ? formatFileSizeFromKb(msg.fileSize) : record.fileSizeStr,
		errorMessage: msg.errorMessage ?? record.errorMessage,
	};
}

function renderExportStatus(record: ImportRecord) {
	const statusTheme = EXPORT_STATUS_THEME_MAP[record.status] ?? EXPORT_STATUS_THEME_MAP[0];
	const badgeStatus = EXPORT_STATUS_BADGE_MAP[record.status] ?? "default";
	const progress = Math.max(0, Math.min(record.progress ?? 0, 100));
	const isExporting = record.status === 2;
	const statusText = getExportStatusText(record.status, record.statusFormat);

	if (!isExporting) {
		return <Badge status={badgeStatus} text={statusText} />;
	}

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				gap: 6,
				minWidth: 128,
				maxWidth: 140,
				padding: "2px 0",
			}}
		>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					width: 112,
					lineHeight: "20px",
				}}
			>
				<Badge status={badgeStatus} text={statusText} />
				<span
					style={{
						color: "#303133",
						fontSize: 12,
						fontVariantNumeric: "tabular-nums",
						lineHeight: "20px",
						whiteSpace: "nowrap",
					}}
				>
					{`${progress}%`}
				</span>
			</div>
			<div
				style={{
					position: "relative",
					width: 112,
					height: 5,
					borderRadius: 999,
					background: statusTheme.track,
					overflow: "hidden",
				}}
			>
				<div
					style={{
						width: `${progress}%`,
						height: "100%",
						borderRadius: 999,
						background: "linear-gradient(90deg, #73A8FF 0%, #2F6BFF 55%, #1D4ED8 100%)",
						boxShadow: "0 0 8px rgba(47,107,255,0.18)",
						transition: "width 0.35s ease",
					}}
				/>
				<div
					style={{
						position: "absolute",
						top: 0,
						left: `${Math.max(progress - 12, 0)}%`,
						width: 16,
						height: "100%",
						borderRadius: 999,
						background:
							"linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.55) 50%, rgba(255,255,255,0) 100%)",
						opacity: progress > 6 ? 1 : 0,
						transition: "left 0.35s ease, opacity 0.2s ease",
						pointerEvents: "none",
					}}
				/>
			</div>
		</div>
	);
}

function renderFileSize(fileSizeStr?: string) {
	if (!fileSizeStr) {
		return <span style={{ color: "#C0C4CC" }}>--</span>;
	}

	return (
		<span
			style={{
				color: "#606266",
				fontVariantNumeric: "tabular-nums",
				whiteSpace: "nowrap",
			}}
		>
			{fileSizeStr}
		</span>
	);
}

function getRemarkDiagnostic(content: string) {
	if (/超过限制|超限|最大100000条|请缩小查询范围/.test(content)) {
		return {
			label: "超限失败",
			color: "#B88230",
		};
	}

	if (/上传异常|上传失败/.test(content)) {
		return {
			label: "上传失败",
			color: "#C45656",
		};
	}

	if (/权限|无权限|未授权/.test(content)) {
		return {
			label: "权限失败",
			color: "#606266",
		};
	}

	return {
		label: "导出失败",
		color: "#C45656",
	};
}

function renderRemark(record: ImportRecord) {
	if (Number(record.status) !== -1) {
		return <span style={{ color: "#C0C4CC" }}>--</span>;
	}

	const content = (record.remark || record.errorMessage || "").trim();
	if (!content) {
		return <span style={{ color: "#C0C4CC" }}>--</span>;
	}

	const summary = content.split(/\r?\n/)[0] || content;
	const diagnostic = getRemarkDiagnostic(content);

	return (
		<Tooltip title={content}>
			<span
				style={{
					display: "inline-flex",
					alignItems: "center",
					maxWidth: 240,
					color: "#606266",
					fontSize: 12,
					lineHeight: "20px",
				}}
			>
				<span
					style={{
						flexShrink: 0,
						color: "#C45656",
						fontSize: 12,
						fontWeight: 500,
						lineHeight: "20px",
					}}
				>
					{`${diagnostic.label}：`}
				</span>
				<span
					style={{
						minWidth: 0,
						color: "#606266",
						overflow: "hidden",
						textOverflow: "ellipsis",
						whiteSpace: "nowrap",
					}}
				>
					{summary}
				</span>
			</span>
		</Tooltip>
	);
}

/**
 * 将 API 返回的 FileInfoItem 转换为页面使用的 ImportRecord
 */
function adaptApiToRecord(item: FileInfoItem): ImportRecord {
	return {
		id: item.id,
		name: item.name,
		module: item.module,
		fileSize: item.fileSize,
		fileSizeStr: item.fileSizeStr,
		status: item.status,
		statusFormat: item.statusStr,
		progress: parseProgress(item.progress),
		bucketName: item.bucketName,
		createTime: item.createTime,
		updateTime: item.updateTime,
		errorMessage: item.errorMessage,
		remark: item.remark,
	};
}

export default function FileCenter() {
	// ============ 状态管理 ============
	const [reloadSignal, setReloadSignal] = React.useState(0);
	const [selectedRowKeys, setSelectedRowKeys] = React.useState<React.Key[]>([]);
	const [currentPageRecords, setCurrentPageRecords] = React.useState<ImportRecord[]>([]);
	const currentPageRecordsRef = useRef<ImportRecord[]>([]);
	const refreshTimerRef = useRef<number | null>(null);

	useEffect(() => {
		currentPageRecordsRef.current = currentPageRecords;
	}, [currentPageRecords]);

	useEffect(() => {
		setSelectedRowKeys((prev) =>
			prev.filter((key) => {
				const matched = currentPageRecords.find((item) => Number(item.id) === Number(key));
				return !!matched && (matched.status === 1 || matched.status === 2);
			}),
		);
	}, [currentPageRecords]);

	const triggerTableRefresh = useCallback(() => {
		if (refreshTimerRef.current !== null) {
			window.clearTimeout(refreshTimerRef.current);
		}
		refreshTimerRef.current = window.setTimeout(() => {
			setReloadSignal((s) => s + 1);
			refreshTimerRef.current = null;
		}, 200);
	}, []);

	useEffect(() => {
		const unsubscribe = taskWsService.onMessage((msg) => {
			if (msg.category !== "export") {
				return;
			}
			if (msg.type === TaskNotificationType.TASK_CREATED) {
				triggerTableRefresh();
				return;
			}
			const matchedRecord = currentPageRecordsRef.current?.find(
				(item) => Number(item.id) === msg.taskId,
			);
			if (matchedRecord) {
				const nextStatus = resolveExportStatus(msg, matchedRecord.status);
				const statusChanged = nextStatus !== matchedRecord.status;
				setCurrentPageRecords((prev) => {
					if (!prev || prev.length === 0) {
						return prev;
					}

					return prev.map((item) => {
						if (Number(item.id) !== msg.taskId) {
							return item;
						}
						return patchRecordByTaskMessage(item, msg);
					});
				});
				// 状态发生迁移时，触发一次刷新，确保状态筛选结果与服务端保持一致。
				if (statusChanged) {
					triggerTableRefresh();
				}
				return;
			}

			if (
				[
					TaskNotificationType.TASK_PROGRESS,
					TaskNotificationType.TASK_SUCCESS,
					TaskNotificationType.TASK_FAILED,
					TaskNotificationType.TASK_CANCELLED,
					TaskNotificationType.TASK_PROCESSING,
				].includes(msg.type)
			) {
				triggerTableRefresh();
			}
		});

		const unsubscribeConnection = taskWsService.onConnectionChange((connected) => {
			if (connected) {
				triggerTableRefresh();
			}
		});

		return () => {
			unsubscribe();
			unsubscribeConnection();
			if (refreshTimerRef.current !== null) {
				window.clearTimeout(refreshTimerRef.current);
			}
		};
	}, [triggerTableRefresh]);

	// ============ 操作方法 ============
	// const refreshTable = useCallback(() => setReloadSignal(s => s + 1), []);

	/**
	 * 处理下载
	 */
	const handleDownload = useCallback(async (record: ImportRecord) => {
		const blob = await downloadFileFromOss(record.bucketName || "", record.name);
		const fileName = record.name;
		downloadBlob(blob, fileName);
	}, []);

	/**
	 * 处理取消任务
	 */
	const handleCancel = useCallback(async (record: ImportRecord) => {
		confirm({
			title: "请确认是否取消任务",
			icon: "yellow",
			content: "取消后任务将停止执行",
			centered: true,
			onOk: async () => {
				try {
					await cancelExportById(Number(record.id));
					setReloadSignal((s) => s + 1);
				} catch (error) {
					console.error("handleCancel failed", error);
				}
			},
		});
	}, []);

	/**
	 * 批量取消任务
	 */
	const batchCancel = useCallback(async (ids: React.Key[]) => {
		if (!ids || ids.length === 0) return;

		confirm({
			title: "请确认是否批量取消任务",
			icon: "yellow",
			content: `将取消 ${ids.length} 个任务`,
			centered: true,
			onOk: async () => {
				try {
					// 并行取消所有任务
					await Promise.all(ids.map((id) => cancelExportById(Number(id))));

					message.success(`已取消 ${ids.length} 个任务`);
					setSelectedRowKeys([]);
					setReloadSignal((s) => s + 1);
				} catch (error) {
					message.error(`批量取消失败${error}`);
				}
			},
		});
	}, []);

	// ============ 搜索配置 ============
	const moduleOptions = useMemo(() => createModuleHierarchy(), []);

	const searchSchema = useMemo(
		() => [
			{
				name: "name",
				label: "文件名称",
				type: "input",
				fieldProps: { allowClear: true, placeholder: "请输入" },
			},
			{
				name: "module",
				label: "模块名称",
				type: "cascader",
				options: moduleOptions,
				fieldProps: { allowClear: true, placeholder: "请选择" },
			},
			{
				name: "status",
				label: "状态",
				type: "select",
				options: EXPORT_STATUS_OPTIONS,
			},
		],
		[moduleOptions],
	);

	// ============ 表格列配置 ============
	const columns = useMemo(
		() => [
			{
				title: "文件名称",
				dataIndex: "name",
				key: "name",
				width: 320,
				ellipsis: true,
				shouldCellUpdate: (record: ImportRecord, prevRecord: ImportRecord) =>
					record.name !== prevRecord.name,
			},
			{
				title: "模块名称",
				dataIndex: "module",
				key: "module",
				width: 180,
				render: (module: string) => getLeafModuleName(module),
				shouldCellUpdate: (record: ImportRecord, prevRecord: ImportRecord) =>
					record.module !== prevRecord.module,
			},
			{
				title: "文件大小",
				dataIndex: "fileSizeStr",
				key: "fileSizeStr",
				width: 120,
				render: (fileSizeStr: string | undefined) => renderFileSize(fileSizeStr),
				shouldCellUpdate: (record: ImportRecord, prevRecord: ImportRecord) =>
					record.fileSizeStr !== prevRecord.fileSizeStr,
			},
			{
				title: "状态",
				dataIndex: "status",
				key: "status",
				width: 170,
				render: (_: any, record: ImportRecord) => renderExportStatus(record),
				shouldCellUpdate: (record: ImportRecord, prevRecord: ImportRecord) =>
					record.status !== prevRecord.status ||
					record.statusFormat !== prevRecord.statusFormat ||
					record.progress !== prevRecord.progress,
			},
			{
				title: "备注",
				dataIndex: "remark",
				key: "remark",
				width: 260,
				render: (_: string | undefined, record: ImportRecord) => renderRemark(record),
				shouldCellUpdate: (record: ImportRecord, prevRecord: ImportRecord) =>
					record.remark !== prevRecord.remark ||
					record.errorMessage !== prevRecord.errorMessage ||
					record.status !== prevRecord.status,
			},
			{
				title: "导出时间",
				dataIndex: "createTime",
				key: "createTime",
				width: 180,
			},
		],
		[],
	);

	// ============ 数据加载 ============
	const fetchData = useCallback(async (params: any) => {
		const { pageNum = 1, pageSize = 10, name, module, status } = params;
		const normalizedStatus = status === "" || status == null ? undefined : Number(status);

		try {
			// 构建 API 参数
			const apiParams: FetchFileInfoListParams = {
				pageNum,
				pageSize,
				name,
				module: Array.isArray(module) ? module.join(" / ") : undefined,
				status: Number.isNaN(normalizedStatus) ? undefined : normalizedStatus,
			};

			// 调用真实 API
			const resp = await fetchFileInfoList(apiParams);

			// 转换数据格式
			const records = resp.data.list.map(adaptApiToRecord);

			return {
				data: records,
				total: resp.data.total,
			};
		} catch (error) {
			console.error("fetchData failed", error);
			return { data: [], total: 0 };
		}
	}, []);

	// ============ 行操作渲染 ============
	const renderRowActions = useCallback(
		(record: ImportRecord) => {
			const actions: React.ReactNode[] = [];

			// 成功状态 - 显示下载按钮
			if (record.status === 3) {
				actions.push(
					<Button
						key="download"
						size="small"
						type="link"
						onClick={() => handleDownload(record)}
					>
						下载
					</Button>,
				);
			}

			// 排队中/导出中 - 显示取消按钮
			if (record.status === 1 || record.status === 2) {
				actions.push(
					<Button
						key="cancel"
						size="small"
						type="link"
						onClick={() => handleCancel(record)}
					>
						取消
					</Button>,
				);
			}

			// 失败/待处理 - 无操作
			if (actions.length === 0) {
				return <span style={{ color: "#909399" }}>--</span>;
			}

			// 分隔符
			const splitNode = (
				<span
					style={{
						display: "inline-block",
						width: 1,
						height: 14,
						background: "rgba(235,238,245,1)",
					}}
				/>
			);

			return <Space split={splitNode}>{actions}</Space>;
		},
		[handleDownload, handleCancel],
	);

	// ============ 渲染 ============
	return (
		<div className="p-6 pb-0">
			<SearchableTable<ImportRecord>
				rowKey="id"
				dataSource={currentPageRecords}
				rowSelection={{
					selectedRowKeys,
					onChange: (keys) => setSelectedRowKeys(keys),
					getCheckboxProps: (record) => ({
						disabled: !(record.status === 1 || record.status === 2),
					}),
				}}
				onDataLoaded={(records) => {
					setCurrentPageRecords(records);
				}}
				reloadSignal={reloadSignal}
				bottomOffset={470}
				columns={columns}
				searchSchema={searchSchema}
				fetchData={fetchData}
				renderRowActions={renderRowActions}
				toolbarActions={
					<Button
						type="default"
						disabled={selectedRowKeys.length === 0}
						onClick={() => batchCancel(selectedRowKeys)}
					>
						批量取消
					</Button>
				}
			/>
		</div>
	);
}
