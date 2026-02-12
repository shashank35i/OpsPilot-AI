import { expect, test } from "@playwright/test";

test("landing renders with call-to-action", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Ship incident response workflows with enterprise precision.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Open workspace" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Toggle theme" })).toBeVisible();
});
