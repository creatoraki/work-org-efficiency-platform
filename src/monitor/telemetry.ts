/* eslint-disable no-console */
/**
 * OpenTelemetry 监控配置
 * 用于将前端性能数据上报到 SigNoz
 *
 * SDK 版本: @opentelemetry/sdk-trace-web 2.2.0
 */

import { trace } from "@opentelemetry/api";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { DocumentLoadInstrumentation } from "@opentelemetry/instrumentation-document-load";
import { FetchInstrumentation } from "@opentelemetry/instrumentation-fetch";
import { UserInteractionInstrumentation } from "@opentelemetry/instrumentation-user-interaction";
import { XMLHttpRequestInstrumentation } from "@opentelemetry/instrumentation-xml-http-request";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { WebTracerProvider } from "@opentelemetry/sdk-trace-web";

/**
 * 路径规范化函数
 * 将 API 路径中的数字 ID 替换为通用占位符
 * 例如: /user/123 -> /user/:id, /workspace/abc/board/1 -> /workspace/:id/board/:id
 *
 * @param pathname - 原始路径
 * @returns 规范化后的路径
 */
function normalizePath(pathname: string): string {
	// 替换 UUID 格式 (8-4-4-4-12)
	pathname = pathname.replace(
		/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
		":id",
	);

	// 替换数字 ID (一个或多个数字)
	pathname = pathname.replace(/\/\d+/g, "/:id");

	// 替换 alphanumeric ID (处理某些系统使用的字母数字组合)
	// 但要注意不要替换已经是占位符的部分
	pathname = pathname.replace(/\/([a-z0-9]+)(?=\/|$)/gi, (match, segment) => {
		// 如果已经是 :id 或其他占位符，跳过
		if (segment.startsWith(":")) {
			return match;
		}
		// 如果是纯字母 (路由名称) 或已知的路由段，保留
		// 如果看起来像 ID (很长的字母数字组合，或主要是数字)，替换
		if (segment.length > 8 || /^\d+[a-z]*$|^[a-z]*\d+[a-z]*$/i.test(segment)) {
			return "/:id";
		}
		return match;
	});

	return pathname;
}

/**
 * 初始化 OpenTelemetry 监控
 */
