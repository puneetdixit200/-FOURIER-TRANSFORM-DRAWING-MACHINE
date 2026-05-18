import { expect, test } from "@playwright/test";

test("home page renders canvas UI and switches core modes", async ({ page }) => {
  const messages: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      messages.push(message.text());
    }
  });

  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Pi preset" })).toBeVisible();
  await expect(page.locator("canvas")).toBeVisible();

  await page.getByRole("button", { name: "Dual-axis" }).click();
  await expect(page.getByRole("button", { name: "Dual-axis" })).toHaveClass(/is-active/);

  await page.getByRole("button", { name: "3D" }).click();
  await expect(page.locator(".three-stage canvas")).toBeVisible();

  await page.getByRole("button", { name: "Epicycles" }).click();
  await page.getByRole("button", { name: "Teach" }).click();
  await expect(page.getByRole("button", { name: "Teach" })).toHaveClass(/is-on/);

  expect(messages).toEqual([]);
});
