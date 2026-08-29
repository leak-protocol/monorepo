import { defineConfig } from "@wagmi/cli";
import { foundry } from "@wagmi/cli/plugins";

export default defineConfig({
  out: "package/wagmiGenerated.ts",
  plugins: [
    foundry({
      forge: {
        build: false,
      },
      include: [
        "BaseCoin",
        "ContentCoin",
        "LeakFactoryImpl",
        "LeakCoinHook",
        "IPoolConfigEncoding",
        "IPermit2",
        "IPoolManager",
        "IUniversalRouter",
      ].map((contractName) => `${contractName}.json`),
    }),
  ],
});
