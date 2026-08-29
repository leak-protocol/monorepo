import { describe, it, expect } from "vitest";
import {
  parseAmount,
  formatAmount,
  applySlippage,
  buildTradeParameters,
} from "./trade";

const poolKey = {
  currency0: "0x0000000000000000000000000000000000000000",
  currency1: "0x1111111111111111111111111111111111111111",
  fee: 8388608,
  tickSpacing: 200,
  hooks: "0x2222222222222222222222222222222222222222",
} as const;

describe("parseAmount", () => {
  it("parses a decimal into wei", () => {
    expect(parseAmount("1")).toBe(10n ** 18n);
    expect(parseAmount("0.5")).toBe(5n * 10n ** 17n);
  });
  it("returns null for a non-numeric or negative string", () => {
    expect(parseAmount("abc")).toBeNull();
    expect(parseAmount("-1")).toBeNull();
    expect(parseAmount("")).toBeNull();
  });
  it("returns null for zero — no empty trades", () => {
    expect(parseAmount("0")).toBeNull();
  });
});

describe("formatAmount", () => {
  it("formats wei into a readable string", () => {
    expect(formatAmount(10n ** 18n)).toBe("1");
  });
  it("truncates to the given precision, never rounding up", () => {
    expect(formatAmount(1234567890123456789n, 18, 4)).toBe("1.2345");
  });
  it("a very small amount does not silently become 0", () => {
    expect(formatAmount(1n, 18, 4)).toBe("<0.0001");
  });
});

describe("applySlippage", () => {
  it("5% removes exactly 5%", () => {
    expect(applySlippage(1000n, 0.05)).toBe(950n);
  });
  it("zero slippage leaves the amount unchanged", () => {
    expect(applySlippage(1000n, 0)).toBe(1000n);
  });
  it("rejects slippage outside [0,1)", () => {
    expect(() => applySlippage(1000n, 1)).toThrow();
    expect(() => applySlippage(1000n, -0.1)).toThrow();
  });
});

describe("buildTradeParameters", () => {
  it("mua: bán native, mua coin", () => {
    const p = buildTradeParameters({
      side: "buy",
      poolKey,
      coin: poolKey.currency1,
      amountIn: 10n ** 18n,
      slippage: 0.05,
      sender: poolKey.hooks,
    });
    expect(p.sell).toEqual({ type: "eth" });
    expect(p.buy).toEqual({ type: "erc20", address: poolKey.currency1 });
    expect(p.amountIn).toBe(10n ** 18n);
  });

  it("bán: bán coin, mua native", () => {
    const p = buildTradeParameters({
      side: "sell",
      poolKey,
      coin: poolKey.currency1,
      amountIn: 5n,
      slippage: 0.01,
      sender: poolKey.hooks,
    });
    expect(p.sell).toEqual({ type: "erc20", address: poolKey.currency1 });
    expect(p.buy).toEqual({ type: "eth" });
  });

  it("recipient defaults to sender", () => {
    const p = buildTradeParameters({
      side: "buy",
      poolKey,
      coin: poolKey.currency1,
      amountIn: 1n,
      slippage: 0,
      sender: poolKey.hooks,
    });
    expect(p.recipient).toBe(p.sender);
  });
});
