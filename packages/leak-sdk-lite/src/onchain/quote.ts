import type { PublicClient } from "viem";
import { EXTERNAL_43114 } from "../external-registry";
import type { PoolKey } from "../types";

/**
 * A hand-written ABI for exactly the one function this SDK calls, derived from the
 * signature verified in external-registry. The parameter is ONE wrapping struct; the
 * four-loose-parameter variant has selector 0x6501a3ce and is NOT in the deployed
 * bytecode.
 */
const v4QuoterAbi = [
  {
    type: "function",
    name: "quoteExactInputSingle",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "params",
        type: "tuple",
        components: [
          {
            name: "poolKey",
            type: "tuple",
            components: [
              { name: "currency0", type: "address" },
              { name: "currency1", type: "address" },
              { name: "fee", type: "uint24" },
              { name: "tickSpacing", type: "int24" },
              { name: "hooks", type: "address" },
            ],
          },
          { name: "zeroForOne", type: "bool" },
          { name: "exactAmount", type: "uint128" },
          { name: "hookData", type: "bytes" },
        ],
      },
    ],
    outputs: [
      { name: "amountOut", type: "uint256" },
      { name: "gasEstimate", type: "uint256" },
    ],
  },
] as const;

export type QuoteArgs = {
  publicClient: PublicClient;
  poolKey: PoolKey;
  /** true = swap currency0 for currency1 */
  zeroForOne: boolean;
  exactAmount: bigint;
  hookData?: `0x${string}`;
};

/** On-chain quote. Replaces the hosted POST /quote endpoint. */
export async function quoteExactInputSingle(args: QuoteArgs) {
  const {
    publicClient,
    poolKey,
    zeroForOne,
    exactAmount,
    hookData = "0x",
  } = args;

  // The function is nonpayable and returns its result by reverting, so it has to be
  // simulated rather than read.
  const { result } = await publicClient.simulateContract({
    address: EXTERNAL_43114.v4Quoter.address,
    abi: v4QuoterAbi,
    functionName: "quoteExactInputSingle",
    args: [{ poolKey, zeroForOne, exactAmount, hookData }],
  });

  const [amountOut, gasEstimate] = result as unknown as [bigint, bigint];
  return { amountOut, gasEstimate };
}
