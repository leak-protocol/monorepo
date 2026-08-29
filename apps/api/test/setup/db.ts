import { sql } from "drizzle-orm";
import { createDatabase, type Database } from "../../src/db/client";
import type { AppDeps } from "../../src/deps";
import { readEnv } from "../../src/env";
import { stubChainReader, stubSubgraphClient } from "./stubs";

export const resetDb = async (db: Database): Promise<void> => {
  await db.execute(
    sql`TRUNCATE TABLE api_keys, profiles, social_accounts, linked_wallets, coin_metadata, coin_stats RESTART IDENTITY CASCADE`,
  );
};

export const testDeps = async (
  overrides: Partial<AppDeps> = {},
): Promise<AppDeps & { close: () => Promise<void> }> => {
  const env = readEnv();
  const { db, close } = createDatabase(env.LEAK_DATABASE_URL);
  await resetDb(db);
  return {
    db,
    env,
    now: () => Date.now(),
    chain: stubChainReader(),
    subgraph: stubSubgraphClient(),
    ...overrides,
    close,
  };
};
