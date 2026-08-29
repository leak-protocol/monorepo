import { verify } from "hono/jwt";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../src/app";
import { apiKeys } from "../../src/db/schema";
import { resetDb, testDeps } from "../setup/db";

const deps = await testDeps();
const app = createApp(deps);
const CREATOR = "0x000000000000000000000000000000000000dead";

const post = (body: unknown, headers: Record<string, string>) =>
  app.request("/createUploadJWT", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });

beforeEach(async () => {
  await resetDb(deps.db);
  await deps.db.insert(apiKeys).values({ key: "live", ownerAddress: CREATOR });
});

afterAll(async () => {
  await deps.close();
});

describe("POST /createUploadJWT", () => {
  it("returns an HS256-signed JWT whose sub is the creatorAddress", async () => {
    const res = await post({ creatorAddress: CREATOR }, { "api-key": "live" });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { createUploadJwtFromApiKey: string };
    expect(body.createUploadJwtFromApiKey.split(".")).toHaveLength(3);
    const claims = await verify(
      body.createUploadJwtFromApiKey,
      deps.env.LEAK_UPLOAD_JWT_SECRET,
      "HS256",
    );
    expect(claims.sub).toBe(CREATOR);
  });

  it("sets exp exactly 3600 seconds after now()", async () => {
    const res = await post({ creatorAddress: CREATOR }, { "api-key": "live" });
    const body = (await res.json()) as { createUploadJwtFromApiKey: string };
    const claims = await verify(
      body.createUploadJwtFromApiKey,
      deps.env.LEAK_UPLOAD_JWT_SECRET,
      "HS256",
    );
    expect(claims.exp).toBe(Math.floor(deps.now() / 1000) + 3600);
  });

  it("falls back to the key's ownerAddress when the body is missing", async () => {
    const res = await app.request("/createUploadJWT", {
      method: "POST",
      headers: { "api-key": "live" },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { createUploadJwtFromApiKey: string };
    const claims = await verify(
      body.createUploadJwtFromApiKey,
      deps.env.LEAK_UPLOAD_JWT_SECRET,
      "HS256",
    );
    expect(claims.sub).toBe(CREATOR);
  });

  it("returns 401 without an api-key", async () => {
    const res = await post({ creatorAddress: CREATOR }, {});
    expect(res.status).toBe(401);
  });

  it("returns 400 when creatorAddress is not an address", async () => {
    const res = await post(
      { creatorAddress: "khong-phai-dia-chi" },
      {
        "api-key": "live",
      },
    );
    expect(res.status).toBe(400);
  });

  it("does NOT expose an upload endpoint in /openapi", async () => {
    const doc = (await (await app.request("/openapi")).json()) as {
      paths: Record<string, unknown>;
    };
    expect(Object.keys(doc.paths)).toContain("/createUploadJWT");
    expect(Object.keys(doc.paths)).not.toContain("/ipfs/add");
  });
});
