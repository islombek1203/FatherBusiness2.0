import { chromium } from "@playwright/test";
import fs from "node:fs";
const browser = await chromium.launch();
const viewports = {
  mobile: { width: 375, height: 812 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1440, height: 900 },
};

fs.mkdirSync("resp-shots", { recursive: true });

for (const [label, viewport] of Object.entries(viewports)) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  await page.goto("http://localhost:3000/login");
  await page.locator("#email").fill("admin@inventory.local");
  await page.locator("#password").fill("Test-Passw0rd-123");
  await page.locator("form button[type=submit]").click();
  await page.waitForURL("http://localhost:3000/");

  for (const [name, path] of [
    ["products", "/products"],
    ["sales-new", "/sales/new"],
    ["users", "/users"],
    ["settings", "/settings"],
    ["profile", "/profile"],
  ]) {
    await page.goto(`http://localhost:3000${path}`);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: `resp-shots/${name}-${label}.png`, fullPage: false });
  }

  await context.close();
}

await browser.close();
console.log("done");
