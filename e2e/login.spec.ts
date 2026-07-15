import { test, expect } from "@playwright/test";

// Selectors are structural/attribute-based rather than text-based, since the
// UI defaults to Uzbek Cyrillic and locale-specific text would make these
// tests brittle across the mobile/tablet/desktop viewport projects.
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@inventory.local";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "Test-Passw0rd-123";

test.describe("authentication", () => {
  test("rejects invalid credentials with a friendly error", async ({ page }) => {
    await page.goto("/login");
    await page.locator("#email").fill("nobody@inventory.local");
    await page.locator("#password").fill("wrong-password");
    await page.locator("form button[type=submit]").click();
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("redirects unauthenticated visitors from a protected route to /login", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });

  test("logs in, reaches the dashboard, and logs out", async ({ page }) => {
    await page.goto("/login");
    await page.locator("#email").fill(ADMIN_EMAIL);
    await page.locator("#password").fill(ADMIN_PASSWORD);
    await page.locator("form button[type=submit]").click();

    await expect(page).toHaveURL("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    await page.screenshot({
      path: `test-results/screenshots/dashboard-${test.info().project.name}.png`,
      fullPage: true,
    });

    // Logout via the user menu (aria-label starts with the DB-stored user
    // name "Administrator", which is not translated).
    await page.getByRole("button", { name: /Administrator/i }).click();
    await page.locator('[data-slot="dropdown-menu-content"] form button[type=submit]').click();
    await expect(page).toHaveURL(/\/login/);
  });
});
