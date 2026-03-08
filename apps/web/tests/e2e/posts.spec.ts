import { expect } from "@playwright/test";
import { test, createPost } from "./fixtures";

test("user can create a post", async ({ page }) => {
  const postTitle = "title here";
  const postContent = "post content here";
  await createPost(page, postTitle, postContent); // user on /post/123 page
  await expect(page).toHaveURL(/\/post\/\d+/); // check url has numeric ID
  await expect(page.locator("h2")).toContainText(postTitle);
  await expect(page.getByRole("main")).toContainText(postContent);
});

test("user can like post", async ({ page }) => {
  const postTitle = "title here";
  const postContent = "post content here";

  await createPost(page, postTitle, postContent); // user on /post/123 page
  await page.getByTestId("like-button").first().click();
  // Wait for the like count to update (works with optimistic updates and API responses)
  await expect(page.getByTestId("like-count").first()).toContainText("1", {
    timeout: 5000,
  });
});

test("user can update post", async ({ page }) => {
  const postTitle = "title here";
  const postContent = "post content here";

  await createPost(page, postTitle, postContent); // user on /post/123 page
  await expect(page).toHaveURL(/\/post\/\d+/); // check url has numeric ID
  await expect(page.locator("h2")).toContainText(postTitle);
  await expect(page.getByRole("main")).toContainText(postContent);

  await page.getByRole("button", { name: "Edit post" }).click();
  await expect(page).toHaveURL(/post\/edit\/\d+/);
  await page
    .getByRole("textbox", { name: "Update Title" })
    .fill(postTitle + " updated");
  await page
    .getByRole("textbox", { name: "Update Content" })
    .fill(postContent + " updated");
  await page.getByRole("button", { name: "Update Post" }).click();
  await expect(page).toHaveURL(/\/post\/\d+/); // check url has numeric ID
  await expect(page.locator("h2")).toContainText(postTitle + " updated");
  await expect(page.getByRole("main")).toContainText(postContent + " updated");
});

test("user can delete post", async ({ page }) => {
  const postTitle = "DELETE ME";
  const postContent = "DELETE ME 2";

  await createPost(page, postTitle, postContent); // user on /post/123 page

  // Extract the post ID from the URL
  const postUrl = page.url();
  const postId = postUrl.split("/").pop(); // gets "123" from "/post/123"

  await page.getByRole("button", { name: "Delete post" }).click();
  await page.getByRole("button", { name: "Yes" }).click();
  // Wait for redirect to complete after deletion
  await page.waitForURL("/");
  await expect(page).toHaveURL("/"); // redirected to default page

  // Check if post removed from default post feed
  await expect(page.locator("h2", { hasText: postTitle })).not.toBeVisible();
  await expect(
    page.locator("main", { hasText: postContent }),
  ).not.toBeVisible();

  // Verify the post URL no longer exists
  await page.goto(`/post/${postId}`);
  //   await expect(page.locator("text=not found")).toBeVisible();
  await expect(page.getByRole("heading")).toContainText("Post Not Found");
});
