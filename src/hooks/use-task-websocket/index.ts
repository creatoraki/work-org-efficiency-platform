import { useAuthStore } from "#src/store";
import { taskWsService } from "#src/utils/websocket/task-ws-service";
import { useEffect } from "react";

/**
 * 任务 WebSocket 生命周期 Hook
 * 在 ContainerLayout 中调用，根据 token 状态自动连接/断开 WebSocket
 */
export function useTaskWebSocket() {
	const token = useAuthStore((state) => state.token);

	useEffect(() => {
		if (token) {
			taskWsService.connect(token);
		} else {
			taskWsService.disconnect();
		}

		return () => {
			taskWsService.disconnect();
		};
	}, [token]);
}
