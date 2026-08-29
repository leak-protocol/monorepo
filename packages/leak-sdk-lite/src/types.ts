/** Matches Uniswap v4's PoolKey struct. Used by curves, quote and routerEncode. */
export type PoolKey = {
  currency0: `0x${string}`;
  currency1: `0x${string}`;
  fee: number;
  tickSpacing: number;
  hooks: `0x${string}`;
};
