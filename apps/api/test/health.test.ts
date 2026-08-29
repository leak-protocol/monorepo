import { afterAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { testDeps } from "./setup/db";

const deps = await testDeps();
const app = createApp(deps);

afterAll(async () => {
  await deps.close();
});

describe("GET /healthz", () => {
  it("returns 200 without touching the database — used by the docker health check", async () => {
    const res = await app.request("/healthz");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok" });
  });

  it("does not require an API key", async () => {
    const res = await app.request("/healthz", { headers: {} });
    expect(res.status).toBe(200);
  });
});

describe("CORS", () => {
  it("accepts a preflight from the web app origin", async () => {
    const res = await app.request("/healthz", {
      method: "OPTIONS",
      headers: {
        Origin: "http://127.0.0.1:5173",
        "Access-Control-Request-Method": "GET",
      },
    });
    expect(res.status).toBeLessThan(300);
    expect(res.headers.get("access-control-allow-origin")).toBe(
      "http://127.0.0.1:5173",
    );
  });

  it("returns the allow header on a normal request", async () => {
    const res = await app.request("/healthz", {
      headers: { Origin: "http://127.0.0.1:5173" },
    });
    expect(res.headers.get("access-control-allow-origin")).toBe(
      "http://127.0.0.1:5173",
    );
  });

  it("grants no header to an unknown origin — never a wildcard", async () => {
    const res = await app.request("/healthz", {
      headers: { Origin: "https://ke-gian.example" },
    });
    expect(res.headers.get("access-control-allow-origin")).toBeNull();
  });

  it("allows extra origins via an environment variable", async () => {
    const custom = createApp({
      ...deps,
      env: {
        ...deps.env,
        LEAK_CORS_ORIGINS: "https://leak.app,https://www.leak.app",
      },
    });
    const res = await custom.request("/healthz", {
      headers: { Origin: "https://leak.app" },
    });
    expect(res.headers.get("access-control-allow-origin")).toBe(
      "https://leak.app",
    );
  });
});