export function initTelemetry() {
	// 检查构建时环境变量(服务器开发环境通过 Jenkins 设置 VITE_ENABLE_OTEL=true)
	const isEnabled = import.meta.env.VITE_ENABLE_OTEL === "true";

	if (!isEnabled) {
		console.log("[OpenTelemetry] 监控已禁用");
		console.log("[OpenTelemetry] 环境: 本地开发/生产环境");
		return;
	}

	try {
		console.log("[OpenTelemetry] 开始初始化(服务器开发环境)...");
		console.log("[OpenTelemetry] 目标地址: /org-efficiency-platform/api/otel/v1/traces");

		// 创建 OTLP HTTP Exporter (通过 Nginx 代理转发)
		const exporter = new OTLPTraceExporter({
			url: "/org-efficiency-platform/api/otel/v1/traces",
			// headers: {
			// 	"Content-Type": "application/protobuf",
			// },
			timeoutMillis: 10000,
		});

		console.log("[OpenTelemetry] ✅ Exporter 已创建");

		// 创建 BatchSpanProcessor (批量发送,而不是实时发送)
		const processor = new BatchSpanProcessor(exporter, {
			maxQueueSize: 100, // 队列最大 100 条 span
			maxExportBatchSize: 50, // 每批最多发送 50 条
			scheduledDelayMillis: 5000, // 每 5 秒发送一批
		});

		console.log("[OpenTelemetry] ✅ Processor 已创建");

		// 创建 Resource 配置服务名称
		const resource = {
			attributes: {
				"service.name": "org-efficiency-platform",
				"service.version": "2.0.0",
				"service.namespace": "frontend",
			},
		};

		// 创建 TracerProvider 并在构造时传入 spanProcessors
		const provider = new WebTracerProvider({
			spanProcessors: [processor],
			resource: resource as any,
		});

		console.log("[OpenTelemetry] ✅ TracerProvider 已创建(包含 processor)");

		// 注册全局 TracerProvider
		provider.register();

		console.log("[OpenTelemetry] ✅ Provider 已注册为全局 tracer");

		// 注册自动埋点工具
		registerInstrumentations({
			tracerProvider: provider,
			instrumentations: [
				// 页面加载性能监控
				new DocumentLoadInstrumentation(),

				// 用户交互监控
				new UserInteractionInstrumentation({
					eventNames: ["click", "submit"],
				}),

				// Fetch API 请求监控 - 自定义 span 名称以包含 API 路径
				new FetchInstrumentation({
					ignoreUrls: [/10\.0\.20\.189:4318/, /api\/otel/],
					propagateTraceHeaderCorsUrls: [/.*/],
					clearTimingResources: true,
					requestHook: (span, request) => {
						// requestHook 在请求开始时调用，用于自定义 span 名称
						const url = typeof request === "string" ? request : (request as any).url;
						const method =
							typeof request === "string" ? "GET" : (request as any).method || "GET";
						if (url) {
							try {
								const urlObj = new URL(url, window.location.origin);
								let pathname = urlObj.pathname;
								// 规范化路径，将 ID 替换为占位符 (如 /user/123 -> /user/:id)
								pathname = normalizePath(pathname);
								// 将 span 名称设置为 "METHOD /path/to/api"，使 SigNoz 能够分别统计每个端点
								span.updateName(`${method} ${pathname}`);
							} catch (e) {
								// URL 解析失败，跳过名称更新
								console.error("Failed to parse URL for FetchInstrumentation:", e);
							}
						}
					},
				}),

				// XMLHttpRequest 请求监控 - 自定义 span 名称以包含 API 路径
				new XMLHttpRequestInstrumentation({
					ignoreUrls: [/10\.0\.20\.189:4318/, /api\/otel/],
					propagateTraceHeaderCorsUrls: [/.*/],
					clearTimingResources: true,
					applyCustomAttributesOnSpan: (span, xhr) => {
						// applyCustomAttributesOnSpan 在请求完成后调用，用于自定义 span 名称
						const url = xhr.responseURL || "";
						const method = (xhr as any).method || "UNKNOWN";
						if (url && method) {
							try {
								const urlObj = new URL(url);
								let pathname = urlObj.pathname;
								// 规范化路径，将 ID 替换为占位符 (如 /user/123 -> /user/:id)
								pathname = normalizePath(pathname);
								// 将 span 名称设置为 "METHOD /path/to/api"，使 SigNoz 能够分别统计每个端点
								span.updateName(`${method} ${pathname}`);
							} catch (e) {
								// URL 解析失败，跳过名称更新
								console.error(
									"Failed to parse URL for XMLHttpRequestInstrumentation:",
									e,
								);
							}
						}
					},
				}),
			],
		});

		console.log("[OpenTelemetry] ✅ 自动埋点已注册");

		// 2 秒后手动创建测试 span
		setTimeout(() => {
			console.log("[OpenTelemetry] 创建测试 span...");
			const tracer = trace.getTracer("manual-test");
			const span = tracer.startSpan("test-manual-span");
			span.setAttribute("test.attribute", "test-value");
			span.setAttribute("environment", import.meta.env.MODE);
			span.end();
			console.log("[OpenTelemetry] ✅ 测试 span 已结束,应该立即发送到 SigNoz");
		}, 2000);

		console.log(`[OpenTelemetry] ✅ 监控已启用 (${import.meta.env.MODE})`);
		console.log("[OpenTelemetry] 📡 数据发送: /org-efficiency-platform/api/otel/v1/traces");
		console.log("[OpenTelemetry] 📊 服务名称: org-efficiency-platform");

		// 暴露到全局方便调试
		(window as any).__otel = {
			provider,
			exporter,
			processor,
			tracer: trace.getTracer("组织效能平台", "2.0.0"),
			// 手动创建测试 span 的函数
			createTestSpan: () => {
				const t = trace.getTracer("manual");
				const s = t.startSpan("manual-test-span");
				s.setAttribute("manual", "true");
				s.setAttribute("timestamp", new Date().toISOString());
				s.end();
				console.log("[OpenTelemetry] 手动测试 span 已创建");
			},
		};

		console.log(
			"[OpenTelemetry] 💡 提示: 可在控制台执行 window.__otel.createTestSpan() 手动测试",
		);
	} catch (error) {
		console.error("[OpenTelemetry] ❌ 初始化失败:", error);
		console.error("[OpenTelemetry] 错误详情:", (error as Error).stack);
	}
}
