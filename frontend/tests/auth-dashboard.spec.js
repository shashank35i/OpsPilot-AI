import { expect, test } from "@playwright/test";

test("register flow navigates to dashboard", async ({ page }) => {
  const email = `qa_${Date.now()}@opspilot.ai`;
  await page.goto("/register");
  await page.getByLabel("Full name").fill("QA User");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("StrongPass@123");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByText("Command Overview")).toBeVisible();
});
