import type { PropsWithChildren } from "react";
import { createContext, useContext } from "react";

/**
 * Profiler 路径上下文
 * 用于记录组件在组件树中的完整路径
 * 格式：["App", "RouterProvider", "LayoutRoot", "SingleFillingPage"]
 */
const ProfilerPathContext = createContext<string[]>([]);

/**
 * 获取当前组件的父组件路径
 * @returns 父组件路径数组
 */
export function useProfilerPath(): string[] {
	return useContext(ProfilerPathContext);
}

/**
 * Profiler 路径提供者
 * 将当前组件名称添加到路径链中
 */
export function ProfilerPathProvider({ name, children }: PropsWithChildren<{ name: string }>) {
	const parentPath = useProfilerPath();
	const currentPath = [...parentPath, name];

	return (
		<ProfilerPathContext.Provider value={currentPath}>{children}</ProfilerPathContext.Provider>
	);
}

export { ProfilerPathContext };
