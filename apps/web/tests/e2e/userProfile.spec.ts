import { expect } from "@playwright/test";
import { TEST_USER } from "../constants";
import { test } from "./fixtures";

test("user able to view profile", async ({ page }) => {
  await page.goto("/user/" + TEST_USER.username);
  await page.waitForURL("/user/" + TEST_USER.username);
  await expect(page).toHaveURL("/user/" + TEST_USER.username);
  await expect(page.getByRole("main")).toContainText(TEST_USER.username);
});

test.describe.serial("Profile modifications", () => {
  test("user able to update profile", async ({ page }) => {
    await page.waitForTimeout(3000); // despite being serial so should run last, still too fast and interrupts other test
    // note this is not an issue if you dont run tests in parallel
    await page.goto("/settings");
    await page.waitForURL("/settings");
    await expect(page).toHaveURL("/settings");
    await page.getByRole("button", { name: "Edit Profile" }).click();
    await page
      .getByRole("textbox", { name: "Username" })
      .fill(`new_${TEST_USER.username}`);
    await page
      .getByRole("textbox", { name: "Email Address" })
      .fill(`${TEST_USER.username}@email.com`);
    await page.getByRole("button", { name: "Save Changes" }).click();
    await expect(page.getByText("Successfully updated profile")).toBeVisible();
    await expect(page.locator("form")).toMatchAriaSnapshot(`
    - text: Username
    - textbox "Username" [disabled]:
      - /placeholder: Enter username
      - text: new_${TEST_USER.username}
    - paragraph: This is your unique identifier on the platform
    `);
    await expect(page.locator("form")).toContainText(
      `Pending verification: ${TEST_USER.username}@email.com`,
    );
    await expect(
      page.locator(`text=Hello, new_${TEST_USER.username}`),
    ).toBeVisible();
    // change username back
    await page.getByRole("button", { name: "Edit Profile" }).click();
    await page
      .getByRole("textbox", { name: "Username" })
      .fill(TEST_USER.username);
    await page.getByRole("button", { name: "Save Changes" }).click();
  });
});
