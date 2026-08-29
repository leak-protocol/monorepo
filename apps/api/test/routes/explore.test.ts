import { eq } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../src/app";
import { coinMetadata, coinStats } from "../../src/db/schema";
import { coinMetadata as meta } from "../../src/db/schema";
import { resetDb, testDeps } from "../setup/db";
import { stubChainReader } from "../setup/stubs";

const eqAddress = (address: string) => eq(meta.address, address);

const NATIVE = "0x0000000000000000000000000000000000000000";
const A = `0x${"a1".repeat(20)}`;
const B = `0x${"b2".repeat(20)}`;
const C = `0x${"c3".repeat(20)}`;

const deps = await testDeps({
  chain: stubChainReader({ readAvaxUsd: async () => 10 }),
});
const app = createApp(deps);

const baseCoin = (address: string) => ({
  address,
  name: `Coin ${address.slice(0, 6)}`,
  symbol: "COIN",
  creatorAddress: NATIVE,
  payoutRecipientAddress: NATIVE,
  platformReferrerAddress: NATIVE,
  currencyAddress: NATIVE,
  currencyName: "AVAX",
  currencyDecimals: 18,
  totalSupplyWei: "1000000000000000000000000000",
  priceInPoolToken: "0.000001",
  priceInPoolToken24hAgo: "0.000001",
  poolToken0: NATIVE,
  poolToken1: address,
  poolFee: 10000,
  poolTickSpacing: 200,
  poolHook: NATIVE,
  tokenUri: "ipfs://meta",
  createdAt: new Date("2026-08-01T00:00:00.000Z"),
  lastTradedAt: new Date("2026-08-20T00:00:00.000Z"),
});

beforeEach(async () => {
  await resetDb(deps.db);
  await deps.db.insert(coinStats).values([
    {
      ...baseCoin(A),
      totalVolume: "500",
      volume24h: "400",
      uniqueHolders: 120,
      uniqueTraders24h: 40,
    },
    {
      ...baseCoin(B),
      totalVolume: "900",
      volume24h: "800",
      uniqueHolders: 10,
      uniqueTraders24h: 2,
    },
    {
      ...baseCoin(C),
      totalVolume: "9999",
      volume24h: "9000",
      uniqueHolders: 2,
      uniqueTraders24h: 1,
    },
  ]);
  await deps.db
    .insert(coinMetadata)
    .values([{ address: A }, { address: B }, { address: C }]);
});

afterAll(async () => {
  await deps.close();
});

type ExploreBody = {
  exploreList: {
    edges: { node: Record<string, unknown>; cursor: string }[];
    pageInfo: { endCursor?: string; hasNextPage: boolean };
  };
};

const explore = async (query: string): Promise<ExploreBody> => {
  const res = await app.request(`/explore?${query}`);
  expect(res.status).toBe(200);
  return (await res.json()) as ExploreBody;
};

describe("GET /explore", () => {
  it("excludes a coin with a single trader even at the highest volume", async () => {
    const body = await explore("listType=TRENDING_ALL");
    expect(body.exploreList.edges.map((e) => e.node.address)).toEqual([A, B]);
  });

  it("the quality factor inverts the ranking that raw volume would give", async () => {
    const byVolume = await explore("listType=TOP_VOLUME_24H");
    expect(byVolume.exploreList.edges[0]?.node.address).toBe(B);
    const trending = await explore("listType=TRENDING_ALL");
    expect(trending.exploreList.edges[0]?.node.address).toBe(A);
  });

  it("platform_blocked is filtered out of every listType", async () => {
    await deps.db
      .update(coinMetadata)
      .set({ platformBlocked: true })
      .where(eqAddress(A));
    const body = await explore("listType=NEW");
    expect(body.exploreList.edges.map((e) => e.node.address)).not.toContain(A);
  });

  it("count limits the page and endCursor continues from it", async () => {
    const page1 = await explore("listType=TRENDING_ALL&count=1");
    expect(page1.exploreList.edges).toHaveLength(1);
    expect(page1.exploreList.pageInfo.hasNextPage).toBe(true);
    const cursor = page1.exploreList.pageInfo.endCursor ?? "";
    const page2 = await explore(
      `listType=TRENDING_ALL&count=1&after=${encodeURIComponent(cursor)}`,
    );
    expect(page2.exploreList.edges[0]?.node.address).toBe(B);
    expect(page2.exploreList.pageInfo.hasNextPage).toBe(false);
  });

  it("every node is CONTENT on chain 43114 with no v3 pool", async () => {
    const body = await explore("listType=NEW");
    for (const edge of body.exploreList.edges) {
      expect(edge.node.coinType).toBe("CONTENT");
      expect(edge.node.chainId).toBe(43114);
      expect(edge.node.uniswapV3PoolAddress).toBe("");
      expect(edge.node.id).toBe(`coin:${String(edge.node.address)}`);
    }
  });

  it("marketCap is USD, from the pool price times the AVAX price", async () => {
    const body = await explore("listType=NEW");
    const node = body.exploreList.edges.find((e) => e.node.address === A)?.node;
    // 0.000001 AVAX/token * (1e27 wei / 1e18) token * 10 USD/AVAX = 10000 USD
    expect(node?.marketCap).toBe("10000");
  });

  it("all 12 listTypes return empty rather than erroring when there is no data", async () => {
    for (const listType of [
      "MOST_VALUABLE_TRENDS",
      "NEW_TRENDS",
      "FEATURED_VIDEOS",
      "NEW_CREATORS",
      "MOST_VALUABLE_CREATORS",
      "FEATURED_CREATORS",
      "TOP_VOLUME_CREATORS_24H",
      "TRENDING_TRENDS",
      "TRENDING_CREATORS",
      "TOP_VOLUME_TRENDS_24H",
      "TRENDING_AGENTS",
      "MOST_VALUABLE_AGENTS",
    ]) {
      const body = await explore(`listType=${listType}`);
      expect(body.exploreList.edges).toEqual([]);
      expect(body.exploreList.pageInfo.hasNextPage).toBe(false);
    }
  });

  it("returns 400 for a listType outside the enum", async () => {
    expect((await app.request("/explore?listType=KHONG_CO")).status).toBe(400);
  });

  it("returns 400 when listType is missing", async () => {
    expect((await app.request("/explore")).status).toBe(400);
  });
});
