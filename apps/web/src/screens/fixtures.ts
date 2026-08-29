import { vi } from "vitest";
import type { CoinRow } from "../lib/coinEvents";
import type { LeakActions } from "../lib/actions";

export const COIN = "0x1111111111111111111111111111111111111111" as const;
export const ACCOUNT = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" as const;

export const ROW: CoinRow = {
  id: "0xtx-0",
  coin: COIN,
  name: "Test Coin",
  symbol: "TEST",
  uri: "ipfs://bafytest",
  creator: ACCOUNT,
  currency: "0x0000000000000000000000000000000000000000",
  poolKey: {
    currency0: "0x0000000000000000000000000000000000000000",
    currency1: COIN,
    fee: 8388608,
    tickSpacing: 200,
    hooks: "0x2222222222222222222222222222222222222222",
  },
  blockNumber: 93821001n,
  logIndex: 0,
  transactionHash: "0xtx",
};

/** A double narrower than the real thing: only what the screens actually call. */
export function stubActions(overrides: Partial<LeakActions> = {}): LeakActions {
  return {
    listCoins: vi.fn(async () => [ROW]),
    createCoin: vi.fn(async () => ({ coin: COIN, hash: "0xhash" as const })),
    quote: vi.fn(async () => ({
      amountOut: 2n * 10n ** 18n,
      minAmountOut: 19n * 10n ** 17n,
    })),
    trade: vi.fn(async () => ({
      hash: "0xtrade" as const,
      amountOut: 2n * 10n ** 18n,
    })),
    ...overrides,
  } as unknown as LeakActions;
}

export function mockCalls(fn: unknown): unknown[][] {
  return (fn as { mock: { calls: unknown[][] } }).mock.calls;
}
