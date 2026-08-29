export type SubgraphCoin = {
  /** coin address, lowercase — Coin entity, from the CoinCreatedV4 event */
  id: string;
  name: string;
  symbol: string;
  creator: string;
  payoutRecipient: string;
  platformReferrer: string;
  currency: string;
  currencyName: string;
  currencyDecimals: number;
  tokenUri: string;
  /** epoch seconds of the block containing CoinCreatedV4 */
  createdAt: string;
  /** epoch seconds of the most recent Swapped, null if never swapped */
  lastTradedAt: string | null;
  totalSupply: string;
  /** accumulated from Swapped, denominated in the backing currency */
  totalVolume: string;
  volume24h: string;
  /** derived from the sqrtPriceX96 of the most recent Swapped */
  priceInPoolToken: string;
  /** derived from the last Swapped before the now-24h mark */
  priceInPoolToken24hAgo: string;
  /** count of addresses with a balance > 0; Holder entity, from CoinTransfer */
  uniqueHolders: number;
  /** count of DISTINCT swapSender addresses over 24h */
  uniqueTraders24h: number;
  poolToken0: string;
  poolToken1: string;
  poolFee: number;
  poolTickSpacing: number;
  poolHook: string;
};

export const LEAK_COIN_STATS_QUERY = `
query LeakCoinStats($first: Int!, $skip: Int!) {
  coins(first: $first, skip: $skip, orderBy: createdAt, orderDirection: asc) {
    id
    name
    symbol
    creator
    payoutRecipient
    platformReferrer
    currency
    currencyName
    currencyDecimals
    tokenUri
    createdAt
    lastTradedAt
    totalSupply
    totalVolume
    volume24h
    priceInPoolToken
    priceInPoolToken24hAgo
    uniqueHolders
    uniqueTraders24h
    poolToken0
    poolToken1
    poolFee
    poolTickSpacing
    poolHook
  }
}`;

export type SubgraphClient = {
  fetchCoins: (first: number, skip: number) => Promise<SubgraphCoin[]>;
};

export const createSubgraphClient = (
  url: string,
  fetchImpl: typeof fetch = fetch,
): SubgraphClient => ({
  fetchCoins: async (first, skip) => {
    const res = await fetchImpl(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        query: LEAK_COIN_STATS_QUERY,
        variables: { first, skip },
      }),
    });
    if (!res.ok) {
      throw new Error(`subgraph responded ${res.status}`);
    }
    const payload = (await res.json()) as {
      data?: { coins?: SubgraphCoin[] };
      errors?: { message: string }[];
    };
    if (payload.errors && payload.errors.length > 0) {
      throw new Error(payload.errors.map((e) => e.message).join("; "));
    }
    return payload.data?.coins ?? [];
  },
});
