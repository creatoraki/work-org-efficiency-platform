import { expect, test } from "@playwright/test";

/**
 * 登录并进入人岗匹配页面。
 *
 * @param page - Playwright 页面实例
 * @author 王善能
 * @since 2026-07-10
 */
async function loginAndOpenJobMatching(page: import("@playwright/test").Page) {
	await page.goto("#/login");
	await page.locator('input[id="username"]').fill("admin");
	await page.locator('input[id="password"]').fill("admin123");

	const captchaInput = page.getByPlaceholder("请输入验证码");
	if (await captchaInput.isVisible().catch(() => false)) {
		await captchaInput.fill("1234");
	}

	await page.locator('button[type="submit"]').click();
	await page.waitForURL((url) => !url.hash.includes("login"), { timeout: 15000 });
	await page.waitForTimeout(1000);
	await page.goto(
		"http://localhost:3333/org-efficiency-platform/org-brain/job-matching#/org-brain/job-matching",
	);
	await page.waitForLoadState("domcontentloaded");
	await page.waitForTimeout(4000);
}

test("新增抽屉应直接打开，并展示基础操作区", async ({ page }) => {
	await loginAndOpenJobMatching(page);

	const createButton = page.getByRole("button", { name: /新\s*增/ });
	await expect(createButton).toBeVisible();
	await createButton.click();

	const drawer = page.locator(".ant-drawer").last();
	await expect(drawer).toBeVisible();
	await expect(drawer.locator(".font-bold", { hasText: "人岗匹配基本信息" })).toBeVisible();
	await expect(drawer.getByRole("button", { name: "结果匹配" })).toBeDisabled();
	await expect(drawer.getByRole("button", { name: /保\s*存/ })).toBeDisabled();
	await expect(drawer.getByRole("button", { name: /取\s*消/ })).toBeVisible();
});

test("编辑抽屉应打开并进入候选人区加载或结果态", async ({ page }) => {
	await loginAndOpenJobMatching(page);

	await page.getByText("编辑").first().click();

	const drawer = page.locator(".ant-drawer").last();
	await expect(drawer).toBeVisible();
	await expect(drawer.locator(".font-bold", { hasText: "人岗匹配基本信息" })).toBeVisible();
	await expect(drawer.getByText("匹配候选人")).toBeVisible();

	const candidateRegion = drawer.locator(".job-matching-candidate-section");
	await expect(candidateRegion).toBeVisible();
});
