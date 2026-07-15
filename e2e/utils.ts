import type { Page } from "@playwright/test";

export const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@inventory.local";
export const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "Test-Passw0rd-123";

export async function loginAsAdmin(page: Page) {
  await page.goto("/login");
  await page.locator("#email").fill(ADMIN_EMAIL);
  await page.locator("#password").fill(ADMIN_PASSWORD);
  await page.locator("form button[type=submit]").click();
  await page.waitForURL("/");
}
