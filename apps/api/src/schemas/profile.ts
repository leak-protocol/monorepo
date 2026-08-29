import { z } from "@hono/zod-openapi";
import { SocialAccounts, WalletType } from "./common";

export const ProfileQuery = z.object({
  identifier: z.string().min(1),
});

export const ProfileResponse = z.object({
  profile: z
    .object({
      id: z.string(),
      handle: z.string(),
      platformBlocked: z.boolean(),
      avatar: z
        .object({
          small: z.string(),
          medium: z.string(),
          blurhash: z.string().optional(),
        })
        .optional(),
      username: z.string(),
      createdAt: z.string(),
      displayName: z.string().optional(),
      bio: z.string(),
      website: z.string().optional(),
      publicWallet: z.object({
        walletAddress: z.string(),
        walletType: WalletType,
      }),
      socialAccounts: SocialAccounts,
      linkedWallets: z.object({
        edges: z.array(
          z.object({
            node: z.object({
              walletType: WalletType,
              walletAddress: z.string(),
            }),
          }),
        ),
      }),
      creatorCoin: z
        .object({
          address: z.string(),
          marketCap: z.string(),
          marketCapDelta24h: z.string(),
        })
        .optional(),
    })
    .optional(),
});
