import { createRoute, type OpenAPIHono } from "@hono/zod-openapi";
import { sql, type SQL } from "drizzle-orm";
import type { ApiVariables, AppDeps } from "../deps";
import {
  EMPTY_LIST_TYPES,
  ExploreQuery,
  ExploreResponse,
  type ListType,
} from "../schemas/explore";
import { isAvaxDenominated, LEAK_CHAIN_ID } from "../sources/chain";
import { ERROR_RESPONSES } from "./apiKey";

export const DEFAULT_COUNT = 20;

export const encodeCursor = (score: string, address: string): string =>
  Buffer.from(JSON.stringify({ s: score, a: address }), "utf8").toString(
    "base64url",
  );

export const decodeCursor = (
  cursor: string,
): { s: string; a: string } | undefined => {
  try {
    const parsed = JSON.parse(
      Buffer.from(cursor, "base64url").toString("utf8"),
    ) as { s?: unknown; a?: unknown };
    if (typeof parsed.s !== "string" || typeof parsed.a !== "string") {
      return undefined;
    }
    return { s: parsed.s, a: parsed.a };
  } catch {
    return undefined;
  }
};

const QUALITY = sql`LEAST(1, s.unique_traders_24h::numeric / 5) * LEAST(1, s.unique_holders::numeric / 25)`;
const SPAM_FILTER = sql`s.unique_holders >= 3 AND s.unique_traders_24h >= 2`;
const NO_FILTER = sql`TRUE`;

type Plan = { score: SQL; filter: SQL; distinctCreator: boolean };

const PLANS: Partial<Record<ListType, Plan>> = {
  TOP_GAINERS: {
    score: sql`(s.price_in_pool_token - s.price_in_pool_token_24h_ago) / NULLIF(s.price_in_pool_token_24h_ago, 0)`,
    filter: SPAM_FILTER,
    distinctCreator: false,
  },
  TOP_VOLUME_24H: {
    score: sql`s.volume_24h`,
    filter: SPAM_FILTER,
    distinctCreator: false,
  },
  TOP_VOLUME_ALL_24H: {
    score: sql`s.volume_24h`,
    filter: SPAM_FILTER,
    distinctCreator: false,
  },
  MOST_VALUABLE: {
    score: sql`s.price_in_pool_token * s.total_supply_wei / 1000000000000000000`,
    filter: SPAM_FILTER,
    distinctCreator: false,
  },
  MOST_VALUABLE_ALL: {
    score: sql`s.price_in_pool_token * s.total_supply_wei / 1000000000000000000`,
    filter: SPAM_FILTER,
    distinctCreator: false,
  },
  TRENDING_POSTS: {
    score: sql`s.volume_24h * ${QUALITY}`,
    filter: SPAM_FILTER,
    distinctCreator: false,
  },
  TRENDING_ALL: {
    score: sql`s.volume_24h * ${QUALITY}`,
    filter: SPAM_FILTER,
    distinctCreator: false,
  },
  NEW: {
    score: sql`EXTRACT(EPOCH FROM s.created_at)`,
    filter: NO_FILTER,
    distinctCreator: false,
  },
  NEW_ALL: {
    score: sql`EXTRACT(EPOCH FROM s.created_at)`,
    filter: NO_FILTER,
    distinctCreator: false,
  },
  OLD: {
    score: sql`-EXTRACT(EPOCH FROM s.created_at)`,
    filter: NO_FILTER,
    distinctCreator: false,
  },
  LAST_TRADED: {
    score: sql`EXTRACT(EPOCH FROM COALESCE(s.last_traded_at, s.created_at))`,
    filter: NO_FILTER,
    distinctCreator: false,
  },
  LAST_TRADED_UNIQUE: {
    score: sql`EXTRACT(EPOCH FROM COALESCE(s.last_traded_at, s.created_at))`,
    filter: NO_FILTER,
    distinctCreator: true,
  },
  FEATURED: {
    score: sql`EXTRACT(EPOCH FROM s.created_at)`,
    filter: sql`COALESCE(m.featured, false) = true`,
    distinctCreator: false,
  },
};

export const getExploreRoute = createRoute({
  method: "get",
  path: "/explore",
  operationId: "getExplore",
  summary: "leakSDK_explore query",
  security: [{ "api-key": [] }],
  request: { query: ExploreQuery },
  responses: {
    200: {
      description: "Successful operation",
      content: { "application/json": { schema: ExploreResponse } },
    },
    ...ERROR_RESPONSES,
  },
});

type Row = {
  score: string;
  address: string;
  name: string;
  symbol: string;
  creator_address: string;
  payout_recipient_address: string;
  platform_referrer_address: string;
  currency_address: string;
  currency_name: string;
  currency_decimals: number;
  total_supply_wei: string;
  total_volume: string;
  volume_24h: string;
  price_in_pool_token: string;
  price_in_pool_token_24h_ago: string;
  unique_holders: number;
  pool_token0: string;
  pool_token1: string;
  pool_fee: number;
  pool_tick_spacing: number;
  pool_hook: string;
  token_uri: string;
  /** `db.execute` returns raw rows: timestamptz comes back as a string, not a Date. */
  created_at: string | Date;
  description: string | null;
  media_mime_type: string | null;
  media_original_uri: string | null;
  preview_small: string | null;
  preview_medium: string | null;
  preview_blurhash: string | null;
  video_preview_url: string | null;
  video_hls_url: string | null;
  platform_blocked: boolean | null;
};

