import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { apiKeys, coinStats } from "../src/db/schema";
import { resetDb, testDeps } from "./setup/db";

const deps = await testDeps();

beforeEach(async () => {
  await resetDb(deps.db);
});

afterAll(async () => {
  await deps.close();
});

describe("schema", () => {
  it("writes and reads back api_keys", async () => {
    await deps.db.insert(apiKeys).values({
      key: "k-1",
      ownerAddress: "0x000000000000000000000000000000000000dead",
    });
    const rows = await deps.db.select().from(apiKeys);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.isActive).toBe(true);
  });

  it("preserves the precision of a 78-digit numeric", async () => {
    await deps.db.insert(coinStats).values({
      address: "0x000000000000000000000000000000000000dead",
      name: "Dead",
      symbol: "DEAD",
      creatorAddress: "0x000000000000000000000000000000000000dead",
      payoutRecipientAddress: "0x000000000000000000000000000000000000dead",
      platformReferrerAddress: "0x0000000000000000000000000000000000000000",
      currencyAddress: "0x0000000000000000000000000000000000000000",
      currencyName: "AVAX",
      currencyDecimals: 18,
      totalSupplyWei: "1000000000000000000000000000",
      totalVolume: "0",
      volume24h: "0",
      priceInPoolToken: "0",
      priceInPoolToken24hAgo: "0",
      uniqueHolders: 0,
      uniqueTraders24h: 0,
      poolToken0: "0x0000000000000000000000000000000000000000",
      poolToken1: "0x000000000000000000000000000000000000dead",
      poolFee: 10000,
      poolTickSpacing: 200,
      poolHook: "0x000000000000000000000000000000000000dead",
      createdAt: new Date("2026-08-01T00:00:00.000Z"),
    });
    const rows = await deps.db.select().from(coinStats);
    expect(rows[0]?.totalSupplyWei).toBe("1000000000000000000000000000");
  });
});
