import { test, expect } from "@playwright/test";

// Create a fixture that registers a user
type UserFixture = {
  user: { username: string; password: string; email?: string };
};

export async function createPost(
  page: any,
  postTitle: string,
  postContent: string,
) {
  await page.getByRole("button", { name: "Post" }).click();
  await expect(page).toHaveURL("/post/create");
  await page.getByRole("textbox", { name: "Post Title" }).fill(postTitle);
  await page.getByRole("textbox", { name: "Post Content" }).fill(postContent);
  await page.getByRole("button", { name: "Create Post" }).click();
  await expect(page).toHaveURL(/\/post\/\d+/);
}

export const test_with_user = test.extend<UserFixture>({
  user: async ({ page }, use) => {
    const username = `testuser_${Math.floor(Math.random() * 100000)}`;
    const password = "password123";
    const email = `${username}@example.com`;
    const allowEmail = false;

    await page.goto("/register");
    await page.waitForLoadState("networkidle");
    await page.getByRole("textbox", { name: "Username" }).fill(username);
    if (allowEmail) {
      await page.getByRole("textbox", { name: "Email" }).fill(email);
    }
    await page
      .getByRole("textbox", { name: "Password", exact: true })
      .fill(password);
    await page
      .getByRole("textbox", { name: "Confirm Password" })
      .fill(password);
    await page.getByRole("button", { name: "Create account" }).click();
    await page.waitForURL("/");
    await page.waitForLoadState("networkidle");

    // Provide the user object to the test
    if (allowEmail) {
      await use({ username, password, email });
    } else {
      await use({ username, password });
    }

    // Cleanup after test if needed
  },
});