const selectPage = async (
  deps: AppDeps,
  listType: ListType,
  count: number,
  after: { s: string; a: string } | undefined,
): Promise<Row[]> => {
  const plan = PLANS[listType];
  if (plan === undefined) return [];

  const base = plan.distinctCreator
    ? sql`SELECT DISTINCT ON (s.creator_address) ${plan.score} AS score, s.*, m.description, m.media_mime_type,
                 m.media_original_uri, m.preview_small, m.preview_medium, m.preview_blurhash,
                 m.video_preview_url, m.video_hls_url, m.platform_blocked
            FROM coin_stats s
            LEFT JOIN coin_metadata m ON m.address = s.address
           WHERE COALESCE(m.platform_blocked, false) = false AND ${plan.filter}
           ORDER BY s.creator_address, ${plan.score} DESC`
    : sql`SELECT ${plan.score} AS score, s.*, m.description, m.media_mime_type,
                 m.media_original_uri, m.preview_small, m.preview_medium, m.preview_blurhash,
                 m.video_preview_url, m.video_hls_url, m.platform_blocked
            FROM coin_stats s
            LEFT JOIN coin_metadata m ON m.address = s.address
           WHERE COALESCE(m.platform_blocked, false) = false AND ${plan.filter}`;

  const keyset =
    after === undefined
      ? sql`TRUE`
      : sql`(ranked.score, ranked.address) < (${after.s}::numeric, ${after.a}::text)`;

  const rows = await deps.db.execute<Row>(
    sql`WITH ranked AS (${base})
        SELECT * FROM ranked
         WHERE ${keyset}
         ORDER BY ranked.score DESC, ranked.address DESC
         LIMIT ${count + 1}`,
  );

  return [...rows];
};

const trimZeros = (value: string): string =>
  value.includes(".") ? value.replace(/0+$/, "").replace(/\.$/, "") : value;

const toDecimalString = (value: number): string => trimZeros(value.toFixed(18));

export const registerExploreRoute = (
  app: OpenAPIHono<{ Variables: ApiVariables }>,
): void => {
  app.openapi(getExploreRoute, async (c) => {
    const { listType, count, after } = c.req.valid("query");
    const limit = count ?? DEFAULT_COUNT;

    if (EMPTY_LIST_TYPES.has(listType)) {
      return c.json(
        { exploreList: { edges: [], pageInfo: { hasNextPage: false } } },
        200,
      );
    }

    const cursor = after === undefined ? undefined : decodeCursor(after);
    if (after !== undefined && cursor === undefined) {
      return c.json(
        { exploreList: { edges: [], pageInfo: { hasNextPage: false } } },
        200,
      );
    }

    const deps = c.get("deps");
    const rows = await selectPage(deps, listType, limit, cursor);
    const hasNextPage = rows.length > limit;
    const page = rows.slice(0, limit);

    const needsUsd = page.some((row) =>
      isAvaxDenominated(row.currency_address),
    );
    const avaxUsd = needsUsd ? await deps.chain.readAvaxUsd() : 0;

    const edges = page.map((row) => {
      const supply = Number(row.total_supply_wei) / 1e18;
      const usd = isAvaxDenominated(row.currency_address) ? avaxUsd : 0;
      const marketCap = Number(row.price_in_pool_token) * supply * usd;
      const marketCap24hAgo =
        Number(row.price_in_pool_token_24h_ago) * supply * usd;

      const node: Record<string, unknown> = {
        id: `coin:${row.address}`,
        platformBlocked: row.platform_blocked ?? false,
        name: row.name,
        description: row.description ?? "",
        address: row.address,
        coinType: "CONTENT",
        symbol: row.symbol,
        totalSupply: row.total_supply_wei,
        totalVolume: trimZeros(row.total_volume),
        volume24h: trimZeros(row.volume_24h),
        createdAt: new Date(row.created_at).toISOString(),
        creatorAddress: row.creator_address,
        poolCurrencyToken: {
          address: row.currency_address,
          name: row.currency_name,
          decimals: row.currency_decimals,
        },
        tokenPrice: {
          ...(usd === 0
            ? {}
            : {
                priceInUsdc: toDecimalString(
                  Number(row.price_in_pool_token) * usd,
                ),
              }),
          currencyAddress: row.currency_address,
          priceInPoolToken: trimZeros(row.price_in_pool_token),
        },
        marketCap: toDecimalString(marketCap),
        marketCapDelta24h: toDecimalString(marketCap - marketCap24hAgo),
        chainId: LEAK_CHAIN_ID,
        tokenUri: row.token_uri,
        platformReferrerAddress: row.platform_referrer_address,
        payoutRecipientAddress: row.payout_recipient_address,
        uniqueHolders: row.unique_holders,
        uniswapV4PoolKey: {
          token0Address: row.pool_token0,
          token1Address: row.pool_token1,
          fee: row.pool_fee,
          tickSpacing: row.pool_tick_spacing,
          hookAddress: row.pool_hook,
        },
        uniswapV3PoolAddress: "",
      };

      if (row.media_original_uri !== null) {
        node.mediaContent = {
          ...(row.media_mime_type === null
            ? {}
            : { mimeType: row.media_mime_type }),
          originalUri: row.media_original_uri,
          ...(row.preview_small === null || row.preview_medium === null
            ? {}
            : {
                previewImage: {
                  small: row.preview_small,
                  medium: row.preview_medium,
                  ...(row.preview_blurhash === null
                    ? {}
                    : { blurhash: row.preview_blurhash }),
                },
              }),
          ...(row.video_preview_url === null
            ? {}
            : { videoPreviewUrl: row.video_preview_url }),
          ...(row.video_hls_url === null
            ? {}
            : { videoHlsUrl: row.video_hls_url }),
        };
      }

      return { node, cursor: encodeCursor(row.score, row.address) };
    });

    const last = edges.at(-1);
    return c.json(
      {
        exploreList: {
          edges,
          pageInfo: {
            ...(last === undefined ? {} : { endCursor: last.cursor }),
            hasNextPage,
          },
        },
      },
      200,
    );
  });
};
