import type { Database } from "./db/client";
import type { Env } from "./env";
import type { ChainReader } from "./sources/chain";
import type { SubgraphClient } from "./sources/subgraph";

export type AppDeps = {
  db: Database;
  env: Env;
  now: () => number;
  chain: ChainReader;
  subgraph: SubgraphClient;
};

export type ApiKeyRecord = {
  key: string;
  ownerAddress: string;
  isActive: boolean;
};

/** Variables attached to Hono's Context. */
export type ApiVariables = {
  deps: AppDeps;
  apiKey: ApiKeyRecord | undefined;
};
