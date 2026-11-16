import type { ImportRecord, WebSocketMessage } from "../types";
import { useEffect } from "react";
import { WS_MESSAGE_TYPE } from "../constants";

interface UseWebSocketMessageProps {
	/** WebSocket 消息 */
	wsMessage: WebSocketMessage | null;
	/** WebSocket 连接状态 */
	wsConnected: boolean;
	/** 上次轮询时间 */
	lastPollTime: number;
	/** 更新单条记录 */
	onUpdateRecord: (record: ImportRecord) => void;
	/** 全表刷新 */
	onRefreshAll: () => void;
	/** 刷新进行中的任务 */
	refreshRunningTasks: () => Promise<void>;
}

/**
 * WebSocket 消息处理 Hook (混合方案)
 */
export function useWebSocketMessage({
	wsMessage,
	wsConnected,
	lastPollTime,
	onUpdateRecord,
	onRefreshAll,
	refreshRunningTasks,
}: UseWebSocketMessageProps) {
	// WebSocket 消息处理
	useEffect(() => {
		if (!wsMessage) return;

		// 单条记录更新
		if (wsMessage.msgType === WS_MESSAGE_TYPE.UPDATE_RECORD && wsMessage.data) {
			onUpdateRecord(wsMessage.data);
		}

		// 全表刷新
		if (wsMessage.msgType === WS_MESSAGE_TYPE.REFRESH_ALL) {
			onRefreshAll();
		}
	}, [wsMessage, onUpdateRecord, onRefreshAll]);

	// 兜底轮询: WebSocket 断开或超过 5 秒没收到消息
	useEffect(() => {
		const timeSinceLastPoll = Date.now() - lastPollTime;
		const shouldPoll = !wsConnected || timeSinceLastPoll > 5000;

		if (!shouldPoll) return;

		// 启动轮询定时器
		const timer = setInterval(() => {
			refreshRunningTasks();
		}, 3000); // 3 秒轮询一次

		return () => clearInterval(timer);
	}, [wsConnected, lastPollTime, refreshRunningTasks]);
}
