import { serve } from "@hono/node-server";
import { createApp } from "./app";
import { createDatabase } from "./db/client";
import { readEnv } from "./env";
import { createChainReader } from "./sources/chain";
import { createSubgraphClient } from "./sources/subgraph";

const env = readEnv();
const { db } = createDatabase(env.LEAK_DATABASE_URL);

serve(
  {
    fetch: createApp({
      db,
      env,
      now: () => Date.now(),
      chain: createChainReader(env.LEAK_RPC_URL),
      subgraph: createSubgraphClient(env.LEAK_SUBGRAPH_URL),
    }).fetch,
    port: env.LEAK_API_PORT,
  },
  (info) => {
    console.log(`leak-api listening on http://localhost:${info.port}`);
  },
);
