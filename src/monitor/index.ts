/**
 * 监控模块统一导出
 */

export { onRenderCallback } from "./component-profiler";
export {
	clearSlowRenders,
	getSlowRenders,
	getSlowRendersStats,
	recordSlowRender,
} from "./component-stats";
export { ProfilerPathProvider, useProfilerPath } from "./profiler-context";
export { initTelemetry } from "./telemetry";
