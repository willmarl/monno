import { test, expect } from "@playwright/test";
import { TEST_USER } from "../constants";
// Users are already authenticated via storageState (auth.setup.ts)
// No need for per-test registration anymore
export { test };

export async function createPost(
  page: any,
  postTitle: string,
  postContent: string,
) {
  await page.goto("/post/create");
  await page.getByRole("textbox", { name: "Post Title" }).fill(postTitle);
  await page.getByRole("textbox", { name: "Post Content" }).fill(postContent);
  await page.getByRole("button", { name: "Create Post" }).click();
  await expect(page).toHaveURL(/\/post\/\d+/);
}
