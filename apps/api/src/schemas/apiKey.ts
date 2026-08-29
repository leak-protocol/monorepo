import { z } from "@hono/zod-openapi";

export const ApiKeyQuery = z.object({
  apiKey: z.string().min(1),
});

export const ApiKeyResponse = z.object({
  apiKey: z.object({
    apiKey: z.string(),
    isActive: z.boolean(),
  }),
});
