import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  timeout: 5_000, // per-test timeout (ms)
  expect: {
    timeout: 5_000, // per-assertion timeout (ms)
  },
  use: {
    baseURL: "http://localhost:3000/",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },

  projects: [
    {
      name: "chromium setup",
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Use the saved authentication state
        storageState: "tests/.auth/user.json",
      },
      // Run setup first, then other tests
      dependencies: ["chromium setup"],
    },
    // {
    //   name: "firefox setup",
    //   testMatch: /auth\.setup\.ts/,
    // },
    // {
    //   name: "firefox",
    //   use: {
    //     ...devices["Desktop Firefox"],
    //     // Use the saved authentication state
    //     storageState: "tests/.auth/user.json",
    //   },
    //   // Run setup first, then other tests
    //   dependencies: ["firefox setup"],
    // },
  ],
});
