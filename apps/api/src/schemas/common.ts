import { z } from "@hono/zod-openapi";

export const WALLET_TYPES = ["PRIVY", "EXTERNAL", "SMART_WALLET"] as const;

export const SOCIAL_NETWORKS = [
  "instagram",
  "tiktok",
  "twitter",
  "farcaster",
] as const;

export const SocialAccount = z.object({
  username: z.string().optional(),
  displayName: z.string().optional(),
  followerCount: z.number().int().optional(),
  id: z.string().optional(),
});

export const SocialAccounts = z.object({
  instagram: SocialAccount.optional(),
  tiktok: SocialAccount.optional(),
  twitter: SocialAccount.optional(),
  farcaster: SocialAccount.optional(),
});

export const WalletType = z.enum(WALLET_TYPES);
