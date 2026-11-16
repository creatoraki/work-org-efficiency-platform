import { Client } from "@stomp/stompjs";
// @ts-expect-error sockjs-client/dist/sockjs 无类型声明
import SockJS from "sockjs-client/dist/sockjs";

/**
 * 任务通知消息类型（与后端 TaskNotificationType 对应）
 */
export enum TaskNotificationType {
	TASK_CREATED = "TASK_CREATED",
	TASK_PROCESSING = "TASK_PROCESSING",
	TASK_PROGRESS = "TASK_PROGRESS",
	TASK_SUCCESS = "TASK_SUCCESS",
	TASK_FAILED = "TASK_FAILED",
	TASK_CANCELLED = "TASK_CANCELLED",
}

/**
 * 任务通知消息结构（与后端 TaskNotificationMessage 对应）
 */
export interface TaskNotificationMessage {
	type: TaskNotificationType;
	/** "export" | "import" */
	category: string;
	taskId: number;
	taskName?: string;
	status?: number;
	/** 0-100, 仅导入 */
	progress?: number;
	/** KB, 仅导出完成时 */
	fileSize?: number;
	errorMessage?: string;
	timestamp?: number;
}

export type TaskMessageHandler = (msg: TaskNotificationMessage) => void;
export type ConnectionStateHandler = (connected: boolean) => void;

/**
 * 任务 WebSocket 服务（STOMP over SockJS）
 * 单例模式，管理 STOMP 连接和消息订阅
 */
class TaskWsService {
	private client: Client | null = null;
	private messageHandlers = new Set<TaskMessageHandler>();
	private connectionHandlers = new Set<ConnectionStateHandler>();
	private _connected = false;

	get connected() {
		return this._connected;
	}

	/**
	 * 建立 STOMP 连接
	 */
	connect(token: string) {
		if (this.client?.active) {
			return;
		}

		const apiBase = import.meta.env.VITE_API_BASE_URL || "";
		const wsUrl = `${apiBase}/ws`;

		this.client = new Client({
			// 使用 SockJS 作为 WebSocket 工厂（自动降级）
			webSocketFactory: () => new SockJS(wsUrl) as unknown as WebSocket,
			connectHeaders: {
				Authorization: `Bearer ${token}`,
			},
			reconnectDelay: 5000,
			heartbeatIncoming: 10000,
			heartbeatOutgoing: 10000,
			debug: () => {},
			onConnect: () => {
				this._connected = true;
				this.notifyConnectionState(true);
				// 订阅用户专属队列
				this.client?.subscribe("/user/queue/task-updates", (message) => {
					try {
						const msg: TaskNotificationMessage = JSON.parse(message.body);
						this.messageHandlers.forEach((handler) => handler(msg));
					} catch (e) {
						console.error("[TaskWS] 消息解析失败:", e);
					}
				});
			},
			onDisconnect: () => {
				this._connected = false;
				this.notifyConnectionState(false);
			},
			onStompError: (frame) => {
				console.error("[TaskWS] STOMP 错误:", frame.headers.message, frame.body);
				this._connected = false;
				this.notifyConnectionState(false);
			},
			onWebSocketClose: () => {
				this._connected = false;
				this.notifyConnectionState(false);
			},
		});

		this.client.activate();
	}

	/**
	 * 断开连接
	 */
	disconnect() {
		if (this.client) {
			this.client.deactivate();
			this.client = null;
		}
		this._connected = false;
		this.notifyConnectionState(false);
	}

	/**
	 * 订阅任务消息
	 * @returns 取消订阅函数
	 */
	onMessage(handler: TaskMessageHandler): () => void {
		this.messageHandlers.add(handler);
		return () => {
			this.messageHandlers.delete(handler);
		};
	}

	/**
	 * 订阅连接状态变化
	 * @returns 取消订阅函数
	 */
	onConnectionChange(handler: ConnectionStateHandler): () => void {
		this.connectionHandlers.add(handler);
		return () => {
			this.connectionHandlers.delete(handler);
		};
	}

	private notifyConnectionState(connected: boolean) {
		this.connectionHandlers.forEach((handler) => handler(connected));
	}
}

/** 全局单例 */
export const taskWsService = new TaskWsService();
