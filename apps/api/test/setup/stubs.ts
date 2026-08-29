import type { ChainReader } from "../../src/sources/chain";

export const stubChainReader = (
  overrides: Partial<ChainReader> = {},
): ChainReader => ({
  readErc20: async () => undefined,
  readAvaxUsd: async () => 0,
  ...overrides,
});

import type { SubgraphClient } from "../../src/sources/subgraph";

export const stubSubgraphClient = (coins: unknown[] = []): SubgraphClient => ({
  fetchCoins: async (first, skip) => coins.slice(skip, skip + first) as never,
});
