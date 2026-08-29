import { describe, it, expect } from "vitest";
import { parseRoute, routeHref } from "./route";

describe("parseRoute", () => {
  it("an empty hash resolves to the list", () => {
    expect(parseRoute("")).toEqual({ name: "list" });
    expect(parseRoute("#/")).toEqual({ name: "list" });
  });
  it("#/create resolves to the create screen", () => {
    expect(parseRoute("#/create")).toEqual({ name: "create" });
  });
  it("#/coin/<address> ra màn trade", () => {
    expect(
      parseRoute("#/coin/0x1111111111111111111111111111111111111111"),
    ).toEqual({
      name: "trade",
      coin: "0x1111111111111111111111111111111111111111",
    });
  });
  it("a malformed address falls back to the list", () => {
    expect(parseRoute("#/coin/0x11")).toEqual({ name: "list" });
  });
  it("an unknown path falls back to the list", () => {
    expect(parseRoute("#/nope")).toEqual({ name: "list" });
  });
});

describe("routeHref", () => {
  it("regenerates the correct hash", () => {
    expect(routeHref({ name: "list" })).toBe("#/");
    expect(routeHref({ name: "create" })).toBe("#/create");
    expect(
      routeHref({
        name: "trade",
        coin: "0x1111111111111111111111111111111111111111",
      }),
    ).toBe("#/coin/0x1111111111111111111111111111111111111111");
  });
});
