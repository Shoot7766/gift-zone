import { expect, test } from "@playwright/test";

test("checkout oqimi sahifasi ochiladi", async ({ page }) => {
  await page.goto("/buyurtma");
  await expect(page).toHaveURL(/buyurtma|kirish/);
});
