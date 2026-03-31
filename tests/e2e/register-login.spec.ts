import { expect, test } from "@playwright/test";

test("register/login sahifalari ochiladi", async ({ page }) => {
  await page.goto("/royxat");
  await expect(page).toHaveURL(/royxat|register/);

  await page.goto("/kirish");
  await expect(page).toHaveURL(/kirish|login/);
});
