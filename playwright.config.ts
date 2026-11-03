import { defineConfig, devices } from "@playwright/test";

const PORT = 5174;
const baseURL = process.env.BASE_URL ?? `http://127.0.0.1:${PORT}/`;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [["html"], ["squally-reporter"]],
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
  ],
  // Without BASE_URL the tests run against the local copy of site/.
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: `node serve.mjs ${PORT}`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
      },
});
