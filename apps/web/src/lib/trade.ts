import { parseUnits, formatUnits } from "viem";
import type { PoolKey } from "@leak/sdk-lite";

export type TradeSide = "buy" | "sell";

/**
 * Parses user input into base units.
 * Returns `null` rather than throwing, so the form shows an error instead of crashing.
 * Zero is also `null`: an empty trade must not be submitted.
 */
export function parseAmount(input: string, decimals = 18): bigint | null {
  const s = input.trim();
  if (!s || !/^\d*\.?\d*$/.test(s)) return null;
  try {
    const v = parseUnits(s, decimals);
    return v > 0n ? v : null;
  } catch {
    return null;
  }
}

/**
 * Formats a number for display. **Truncates**, never rounds — rounding up in a trading
 * interface makes people believe they receive more than they will.
 * A non-zero value below the threshold shows as "<0.0001" rather than "0".
 */
export function formatAmount(
  value: bigint,
  decimals = 18,
  precision = 4,
): string {
  const full = formatUnits(value, decimals);
  const [int, frac = ""] = full.split(".");
  if (!frac) return int!;
  const cut = frac.slice(0, precision).replace(/0+$/, "");
  if (!cut) {
    return value > 0n && int === "0"
      ? `<0.${"0".repeat(precision - 1)}1`
      : int!;
  }
  return `${int}.${cut}`;
}

/** Subtracts slippage to get the minimum received. `slippage` is a fraction: 0.05 = 5%. */
export function applySlippage(amountOut: bigint, slippage: number): bigint {
  if (!(slippage >= 0 && slippage < 1)) {
    throw new Error(`slippage must be within [0, 1), got ${slippage}`);
  }
  const bps = BigInt(Math.round((1 - slippage) * 10_000));
  return (amountOut * bps) / 10_000n;
}

export type BuildTradeArgs = {
  side: TradeSide;
  poolKey: PoolKey;
  coin: `0x${string}`;
  amountIn: bigint;
  slippage: number;
  sender: `0x${string}`;
  recipient?: `0x${string}`;
  tradeReferrer?: `0x${string}`;
};

/**
 * Builds the parameters for the SDK's `createQuote`.
 * Leak pools always pair against native, so the native side is `{type:"eth"}`.
 */
export function buildTradeParameters(args: BuildTradeArgs) {
  const {
    side,
    poolKey,
    coin,
    amountIn,
    slippage,
    sender,
    recipient,
    tradeReferrer,
  } = args;
  const native = { type: "eth" } as const;
  const token = { type: "erc20", address: coin } as const;
  return {
    poolKey,
    sell: side === "buy" ? native : token,
    buy: side === "buy" ? token : native,
    amountIn,
    slippage,
    sender,
    recipient: recipient ?? sender,
    ...(tradeReferrer ? { tradeReferrer } : {}),
  };
}
