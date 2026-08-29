import {
  LEAK_MEME,
  LEAK_STABLE,
  encodeCurve,
  type CurvePreset,
} from "@leak/sdk-lite";

/** Native AVAX. Uniswap v4 uses address(0) for a chain's native token. */
export const NATIVE_CURRENCY =
  "0x0000000000000000000000000000000000000000" as const;

export type CurvePresetId = "meme" | "stable";

export type CurveChoice = {
  id: CurvePresetId;
  label: string;
  description: string;
  preset: CurvePreset;
  /** FDV range shown to the creator, in AVAX. Measured on a fork. */
  fdvRange: { from: number; to: number };
  /** Maximum price multiple across the discovery band. */
  multiple: number;
  encodeConfig: (currency: `0x${string}`) => `0x${string}`;
};

export const CURVE_CHOICES: CurveChoice[] = [
  {
    id: "meme",
    label: "Meme",
    description:
      "A wide band with thin liquidity. Small amounts move the price hard, rewarding " +
      "early entrants. Measured on a fork: the first 1 AVAX moves 7,486 ticks.",
    preset: LEAK_MEME,
    fdvRange: { from: 3.08, to: 768 },
    multiple: 244,
    encodeConfig: (currency) => encodeCurve(LEAK_MEME, currency),
  },
  {
    id: "stable",
    label: "Stable",
    description:
      "A narrow band of three overlapping curves, so each price level is harder to " +
      "reach. Suits assets with a reference price. Measured on a fork: the first " +
      "1 AVAX moves 223 ticks.",
    preset: LEAK_STABLE,
    fdvRange: { from: 99.9, to: 816 },
    multiple: 8.2,
    encodeConfig: (currency) => encodeCurve(LEAK_STABLE, currency),
  },
];

/** Looks a choice up by id. Throws rather than returning undefined so the error surfaces at the call site. */
export function curveChoiceById(id: string): CurveChoice {
  const found = CURVE_CHOICES.find((c) => c.id === id);
  if (!found) {
    throw new Error(
      `No curve with id "${id}". Valid ids: ${CURVE_CHOICES.map((c) => c.id).join(", ")}`,
    );
  }
  return found;
}
