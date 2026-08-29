import { createRoute, type OpenAPIHono } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";
import type { ApiVariables } from "../auth";
import { apiKeys } from "../db/schema";
import { problem } from "../problem";
import { ApiKeyQuery, ApiKeyResponse } from "../schemas/apiKey";

export const ERROR_RESPONSES = {
  400: { description: "Bad request" },
  500: { description: "Internal server error" },
} as const;

export const getApiKeyRoute = createRoute({
  method: "get",
  path: "/apiKey",
  operationId: "getApiKey",
  summary: "leakSDK_apiKey query",
  security: [{ "api-key": [] }],
  request: { query: ApiKeyQuery },
  responses: {
    200: {
      description: "Successful operation",
      content: { "application/json": { schema: ApiKeyResponse } },
    },
    ...ERROR_RESPONSES,
  },
});

export const registerApiKeyRoute = (
  app: OpenAPIHono<{ Variables: ApiVariables }>,
): void => {
  app.openapi(getApiKeyRoute, async (c) => {
    const { apiKey } = c.req.valid("query");
    const [row] = await c
      .get("deps")
      .db.select({ key: apiKeys.key, isActive: apiKeys.isActive })
      .from(apiKeys)
      .where(eq(apiKeys.key, apiKey))
      .limit(1);

    if (row === undefined) {
      return problem(c, "bad-request", "Unknown API key.");
    }

    return c.json({ apiKey: { apiKey: row.key, isActive: row.isActive } }, 200);
  });
};
