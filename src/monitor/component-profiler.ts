import { trace } from "@opentelemetry/api";
import { recordSlowRender } from "./component-stats";

/**
 * React Profiler 回调处理器
 * 记录慢渲染的组件，并上报到 OpenTelemetry
 *
 * @param id - 组件唯一标识（格式：ComponentName@Path#InstanceId）
 * @param phase - 渲染阶段：'mount' | 'update' | 'nested-update'
 * @param actualDuration - 实际渲染耗时（毫秒，包括子组件）
 * @param baseDuration - 理论最优渲染耗时（毫秒）
 * @param startTime - 渲染开始时间（相对于页面加载，毫秒）
 * @param commitTime - 渲染提交时间（相对于页面加载，毫秒）
 */
export function onRenderCallback(
	id: string,
	phase: "mount" | "update" | "nested-update",
	actualDuration: number,
	baseDuration: number,
	startTime: number,
	commitTime: number,
) {
	// 环境变量检查
	const PROFILER_ENABLED =
		import.meta.env.VITE_ENABLE_PROFILER === "true" &&
		import.meta.env.VITE_ENABLE_OTEL === "true";

	if (!PROFILER_ENABLED) return;

	// 阈值过滤（用户设定 500ms）
	const SLOW_RENDER_THRESHOLD = Number(import.meta.env.VITE_SLOW_RENDER_THRESHOLD) || 500;

	if (actualDuration < SLOW_RENDER_THRESHOLD) return;

	// 解析唯一标识
	// 格式：ComponentName@Path#InstanceId
	const [nameWithPath, instanceId] = id.split("#");
	const parts = nameWithPath.split("@");
	const componentName = parts[0];
	const componentPath = parts.slice(1).join("@");

	// 创建 OpenTelemetry Span
	const tracer = trace.getTracer("react-profiler");
	const span = tracer.startSpan(`React.Render: ${componentName}`, {
		startTime: performance.timeOrigin + startTime,
		attributes: {
			"component.name": componentName,
			"component.phase": phase,
			"component.duration_ms": actualDuration,
			"component.base_duration_ms": baseDuration,
			"component.overhead_ms": actualDuration - baseDuration,
			"component.unique_id": id,
			"component.path": componentPath || "root",
			"component.instance_id": instanceId,
			"component.is_slow": true,
		},
	});

	span.end(performance.timeOrigin + commitTime);

	// 记录到本地统计（用于开发环境调试）
	recordSlowRender({
		componentName,
		uniqueId: id,
		duration: actualDuration,
		phase,
		path: componentPath,
		timestamp: Date.now(),
	});
}
