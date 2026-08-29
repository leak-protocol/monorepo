import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Avalanche's public RPC is the bottleneck: one coin-creation transaction pulls
    // hundreds of cold state slots through anvil. Measured at 80-300 seconds per run.
    testTimeout: 600_000,
    hookTimeout: 900_000,
    // the fork tests share a single anvil instance, so they run sequentially
    fileParallelism: false,
  },
});
