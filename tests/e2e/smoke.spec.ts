import { expect, test } from "@playwright/test";

test.describe("Login Page Boundary & Validation Tests", () => {
	test.beforeEach(async ({ page }) => {
		// 使用 Hash 路由模式
		await page.goto("#/login");
		// 等待页面加载完成
		await expect(page).toHaveTitle(/组织效能|Login/i);
	});

	test("should show required validation errors when submitting empty form", async ({ page }) => {
		// 清空默认填充的账号密码
		const usernameInput = page.locator('input[id="username"]');
		await usernameInput.clear();
		const passwordInput = page.locator('input[id="password"]');
		await passwordInput.clear();

		// 直接点击登录按钮
		const loginButton = page.locator('button[type="submit"]');
		await loginButton.click();

		// 验证必填错误提示
		await expect(page.locator("text=请输入用户名")).toBeVisible();
		await expect(page.locator("text=请输入密码")).toBeVisible();

		// 如果验证码存在，也应该提示
		const captchaInput = page.getByPlaceholder("请输入验证码");
		if (await captchaInput.isVisible()) {
			await expect(page.locator("text=请输入验证码")).toBeVisible();
		}
	});

	test("should validate username length and format boundaries", async ({ page }) => {
		const usernameInput = page.locator('input[id="username"]');
		const errorMsg = "3 到 16 位，支持字母、数字、下划线和减号";

		// 1. 测试过短 (2位)
		await usernameInput.fill("ab");
		// 触发验证（通常 onChange 就会触发，或者 blur）
		await usernameInput.blur();
		await expect(page.getByText(errorMsg)).toBeVisible();

		// 2. 测试过长 (17位)
		await usernameInput.fill("a".repeat(17));
		await usernameInput.blur();
		await expect(page.getByText(errorMsg)).toBeVisible();

		// 3. 测试非法字符 (包含 @)
		await usernameInput.fill("user@name");
		await usernameInput.blur();
		await expect(page.getByText(errorMsg)).toBeVisible();

		// 4. 测试边界值 - 最小长度 (3位) - 应该无错误
		await usernameInput.fill("abc");
		await usernameInput.blur();
		await expect(page.getByText(errorMsg)).not.toBeVisible();

		// 5. 测试边界值 - 最大长度 (16位) - 应该无错误
		await usernameInput.fill("a".repeat(16));
		await usernameInput.blur();
		await expect(page.getByText(errorMsg)).not.toBeVisible();

		// 6. 测试合法特殊字符 (下划线和减号)
		await usernameInput.fill("user_name-1");
		await usernameInput.blur();
		await expect(page.getByText(errorMsg)).not.toBeVisible();
	});

	test("should validate password requirement", async ({ page }) => {
		const usernameInput = page.locator('input[id="username"]');
		const passwordInput = page.locator('input[id="password"]');
		const loginButton = page.locator('button[type="submit"]');

		// 输入合法的用户名
		await usernameInput.fill("admin");

		// 密码为空
		await passwordInput.fill("");
		await loginButton.click();

		await expect(page.locator("text=请输入密码")).toBeVisible();
	});

	test("should login successfully with valid credentials", async ({ page }) => {
		const usernameInput = page.locator('input[id="username"]');
		const passwordInput = page.locator('input[id="password"]');
		const loginButton = page.locator('button[type="submit"]');

		// 填写正确账号
		await usernameInput.fill("admin");
		// 填写正确密码
		await passwordInput.fill("admin123");

		// 处理验证码
		const captchaInput = page.getByPlaceholder("请输入验证码");
		if (await captchaInput.isVisible()) {
			// 假设测试环境验证码固定或可绕过，这里填入示例值
			await captchaInput.fill("1234");
		}

		// 提交
		await loginButton.click();

		// 验证跳转 (Hash 路由模式)
		await page.waitForURL((url) => !url.hash.includes("login"), { timeout: 10000 });
		await expect(page).not.toHaveURL(/#\/login/);
	});
});
