/**
 * 请求取消控制器工具
 *
 * ky 原生支持 AbortController，可以直接使用：
 * ```ts
 * const controller = new AbortController();
 * request.get('api/data', { signal: controller.signal });
 * controller.abort(); // 取消请求
 * ```
 *
 * 本模块提供额外的工具：
 * - AbortControllerManager: 管理多个请求的取消控制器
 */

/**
 * 取消控制器返回值的类型定义
 */
export interface AbortControllerReturn {
	/**
	 * AbortSignal 对象，用于传递给请求选项
	 */
	signal: AbortSignal;
	/**
	 * 取消请求的方法
	 *
	 * @param reason - 可选的取消原因
	 */
	abort: (reason?: string) => void;
	/**
	 * 检查请求是否已被取消（getter 属性）
	 */
	get aborted(): boolean;
}

/**
 * 请求取消控制器管理器
 *
 * 用于管理多个请求的取消控制器，支持通过唯一标识（key）来创建、取消和管理多个请求。
 */
export class AbortControllerManager {
	private controllers: Map<string, AbortController> = new Map();

	/**
	 * 创建并注册一个取消控制器
	 *
	 * 如果指定的 key 已存在，会先取消旧的请求，然后创建新的控制器。
	 *
	 * @param key - 控制器的唯一标识
	 * @returns 返回包含 signal、abort 方法和 aborted 属性的对象
	 *
	 * @example
	 * ```ts
	 * const { signal, abort } = abortControllerManager.create("fetchUserData");
	 * request.get("api/user", { signal });
	 * ```
	 */
	create(key: string): AbortControllerReturn {
		// 如果已存在，先取消旧的请求
		this.abort(key);

		const controller = new AbortController();
		this.controllers.set(key, controller);

		return {
			signal: controller.signal,
			abort: (reason?: string) => {
				this.abort(key, reason);
			},
			get aborted() {
				return controller.signal.aborted;
			},
		};
	}

	/**
	 * 取消指定的请求
	 *
	 * @param key - 控制器的唯一标识
	 * @param reason - 可选的取消原因
	 *
	 * @example
	 * ```ts
	 * abortControllerManager.abort("fetchUserData", "用户切换页面");
	 * ```
	 */
	abort(key: string, reason?: string): void {
		const controller = this.controllers.get(key);
		if (controller && !controller.signal.aborted) {
			controller.abort(reason);
			this.controllers.delete(key);
		}
	}

	/**
	 * 取消所有请求
	 *
	 * @param reason - 可选的取消原因
	 *
	 * @example
	 * ```ts
	 * abortControllerManager.abortAll("页面卸载");
	 * ```
	 */
	abortAll(reason?: string): void {
		this.controllers.forEach((controller) => {
			if (!controller.signal.aborted) {
				controller.abort(reason);
			}
		});
		this.controllers.clear();
	}

	/**
	 * 移除指定的控制器（不取消请求）
	 *
	 * 注意：此方法只会从管理器中移除控制器，不会取消正在进行的请求。
	 *
	 * @param key - 控制器的唯一标识
	 *
	 * @example
	 * ```ts
	 * abortControllerManager.remove("fetchUserData");
	 * ```
	 */
	remove(key: string): void {
		this.controllers.delete(key);
	}

	/**
	 * 清空所有控制器（不取消请求）
	 *
	 * 注意：此方法只会从管理器中移除所有控制器，不会取消正在进行的请求。
	 *
	 * @example
	 * ```ts
	 * abortControllerManager.clear();
	 * ```
	 */
	clear(): void {
		this.controllers.clear();
	}

	/**
	 * 检查指定的请求是否已被取消
	 *
	 * @param key - 控制器的唯一标识
	 * @returns 如果请求已被取消返回 `true`，否则返回 `false`
	 *
	 * @example
	 * ```ts
	 * if (abortControllerManager.isAborted("fetchUserData")) {
	 *   console.log("请求已被取消");
	 * }
	 * ```
	 */
	isAborted(key: string): boolean {
		const controller = this.controllers.get(key);
		return controller?.signal.aborted ?? false;
	}
}

/**
 * 全局请求取消控制器管理器实例
 *
 * 可以直接使用此实例来管理多个请求的取消控制器。
 *
 * @example
 * ```ts
 * import { abortControllerManager } from "#src/utils/request";
 *
 * abortControllerManager.create("key");
 * abortControllerManager.abort("key");
 * ```
 */
export const abortControllerManager = new AbortControllerManager();
