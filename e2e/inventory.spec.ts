import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./utils";

test.describe("core inventory", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("creates a category, then edits it", async ({ page }) => {
    const name = `Test Category ${Date.now()}`;

    await page.goto("/categories/new");
    await page.locator("#name").fill(name);
    await page.locator("#description").fill("Created by Playwright");
    await page.locator("form button[type=submit]").click();

    await expect(page).toHaveURL("/categories");
    await expect(page.getByRole("cell", { name, exact: true })).toBeVisible();

    // The "Edit" action renders as a real <a> (role "link"); the
    // activate/deactivate toggle is the only actual <button> in the row.
    await page.getByRole("row", { name: new RegExp(name) }).getByRole("link").click();
    await expect(page).toHaveURL(/\/categories\/.+\/edit/);
    const renamed = `${name} (edited)`;
    await page.locator("#name").fill(renamed);
    await page.locator("form button[type=submit]").click();

    await expect(page).toHaveURL("/categories");
    await expect(page.getByRole("cell", { name: renamed, exact: true })).toBeVisible();
  });

  test("creates a product linked to a category and adjusts its stock", async ({ page }) => {
    const categoryName = `Stock Test Category ${Date.now()}`;
    await page.goto("/categories/new");
    await page.locator("#name").fill(categoryName);
    await page.locator("form button[type=submit]").click();
    await expect(page).toHaveURL("/categories");

    const sku = `E2E-${Date.now()}`;
    const productName = `Playwright Test Product ${sku}`;
    await page.goto("/products/new");
    await page.locator("#sku").fill(sku);
    await page.locator("#name").fill(productName);
    await page.locator("#categoryId").click();
    await page.getByRole("option", { name: categoryName }).click();
    await page.locator("#unit").fill("dona");
    await page.locator("#sellingPrice").fill("1000");
    await page.locator("form button[type=submit]").click();

    await expect(page).toHaveURL("/products");
    const row = page.getByRole("row", { name: new RegExp(sku) });
    await expect(row).toBeVisible();
    await expect(row).toContainText("0 dona");

    await row.getByTestId("adjust-stock-trigger").click();
    await page.locator("#quantityAfter").fill("25");
    await page.locator("#note").fill("Initial stock count");
    await page.locator('[role="dialog"] form button[type=submit]').click();

    await expect(page.locator('[role="dialog"]')).toBeHidden();
    await expect(row).toContainText("25 dona");

    await page.goto("/inventory");
    await expect(page.getByRole("cell", { name: productName, exact: true })).toBeVisible();
  });
});
