import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./utils";

test.describe("purchases and sales", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("purchase increases stock and sets cost; sale decreases stock and records profit", async ({ page }) => {
    const stamp = Date.now();
    const categoryName = `Txn Category ${stamp}`;
    const supplierName = `Txn Supplier ${stamp}`;
    const sku = `TXN-${stamp}`;
    const productName = `Txn Product ${stamp}`;

    await page.goto("/categories/new");
    await page.locator("#name").fill(categoryName);
    await page.locator("form button[type=submit]").click();
    await expect(page).toHaveURL("/categories");

    await page.goto("/suppliers/new");
    await page.locator("#name").fill(supplierName);
    await page.locator("form button[type=submit]").click();
    await expect(page).toHaveURL("/suppliers");

    await page.goto("/products/new");
    await page.locator("#sku").fill(sku);
    await page.locator("#name").fill(productName);
    await page.locator("#categoryId").click();
    await page.getByRole("option", { name: categoryName }).click();
    await page.locator("#unit").fill("dona");
    await page.locator("#sellingPrice").fill("10000");
    await page.locator("form button[type=submit]").click();
    await expect(page).toHaveURL("/products");

    // Purchase 20 units at 6000 each.
    await page.goto("/purchases/new");
    await page.locator("#supplierId").click();
    await page.getByRole("option", { name: supplierName }).click();

    const purchaseRow = page.getByTestId("item-row").first();
    await purchaseRow.getByTestId("item-product-select").click();
    await page.getByRole("option", { name: new RegExp(sku) }).click();
    await purchaseRow.getByTestId("item-quantity").fill("20");
    await purchaseRow.getByTestId("item-unit-cost").fill("6000");
    await page.locator("form button[type=submit]").click();
    await expect(page).toHaveURL("/purchases");

    await page.goto("/products");
    const productRow = page.getByRole("row", { name: new RegExp(sku) });
    await expect(productRow).toContainText("20 dona");

    // Sell 5 units at the default selling price (10000). Profit should be
    // 5 * (10000 - 6000) = 20000, matching the just-recorded purchase cost.
    await page.goto("/sales/new");
    const saleRow = page.getByTestId("item-row").first();
    await saleRow.getByTestId("item-product-select").click();
    await page.getByRole("option", { name: new RegExp(sku) }).click();
    await saleRow.getByTestId("item-quantity").fill("5");
    await expect(saleRow.getByTestId("item-unit-price")).toHaveValue("10000");
    await page.locator("form button[type=submit]").click();
    await expect(page).toHaveURL("/sales");

    const firstSaleRow = page.locator("tbody tr").first();
    await expect(firstSaleRow).toContainText("20"); // profit = 20000 (currency-formatted)

    await page.goto("/products");
    await expect(page.getByRole("row", { name: new RegExp(sku) })).toContainText("15 dona");

    await page.goto("/inventory");
    await expect(page.getByRole("cell", { name: productName, exact: true }).first()).toBeVisible();

    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("a product with zero stock cannot be selected on the new-sale form", async ({ page }) => {
    const stamp = Date.now();
    const categoryName = `Stock Limit Category ${stamp}`;
    const sku = `LIMIT-${stamp}`;
    const productName = `Limit Product ${stamp}`;

    await page.goto("/categories/new");
    await page.locator("#name").fill(categoryName);
    await page.locator("form button[type=submit]").click();
    await expect(page).toHaveURL("/categories");

    await page.goto("/products/new");
    await page.locator("#sku").fill(sku);
    await page.locator("#name").fill(productName);
    await page.locator("#categoryId").click();
    await page.getByRole("option", { name: categoryName }).click();
    await page.locator("#unit").fill("dona");
    await page.locator("#sellingPrice").fill("1000");
    await page.locator("form button[type=submit]").click();

    // The new-sale product list only includes products with stock > 0, so a
    // freshly created (zero-stock) product must never appear as an option —
    // this is the server-side guarantee behind InsufficientStockError.
    await page.goto("/sales/new");
    await page.getByTestId("item-row").first().getByTestId("item-product-select").click();
    await expect(page.getByRole("option", { name: new RegExp(sku) })).toHaveCount(0);
  });
});
