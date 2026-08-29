import { createRoute, type OpenAPIHono } from "@hono/zod-openapi";
import { eq, or } from "drizzle-orm";
import type { ApiVariables } from "../auth";
import { linkedWallets, profiles, socialAccounts } from "../db/schema";
import { ADDRESS_PATTERN } from "../schemas/uploadJwt";
import { ProfileQuery, ProfileResponse } from "../schemas/profile";
import { ERROR_RESPONSES } from "./apiKey";

export const getProfileRoute = createRoute({
  method: "get",
  path: "/profile",
  operationId: "getProfile",
  summary: "leakSDK_profile query",
  security: [{ "api-key": [] }],
  request: { query: ProfileQuery },
  responses: {
    200: {
      description: "Successful operation",
      content: { "application/json": { schema: ProfileResponse } },
    },
    ...ERROR_RESPONSES,
  },
});

const dropUndefined = <T extends Record<string, unknown>>(value: T): T =>
  Object.fromEntries(
    Object.entries(value).filter(([, v]) => v !== undefined && v !== null),
  ) as T;

const asWalletType = (value: string): "PRIVY" | "EXTERNAL" | "SMART_WALLET" =>
  value === "PRIVY" || value === "SMART_WALLET" ? value : "EXTERNAL";

export const registerProfileRoute = (
  app: OpenAPIHono<{ Variables: ApiVariables }>,
): void => {
  app.openapi(getProfileRoute, async (c) => {
    const { identifier } = c.req.valid("query");
    const db = c.get("deps").db;
    // `.toUpperCase()` also uppercases the `0x` prefix, so lowercase first and only
    // then match against ADDRESS_PATTERN.
    const lowered = identifier.toLowerCase();
    const normalised = ADDRESS_PATTERN.test(lowered) ? lowered : identifier;

    const [row] = await db
      .select()
      .from(profiles)
      .where(
        or(
          eq(profiles.id, normalised),
          eq(profiles.handle, normalised),
          eq(profiles.walletAddress, normalised),
        ),
      )
      .limit(1);

    if (row === undefined) {
      return c.json({}, 200);
    }

    const socials = await db
      .select()
      .from(socialAccounts)
      .where(eq(socialAccounts.profileId, row.id));

    const linked = await db
      .select()
      .from(linkedWallets)
      .where(eq(linkedWallets.profileId, row.id));

    const socialAccountsBody = Object.fromEntries(
      socials.map((s) => [
        s.network,
        dropUndefined({
          username: s.username ?? undefined,
          displayName: s.displayName ?? undefined,
          followerCount: s.followerCount ?? undefined,
          id: s.externalId ?? undefined,
        }),
      ]),
    );

    const avatar =
      row.avatarSmall !== null && row.avatarMedium !== null
        ? dropUndefined({
            small: row.avatarSmall,
            medium: row.avatarMedium,
            blurhash: row.avatarBlurhash ?? undefined,
          })
        : undefined;

    return c.json(
      {
        profile: dropUndefined({
          id: row.id,
          handle: row.handle,
          platformBlocked: row.platformBlocked,
          avatar,
          username: row.username,
          createdAt: row.createdAt.toISOString(),
          displayName: row.displayName ?? undefined,
          bio: row.bio,
          website: row.website ?? undefined,
          publicWallet: {
            walletAddress: row.walletAddress,
            walletType: asWalletType(row.walletType),
          },
          socialAccounts: socialAccountsBody,
          linkedWallets: {
            edges: linked.map((w) => ({
              node: {
                walletType: asWalletType(w.walletType),
                walletAddress: w.walletAddress,
              },
            })),
          },
        }),
      },
      200,
    );
  });
};
