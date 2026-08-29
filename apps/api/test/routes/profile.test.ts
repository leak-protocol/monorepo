import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../src/app";
import { linkedWallets, profiles, socialAccounts } from "../../src/db/schema";
import { resetDb, testDeps } from "../setup/db";

const deps = await testDeps();
const app = createApp(deps);

const WALLET = "0x000000000000000000000000000000000000dead";
const OTHER = "0x0000000000000000000000000000000000000000";

beforeEach(async () => {
  await resetDb(deps.db);
  await deps.db.insert(profiles).values({
    id: `profile:${WALLET}`,
    handle: "satoshi",
    walletAddress: WALLET,
    walletType: "EXTERNAL",
    username: "satoshi",
    displayName: "Satoshi",
    bio: "builds things",
    website: "https://example.com",
    avatarSmall: "https://cdn.example.com/s.png",
    avatarMedium: "https://cdn.example.com/m.png",
    createdAt: new Date("2026-01-02T03:04:05.000Z"),
  });
  await deps.db.insert(socialAccounts).values({
    profileId: `profile:${WALLET}`,
    network: "twitter",
    username: "satoshi",
    displayName: "Satoshi",
    followerCount: 42,
    externalId: "t-1",
  });
  await deps.db.insert(linkedWallets).values({
    profileId: `profile:${WALLET}`,
    walletAddress: OTHER,
    walletType: "SMART_WALLET",
  });
});

afterAll(async () => {
  await deps.close();
});

describe("GET /profile", () => {
  it("resolves by handle", async () => {
    const res = await app.request("/profile?identifier=satoshi");
    expect(res.status).toBe(200);
    const body = (await res.json()) as { profile?: Record<string, unknown> };
    expect(body.profile?.handle).toBe("satoshi");
    expect(body.profile?.id).toBe(`profile:${WALLET}`);
    expect(body.profile?.createdAt).toBe("2026-01-02T03:04:05.000Z");
  });

  it("resolves by wallet address, case insensitively", async () => {
    const res = await app.request(
      `/profile?identifier=${WALLET.toUpperCase()}`,
    );
    expect(
      ((await res.json()) as { profile?: { handle: string } }).profile?.handle,
    ).toBe("satoshi");
  });

  it("the /profile avatar is flat, not wrapped in previewImage", async () => {
    const res = await app.request("/profile?identifier=satoshi");
    const body = (await res.json()) as {
      profile?: { avatar?: Record<string, unknown> };
    };
    expect(body.profile?.avatar).toEqual({
      small: "https://cdn.example.com/s.png",
      medium: "https://cdn.example.com/m.png",
    });
  });

  it("socialAccounts groups by network, omitting the key for absent networks", async () => {
    const res = await app.request("/profile?identifier=satoshi");
    const body = (await res.json()) as {
      profile?: { socialAccounts: Record<string, unknown> };
    };
    expect(body.profile?.socialAccounts).toEqual({
      twitter: {
        username: "satoshi",
        displayName: "Satoshi",
        followerCount: 42,
        id: "t-1",
      },
    });
  });

  it("linkedWallets is edges with no pageInfo", async () => {
    const res = await app.request("/profile?identifier=satoshi");
    const body = (await res.json()) as {
      profile?: { linkedWallets: Record<string, unknown> };
    };
    expect(body.profile?.linkedWallets).toEqual({
      edges: [{ node: { walletType: "SMART_WALLET", walletAddress: OTHER } }],
    });
  });

  it("has no creatorCoin, because Leak does not implement creator coins", async () => {
    const res = await app.request("/profile?identifier=satoshi");
    const body = (await res.json()) as { profile?: Record<string, unknown> };
    expect(Object.hasOwn(body.profile ?? {}, "creatorCoin")).toBe(false);
  });

  it("returns 200 with an empty body when not found, not 404", async () => {
    const res = await app.request("/profile?identifier=khong-ai");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({});
  });

  it("returns 400 when identifier is missing", async () => {
    expect((await app.request("/profile")).status).toBe(400);
  });
});
