import { sql } from "drizzle-orm";
import { coinStats } from "../db/schema";
import type { AppDeps } from "../deps";

export const REFRESH_PAGE_SIZE = 500;

export const refreshCoinStats = async (deps: AppDeps): Promise<number> => {
  let skip = 0;
  let written = 0;

  for (;;) {
    const page = await deps.subgraph.fetchCoins(REFRESH_PAGE_SIZE, skip);
    if (page.length === 0) break;

    await deps.db
      .insert(coinStats)
      .values(
        page.map((coin) => ({
          address: coin.id.toLowerCase(),
          name: coin.name,
          symbol: coin.symbol,
          creatorAddress: coin.creator.toLowerCase(),
          payoutRecipientAddress: coin.payoutRecipient.toLowerCase(),
          platformReferrerAddress: coin.platformReferrer.toLowerCase(),
          currencyAddress: coin.currency.toLowerCase(),
          currencyName: coin.currencyName,
          currencyDecimals: coin.currencyDecimals,
          totalSupplyWei: coin.totalSupply,
          totalVolume: coin.totalVolume,
          volume24h: coin.volume24h,
          priceInPoolToken: coin.priceInPoolToken,
          priceInPoolToken24hAgo: coin.priceInPoolToken24hAgo,
          uniqueHolders: coin.uniqueHolders,
          uniqueTraders24h: coin.uniqueTraders24h,
          poolToken0: coin.poolToken0.toLowerCase(),
          poolToken1: coin.poolToken1.toLowerCase(),
          poolFee: coin.poolFee,
          poolTickSpacing: coin.poolTickSpacing,
          poolHook: coin.poolHook.toLowerCase(),
          tokenUri: coin.tokenUri,
          createdAt: new Date(Number(coin.createdAt) * 1000),
          lastTradedAt:
            coin.lastTradedAt === null
              ? null
              : new Date(Number(coin.lastTradedAt) * 1000),
          refreshedAt: new Date(deps.now()),
        })),
      )
      .onConflictDoUpdate({
        target: coinStats.address,
        set: {
          name: sql`excluded.name`,
          symbol: sql`excluded.symbol`,
          totalSupplyWei: sql`excluded.total_supply_wei`,
          totalVolume: sql`excluded.total_volume`,
          volume24h: sql`excluded.volume_24h`,
          priceInPoolToken: sql`excluded.price_in_pool_token`,
          priceInPoolToken24hAgo: sql`excluded.price_in_pool_token_24h_ago`,
          uniqueHolders: sql`excluded.unique_holders`,
          uniqueTraders24h: sql`excluded.unique_traders_24h`,
          tokenUri: sql`excluded.token_uri`,
          lastTradedAt: sql`excluded.last_traded_at`,
          refreshedAt: sql`excluded.refreshed_at`,
        },
      });

    written += page.length;
    skip += page.length;
    if (page.length < REFRESH_PAGE_SIZE) break;
  }

  return written;
};
