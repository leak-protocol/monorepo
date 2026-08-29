import { describe, it, expect } from "vitest";
import { CURVE_CHOICES, curveChoiceById, NATIVE_CURRENCY } from "./presets";
import { decodeAbiParameters } from "viem";

describe("CURVE_CHOICES", () => {
  it("offers exactly two choices: meme and stable", () => {
    expect(CURVE_CHOICES.map((c) => c.id)).toEqual(["meme", "stable"]);
  });

  it("every choice has a non-empty label and description", () => {
    for (const c of CURVE_CHOICES) {
      expect(c.label.length).toBeGreaterThan(0);
      expect(c.description.length).toBeGreaterThan(0);
    }
  });

  it("meme has one curve, stable has three overlapping ones", () => {
    expect(curveChoiceById("meme").preset.tickLower).toHaveLength(1);
    expect(curveChoiceById("stable").preset.tickLower).toHaveLength(3);
  });
});

describe("curveChoiceById", () => {
  it("throws a clear error for an unknown id", () => {
    expect(() => curveChoiceById("khong-ton-tai")).toThrow(/khong-ton-tai/);
  });
});

describe("encode qua preset", () => {
  it("meme's encodeConfig decodes back to the declared ticks", () => {
    const choice = curveChoiceById("meme");
    const [version, currency, lo] = decodeAbiParameters(
      [{ type: "uint8" }, { type: "address" }, { type: "int24[]" }],
      choice.encodeConfig(NATIVE_CURRENCY),
    );
    expect(version).toBe(4);
    expect(currency).toBe(NATIVE_CURRENCY);
    expect(lo).toEqual(choice.preset.tickLower);
  });
});
