import { z } from "@hono/zod-openapi";
import { SocialAccounts } from "./common";

export const LIST_TYPES = [
  "TOP_GAINERS",
  "TOP_VOLUME_24H",
  "MOST_VALUABLE",
  "MOST_VALUABLE_TRENDS",
  "NEW",
  "NEW_TRENDS",
  "OLD",
  "LAST_TRADED",
  "LAST_TRADED_UNIQUE",
  "FEATURED",
  "FEATURED_VIDEOS",
  "NEW_CREATORS",
  "MOST_VALUABLE_CREATORS",
  "FEATURED_CREATORS",
  "TOP_VOLUME_CREATORS_24H",
  "TOP_VOLUME_ALL_24H",
  "NEW_ALL",
  "TRENDING_POSTS",
  "TRENDING_TRENDS",
  "TRENDING_CREATORS",
  "TRENDING_ALL",
  "TOP_VOLUME_TRENDS_24H",
  "MOST_VALUABLE_ALL",
  "TRENDING_AGENTS",
  "MOST_VALUABLE_AGENTS",
] as const;

export type ListType = (typeof LIST_TYPES)[number];

export const EMPTY_LIST_TYPES: ReadonlySet<ListType> = new Set([
  "MOST_VALUABLE_TRENDS",
  "NEW_TRENDS",
  "FEATURED_VIDEOS",
  "NEW_CREATORS",
  "MOST_VALUABLE_CREATORS",
  "FEATURED_CREATORS",
  "TOP_VOLUME_CREATORS_24H",
  "TRENDING_TRENDS",
  "TRENDING_CREATORS",
  "TOP_VOLUME_TRENDS_24H",
  "TRENDING_AGENTS",
  "MOST_VALUABLE_AGENTS",
]);

export const ExploreQuery = z.object({
  listType: z.enum(LIST_TYPES),
  count: z.coerce.number().int().min(1).max(100).optional(),
  after: z.string().optional(),
});

const CreatorProfile = z.object({
  id: z.string(),
  handle: z.string(),
  platformBlocked: z.boolean(),
  avatar: z
    .object({
      previewImage: z.object({
        blurhash: z.string().optional(),
        medium: z.string(),
        small: z.string(),
      }),
    })
    .optional(),
  socialAccounts: SocialAccounts,
  creatorCoin: z.object({ address: z.string() }).optional(),
});

const ExploreNode = z.object({
  id: z.string(),
  platformBlocked: z.boolean(),
  name: z.string(),
  description: z.string(),
  address: z.string(),
  coinType: z.enum(["CREATOR", "CONTENT", "TREND"]),
  symbol: z.string(),
  totalSupply: z.string(),
  totalVolume: z.string(),
  volume24h: z.string(),
  createdAt: z.string().optional(),
  creatorAddress: z.string().optional(),
  poolCurrencyToken: z
    .object({
      address: z.string().optional(),
      name: z.string().optional(),
      decimals: z.number().int().optional(),
    })
    .optional(),
  tokenPrice: z
    .object({
      priceInUsdc: z.string().optional(),
      currencyAddress: z.string(),
      priceInPoolToken: z.string(),
    })
    .optional(),
  marketCap: z.string(),
  marketCapDelta24h: z.string(),
  chainId: z.number().int(),
  tokenUri: z.string().optional(),
  platformReferrerAddress: z.string().optional(),
  payoutRecipientAddress: z.string().optional(),
  creatorProfile: CreatorProfile.optional(),
  mediaContent: z
    .object({
      mimeType: z.string().optional(),
      originalUri: z.string(),
      previewImage: z
        .object({
          small: z.string(),
          medium: z.string(),
          blurhash: z.string().optional(),
        })
        .optional(),
      videoPreviewUrl: z.string().optional(),
      videoHlsUrl: z.string().optional(),
    })
    .optional(),
  uniqueHolders: z.number().int(),
  uniswapV4PoolKey: z.object({
    token0Address: z.string(),
    token1Address: z.string(),
    fee: z.number().int(),
    tickSpacing: z.number().int(),
    hookAddress: z.string(),
  }),
  uniswapV3PoolAddress: z.string(),
});

export const ExploreResponse = z.object({
  exploreList: z.object({
    edges: z.array(z.object({ node: ExploreNode, cursor: z.string() })),
    pageInfo: z.object({
      endCursor: z.string().optional(),
      hasNextPage: z.boolean(),
    }),
  }),
});
