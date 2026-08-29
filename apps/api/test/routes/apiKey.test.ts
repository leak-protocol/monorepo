import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../src/app";
import { apiKeys } from "../../src/db/schema";
import { PROBLEM_CONTENT_TYPE } from "../../src/problem";
import { resetDb, testDeps } from "../setup/db";

const deps = await testDeps();
const app = createApp(deps);

beforeEach(async () => {
  await resetDb(deps.db);
  await deps.db.insert(apiKeys).values([
    { key: "live", ownerAddress: "0x000000000000000000000000000000000000dead" },
    {
      key: "revoked",
      ownerAddress: "0x000000000000000000000000000000000000dead",
      isActive: false,
    },
  ]);
});

afterAll(async () => {
  await deps.close();
});

describe("GET /apiKey", () => {
  it("returns isActive true for an active key", async () => {
    const res = await app.request("/apiKey?apiKey=live");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      apiKey: { apiKey: "live", isActive: true },
    });
  });

  it("returns 200 with isActive false for a revoked key", async () => {
    const res = await app.request("/apiKey?apiKey=revoked");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      apiKey: { apiKey: "revoked", isActive: false },
    });
  });

  it("returns 400 problem+json when the apiKey query is missing", async () => {
    const res = await app.request("/apiKey");
    expect(res.status).toBe(400);
    expect(res.headers.get("content-type")).toBe(PROBLEM_CONTENT_TYPE);
  });

  it("returns 400, not 404, for a key that does not exist", async () => {
    const res = await app.request("/apiKey?apiKey=khong-co");
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ title: "Bad request" });
  });

  it("does not require an api-key header to call", async () => {
    const res = await app.request("/apiKey?apiKey=live");
    expect(res.status).toBe(200);
  });
});
