/**
 * 任务状态缓存管理 Hook
 * 使用 Symbol 作为任务唯一标识，缓存每个任务的选中人员信息
 */

import type { UserInfo } from "#src/api/personnel-archive/common";
import { useCallback, useRef } from "react";

/**
 * 任务状态缓存接口
 */
interface TaskStateCache {
	/** 已选中的用户信息 */
	selectedUser?: UserInfo;
}

/**
 * 任务状态缓存管理 Hook
 *
 * @returns 任务状态缓存管理相关的方法
 */
export function useTaskStateCache() {
	/** 任务状态缓存 Map */
	const taskStateCacheRef = useRef<Map<symbol, TaskStateCache>>(new Map());

	/**
	 * 获取或创建任务状态缓存
	 *
	 * @param taskId - 任务唯一标识符（Symbol）
	 * @returns 任务状态缓存
	 */
	const getOrCreateTaskState = useCallback((taskId: symbol): TaskStateCache => {
		if (!taskStateCacheRef.current.has(taskId)) {
			taskStateCacheRef.current.set(taskId, {
				selectedUser: undefined,
			});
		}
		return taskStateCacheRef.current.get(taskId)!;
	}, []);

	/**
	 * 更新任务状态缓存
	 *
	 * @param taskId - 任务唯一标识符（Symbol）
	 * @param updates - 要更新的状态
	 */
	const updateTaskState = useCallback(
		(taskId: symbol, updates: Partial<TaskStateCache>) => {
			const currentState = getOrCreateTaskState(taskId);
			taskStateCacheRef.current.set(taskId, { ...currentState, ...updates });
		},
		[getOrCreateTaskState],
	);

	/**
	 * 清空所有任务状态缓存
	 */
	const clearCache = useCallback(() => {
		taskStateCacheRef.current.clear();
	}, []);

	return {
		getOrCreateTaskState,
		updateTaskState,
		clearCache,
	};
}
