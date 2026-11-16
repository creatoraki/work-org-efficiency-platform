import { TaskNotificationType, taskWsService } from "#src/utils/websocket/task-ws-service";
import { useCallback, useEffect, useRef } from "react";

const AI_TASK_TIMEOUT_MS = 60 * 60 * 1000;

export interface AiTaskWaiter {
	promise: Promise<number>;
	cancel: () => void;
}

/**
 * 创建 AI 排兵布阵任务等待器。
 *
 * 负责监听 ai-staff websocket 消息，并在成功、失败、超时三种场景结束等待。
 *
 * @param projectId - 项目 ID，用于匹配同一任务流的 websocket 消息
 * @returns 可等待的任务对象，包含 promise 与 cancel 能力
 * @author 王善能
 * @since 2026-06-30
 */
function createAiTaskWaiter(projectId: string): AiTaskWaiter {
	let cleanup = () => {};

	const promise = new Promise<number>((resolve, reject) => {
		const timer = setTimeout(() => {
			unsubscribe();
			reject(new Error("AI 排兵布阵超时，请稍后查看任务状态"));
		}, AI_TASK_TIMEOUT_MS);

		const unsubscribe = taskWsService.onMessage((msg) => {
			if (msg.category !== "ai-staff" || msg.taskName !== projectId) {
				return;
			}
			if (msg.type === TaskNotificationType.TASK_SUCCESS) {
				clearTimeout(timer);
				unsubscribe();
				resolve(msg.taskId);
				return;
			}
			if (msg.type === TaskNotificationType.TASK_FAILED) {
				clearTimeout(timer);
				unsubscribe();
				reject(new Error(msg.errorMessage || "AI 排兵布阵失败"));
			}
		});

		cleanup = () => {
			clearTimeout(timer);
			unsubscribe();
		};
	});

	return {
		promise,
		cancel: cleanup,
	};
}

/**
 * 管理 AI 排兵布阵等待器生命周期。
 *
 * 页面层只关心创建和销毁，不直接操作 websocket 监听与 timeout 细节。
 *
 * @returns 当前等待器的创建、销毁与读取能力
 * @author 王善能
 * @since 2026-06-30
 */
export function useAiTaskWaiter() {
	const waiterRef = useRef<AiTaskWaiter | null>(null);

	const disposeCurrentWaiter = useCallback(() => {
		waiterRef.current?.cancel();
		waiterRef.current = null;
	}, []);

	const createWaiter = useCallback(
		(projectId: string) => {
			disposeCurrentWaiter();
			const waiter = createAiTaskWaiter(projectId);
			waiterRef.current = waiter;
			return waiter;
		},
		[disposeCurrentWaiter],
	);

	useEffect(() => {
		return () => {
			disposeCurrentWaiter();
		};
	}, [disposeCurrentWaiter]);

	return {
		createWaiter,
		disposeCurrentWaiter,
		getCurrentWaiter: () => waiterRef.current,
	};
}
