import { describe, it, expect } from "vitest";
import { parseWebConfig, loadWebConfig, ConfigError } from "./config";

const good = {
  chainId: 43114,
  rpcUrl: "http://127.0.0.1:8545",
  factory: "0x1234567890123456789012345678901234567890",
  factoryDeployBlock: "93821000",
  apiUrl: "http://127.0.0.1:8787",
};

describe("parseWebConfig", () => {
  it("accepts a valid config and converts the block to bigint", () => {
    const cfg = parseWebConfig(good);
    expect(cfg.chainId).toBe(43114);
    expect(cfg.factoryDeployBlock).toBe(93821000n);
    expect(cfg.factory).toBe(good.factory);
  });

  it("accepts a numeric factoryDeployBlock", () => {
    expect(
      parseWebConfig({ ...good, factoryDeployBlock: 12 }).factoryDeployBlock,
    ).toBe(12n);
  });

  it("rejects a chainId that is not a positive integer", () => {
    expect(() => parseWebConfig({ ...good, chainId: "43114" })).toThrow(
      ConfigError,
    );
    expect(() => parseWebConfig({ ...good, chainId: 0 })).toThrow(/chainId/);
  });

  it("rejects an rpcUrl that is not http", () => {
    expect(() => parseWebConfig({ ...good, rpcUrl: "ws://x" })).toThrow(
      /rpcUrl/,
    );
  });

  it("rejects a factory that is not a 20-byte address", () => {
    expect(() => parseWebConfig({ ...good, factory: "0x1234" })).toThrow(
      /factory/,
    );
  });

  it("rejects an all-zero factory — the deployer has not written it", () => {
    expect(() =>
      parseWebConfig({
        ...good,
        factory: "0x0000000000000000000000000000000000000000",
      }),
    ).toThrow(/has not been written by the deployer/);
  });

  it("rejects a non-numeric factoryDeployBlock", () => {
    expect(() =>
      parseWebConfig({ ...good, factoryDeployBlock: "abc" }),
    ).toThrow(/factoryDeployBlock/);
  });

  it("rejects anything that is not an object", () => {
    expect(() => parseWebConfig(null)).toThrow(ConfigError);
    expect(() => parseWebConfig("x")).toThrow(ConfigError);
  });
});

describe("loadWebConfig", () => {
  it("fetches the right path with caching disabled", async () => {
    let seenUrl = "";
    let seenInit: RequestInit | undefined;
    const fake = (async (url: string, init?: RequestInit) => {
      seenUrl = url;
      seenInit = init;
      return { ok: true, status: 200, json: async () => good };
    }) as unknown as typeof fetch;

    const cfg = await loadWebConfig(fake);
    expect(seenUrl).toBe("/runtime/config.json");
    expect(seenInit?.cache).toBe("no-store");
    expect(cfg.chainId).toBe(43114);
  });

  it("throws ConfigError on an HTTP failure", async () => {
    const fake = (async () => ({
      ok: false,
      status: 404,
      json: async () => ({}),
    })) as unknown as typeof fetch;
    await expect(loadWebConfig(fake)).rejects.toThrow(/404/);
  });
});
