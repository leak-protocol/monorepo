import { afterAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { testDeps } from "./setup/db";

type Doc = {
  openapi: string;
  info: { title: string; version: string };
  servers: { url: string }[];
  components: { securitySchemes: Record<string, unknown> };
  paths: Record<string, unknown>;
};

const deps = await testDeps();
const app = createApp(deps);

afterAll(async () => {
  await deps.close();
});

const fetchDoc = async (): Promise<Doc> => {
  const res = await app.request("/openapi");
  expect(res.status).toBe(200);
  return (await res.json()) as Doc;
};

describe("GET /openapi", () => {
  it("là OpenAPI 3.1", async () => {
    expect((await fetchDoc()).openapi).toBe("3.1.0");
  });

  it("declares exactly one server, and it is in the SDK's baseUrl union", async () => {
    expect((await fetchDoc()).servers).toEqual([
      { url: "http://localhost:8787/" },
    ]);
  });

  it("registers an api-key securityScheme in the header", async () => {
    expect((await fetchDoc()).components.securitySchemes["api-key"]).toEqual({
      type: "apiKey",
      name: "api-key",
      in: "header",
    });
  });
  it("each operationId equals the function name the SDK imports", async () => {
    const doc = (await fetchDoc()) as Doc & {
      paths: Record<string, Record<string, { operationId?: string }>>;
    };
    expect(doc.paths["/apiKey"]?.get?.operationId).toBe("getApiKey");
  });
});
