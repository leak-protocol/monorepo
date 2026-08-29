import { Hex, keccak256, slice, toHex } from "viem";

/**
 * Four bytes appended to calldata to mark calls originating from this SDK.
 * No Leak contract reads it — grepping `dataSuffix` and `attribution` across
 * packages/coins/src returns nothing — it exists only for indexer-side filtering.
 */
export function getAttribution(): Hex {
  const hash = keccak256(toHex("sdk.leak.ai"));
  return slice(hash, 0, 4) as Hex;
}
