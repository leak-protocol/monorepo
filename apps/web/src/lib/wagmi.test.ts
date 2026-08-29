import { describe, it, expect } from "vitest";
import { leakChain, createLeakWagmiConfig } from "./wagmi";
import type { WebConfig } from "./config";

const cfg: WebConfig = {
  chainId: 43114,
  rpcUrl: "http://127.0.0.1:8545",
  factory: "0x1234567890123456789012345678901234567890",
  factoryDeployBlock: 93821000n,
  apiUrl: "http://127.0.0.1:8787",
};

describe("leakChain", () => {
  it("keeps chain id 43114 and AVAX as the currency", () => {
    const chain = leakChain(cfg);
    expect(chain.id).toBe(43114);
    expect(chain.nativeCurrency.symbol).toBe("AVAX");
  });

  it("replaces the default RPC with the one from config", () => {
    expect(leakChain(cfg).rpcUrls.default.http[0]).toBe(
      "http://127.0.0.1:8545",
    );
  });

  it("rejects every other chain, Fuji included", () => {
    expect(() => leakChain({ ...cfg, chainId: 43113 })).toThrow(/Uniswap v4/);
    expect(() => leakChain({ ...cfg, chainId: 8453 })).toThrow(/43114/);
  });
});

describe("createLeakWagmiConfig", () => {
  it("declares exactly one chain and one connector", () => {
    const wagmi = createLeakWagmiConfig(cfg);
    expect(wagmi.chains).toHaveLength(1);
    expect(wagmi.chains[0]!.id).toBe(43114);
    expect(wagmi.connectors).toHaveLength(1);
  });
});
