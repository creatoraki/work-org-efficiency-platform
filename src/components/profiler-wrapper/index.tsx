import type { PropsWithChildren } from "react";
import { useProfiler } from "#src/hooks/use-profiler";
import { onRenderCallback } from "#src/monitor";
import { ProfilerPathProvider } from "#src/monitor/profiler-context";
import { Profiler } from "react";

/**
 * ProfilerWrapper 组件属性
 */
interface Props {
	/** 组件名称 */
	name: string;
	/** 是否启用 Profiler（默认 true） */
	enabled?: boolean;
}

/**
 * React 组件渲染性能监控包装器
 *
 * 自动记录组件的渲染时长，并上报到 OpenTelemetry
 * 同时通过 Context 追踪组件在组件树中的路径
 *
 * @example
 * ```typescript
 * // 监控应用入口
 * function App() {
 *   return (
 *     <ConfigProvider>
 *       <ProfilerWrapper name="App">
 *         <RouterProvider router={router} />
 *       </ProfilerWrapper>
 *     </ConfigProvider>
 *   );
 * }
 *
 * // 监控特定页面
 * function MyPage() {
 *   return (
 *     <ProfilerWrapper name="MyPage">
 *       <PageContent />
 *     </ProfilerWrapper>
 *   );
 * }
 *
 * // 条件启用
 * <ProfilerWrapper name="Component" enabled={import.meta.env.PROD}>
 *   <Content />
 * </ProfilerWrapper>
 * ```
 */
export function ProfilerWrapper({ name, enabled = true, children }: PropsWithChildren<Props>) {
	const profileId = useProfiler(name);

	// 如果禁用，直接渲染子组件
	if (!enabled) {
		return <>{children}</>;
	}

	// 启用 Profiler 和路径追踪
	return (
		<ProfilerPathProvider name={name}>
			<Profiler id={profileId} onRender={onRenderCallback}>
				{children}
			</Profiler>
		</ProfilerPathProvider>
	);
}
