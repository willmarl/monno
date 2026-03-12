import { test, expect } from "@playwright/test";
import { TEST_USER } from "../constants";

test.beforeEach(async ({ page, context }) => {
  // Clear all storage
  await page.goto("/");
  await context.clearCookies();
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  // Fresh login
  await page.goto("/login");
  await page.getByLabel("Username").fill(TEST_USER.username);
  await page.getByLabel("Password").fill(TEST_USER.password);
  await page.locator("form").getByRole("button", { name: "Login" }).click();
  await page.waitForURL("/");
  await page.waitForLoadState("networkidle");
});
test("user is authenticated and can see default page", async ({ page }) => {
  // User is already logged in via storageState
  await page.goto("/");
  await expect(page).toHaveURL("/");
  await expect(page.locator(`text=Hello, ${TEST_USER.username}`)).toBeVisible();
});

test("logout works", async ({ page }) => {
  // User is already logged in via storageState
  await page.goto("/");
  await page
    .getByRole("button", { name: `Hello, ${TEST_USER.username}` })
    .click({ timeout: 5000 });
  await page
    .getByRole("menuitem", { name: "Logout" })
    .waitFor({ state: "visible" });
  await page.getByRole("menuitem", { name: "Logout" }).click();
  await page.waitForURL("/login");
  await expect(page).toHaveURL("/login");
});

test("login fails with wrong password", async ({ page }) => {
  // First logout to test login flow
  await page.goto("/");
  // await page.pause();
  await page
    .getByRole("button", { name: `Hello, ${TEST_USER.username}` })
    .click();
  await page.getByRole("menuitem", { name: "Logout" }).click();
  await page.waitForURL("/login");
  await page.waitForLoadState("networkidle");

  // Now test login with wrong password
  await page
    .getByRole("textbox", { name: "Username" })
    .fill(TEST_USER.username);
  await page.getByRole("textbox", { name: "Password" }).fill("wrongpassword");
  await page.locator("form").getByRole("button", { name: "Login" }).click();
  await expect(page.getByText("Error: Invalid credentials")).toBeVisible();
});
