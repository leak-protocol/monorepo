import { describe, it, expect, vi } from "vitest";
import { createLeakActions } from "./actions";
import type { WebConfig } from "./config";

const web: WebConfig = {
  chainId: 43114,
  rpcUrl: "http://127.0.0.1:8545",
  factory: "0x1111111111111111111111111111111111111111",
  factoryDeployBlock: 100n,
  apiUrl: "http://localhost:8787",
};

const poolKey = {
  currency0: "0x0000000000000000000000000000000000000000",
  currency1: "0x2222222222222222222222222222222222222222",
  fee: 8388608,
  tickSpacing: 200,
  hooks: "0x3333333333333333333333333333333333333333",
} as const;

/** Injection point: every outbound call goes through here, so tests need no chain. */
function makeDeps(over: Record<string, unknown> = {}) {
  return {
    getPublicClient: vi.fn(() => ({
      getLogs: vi.fn(async (_args: unknown) => [] as unknown[]),
      getBlockNumber: vi.fn(async () => 500n),
    })),
    getWalletClient: vi.fn(async () => ({ account: { address: web.factory } })),
    sendTransaction: vi.fn(async () => `0x${"aa".repeat(32)}`),
    waitForTransactionReceipt: vi.fn(async () => ({
      status: "success",
      logs: [],
    })),
    createCoinCall: vi.fn(async (_args: unknown) => ({
      calls: [{ to: web.factory, data: "0xdead" as const, value: 0n }],
      predictedCoinAddress:
        "0x4444444444444444444444444444444444444444" as const,
    })),
    createQuote: vi.fn(async (_args: unknown) => ({
      success: true,
      call: { target: poolKey.hooks, data: "0xbeef" as const, value: "1000" },
      trade: { commands: "0x10" as const, inputs: [], value: "1000" },
      quote: { amountOut: "999", slippage: 0.05 },
    })),
    ...over,
  };
}

describe("createLeakActions", () => {
  it("createCoin builds calldata, sends it, and returns the predicted address and hash", async () => {
    const deps = makeDeps();
    const actions = createLeakActions({} as never, web, deps as never);
    const r = await actions.createCoin({
      name: "T",
      symbol: "T",
      uri: "ipfs://x",
      poolConfig: "0xcafe",
    });
    expect(deps.createCoinCall).toHaveBeenCalledOnce();
    expect(deps.sendTransaction).toHaveBeenCalledOnce();
    expect(r.coin).toBe("0x4444444444444444444444444444444444444444");
    expect(r.hash).toMatch(/^0x/);
  });

  it("createCoin passes the factory from WebConfig rather than hardcoding it", async () => {
    const deps = makeDeps();
    const actions = createLeakActions({} as never, web, deps as never);
    await actions.createCoin({
      name: "T",
      symbol: "T",
      uri: "ipfs://x",
      poolConfig: "0xcafe",
    });
    expect(deps.createCoinCall.mock.calls[0]![0]).toMatchObject({
      factory: web.factory,
    });
  });

  it("createCoin passes sender = the wallet address, since the factory salts from msg.sender", async () => {
    const deps = makeDeps();
    const actions = createLeakActions({} as never, web, deps as never);
    await actions.createCoin({
      name: "T",
      symbol: "T",
      uri: "ipfs://x",
      poolConfig: "0xcafe",
    });
    expect(deps.createCoinCall.mock.calls[0]![0]).toMatchObject({
      sender: web.factory,
    });
  });

  it("throws a clear error when no wallet is connected", async () => {
    const deps = makeDeps({
      getWalletClient: vi.fn(async () => null) as never,
    });
    const actions = createLeakActions({} as never, web, deps as never);
    await expect(
      actions.createCoin({
        name: "T",
        symbol: "T",
        uri: "ipfs://x",
        poolConfig: "0xcafe",
      }),
    ).rejects.toThrow(/wallet/i);
  });

  it("trade fetches a quote then sends the router transaction", async () => {
    const deps = makeDeps();
    const actions = createLeakActions({} as never, web, deps as never);
    const r = await actions.trade({
      side: "buy",
      poolKey,
      coin: poolKey.currency1,
      amountIn: 10n ** 18n,
      slippage: 0.05,
    });
    expect(deps.createQuote).toHaveBeenCalledOnce();
    expect(deps.sendTransaction).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ to: poolKey.hooks, value: 1000n }),
    );
    expect(r.amountOut).toBe(999n);
  });

  it("listCoins scans from factoryDeployBlock, not from 0", async () => {
    const getLogs = vi.fn(async (_args: unknown) => [] as unknown[]);
    const deps = makeDeps({
      getPublicClient: vi.fn(() => ({
        getLogs,
        getBlockNumber: vi.fn(async () => 500n),
      })) as never,
    });
    const actions = createLeakActions({} as never, web, deps as never);
    await actions.listCoins();
    expect(getLogs.mock.calls[0]![0]).toMatchObject({ fromBlock: 100n });
  });
});

describe("quote", () => {
  it("returns amountOut and the slippage-adjusted minimum without sending anything", async () => {
    const deps = makeDeps();
    const actions = createLeakActions({} as never, web, deps as never);
    const q = await actions.quote({
      side: "buy",
      poolKey,
      coin: poolKey.currency1,
      amountIn: 10n ** 18n,
      slippage: 0.05,
    });
    expect(q.amountOut).toBe(999n);
    expect(q.minAmountOut).toBe(949n); // 999 * 9500 / 10000, truncated
    expect(deps.sendTransaction).not.toHaveBeenCalled();
  });
});
