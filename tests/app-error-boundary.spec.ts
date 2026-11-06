import { expect, test } from "@playwright/test";

test("unexpected render errors show recovery controls instead of a blank page", async ({ page }) => {
  await page.route("**/api/companies", route => route.fulfill({ json: { invalid: true } }));
  await page.goto("/companies");
  await expect(page.getByRole("heading", { name: "Không thể hiển thị trang này" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Tải lại trang" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Về trang việc làm" })).toHaveAttribute("href", "/jobs");
  await page.route("**/api/companies", route => route.fulfill({ json: [] }));
  await page.getByRole("button", { name: "Tải lại trang" }).click();
  await expect(page.getByRole("heading", { name: "Không tìm thấy công ty" })).toBeVisible();
});
