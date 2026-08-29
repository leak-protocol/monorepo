import {
  boolean,
  index,
  integer,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const apiKeys = pgTable("api_keys", {
  key: text("key").primaryKey(),
  ownerAddress: text("owner_address").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const profiles = pgTable(
  "profiles",
  {
    id: text("id").primaryKey(),
    handle: text("handle").notNull(),
    walletAddress: text("wallet_address").notNull(),
    walletType: text("wallet_type").notNull(),
    username: text("username").notNull(),
    displayName: text("display_name"),
    bio: text("bio").notNull().default(""),
    website: text("website"),
    avatarSmall: text("avatar_small"),
    avatarMedium: text("avatar_medium"),
    avatarBlurhash: text("avatar_blurhash"),
    platformBlocked: boolean("platform_blocked").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("profiles_handle_key").on(t.handle),
    uniqueIndex("profiles_wallet_address_key").on(t.walletAddress),
  ],
);

export const socialAccounts = pgTable(
  "social_accounts",
  {
    profileId: text("profile_id").notNull(),
    network: text("network").notNull(),
    username: text("username"),
    displayName: text("display_name"),
    followerCount: integer("follower_count"),
    externalId: text("external_id"),
  },
  (t) => [primaryKey({ columns: [t.profileId, t.network] })],
);

export const linkedWallets = pgTable(
  "linked_wallets",
  {
    profileId: text("profile_id").notNull(),
    walletAddress: text("wallet_address").notNull(),
    walletType: text("wallet_type").notNull(),
  },
  (t) => [primaryKey({ columns: [t.profileId, t.walletAddress] })],
);

export const coinMetadata = pgTable("coin_metadata", {
  address: text("address").primaryKey(),
  description: text("description").notNull().default(""),
  tokenUri: text("token_uri"),
  icon: text("icon"),
  mediaMimeType: text("media_mime_type"),
  mediaOriginalUri: text("media_original_uri"),
  previewSmall: text("preview_small"),
  previewMedium: text("preview_medium"),
  previewBlurhash: text("preview_blurhash"),
  videoPreviewUrl: text("video_preview_url"),
  videoHlsUrl: text("video_hls_url"),
  platformBlocked: boolean("platform_blocked").notNull().default(false),
  featured: boolean("featured").notNull().default(false),
});

export const coinStats = pgTable(
  "coin_stats",
  {
    address: text("address").primaryKey(),
    name: text("name").notNull(),
    symbol: text("symbol").notNull(),
    creatorAddress: text("creator_address").notNull(),
    payoutRecipientAddress: text("payout_recipient_address").notNull(),
    platformReferrerAddress: text("platform_referrer_address").notNull(),
    currencyAddress: text("currency_address").notNull(),
    currencyName: text("currency_name").notNull(),
    currencyDecimals: integer("currency_decimals").notNull(),
    totalSupplyWei: numeric("total_supply_wei", {
      precision: 78,
      scale: 0,
    }).notNull(),
    totalVolume: numeric("total_volume", {
      precision: 78,
      scale: 18,
    }).notNull(),
    volume24h: numeric("volume_24h", { precision: 78, scale: 18 }).notNull(),
    priceInPoolToken: numeric("price_in_pool_token", {
      precision: 78,
      scale: 18,
    }).notNull(),
    priceInPoolToken24hAgo: numeric("price_in_pool_token_24h_ago", {
      precision: 78,
      scale: 18,
    }).notNull(),
    uniqueHolders: integer("unique_holders").notNull(),
    uniqueTraders24h: integer("unique_traders_24h").notNull(),
    poolToken0: text("pool_token0").notNull(),
    poolToken1: text("pool_token1").notNull(),
    poolFee: integer("pool_fee").notNull(),
    poolTickSpacing: integer("pool_tick_spacing").notNull(),
    poolHook: text("pool_hook").notNull(),
    tokenUri: text("token_uri").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    lastTradedAt: timestamp("last_traded_at", { withTimezone: true }),
    refreshedAt: timestamp("refreshed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("coin_stats_volume_24h_idx").on(t.volume24h),
    index("coin_stats_created_at_idx").on(t.createdAt),
    index("coin_stats_last_traded_at_idx").on(t.lastTradedAt),
  ],
);
