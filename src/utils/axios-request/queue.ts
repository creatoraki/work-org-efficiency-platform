import type { AxiosRequestConfig } from "axios";
import type { RequestOptions } from "./types";

/**
 * 请求队列项
 */
interface QueueItem {
	/** 请求配置 */
	config: RequestOptions;
	/** 请求函数 */
	requestFn: (config: AxiosRequestConfig) => Promise<unknown>;
	/** 请求 Promise 的 resolve 函数 */
	resolve: (value: unknown) => void;
	/** 请求 Promise 的 reject 函数 */
	reject: (reason?: unknown) => void;
	/** 优先级，数字越大优先级越高 */
	priority?: number;
}

/**
 * 请求队列管理器
 */
class RequestQueue {
	/** 最大并发数 */
	private maxConcurrent: number;
	/** 当前正在执行的请求数 */
	private runningCount: number;
	/** 请求队列 */
	private queue: QueueItem[];

	/**
	 * 创建请求队列管理器
	 *
	 * @param maxConcurrent - 最大并发数，默认为 10
	 */
	constructor(maxConcurrent = 10) {
		this.maxConcurrent = maxConcurrent;
		this.runningCount = 0;
		this.queue = [];
	}

	/**
	 * 添加请求到队列
	 *
	 * @param config - 请求配置
	 * @param requestFn - 请求函数
	 * @returns Promise
	 */
	async add<T>(
		config: RequestOptions,
		requestFn: (config: AxiosRequestConfig) => Promise<T>,
	): Promise<T> {
		return new Promise<T>((resolve, reject) => {
			const queueItem: QueueItem = {
				config,
				requestFn: requestFn as (config: AxiosRequestConfig) => Promise<unknown>,
				resolve: resolve as (value: unknown) => void,
				reject,
				priority: config.priority,
			};

			// 如果队列为空且未达到最大并发数，直接执行
			if (this.runningCount < this.maxConcurrent) {
				this.execute(queueItem);
			} else {
				// 否则加入队列，按优先级排序
				this.queue.push(queueItem);
				this.queue.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
			}
		});
	}

	/**
	 * 执行请求
	 *
	 * @param item - 队列项
	 */
	private async execute(item: QueueItem): Promise<void> {
		this.runningCount++;

		try {
			const result = await item.requestFn(item.config);
			item.resolve(result);
		} catch (error) {
			item.reject(error);
		} finally {
			this.runningCount--;
			this.processNext();
		}
	}

	/**
	 * 处理下一个请求
	 */
	private processNext(): void {
		if (this.queue.length === 0 || this.runningCount >= this.maxConcurrent) {
			return;
		}

		const nextItem = this.queue.shift();
		if (nextItem) {
			this.execute(nextItem);
		}
	}

	/**
	 * 清空队列
	 */
	clear(): void {
		this.queue.forEach((item) => {
			item.reject(new Error("Request queue cleared"));
		});
		this.queue = [];
	}

	/**
	 * 获取队列长度
	 *
	 * @returns 队列长度
	 */
	getQueueLength(): number {
		return this.queue.length;
	}

	/**
	 * 获取当前运行中的请求数
	 *
	 * @returns 运行中的请求数
	 */
	getRunningCount(): number {
		return this.runningCount;
	}

	/**
	 * 设置最大并发数
	 *
	 * @param maxConcurrent - 最大并发数
	 */
	setMaxConcurrent(maxConcurrent: number): void {
		this.maxConcurrent = maxConcurrent;
		// 如果新的最大并发数大于当前运行数，处理队列中的请求
		while (this.runningCount < this.maxConcurrent && this.queue.length > 0) {
			this.processNext();
		}
	}
}

/**
 * 默认请求队列实例
 */
export const defaultQueue = new RequestQueue();

/**
 * 创建自定义请求队列
 *
 * @param maxConcurrent - 最大并发数
 * @returns 请求队列实例
 */
export function createRequestQueue(maxConcurrent?: number): RequestQueue {
	return new RequestQueue(maxConcurrent);
}
