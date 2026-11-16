import { useProfilerPath } from "#src/monitor/profiler-context";
import { useRef } from "react";
import { v4 as uuidv4 } from "uuid";

/**
 * 为组件生成唯一的 Profiler ID
 * 格式：ComponentName@Path#InstanceId
 *
 * @param componentName 组件名称
 * @returns Profiler ID
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const profileId = useProfiler("MyComponent");
 *   return <Profiler id={profileId} onRender={onRenderCallback}>{children}</Profiler>;
 * }
 * ```
 */
export function useProfiler(componentName: string): string {
	// 1. 生成唯一实例 ID（只在首次渲染时生成）
	const instanceIdRef = useRef<string>();

	if (!instanceIdRef.current) {
		// 使用 uuid v4 生成，取前 6 位作为短 ID
		instanceIdRef.current = uuidv4().slice(0, 6);
	}

	// 2. 获取父组件路径（从 Context）
	const parentPath = useProfilerPath();

	// 3. 组装完整 ID：ComponentName@Path#InstanceId
	if (parentPath.length > 0) {
		const fullPath = parentPath.join("/");
		return `${componentName}@${fullPath}#${instanceIdRef.current}`;
	}

	// 如果没有路径，只返回组件名 + 实例 ID
	return `${componentName}#${instanceIdRef.current}`;
}
