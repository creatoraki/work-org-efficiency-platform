import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

// --- Types ---
interface IndicatorData {
	name: string;
	responsibleDepartment: string;
	type: "基础指标" | "复合指标";
	definition: string;
	remark?: string | any;
	dataType: "数值" | "百分比";
	unit: "元" | "万元" | "人" | "%";
	decimalDigits: string;
	dataRangeStart?: string;
	dataRangeEnd?: string;
}

// --- Helpers ---

async function createIndicator(page: Page, data: IndicatorData) {
	await test.step(`Create Indicator: ${data.name}`, async () => {
		await page.getByRole("button", { name: "新增指标" }).click();
		await expect(
			page
				.locator(".ant-drawer-title")
				.filter({ hasText: "新增指标" })
				.or(page.getByText("基础配置")),
		).toBeVisible();

		// Basic Info
		await page.locator(".ant-drawer-content #name").fill(data.name);

		const typeRegex = data.type === "基础指标" ? /^基础指标$/ : /^复合指标/;
		await page.locator("label").filter({ hasText: typeRegex }).click();

		await page
			.locator(".ant-drawer-content .ant-select-selector")
			.filter({ has: page.locator("#responsibleDepartmentCode") })
			.click();
		await page.getByTitle(data.responsibleDepartment).click();

		await page.locator("#definition").fill(data.definition);

		if (data.remark) {
			await page.locator("#remark").fill(data.remark);
		}

		// Attributes
		await page
			.locator(".ant-drawer-content .ant-select-selector")
			.filter({ has: page.locator("#dataType") })
			.click();
		await page.getByTitle(data.dataType, { exact: true }).click();

		await page
			.locator(".ant-drawer-content .ant-select-selector")
			.filter({ has: page.locator("#unit") })
			.click();
		await page.getByTitle(data.unit, { exact: true }).click();

		await page.locator("#decimalDigits").fill(data.decimalDigits);

		if (data.dataRangeStart) {
			await page.getByPlaceholder("最小值").fill(data.dataRangeStart);
		}
		if (data.dataRangeEnd) {
			await page.getByPlaceholder("最大值").fill(data.dataRangeEnd);
		}

		await page.getByRole("button", { name: "确 定" }).click();
		await expect(page.getByText("创建成功")).toBeVisible();
		await expect(page.locator(".ant-drawer-content")).toBeHidden();
	});
}

async function editIndicator(page: Page, oldName: string, newData: IndicatorData) {
	await test.step(`Edit Indicator: ${oldName} -> ${newData.name}`, async () => {
		await searchAndFindRow(page, oldName);
		const row = page.getByRole("row", { name: oldName });

		const editBtn = row.getByRole("button", { name: "指标编辑" });
		if (await editBtn.isVisible()) {
			await editBtn.click();
		} else {
			const moreBtn = row.getByRole("button", { name: "···" });
			await moreBtn.hover();
			await page.getByText("指标编辑").click();
		}

		await expect(
			page.locator(".ant-drawer-title").filter({ hasText: "指标编辑" }),
		).toBeVisible();

		await page.locator(".ant-drawer-content #name").fill(newData.name);

		const typeRegex = newData.type === "基础指标" ? /^基础指标$/ : /^复合指标/;
		await page.locator("label").filter({ hasText: typeRegex }).click();

		await page
			.locator(".ant-drawer-content .ant-select-selector")
			.filter({ has: page.locator("#responsibleDepartmentCode") })
			.click();
		await page.getByTitle(newData.responsibleDepartment).click();

		await page.locator("#definition").fill(newData.definition);

		if (newData.remark) {
			await page.locator("#remark").fill(newData.remark);
		}

		await page
			.locator(".ant-drawer-content .ant-select-selector")
			.filter({ has: page.locator("#dataType") })
			.click();
		await page.getByTitle(newData.dataType, { exact: true }).click();

		await page
			.locator(".ant-drawer-content .ant-select-selector")
			.filter({ has: page.locator("#unit") })
			.click();
		// Wait for dropdown to be visible and stable
		await page.waitForTimeout(300);
		await page
			.locator(".ant-select-dropdown:visible")
			.getByTitle(newData.unit, { exact: true })
			.click();

		await page.locator("#decimalDigits").fill(newData.decimalDigits);

		if (newData.dataRangeStart) {
			await page.getByPlaceholder("最小值").fill(newData.dataRangeStart);
		}
		if (newData.dataRangeEnd) {
			await page.getByPlaceholder("最大值").fill(newData.dataRangeEnd);
		}

		await page.getByRole("button", { name: "确 定" }).click();
		await expect(page.getByText("编辑成功")).toBeVisible();
		await expect(page.locator(".ant-drawer-content")).toBeHidden();
	});
}

