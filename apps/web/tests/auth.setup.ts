import { test as setup } from "@playwright/test";
import { TEST_USER } from "./constants";

setup("authenticate", async ({ page }) => {
  console.log(
    "Reminder to increase rate limiting in apps/api/.env if having inconsistent tests",
  );
  const username = TEST_USER.username;
  const password = TEST_USER.password;

  await page.goto("/login");

  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Password").fill(password);

  const errorToast = page.getByText("Error: Invalid credentials");

  await page.locator("form").getByRole("button", { name: "Login" }).click();

  const result = await Promise.race([
    page.waitForURL("/", { timeout: 15000 }).then(() => "success"),
    errorToast
      .waitFor({ state: "visible", timeout: 15000 })
      .then(() => "error"),
  ]);

  if (result === "error") {
    console.log("Making new account");

    await page.goto("/register");

    await page.getByLabel("Username").fill(username);
    await page
      .getByRole("textbox", { name: "Password", exact: true })
      .fill(password);
    await page
      .getByRole("textbox", { name: "Confirm Password" })
      .fill(password);
    await page.getByRole("button", { name: "Create account" }).click();

    await page.waitForURL("/");
  } else {
    console.log("User already exists, logging in");
  }

  await page.context().storageState({ path: "tests/.auth/user.json" });
});
