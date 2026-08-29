import { describe, it, expect } from "vitest";
import { validateCreateForm, type CreateFormValues } from "./createForm";

const ok: CreateFormValues = {
  name: "Test Coin",
  symbol: "TEST",
  uri: "ipfs://bafytest",
  curveId: "meme",
};

describe("validateCreateForm", () => {
  it("a valid form has no errors and returns a poolConfig", () => {
    const r = validateCreateForm(ok);
    expect(r.errors).toEqual({});
    expect(r.valid).toBe(true);
    expect(r.poolConfig?.startsWith("0x")).toBe(true);
  });

  it("rejects a name that is empty or only whitespace", () => {
    expect(validateCreateForm({ ...ok, name: "   " }).errors.name).toMatch(
      /name/i,
    );
  });

  it("requires a symbol of 1-11 uppercase letters or digits", () => {
    expect(
      validateCreateForm({ ...ok, symbol: "" }).errors.symbol,
    ).toBeTruthy();
    expect(
      validateCreateForm({ ...ok, symbol: "abc" }).errors.symbol,
    ).toBeTruthy();
    expect(
      validateCreateForm({ ...ok, symbol: "TOOOOOOLONGGG" }).errors.symbol,
    ).toBeTruthy();
    expect(
      validateCreateForm({ ...ok, symbol: "LEAK9" }).errors.symbol,
    ).toBeUndefined();
  });

  it("requires the uri to be ipfs:// or https://", () => {
    expect(
      validateCreateForm({ ...ok, uri: "ftp://x" }).errors.uri,
    ).toBeTruthy();
    expect(
      validateCreateForm({ ...ok, uri: "https://a.b/c.json" }).errors.uri,
    ).toBeUndefined();
  });

  it("turns an unknown curveId into an error rather than throwing", () => {
    const r = validateCreateForm({ ...ok, curveId: "khong-co" });
    expect(r.errors.curveId).toBeTruthy();
    expect(r.valid).toBe(false);
    expect(r.poolConfig).toBeUndefined();
  });

  it("builds no poolConfig when the form is invalid", () => {
    expect(validateCreateForm({ ...ok, name: "" }).poolConfig).toBeUndefined();
  });
});
