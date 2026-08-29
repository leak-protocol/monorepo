import { z } from "@hono/zod-openapi";

export const ADDRESS_PATTERN = /^0x[0-9a-fA-F]{40}$/;

export const UploadJwtBody = z.object({
  creatorAddress: z.string().regex(ADDRESS_PATTERN),
});

export const UploadJwtResponse = z.object({
  createUploadJwtFromApiKey: z.string(),
});
