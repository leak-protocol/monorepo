import { z } from "@hono/zod-openapi";

export const TokenInfoQuery = z.object({
  address: z.string().min(1),
  chainId: z.coerce.number().int().optional(),
});

export const TokenInfoResponse = z.object({
  erc20Token: z
    .object({
      currency: z
        .object({
          priceUsd: z.string().optional(),
          decimals: z.number().int().optional(),
          name: z.string().optional(),
          symbol: z.string().optional(),
          icon: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
});
