import process from "node:process";
import { defineConfig, devices } from "@playwright/test";

/**
 * 参考 https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
	testDir: "./tests/e2e",
	/* 并行运行测试文件 */
	fullyParallel: true,
	/* 如果在源代码中意外留下了 test.only，则在 CI 上构建失败。 */
	forbidOnly: !!process.env.CI,
	/* 仅在 CI 上重试 */
	retries: process.env.CI ? 2 : 0,
	/* 在 CI 上禁用并行测试。 */
	workers: process.env.CI ? 1 : undefined,
	/* 使用的报告器。参考 https://playwright.dev/docs/test-reporters */
	reporter: "html",
	/* 下面所有项目的共享设置。参考 https://playwright.dev/docs/api/class-testoptions。 */
	use: {
		/* 在 await page.goto('/') 等操作中使用的基础 URL。 */
		baseURL: "http://localhost:3333/org-efficiency-platform/",

		/* 重试失败的测试时收集跟踪信息。参考 https://playwright.dev/docs/trace-viewer */
		trace: "on-first-retry",

		/* 失败时截图 */
		screenshot: "only-on-failure",

		/* 开发期间默认以有头模式运行 */
		// headless: false, // UI 模式下此配置可能被覆盖，建议通过命令行参数控制
	},

	/* 为主要浏览器配置项目 */
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
		// {
		//   name: 'firefox',
		//   use: { ...devices['Desktop Firefox'] },
		// },
		// {
		//   name: 'webkit',
		//   use: { ...devices['Desktop Safari'] },
		// },
	],

	/* 在开始测试之前运行本地开发服务器 */
	webServer: {
		command: "pnpm dev",
		url: "http://localhost:3333/org-efficiency-platform/",
		reuseExistingServer: !process.env.CI,
		timeout: 120 * 1000,
	},
});
