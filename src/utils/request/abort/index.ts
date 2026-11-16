/**
 * 请求取消功能模块
 *
 * ky 原生支持 AbortController，可以直接使用：
 * ```ts
 * const controller = new AbortController();
 * request.get('api/data', { signal: controller.signal });
 * controller.abort();
 * ```
 *
 * 本模块提供额外的工具：
 * - useAbortController: React Hook，组件卸载时自动取消请求，支持依赖变化时自动取消
 * - AbortControllerManager: 管理多个请求的取消控制器
 */

export {
	abortControllerManager,
	AbortControllerManager,
	type AbortControllerReturn,
} from "./abortController";
export { useAbortController, type UseAbortControllerReturn } from "./useAbortController";
