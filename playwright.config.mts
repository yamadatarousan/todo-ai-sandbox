import { fileURLToPath } from "node:url";
import { defineConfig } from "@playwright/test";

const e2eDatabaseFilePath = fileURLToPath(
  new URL("./data/e2e/app.sqlite", import.meta.url),
);

export default defineConfig({
  globalSetup: "./tests/e2e/globalSetup.mts",
  testDir: "./tests/e2e",
  fullyParallel: false,
  reporter: "list",
  retries: 0,
  use: {
    baseURL: "http://127.0.0.1:4173",
    headless: true,
  },
  webServer: [
    {
      command: "npm run start:backend:e2e",
      env: {
        HOST: "127.0.0.1",
        PORT: "3001",
        TODO_AI_DATABASE_PATH: e2eDatabaseFilePath,
      },
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
      url: "http://127.0.0.1:3001/health",
    },
    {
      command: "npm run dev:frontend:e2e",
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
      url: "http://127.0.0.1:4173",
    },
  ],
  workers: 1,
});
