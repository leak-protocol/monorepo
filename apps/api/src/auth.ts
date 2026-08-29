import { eq } from "drizzle-orm";
import type { Context, MiddlewareHandler } from "hono";
import { apiKeys } from "./db/schema";
import type { ApiKeyRecord, ApiVariables } from "./deps";
import { problem } from "./problem";

export const API_KEY_HEADER = "api-key";

export type { ApiKeyRecord, ApiVariables };

export const apiKeyMiddleware =
  (): MiddlewareHandler<{ Variables: ApiVariables }> => async (c, next) => {
    const presented = c.req.header(API_KEY_HEADER);
    if (presented === undefined || presented === "") {
      c.set("apiKey", undefined);
      return next();
    }

    const [row] = await c
      .get("deps")
      .db.select({
        key: apiKeys.key,
        ownerAddress: apiKeys.ownerAddress,
        isActive: apiKeys.isActive,
      })
      .from(apiKeys)
      .where(eq(apiKeys.key, presented))
      .limit(1);

    if (row === undefined || !row.isActive) {
      return problem(
        c,
        "unauthorized",
        "The api-key header does not match an active key.",
      );
    }

    c.set("apiKey", row);
    return next();
  };

export const requireApiKey = (
  c: Context<{ Variables: ApiVariables }>,
): ApiKeyRecord | undefined => c.get("apiKey");
