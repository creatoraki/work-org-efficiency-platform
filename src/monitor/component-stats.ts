/**
 * 慢渲染记录接口
 */
export interface SlowRenderRecord {
	componentName: string;
	uniqueId: string;
	duration: number;
	phase: string;
	path: string;
	timestamp: number;
}

// 存储慢渲染记录（最多保留 500 条，最新的在前面）
const slowRenders: SlowRenderRecord[] = [];
const MAX_RECORDS = 500;

/**
 * 记录一次慢渲染事件
 * @param record 慢渲染记录
 */
export function recordSlowRender(record: SlowRenderRecord) {
	// 添加记录到数组前面
	slowRenders.unshift(record);

	// 限制数量，移除最旧的记录
	if (slowRenders.length > MAX_RECORDS) {
		slowRenders.pop();
	}

	// 开发环境下打印警告到控制台
	if (import.meta.env.DEV) {
		console.warn(
			`[慢渲染] ${record.componentName} (${record.phase}) 耗时 ${record.duration.toFixed(2)}ms`,
			`\n路径: ${record.path || "root"}`,
			`\n完整 ID: ${record.uniqueId}`,
		);
	}
}

/**
 * 获取所有慢渲染记录
 * @returns 慢渲染记录副本
 */
export function getSlowRenders(): SlowRenderRecord[] {
	return slowRenders.slice(); // 返回副本，防止外部修改
}

/**
 * 清空所有慢渲染记录
 */
export function clearSlowRenders() {
	slowRenders.length = 0;
}

/**
 * 获取慢渲染统计信息
 */
export function getSlowRendersStats() {
	const total = slowRenders.length;

	// 按组件名统计
	const byComponent = slowRenders.reduce(
		(acc, r) => {
			acc[r.componentName] = (acc[r.componentName] || 0) + 1;
			return acc;
		},
		{} as Record<string, number>,
	);

	// 计算平均渲染时长
	const avgDuration = total > 0 ? slowRenders.reduce((sum, r) => sum + r.duration, 0) / total : 0;

	return {
		total,
		byComponent,
		avgDuration: avgDuration.toFixed(2),
	};
}

/**
 * 全局暴露调试接口
 * 在浏览器控制台使用：
 * - window.__slowRenders.get()       // 查看所有记录
 * - window.__slowRenders.stats()     // 查看统计信息
 * - window.__slowRenders.clear()     // 清空记录
 */
if (typeof window !== "undefined") {
	(window as any).__slowRenders = {
		get: getSlowRenders,
		clear: clearSlowRenders,
		stats: getSlowRendersStats,
	};
}
