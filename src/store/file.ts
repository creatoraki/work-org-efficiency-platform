import type { ImportRecord } from "#src/pages/file-center/types";
import { create } from "zustand";

/**
 * 全局文件任务 Store
 * 管理导入/导出任务数据,与 file-center 页面共享数据
 */
interface FileStore {
	tableData: ImportRecord[];
	setTableData: (data: ImportRecord[]) => void;
	addTask: (task: ImportRecord) => void;
	updateTaskProgress: (taskId: string | number, progress: number) => void;
	updateTaskStatus: (taskId: string | number, status: number, statusFormat: string) => void;
	ongoingTasksCount: () => number;
}

export const useFileStore = create<FileStore>((set, get) => ({
	tableData: [],

	/**
	 * 设置整个数据列表
	 * 用于初始化或批量替换数据
	 */
	setTableData: (data) => set({ tableData: data }),

	/**
	 * 添加新任务
	 * 新任务会插入到列表顶部
	 */
	addTask: (task) =>
		set((state) => ({
			tableData: [task, ...state.tableData],
		})),

	/**
	 * 更新指定任务的进度
	 * @param taskId 任务 ID
	 * @param progress 新的进度百分比
	 */
	updateTaskProgress: (taskId, progress) =>
		set((state) => ({
			tableData: state.tableData.map((item) =>
				String(item.id) === String(taskId) ? { ...item, progress } : item,
			),
		})),

	/**
	 * 更新指定任务的状态
	 * @param taskId 任务 ID
	 * @param status 新的状态值
	 * @param statusFormat 新的状态文本
	 */
	updateTaskStatus: (taskId, status, statusFormat) =>
		set((state) => ({
			tableData: state.tableData.map((item) =>
				String(item.id) === String(taskId) ? { ...item, status, statusFormat } : item,
			),
		})),

	/**
	 * 计算进行中的任务数量
	 * 进行中状态: status === 1 (导入中) 或 status === 2 (处理中)
	 */
	ongoingTasksCount: () => {
		const { tableData } = get();
		return tableData.filter((t) => t.status === 1 || t.status === 2).length;
	},
}));
