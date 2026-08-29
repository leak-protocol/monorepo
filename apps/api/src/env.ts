import { z } from "@hono/zod-openapi";

const EnvSchema = z.object({
  LEAK_API_PORT: z.coerce.number().int().min(1).max(65535).default(8787),
  LEAK_DATABASE_URL: z
    .string()
    .min(1)
    .default("postgres://localhost:5432/leak_api"),
  LEAK_SUBGRAPH_URL: z
    .string()
    .min(1)
    .default("http://localhost:8000/subgraphs/name/leak"),
  LEAK_RPC_URL: z
    .string()
    .min(1)
    .default("https://api.avax.network/ext/bc/C/rpc"),
  LEAK_IPFS_API_URL: z.string().min(1).default("http://localhost:5001"),
  LEAK_UPLOAD_JWT_SECRET: z.string().min(32),
  /**
   * Origins allowed to call the API, comma separated. Defaults to the two origins
   * the web app runs on locally. Never "*": this API issues upload JWTs, so opening
   * it to every origin lets any page request a JWT on a visitor's behalf.
   */
  LEAK_CORS_ORIGINS: z
    .string()
    .min(1)
    .default("http://127.0.0.1:5173,http://localhost:5173"),
});

export type Env = z.infer<typeof EnvSchema>;

export const readEnv = (source: NodeJS.ProcessEnv = process.env): Env =>
  EnvSchema.parse(source);