async function searchAndFindRow(page: Page, name: string) {
	await test.step(`Search for: ${name}`, async () => {
		await page
			.locator("form")
			.filter({ has: page.getByRole("button", { name: "查 询" }) })
			.locator("#name")
			.fill(name);
		await page.getByRole("button", { name: "查 询" }).click();
		await expect(page.getByRole("cell", { name }).first()).toBeVisible();
	});
}

async function deleteIndicator(page: Page, name: string) {
	await test.step(`Delete Indicator: ${name}`, async () => {
		await searchAndFindRow(page, name);
		const row = page.getByRole("row", { name });

		const deleteBtn = row.getByRole("button", { name: "删除" });
		if (await deleteBtn.isVisible()) {
			await deleteBtn.click();
		} else {
			const moreBtn = row.getByRole("button", { name: "···" });
			await moreBtn.hover();
			await page.getByText("删除").click();
		}

		await page.getByRole("button", { name: "确 认" }).click();
		await expect(page.getByText("操作成功")).toBeVisible();
		await expect(row).not.toBeVisible();
	});
}

test.describe("Strategy - Indicator Library", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("#/login");
		await page.locator('input[id="username"]').fill("admin");
		await page.locator('input[id="password"]').fill("admin123");

		const captchaInput = page.getByPlaceholder("请输入验证码");
		if (await captchaInput.isVisible()) {
			await captchaInput.fill("1234");
		}
		await page.locator('button[type="submit"]').click();
		await page.waitForURL((url) => !url.hash.includes("login"));
		await expect(page.getByText("战略拆解")).toBeVisible({ timeout: 20000 });
		await page.goto("#/strategy/target-management/indicator-library");
		await expect(page.getByRole("button", { name: "新增指标" })).toBeVisible();
	});

	test("should create and edit an indicator with all fields", async ({ page }) => {
		const timestamp = Date.now();
		const initialData: IndicatorData = {
			name: `FullField_Create_${timestamp}`,
			responsibleDepartment: "客户服务中心",
			type: "基础指标",
			definition: "Initial Definition",
			remark: "Initial Remark",
			dataType: "数值",
			unit: "万元",
			decimalDigits: "2",
			dataRangeStart: "0",
			dataRangeEnd: "100",
		};

		const updatedData: IndicatorData = {
			name: `FullField_Edit_${timestamp}`,
			responsibleDepartment: "本体建设中心",
			type: "基础指标",
			definition: "Updated Definition",
			remark: "Updated Remark",
			dataType: "百分比",
			unit: "%",
			decimalDigits: "4",
			dataRangeStart: "10",
			dataRangeEnd: "90",
		};

		// 1. Create
		await createIndicator(page, initialData);

		// 2. Verify List Data (Basic check)
		await searchAndFindRow(page, initialData.name);
		const row = page.getByRole("row", { name: initialData.name });
		await expect(row).toContainText(initialData.responsibleDepartment);
		await expect(row).toContainText("基础指标");
		await expect(row).toContainText("未上线");

		// 3. Edit
		await editIndicator(page, initialData.name, updatedData);

		// 4. Verify Updated Data
		await searchAndFindRow(page, updatedData.name);
		const updatedRow = page.getByRole("row", { name: updatedData.name });
		await expect(updatedRow).toContainText(updatedData.responsibleDepartment);

		// Verify details by opening edit drawer again in readonly mode (clicking name)
		await updatedRow.getByText(updatedData.name).click();
		await expect(
			page.locator(".ant-drawer-title").filter({ hasText: "指标详情" }),
		).toBeVisible();

		// Check values in readonly drawer
		await expect(page.getByText(updatedData.definition)).toBeVisible();
		await expect(page.getByText(updatedData.remark)).toBeVisible();
		await expect(page.getByText("百分比", { exact: true })).toBeVisible();
		await expect(page.getByText("%", { exact: true })).toBeVisible();
		await expect(page.getByText("10 - 90")).toBeVisible();

		// Close drawer
		await page.getByRole("button", { name: "关闭" }).click();
		await expect(page.locator(".ant-drawer-content")).toBeHidden();

		// 5. Cleanup
		await deleteIndicator(page, updatedData.name);
	});

	test("should search indicators by all fields", async ({ page }) => {
		const timestamp = Date.now();
		const indicatorName = `SearchTest_${timestamp}`;
		const data: IndicatorData = {
			name: indicatorName,
			responsibleDepartment: "市场发展中心",
			type: "复合指标",
			definition: "Search Test Def",
			dataType: "数值",
			unit: "人",
			decimalDigits: "0",
		};

		await createIndicator(page, data);

		const resetSearch = async () => {
			await page.getByRole("button", { name: "重置" }).click();
			await page.waitForTimeout(500);
		};

		// 1. Search by Name
		await test.step("Search by Name", async () => {
			await page.locator("form #name").fill(indicatorName);
			await page.getByRole("button", { name: "查 询" }).click();
			await expect(page.getByRole("row", { name: indicatorName })).toBeVisible();
			await expect(page.locator(".ant-table-row")).toHaveCount(1);
		});

		await resetSearch();

		// 2. Search by Department
		await test.step("Search by Department", async () => {
			await page
				.locator("form .ant-select-selector")
				.filter({ has: page.locator("#responsibleDepartmentCode") })
				.click();
			await page.waitForTimeout(300);
			await page.locator(".ant-select-dropdown:visible").getByTitle("市场发展中心").click();
			await page.getByRole("button", { name: "查 询" }).click();
			await expect(page.getByRole("row", { name: indicatorName })).toBeVisible();
		});

		await resetSearch();

		// 3. Search by Type
		await test.step("Search by Type", async () => {
			await page
				.locator("form .ant-select-selector")
				.filter({ has: page.locator("#type") })
				.click();
			await page.waitForTimeout(300);
			await page.locator(".ant-select-dropdown:visible").getByTitle("复合指标").click();
			await page.getByRole("button", { name: "查 询" }).click();
			await expect(page.getByRole("row", { name: indicatorName })).toBeVisible();
		});

		await resetSearch();

		// 4. Search by Status
		await test.step("Search by Status", async () => {
			await page
				.locator("form .ant-select-selector")
				.filter({ has: page.locator("#onlineStatus") })
				.click();
			await page.waitForTimeout(300);
			await page.locator(".ant-select-dropdown:visible").getByTitle("未上线").click();
			await page.getByRole("button", { name: "查 询" }).click();
			await expect(page.getByRole("row", { name: indicatorName })).toBeVisible();
		});

		await resetSearch();

		// 5. Search by Creator (admin)
		await test.step("Search by Creator", async () => {
			await page.locator("form #createByName").fill("admin");
			await page.getByRole("button", { name: "查 询" }).click();
			await expect(page.getByRole("row", { name: indicatorName })).toBeVisible();
		});

		await resetSearch();

		// 6. Search by Updater (admin)
		await test.step("Search by Updater", async () => {
			await page.locator("form #updateByName").fill("admin");
			await page.getByRole("button", { name: "查 询" }).click();
			await expect(page.getByRole("row", { name: indicatorName })).toBeVisible();
		});

		// Cleanup
		await deleteIndicator(page, indicatorName);
	});

	test("should change indicator status (Online/Offline)", async ({ page }) => {
		const timestamp = Date.now();
		const indicatorName = `StatusTest_${timestamp}`;
		const data: IndicatorData = {
			name: indicatorName,
			responsibleDepartment: "运营管控中心",
			type: "基础指标",
			definition: "Status Test",
			dataType: "数值",
			unit: "元",
			decimalDigits: "2",
		};

		await createIndicator(page, data);
		await searchAndFindRow(page, indicatorName);
		const row = page.getByRole("row", { name: indicatorName });

		// Online
		const onlineBtn = row.getByRole("button", { name: "上线" });
		await onlineBtn.click();
		await page.getByRole("button", { name: "确 认" }).click();
		await expect(page.getByText("上线成功")).toBeVisible();

		const offlineBtn = row.getByRole("button", { name: "下线" });
		await expect(offlineBtn).toBeVisible();
		await expect(row).toContainText("已上线");

		// Offline
		await offlineBtn.click();
		await page.getByRole("button", { name: "确 认" }).click();
		await expect(page.getByText("下线成功")).toBeVisible();

		await expect(onlineBtn).toBeVisible();
		await expect(row).toContainText("未上线");

		await deleteIndicator(page, indicatorName);
	});
});
