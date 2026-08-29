import { afterAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { testDeps } from "./setup/db";

const deps = await testDeps();
const app = createApp(deps);

afterAll(async () => {
  await deps.close();
});
import { PROBLEM_CONTENT_TYPE, problemBody } from "../src/problem";

describe("problemBody", () => {
  it("sets status and title from the problem type", () => {
    expect(
      problemBody("bad-request", "/explore", "listType is missing"),
    ).toEqual({
      type: "https://leak.ai/problems/bad-request",
      title: "Bad request",
      status: 400,
      detail: "listType is missing",
      instance: "/explore",
    });
  });

  it("omits detail entirely rather than leaving it undefined", () => {
    const body = problemBody("not-found", "/nope");
    expect(Object.hasOwn(body, "detail")).toBe(false);
    expect(body.status).toBe(404);
  });

  it("unauthorized là 401, internal là 500", () => {
    expect(problemBody("unauthorized", "/x").status).toBe(401);
    expect(problemBody("internal", "/x").status).toBe(500);
  });
});

describe("app error handling", () => {
  it("returns 404 problem+json for an unknown route", async () => {
    const res = await app.request("/khong-co-route-nay");
    expect(res.status).toBe(404);
    expect(res.headers.get("content-type")).toBe(PROBLEM_CONTENT_TYPE);
    expect(await res.json()).toMatchObject({
      title: "Not found",
      status: 404,
      instance: "/khong-co-route-nay",
    });
  });
});
