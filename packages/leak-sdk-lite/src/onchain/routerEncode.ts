import { encodeAbiParameters, concatHex } from "viem";
import type { PoolKey } from "../types";

/** UniversalRouter command: 0x10 = V4_SWAP. */
export const CMD_V4_SWAP = "0x10" as const;
/** V4Router actions. */
const SWAP_EXACT_IN_SINGLE = "0x06";
const SETTLE_ALL = "0x0c";
const TAKE_ALL = "0x0f";

const poolKeyComponents = [
  { name: "currency0", type: "address" },
  { name: "currency1", type: "address" },
  { name: "fee", type: "uint24" },
  { name: "tickSpacing", type: "int24" },
  { name: "hooks", type: "address" },
] as const;

export type EncodeSwapArgs = {
  poolKey: PoolKey;
  zeroForOne: boolean;
  amountIn: bigint;
  minAmountOut: bigint;
  /** First 32 bytes are the trade referrer address, or "0x" when absent. */
  hookData?: `0x${string}`;
};

/** Builds (commands, inputs) for UniversalRouter.execute. */
export function encodeV4Swap(args: EncodeSwapArgs) {
  const { poolKey, zeroForOne, amountIn, minAmountOut, hookData = "0x" } = args;

  const actions = concatHex([SWAP_EXACT_IN_SINGLE, SETTLE_ALL, TAKE_ALL]);

  const swapParams = encodeAbiParameters(
    [
      {
        type: "tuple",
        components: [
          { name: "poolKey", type: "tuple", components: poolKeyComponents },
          { name: "zeroForOne", type: "bool" },
          { name: "amountIn", type: "uint128" },
          { name: "amountOutMinimum", type: "uint128" },
          { name: "hookData", type: "bytes" },
        ],
      },
    ],
    [
      {
        poolKey,
        zeroForOne,
        amountIn,
        amountOutMinimum: minAmountOut,
        hookData,
      },
    ],
  );

  const inputCurrency = zeroForOne ? poolKey.currency0 : poolKey.currency1;
  const outputCurrency = zeroForOne ? poolKey.currency1 : poolKey.currency0;

  const settle = encodeAbiParameters(
    [{ type: "address" }, { type: "uint256" }],
    [inputCurrency, amountIn],
  );
  const take = encodeAbiParameters(
    [{ type: "address" }, { type: "uint256" }],
    [outputCurrency, minAmountOut],
  );

  const input = encodeAbiParameters(
    [{ type: "bytes" }, { type: "bytes[]" }],
    [actions, [swapParams, settle, take]],
  );

  return { commands: CMD_V4_SWAP, inputs: [input] };
}
