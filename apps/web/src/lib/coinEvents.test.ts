import { describe, it, expect } from "vitest";
import {
  coinCreatedV4Event,
  toCoinRow,
  sortNewestFirst,
  type CoinRow,
} from "./coinEvents";

const poolKey = {
  currency0: "0x0000000000000000000000000000000000000000",
  currency1: "0x1111111111111111111111111111111111111111",
  fee: 8388608,
  tickSpacing: 200,
  hooks: "0x2222222222222222222222222222222222222222",
} as const;

const log = {
  args: {
    caller: "0x3333333333333333333333333333333333333333",
    payoutRecipient: "0x4444444444444444444444444444444444444444",
    platformReferrer: "0x5555555555555555555555555555555555555555",
    currency: "0x0000000000000000000000000000000000000000",
    uri: "ipfs://x",
    name: "Test Coin",
    symbol: "TEST",
    coin: "0x1111111111111111111111111111111111111111",
    poolKey,
    poolKeyHash: `0x${"ab".repeat(32)}`,
    version: "2.6.1",
  },
  blockNumber: 100n,
  transactionHash: `0x${"cd".repeat(32)}`,
  logIndex: 3,
} as const;

describe("coinCreatedV4Event", () => {
  it("is an event named CoinCreatedV4 with 11 parameters", () => {
    expect(coinCreatedV4Event.type).toBe("event");
    expect(coinCreatedV4Event.name).toBe("CoinCreatedV4");
    expect(coinCreatedV4Event.inputs).toHaveLength(11);
  });

  it("the first three parameters are indexed, in on-chain declaration order", () => {
    const idx = coinCreatedV4Event.inputs
      .filter((i) => i.indexed)
      .map((i) => i.name);
    expect(idx).toEqual(["caller", "payoutRecipient", "platformReferrer"]);
  });

  it("poolKey is a five-field tuple", () => {
    const pk = coinCreatedV4Event.inputs.find((i) => i.name === "poolKey");
    expect(pk?.type).toBe("tuple");
    expect(pk?.components?.map((c) => c.name)).toEqual([
      "currency0",
      "currency1",
      "fee",
      "tickSpacing",
      "hooks",
    ]);
  });
});

describe("toCoinRow", () => {
  it("extracts the right fields and preserves poolKey", () => {
    const r = toCoinRow(log as never);
    expect(r.coin).toBe(log.args.coin);
    expect(r.name).toBe("Test Coin");
    expect(r.symbol).toBe("TEST");
    expect(r.creator).toBe(log.args.payoutRecipient);
    expect(r.blockNumber).toBe(100n);
    expect(r.poolKey.currency0).toBe(poolKey.currency0);
  });

  it("the id is unique per tx and logIndex, not per coin address", () => {
    const a = toCoinRow(log as never);
    const b = toCoinRow({ ...log, logIndex: 4 } as never);
    expect(a.id).not.toBe(b.id);
  });
});

describe("sortNewestFirst", () => {
  it("a higher block sorts first", () => {
    const rows = [
      { blockNumber: 1n, logIndex: 0 },
      { blockNumber: 3n, logIndex: 0 },
      { blockNumber: 2n, logIndex: 0 },
    ] as CoinRow[];
    expect(sortNewestFirst(rows).map((r) => r.blockNumber)).toEqual([
      3n,
      2n,
      1n,
    ]);
  });

  it("within a block, a higher logIndex sorts first", () => {
    const rows = [
      { blockNumber: 5n, logIndex: 1 },
      { blockNumber: 5n, logIndex: 7 },
    ] as CoinRow[];
    expect(sortNewestFirst(rows).map((r) => r.logIndex)).toEqual([7, 1]);
  });

  it("does not mutate the input array", () => {
    const rows = [
      { blockNumber: 1n, logIndex: 0 },
      { blockNumber: 2n, logIndex: 0 },
    ] as CoinRow[];
    sortNewestFirst(rows);
    expect(rows[0]!.blockNumber).toBe(1n);
  });
});
