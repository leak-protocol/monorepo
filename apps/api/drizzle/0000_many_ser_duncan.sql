CREATE TABLE "api_keys" (
	"key" text PRIMARY KEY NOT NULL,
	"owner_address" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coin_metadata" (
	"address" text PRIMARY KEY NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"token_uri" text,
	"icon" text,
	"media_mime_type" text,
	"media_original_uri" text,
	"preview_small" text,
	"preview_medium" text,
	"preview_blurhash" text,
	"video_preview_url" text,
	"video_hls_url" text,
	"platform_blocked" boolean DEFAULT false NOT NULL,
	"featured" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coin_stats" (
	"address" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"symbol" text NOT NULL,
	"creator_address" text NOT NULL,
	"payout_recipient_address" text NOT NULL,
	"platform_referrer_address" text NOT NULL,
	"currency_address" text NOT NULL,
	"currency_name" text NOT NULL,
	"currency_decimals" integer NOT NULL,
	"total_supply_wei" numeric(78, 0) NOT NULL,
	"total_volume" numeric(78, 18) NOT NULL,
	"volume_24h" numeric(78, 18) NOT NULL,
	"price_in_pool_token" numeric(78, 18) NOT NULL,
	"price_in_pool_token_24h_ago" numeric(78, 18) NOT NULL,
	"unique_holders" integer NOT NULL,
	"unique_traders_24h" integer NOT NULL,
	"pool_token0" text NOT NULL,
	"pool_token1" text NOT NULL,
	"pool_fee" integer NOT NULL,
	"pool_tick_spacing" integer NOT NULL,
	"pool_hook" text NOT NULL,
	"token_uri" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"last_traded_at" timestamp with time zone,
	"refreshed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "linked_wallets" (
	"profile_id" text NOT NULL,
	"wallet_address" text NOT NULL,
	"wallet_type" text NOT NULL,
	CONSTRAINT "linked_wallets_profile_id_wallet_address_pk" PRIMARY KEY("profile_id","wallet_address")
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"handle" text NOT NULL,
	"wallet_address" text NOT NULL,
	"wallet_type" text NOT NULL,
	"username" text NOT NULL,
	"display_name" text,
	"bio" text DEFAULT '' NOT NULL,
	"website" text,
	"avatar_small" text,
	"avatar_medium" text,
	"avatar_blurhash" text,
	"platform_blocked" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_accounts" (
	"profile_id" text NOT NULL,
	"network" text NOT NULL,
	"username" text,
	"display_name" text,
	"follower_count" integer,
	"external_id" text,
	CONSTRAINT "social_accounts_profile_id_network_pk" PRIMARY KEY("profile_id","network")
);
--> statement-breakpoint
CREATE INDEX "coin_stats_volume_24h_idx" ON "coin_stats" USING btree ("volume_24h");--> statement-breakpoint
CREATE INDEX "coin_stats_created_at_idx" ON "coin_stats" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "coin_stats_last_traded_at_idx" ON "coin_stats" USING btree ("last_traded_at");--> statement-breakpoint
CREATE UNIQUE INDEX "profiles_handle_key" ON "profiles" USING btree ("handle");--> statement-breakpoint
CREATE UNIQUE INDEX "profiles_wallet_address_key" ON "profiles" USING btree ("wallet_address");