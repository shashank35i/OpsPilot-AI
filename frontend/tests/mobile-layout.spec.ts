import { expect, test } from "@playwright/test";

test("mobile layout shows bottom nav without horizontal overflow", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Mobile-only assertion");

  const email = `qa_mobile_${Date.now()}@opspilot.ai`;
  await page.goto("/register");
  await page.getByLabel("Full name").fill("QA Mobile");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("StrongPass@123");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/app$/);

  await expect(page.locator(".bottom-nav")).toBeVisible();

  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth > doc.clientWidth + 1;
  });
  expect(overflow).toBeFalsy();
});
