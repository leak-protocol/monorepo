import { describe, it, expect } from "vitest";
import { decodeAbiParameters } from "viem";
import {
  marketCapToTick,
  tickToMarketCap,
  LEAK_MEME,
  LEAK_STABLE,
  encodeCurve,
} from "../src/curves";

describe("marketCapToTick", () => {
  it("an FDV of $23 at AVAX $7.43 gives tick -196000", () => {
    expect(marketCapToTick(23, 7.43)).toBe(-196000);
  });
  it("is always a multiple of the 200 tick spacing", () => {
    // -196000 % 200 is -0 in JS, and toBe uses Object.is, where -0 !== 0.
    expect(marketCapToTick(23, 7.43) % 200 === 0).toBe(true);
    expect(marketCapToTick(5625, 7.43) % 200 === 0).toBe(true);
  });
  it("round-trips within one tick-spacing step", () => {
    const t = marketCapToTick(1000, 7.43);
    expect(Math.abs(tickToMarketCap(t, 7.43) - 1000)).toBeLessThan(30);
  });
});

describe("preset", () => {
  it("LEAK_MEME: one curve, 11 positions, 5%", () => {
    expect(LEAK_MEME.tickLower).toEqual([-196000]);
    expect(LEAK_MEME.tickUpper).toEqual([-140800]);
    expect(LEAK_MEME.numDiscoveryPositions).toEqual([11]);
    expect(LEAK_MEME.maxDiscoverySupplyShare).toEqual([50000000000000000n]);
  });
  it("LEAK_STABLE: three curves, shares summing to exactly 37.5% and under 100%", () => {
    expect(LEAK_STABLE.tickLower).toHaveLength(3);
    const total = LEAK_STABLE.maxDiscoverySupplyShare.reduce(
      (a, b) => a + b,
      0n,
    );
    expect(total).toBe(375000000000000000n);
    expect(total).toBeLessThan(10n ** 18n);
  });
  it("every tick is a multiple of 200", () => {
    for (const p of [LEAK_MEME, LEAK_STABLE])
      for (const t of [...p.tickLower, ...p.tickUpper])
        expect(t % 200 === 0).toBe(true);
  });
});

describe("encodeCurve", () => {
  it("decodes back to exactly the parameters that went in", () => {
    const encoded = encodeCurve(
      LEAK_MEME,
      "0x0000000000000000000000000000000000000000",
    );
    const [version, currency, lo, hi, np, shares] = decodeAbiParameters(
      [
        { type: "uint8" },
        { type: "address" },
        { type: "int24[]" },
        { type: "int24[]" },
        { type: "uint16[]" },
        { type: "uint256[]" },
      ],
      encoded,
    );
    expect(version).toBe(4);
    expect(currency).toBe("0x0000000000000000000000000000000000000000");
    expect(lo).toEqual([-196000]);
    expect(hi).toEqual([-140800]);
    expect(np).toEqual([11]);
    expect(shares).toEqual([50000000000000000n]);
  });
});
