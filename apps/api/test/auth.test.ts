import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { PROBLEM_CONTENT_TYPE } from "../src/problem";
import { apiKeys } from "../src/db/schema";
import { resetDb, testDeps } from "./setup/db";

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

describe("middleware api-key", () => {
  it("proceeds when no header is present", async () => {
    const res = await app.request("/openapi");
    expect(res.status).toBe(200);
  });

  it("returns 401 problem+json for an unknown key", async () => {
    const res = await app.request("/openapi", {
      headers: { "api-key": "khong-ton-tai" },
    });
    expect(res.status).toBe(401);
    expect(res.headers.get("content-type")).toBe(PROBLEM_CONTENT_TYPE);
    expect(await res.json()).toMatchObject({
      title: "Unauthorized",
      status: 401,
    });
  });

  it("returns 401 for a revoked key too", async () => {
    const res = await app.request("/openapi", {
      headers: { "api-key": "revoked" },
    });
    expect(res.status).toBe(401);
  });

  it("proceeds with a valid key", async () => {
    const res = await app.request("/openapi", {
      headers: { "api-key": "live" },
    });
    expect(res.status).toBe(200);
  });
});
