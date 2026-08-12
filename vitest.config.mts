import { config } from "dotenv";
import { defineConfig } from "vitest/config";

config();

export default defineConfig({
  test: {
    // Tests share one Postgres database and truncate it between runs, so
    // files must not execute concurrently.
    fileParallelism: false,
    env: {
      DATABASE_URL: process.env.DATABASE_URL,
      TEST_DATABASE_URL: process.env.TEST_DATABASE_URL,
    },
  },
});
