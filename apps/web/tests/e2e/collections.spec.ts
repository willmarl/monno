import { expect } from "@playwright/test";
import { TEST_USER } from "../constants";
import { test, createPost } from "./fixtures";

test("user able to create collection", async ({ page }) => {
  await page.goto("/user/" + TEST_USER.username);
  await page.getByRole("button", { name: "New Collection" }).click();

  const collectionName = `Test Collection ${Date.now()}`;
  const collectionDescription = "A test collection for E2E testing";

  await page.getByRole("textbox", { name: "Name" }).fill(collectionName);
  await page
    .getByRole("textbox", { name: "Description (optional)" })
    .fill(collectionDescription);
  await page.getByRole("button", { name: "Create collection" }).click();
  await page.waitForLoadState("networkidle");

  await expect(page.getByText("Collection created")).toBeVisible({
    timeout: 5000,
  });
  await expect(page.getByRole("heading", { name: collectionName })).toBeVisible(
    { timeout: 5000 },
  );
  await expect(page.getByText(collectionDescription)).toBeVisible({
    timeout: 5000,
  });
});

test("user able to add post to collection", async ({ page }) => {
  const postTitle = "Post for Favorites Collection";
  const postContent = "This post will be added to the favorites collection";

  await createPost(page, postTitle, postContent);
  await page.waitForLoadState("networkidle");
  await expect(page).toHaveURL(/\/post\/\d+/);

  await page.getByRole("button", { name: "Add to collection" }).click();
  const dialog = page.getByRole("dialog", { name: "Add post to collection" });
  await expect(dialog).toBeVisible();

  await dialog.getByRole("checkbox", { name: "favorites" }).click();
  await dialog.getByRole("button", { name: "Done" }).click();
  await page.waitForLoadState("networkidle");

  await expect(page.getByText("Post added to collection")).toBeVisible({
    timeout: 5000,
  });
  await expect(dialog).not.toBeVisible();

  await page.goto("/user/" + TEST_USER.username);
  await page.waitForLoadState("networkidle");
  await page
    .getByRole("heading", { name: /Collections by/ })
    .scrollIntoViewIfNeeded();
  await page.getByText("favoritesYour favorite posts").click();
  await page.waitForLoadState("networkidle");

  await expect(page).toHaveURL(/\/collection\/\d+/);
  await expect(page.getByText(postTitle).first()).toBeVisible();
  await expect(page.getByText(postContent).first()).toBeVisible();
});
