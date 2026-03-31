import { expect, test } from "@playwright/test";

test("admin p2p bo'limi routing tekshiruvi", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/admin|kirish/);
});
