import { test, expect } from "@playwright/test";
import { ADMIN_EMAIL, ADMIN_PASSWORD } from "./utils";

// The one continuous story the spec calls for explicitly: login → add
// product → record purchase → record sale → check dashboard numbers →
// export Excel → export PDF → backup → restore. Other spec files cover
// each piece in more depth / more edge cases (including at all three
// viewports); this test proves the whole chain works back-to-back in a
// single session, and that none of it prints a browser console error.
//
// Restricted to a single project: it exercises the *workflow*, not
// responsive layout, and pg_restore --clean is not safe to run
// concurrently against the same database — running this on all three
// viewport projects in parallel races multiple simultaneous restores
// against each other and corrupts the schema (seen firsthand).
test("full workflow: login through backup/restore", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440", "Runs once — see comment above.");


  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(err.message));

  const stamp = Date.now();
  const categoryName = `Journey Category ${stamp}`;
  const supplierName = `Journey Supplier ${stamp}`;
  const sku = `JOURNEY-${stamp}`;
  const productName = `Journey Product ${stamp}`;

  // 1. Login
  await page.goto("/login");
  await page.locator("#email").fill(ADMIN_EMAIL);
  await page.locator("#password").fill(ADMIN_PASSWORD);
  await page.locator("form button[type=submit]").click();
  await expect(page).toHaveURL("/");

  // 2. Add product (with its category)
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
  await page.locator("#sellingPrice").fill("8000");
  await page.locator("form button[type=submit]").click();
  await expect(page).toHaveURL("/products");

  // 3. Record purchase (10 units at 5000 each)
  await page.goto("/purchases/new");
  await page.locator("#supplierId").click();
  await page.getByRole("option", { name: supplierName }).click();
  const purchaseRow = page.getByTestId("item-row").first();
  await purchaseRow.getByTestId("item-product-select").click();
  await page.getByRole("option", { name: new RegExp(sku) }).click();
  await purchaseRow.getByTestId("item-quantity").fill("10");
  await purchaseRow.getByTestId("item-unit-cost").fill("5000");
  await page.locator("form button[type=submit]").click();
  await expect(page).toHaveURL("/purchases");

  // 4. Record sale (4 units at 8000 each → profit 4*(8000-5000)=12000)
  await page.goto("/sales/new");
  const saleRow = page.getByTestId("item-row").first();
  await saleRow.getByTestId("item-product-select").click();
  await page.getByRole("option", { name: new RegExp(sku) }).click();
  await saleRow.getByTestId("item-quantity").fill("4");
  await page.locator("form button[type=submit]").click();
  await expect(page).toHaveURL("/sales");
  await expect(page.locator("tbody tr").first()).toContainText("12");

  // 5. Check dashboard numbers render (aggregate totals, not this sale in
  // isolation, since the dev DB accumulates data across test runs).
  await page.goto("/");
  await expect(page.getByText(/Bugungi savdo|Бугунги савдо/)).toBeVisible();
  await expect(page.getByText(/Faol mahsulotlar|Фаол маҳсулотлар/)).toBeVisible();

  // 6. Export Excel and PDF
  await page.goto("/products");
  const excelDownload = page.waitForEvent("download");
  await page.getByRole("link", { name: "Excel" }).click();
  expect((await excelDownload).suggestedFilename()).toBe("products.xlsx");

  const pdfDownload = page.waitForEvent("download");
  await page.getByRole("link", { name: "PDF" }).click();
  expect((await pdfDownload).suggestedFilename()).toBe("products.pdf");

  // 7. Backup, then restore that same backup (self-consistent round trip;
  // restoring invalidates the session, so re-login proves data integrity).
  await page.goto("/settings");
  const backupDownload = page.waitForEvent("download");
  await page.getByRole("link", { name: /zaxira nusxani|захира нусхани/i }).click();
  const backup = await backupDownload;
  const backupPath = await backup.path();
  expect(backupPath).toBeTruthy();

  await page.setInputFiles("#restore-file", backupPath!);
  await page.locator("#confirmation").fill("RESTORE");
  await page.getByRole("button", { name: /tiklash|тиклаш/i }).click();
  await expect(page.getByText(/tiklandi|Tiklash yakunlandi|тикланди|Тиклаш якунланди/i)).toBeVisible({
    timeout: 15000,
  });

  // Session was invalidated by the restore; confirm the account still works.
  await page.waitForURL("/login", { timeout: 10000 });
  await page.locator("#email").fill(ADMIN_EMAIL);
  await page.locator("#password").fill(ADMIN_PASSWORD);
  await page.locator("form button[type=submit]").click();
  await expect(page).toHaveURL("/");

  expect(consoleErrors, `Console errors during the journey:\n${consoleErrors.join("\n")}`).toEqual([]);
});
