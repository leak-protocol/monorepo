import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    globalSetup: ["test/setup/globalSetup.ts"],
    fileParallelism: false,
    testTimeout: 30_000,
    env: {
      LEAK_UPLOAD_JWT_SECRET: "test-secret-0123456789-0123456789-abc",
      LEAK_DATABASE_URL:
        process.env.LEAK_TEST_DATABASE_URL ??
        "postgres://localhost:5432/leak_api_test",
    },
  },
});
