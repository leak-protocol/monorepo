import { describe, it, expect } from "vitest";
import * as full from "./index";
import * as lite from "@leak/sdk-lite";

/**
 * `@leak/sdk` is `@leak/sdk-lite` plus the read layer, gathered with
 * `export * from "@leak/sdk-lite"`. A barrel export silently drops a name on
 * conflict, so a consumer can upgrade and lose a function with no compile error.
 */
describe("@leak/sdk fully covers @leak/sdk-lite", () => {
  it("is missing no export from the lite package", () => {
    const missing = Object.keys(lite).filter((k) => !(k in full));
    expect(missing).toEqual([]);
  });

  it("exposes the four core contract-layer functions, as functions", () => {
    for (const name of [
      "createCoinCall",
      "createQuote",
      "encodeCurve",
      "tradeCoin",
    ]) {
      expect(typeof (full as Record<string, unknown>)[name], name).toBe(
        "function",
      );
    }
  });

  it("ships the curve presets, not only the functions", () => {
    expect(full.LEAK_MEME).toBeDefined();
    expect(full.LEAK_STABLE).toBeDefined();
  });

  it("adds a read layer — without it the full package has no purpose", () => {
    expect(Object.keys(full).length).toBeGreaterThan(Object.keys(lite).length);
    expect(typeof full.setApiKey).toBe("function");
  });
});
