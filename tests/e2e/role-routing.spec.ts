import { expect, test } from "@playwright/test";
import { expectAnyOf } from "./helpers/routing";

test("dashboard role routing tekshiruvi", async ({ page }) => {
  await page.goto("/dashboard");
  const pathname = new URL(page.url()).pathname;
  expect(expectAnyOf(pathname, [/dashboard/, /admin/, /provider/, /kirish/])).toBeTruthy();
});
