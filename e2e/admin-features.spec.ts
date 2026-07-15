import { test, expect } from "@playwright/test";
import ExcelJS from "exceljs";
import { loginAsAdmin } from "./utils";

test.describe("admin-only features", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("creates a user, resets their password, and deactivates them", async ({ page }) => {
    const stamp = Date.now();
    const email = `staff-${stamp}@inventory.local`;

    await page.goto("/users/new");
    await page.locator("#name").fill(`Staff ${stamp}`);
    await page.locator("#email").fill(email);
    await page.locator("#password").fill("Initial-Passw0rd-1");
    await page.locator("form button[type=submit]").click();
    await expect(page).toHaveURL("/users");

    // Not getByRole("row", {name}): the email cell is CSS-hidden below the
    // `sm` breakpoint, which excludes it from the row's accessible name.
    // hasText matches DOM text content regardless of CSS visibility.
    const row = page.locator("tbody tr", { hasText: email });
    await expect(row).toBeVisible();

    await row.getByTestId("reset-password-trigger").click();
    await page.locator("#password").fill("Reset-Passw0rd-2");
    await page.locator('[role="dialog"] form button[type=submit]').click();
    await expect(page.locator('[role="dialog"]')).toBeHidden();

    // Deactivate via the last button in the row (Edit link, then the
    // activate/deactivate <button>).
    await row.getByRole("button").last().click();
    await expect(row).toContainText(/Faol emas|Фаол эмас/);
  });

  test("downloads a database backup", async ({ page }) => {
    await page.goto("/settings");
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("link", { name: /backup|zaxira|захира/i }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^inventory-backup-.*\.dump$/);
  });

  test("exports products as Excel and PDF", async ({ page }) => {
    await page.goto("/products");
    const excelDownload = page.waitForEvent("download");
    await page.getByRole("link", { name: "Excel" }).click();
    const excel = await excelDownload;
    expect(excel.suggestedFilename()).toBe("products.xlsx");

    const pdfDownload = page.waitForEvent("download");
    await page.getByRole("link", { name: "PDF" }).click();
    const pdf = await pdfDownload;
    expect(pdf.suggestedFilename()).toBe("products.pdf");
  });

  test("imports products from an Excel file", async ({ page }) => {
    const stamp = Date.now();
    const sku = `IMPORT-${stamp}`;

    // Playwright can set an <input type=file> directly from an in-memory
    // buffer, so build a minimal xlsx here rather than needing a fixture file.
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Products");
    sheet.addRow(["SKU", "Name", "Category", "Unit", "Stock", "Selling price"]);
    sheet.addRow([sku, `Imported Product ${stamp}`, `Imported Category ${stamp}`, "dona", 12, 4500]);
    const buffer = await workbook.xlsx.writeBuffer();

    await page.goto("/products/import");
    await page.setInputFiles("#file", {
      name: "import.xlsx",
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      buffer: Buffer.from(buffer),
    });
    await page.locator("form button[type=submit]").click();

    await expect(page.getByText(/Qo‘shildi: 1|Қўшилди: 1/)).toBeVisible();

    await page.goto("/products");
    await page.locator('input[name="q"]').fill(sku);
    await page.locator('input[name="q"]').press("Enter");
    const row = page.getByRole("row", { name: new RegExp(sku) });
    await expect(row).toContainText("12 dona");
  });
});
