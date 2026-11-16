import type { ImportRecord, PaginationParams, SearchFormValues } from "../types";
import { useCallback, useMemo, useState } from "react";
import { DEFAULT_PAGINATION } from "../constants";
import { ImportStatus } from "../types";
import { updateRecordInTable } from "../utils";

/**
 * Mock 数据生成器
 */
function generateMockData(count: number = 10): ImportRecord[] {
	const modules = ["用户管理", "订单管理", "财务报表", "数据统计", "系统配置"];
	const statuses = [
		ImportStatus.QUEUED,
		ImportStatus.IN_PROGRESS,
		ImportStatus.SUCCESS,
		ImportStatus.FAILED,
		ImportStatus.CANCELLED,
	];
	const statusTexts = ["排队中", "进行中", "成功", "失败", "取消"];

	return Array.from({ length: count }, (_, i) => {
		const status = statuses[Math.floor(Math.random() * statuses.length)];
		return {
			id: `mock-${Date.now()}-${i}`,
			name: `导出文件_${i + 1}_${Date.now()}.xlsx`,
			module: modules[Math.floor(Math.random() * modules.length)],
			fileSize: Math.floor(Math.random() * 10000000) + 100000,
			status,
			statusFormat: statusTexts[statuses.indexOf(status)],
			progress:
				status === ImportStatus.IN_PROGRESS ? Math.floor(Math.random() * 100) : undefined,
			bucketName: "export-bucket",
			updateTime: new Date(Date.now() - Math.floor(Math.random() * 86400000)).toLocaleString(
				"zh-CN",
			),
			errorMessage: status === ImportStatus.FAILED ? "导入失败: 数据格式错误" : undefined,
		};
	});
}

export function useImportTableData() {
	const [tableData, setTableData] = useState<ImportRecord[]>(() => generateMockData(15));
	const [loading, setLoading] = useState(false);
	const [pagination, setPagination] = useState<PaginationParams>(DEFAULT_PAGINATION);
	const [lastPollTime, setLastPollTime] = useState(Date.now());

	// 获取进行中的任务
	const runningTasks = useMemo(
		() => tableData.filter((item) => item.status === ImportStatus.IN_PROGRESS),
		[tableData],
	);

	/**
	 * 加载表格数据 (Mock 实现)
	 */
	const loadData = useCallback(async (searchParams: SearchFormValues = {}) => {
		setLoading(true);

		try {
			// 模拟 API 延迟
			await new Promise((resolve) => setTimeout(resolve, 500));

			// TODO: 替换为真实 API
			const mockData = generateMockData(15);

			// 简单的客户端过滤 (Mock)
			let filteredData = mockData;

			if (searchParams.name) {
				filteredData = filteredData.filter((item) =>
					item.name.toLowerCase().includes(searchParams.name!.toLowerCase()),
				);
			}

			if (searchParams.status !== undefined) {
				filteredData = filteredData.filter((item) => item.status === searchParams.status);
			}

			setTableData(filteredData);
			setPagination((prev) => ({ ...prev, total: filteredData.length }));
			setLastPollTime(Date.now());
		} catch (error) {
			console.error("loadData failed", error);
			setTableData([]);
		} finally {
			setLoading(false);
		}
	}, []);

	/**
	 * 更新单条记录 (WebSocket 推送)
	 */
	const updateRecord = useCallback((record: ImportRecord) => {
		setTableData((prev) => updateRecordInTable(prev, record));
		setLastPollTime(Date.now());
	}, []);

	/**
	 * 刷新进行中的任务 (轻量级查询)
	 */
	const refreshRunningTasks = useCallback(async () => {
		if (runningTasks.length === 0) return;

		try {
			// 模拟 API 延迟
			await new Promise((resolve) => setTimeout(resolve, 300));

			// TODO: 替换为真实 API
			// 模拟进度更新
			setTableData((prev) =>
				prev.map((item) => {
					if (item.status === ImportStatus.IN_PROGRESS) {
						const newProgress = Math.min((item.progress || 0) + 10, 100);
						return {
							...item,
							progress: newProgress,
							status: newProgress === 100 ? ImportStatus.SUCCESS : item.status,
							statusFormat: newProgress === 100 ? "成功" : item.statusFormat,
						};
					}
					return item;
				}),
			);

			setLastPollTime(Date.now());
		} catch (error) {
			console.error("refreshRunningTasks failed", error);
		}
	}, [runningTasks.length]);

	/**
	 * 处理分页变化
	 */
	const handleTableChange = useCallback((newPagination: PaginationParams) => {
		setPagination(newPagination);
	}, []);

	return {
		tableData,
		loading,
		pagination,
		loadData,
		updateRecord,
		refreshRunningTasks,
		handleTableChange,
		runningTasks,
		lastPollTime,
	};
}
