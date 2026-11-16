import { useEffect, useMemo, useRef } from "react";

/**
 * 请求取消控制器的返回值类型
 */
export interface UseAbortControllerReturn {
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
 * React Hook: 在组件中使用请求取消功能
 *
 * 组件卸载时自动取消所有请求，符合 React 最佳实践。
 * 当依赖数组变化时，会自动取消旧的请求并创建新的 AbortController。
 *
 * @param deps - 可选的依赖数组，当依赖变化时会创建新的 AbortController
 * @returns 返回包含 signal、abort 方法和 aborted 属性的对象
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { signal, abort } = useAbortController();
 *
 *   useEffect(() => {
 *     const fetchData = async () => {
 *       try {
 *         const data = await request.get('api/data', { signal });
 *         // 处理数据
 *       } catch (error) {
 *         if (error.name !== 'AbortError') {
 *           // 处理其他错误
 *           console.error(error);
 *         }
 *       }
 *     };
 *
 *     fetchData();
 *   }, [signal]);
 *
 *   return (
 *     <button onClick={() => abort()}>取消请求</button>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // 当 userId 变化时，自动取消之前的请求并创建新的 controller
 * function UserDetail({ userId }: { userId: string }) {
 *   const { signal } = useAbortController([userId]);
 *
 *   useEffect(() => {
 *     request.get(`api/users/${userId}`, { signal });
 *   }, [userId, signal]);
 * }
 * ```
 */
export function useAbortController(deps?: React.DependencyList): UseAbortControllerReturn {
	const controllerRef = useRef<AbortController | null>(null);
	const prevDepsRef = useRef<React.DependencyList | undefined>(undefined);

	// 初始化 controller
	if (!controllerRef.current) {
		controllerRef.current = new AbortController();
	}

	// 检查依赖是否变化
	useEffect(() => {
		// 如果没有提供依赖数组，直接返回
		if (deps === undefined) {
			return;
		}

		// 检查依赖是否真的变化了
		const depsChanged =
			prevDepsRef.current === undefined ||
			deps.length !== prevDepsRef.current.length ||
			deps.some((dep, index) => dep !== prevDepsRef.current?.[index]);

		if (depsChanged) {
			// 取消旧的请求
			if (controllerRef.current && !controllerRef.current.signal.aborted) {
				controllerRef.current.abort("依赖变化");
			}
			// 创建新的 controller
			controllerRef.current = new AbortController();
			prevDepsRef.current = deps;
		}
	}, deps ?? []);

	// 组件卸载时自动取消请求
	useEffect(() => {
		return () => {
			if (controllerRef.current && !controllerRef.current.signal.aborted) {
				controllerRef.current.abort("组件卸载");
			}
		};
	}, []);

	// 使用 useMemo 稳定返回对象的引用，当 signal 变化时（依赖变化导致创建新的 controller）才重新创建对象
	const signal = controllerRef.current.signal;
	return useMemo(() => {
		const controller = controllerRef.current!;

		return {
			signal: controller.signal,
			abort: (reason?: string) => {
				controller.abort(reason);
			},
			get aborted() {
				return controller.signal.aborted;
			},
		};
	}, [signal]);
}
