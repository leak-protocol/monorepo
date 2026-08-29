import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../src/app";
import { coinMetadata, coinStats } from "../../src/db/schema";
import { resetDb, testDeps } from "../setup/db";
import { stubChainReader } from "../setup/stubs";

const COIN = "0x000000000000000000000000000000000000dead";
const NATIVE = "0x0000000000000000000000000000000000000000";

const deps = await testDeps({
  chain: stubChainReader({
    readErc20: async () => ({
      name: "Dead Coin",
      symbol: "DEAD",
      decimals: 18,
    }),
    readAvaxUsd: async () => 7.28563305,
  }),
});
const app = createApp(deps);

beforeEach(async () => {
  await resetDb(deps.db);
  await deps.db.insert(coinStats).values({
    address: COIN,
    name: "Dead Coin",
    symbol: "DEAD",
    creatorAddress: COIN,
    payoutRecipientAddress: COIN,
    platformReferrerAddress: NATIVE,
    currencyAddress: NATIVE,
    currencyName: "AVAX",
    currencyDecimals: 18,
    totalSupplyWei: "1000000000000000000000000000",
    totalVolume: "10",
    volume24h: "4",
    priceInPoolToken: "0.000002",
    priceInPoolToken24hAgo: "0.000001",
    uniqueHolders: 50,
    uniqueTraders24h: 12,
    poolToken0: NATIVE,
    poolToken1: COIN,
    poolFee: 10000,
    poolTickSpacing: 200,
    poolHook: COIN,
    createdAt: new Date("2026-08-01T00:00:00.000Z"),
  });
  await deps.db.insert(coinMetadata).values({
    address: COIN,
    icon: "ipfs://bafyicon",
  });
});

afterAll(async () => {
  await deps.close();
});

describe("GET /tokenInfo", () => {
  it("returns name, symbol and decimals from chain, and the icon from Postgres", async () => {
    const res = await app.request(`/tokenInfo?address=${COIN}`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      erc20Token: {
        currency: {
          priceUsd: "0.0000145712661",
          decimals: 18,
          name: "Dead Coin",
          symbol: "DEAD",
          icon: "ipfs://bafyicon",
        },
      },
    });
  });

  it("still serves when chainId is exactly 43114", async () => {
    const res = await app.request(`/tokenInfo?address=${COIN}&chainId=43114`);
    expect(res.status).toBe(200);
  });

  it("chainId khác thì 400", async () => {
    const res = await app.request(`/tokenInfo?address=${COIN}&chainId=1`);
    expect(res.status).toBe(400);
  });

  it("returns an empty body, not an error, for a non-ERC20 address", async () => {
    const empty = createApp({
      ...deps,
      chain: stubChainReader({ readErc20: async () => undefined }),
    });
    const res = await empty.request(`/tokenInfo?address=${COIN}`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({});
  });

  it("omits priceUsd for a coin absent from coin_stats", async () => {
    const res = await app.request(`/tokenInfo?address=${NATIVE}`);
    const body = (await res.json()) as {
      erc20Token?: { currency?: Record<string, unknown> };
    };
    expect(Object.hasOwn(body.erc20Token?.currency ?? {}, "priceUsd")).toBe(
      false,
    );
  });

  it("returns 400 when address is missing", async () => {
    expect((await app.request("/tokenInfo")).status).toBe(400);
  });
});
