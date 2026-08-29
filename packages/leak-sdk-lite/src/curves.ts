import { encodeAbiParameters } from "viem";

/** Matches CoinConfigurationVersions.DOPPLER_MULTICURVE_UNI_V4_POOL_VERSION. */
const POOL_CONFIG_VERSION_V4 = 4;
/** Matches CoinConstants.TICK_SPACING. */
const TICK_SPACING = 200;
const TOTAL_SUPPLY = 1_000_000_000;
const LN_1_0001 = Math.log(1.0001);

export type CurvePreset = {
  tickLower: number[];
  tickUpper: number[];
  numDiscoveryPositions: number[];
  maxDiscoverySupplyShare: bigint[];
};

/** Pure, no I/O. Fetch the AVAX price with readAvaxUsd() and pass it in. */
export function marketCapToTick(fdvUsd: number, avaxUsd: number): number {
  const pricePerCoin = fdvUsd / avaxUsd / TOTAL_SUPPLY;
  return (
    Math.round(Math.log(pricePerCoin) / LN_1_0001 / TICK_SPACING) * TICK_SPACING
  );
}

export function tickToMarketCap(tick: number, avaxUsd: number): number {
  return TOTAL_SUPPLY * Math.exp(tick * LN_1_0001) * avaxUsd;
}

/**
 * A wide band with low density. Rewards early entrants.
 * FDV 3.08 -> 768 AVAX, a 244x range. Measured on a fork: the first 1 AVAX moves
 * the price 7,486 ticks.
 */
export const LEAK_MEME: CurvePreset = {
  tickLower: [-196000],
  tickUpper: [-140800],
  numDiscoveryPositions: [11],
  maxDiscoverySupplyShare: [50000000000000000n],
};

/**
 * A narrow band, three overlapping curves, density rising with price. Resists pumps.
 * FDV 99.9 -> 816 AVAX, an 8.2x range. Measured on a fork: the first 1 AVAX moves
 * the price 223 ticks.
 */
export const LEAK_STABLE: CurvePreset = {
  tickLower: [-161200, -149200, -143200],
  tickUpper: [-147200, -140200, -140200],
  numDiscoveryPositions: [11, 11, 11],
  maxDiscoverySupplyShare: [
    50000000000000000n,
    125000000000000000n,
    200000000000000000n,
  ],
};

/** Encode poolConfig cho LeakFactory.deploy. Thay endpoint /contentCoinPoolConfig. */
export function encodeCurve(
  preset: CurvePreset,
  currency: `0x${string}`,
): `0x${string}` {
  return encodeAbiParameters(
    [
      { type: "uint8" },
      { type: "address" },
      { type: "int24[]" },
      { type: "int24[]" },
      { type: "uint16[]" },
      { type: "uint256[]" },
    ],
    [
      POOL_CONFIG_VERSION_V4,
      currency,
      preset.tickLower,
      preset.tickUpper,
      preset.numDiscoveryPositions,
      preset.maxDiscoverySupplyShare,
    ],
  );
}
