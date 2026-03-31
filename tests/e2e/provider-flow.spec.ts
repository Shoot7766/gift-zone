import { expect, test } from "@playwright/test";

test("provider panel routing tekshiruvi", async ({ page }) => {
  await page.goto("/provider");
  await expect(page).toHaveURL(/provider|kirish/);
});
