import { expect } from "@playwright/test";
import { test_with_user } from "./fixtures";

test_with_user(
  "user can register and be sent to default page",
  async ({ page, user }) => {
    await expect(page).toHaveURL("/");
    await expect(page.locator("#radix-_R_j9eqmlb_")).toContainText(
      `Hello, ${user.username}`,
    );
  },
);

test_with_user.only("logout works", async ({ page, user }) => {
  // User is already registered and logged in
  await page.getByRole("button", { name: `Hello, ${user.username}` }).click();
  await page.getByRole("menuitem", { name: "Logout" }).click();
  await page.waitForURL("/login");
  await expect(page).toHaveURL("/login");
});

test_with_user("login fails with wrong password", async ({ page, user }) => {
  // User is already registered, navigate to login
  await page.getByRole("button", { name: `Hello, ${user.username}` }).click();
  await page.getByRole("menuitem", { name: "Logout" }).click();
  await page.waitForURL("/login");
  await page.waitForLoadState("networkidle");
  await page.getByRole("textbox", { name: "Username" }).fill(user.username);
  await page.getByRole("textbox", { name: "Password" }).fill("wrongpassword");
  await page.locator("form").getByRole("button", { name: "Login" }).click();
  await expect(page.getByText("Error: Invalid credentials")).toBeVisible();
});
