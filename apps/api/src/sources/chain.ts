import { createPublicClient, erc20Abi, http, type Address } from "viem";
import { avalanche } from "viem/chains";

export const LEAK_CHAIN_ID = 43114;
export const NATIVE_CURRENCY = "0x0000000000000000000000000000000000000000";
export const WAVAX = "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7";
export const CHAINLINK_AVAX_USD = "0x0A77230d17318075983913bC2145DB16C7366156";
export const CHAINLINK_DECIMALS = 8;

const aggregatorAbi = [
  {
    type: "function",
    name: "latestRoundData",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { name: "roundId", type: "uint80" },
      { name: "answer", type: "int256" },
      { name: "startedAt", type: "uint256" },
      { name: "updatedAt", type: "uint256" },
      { name: "answeredInRound", type: "uint80" },
    ],
  },
] as const;

export type Erc20Info = { name: string; symbol: string; decimals: number };

export type ChainReader = {
  readErc20: (address: string) => Promise<Erc20Info | undefined>;
  readAvaxUsd: () => Promise<number>;
};

export const createChainReader = (rpcUrl: string): ChainReader => {
  const client = createPublicClient({
    chain: avalanche,
    transport: http(rpcUrl),
  });

  return {
    readErc20: async (address) => {
      try {
        const [name, symbol, decimals] = await Promise.all([
          client.readContract({
            address: address as Address,
            abi: erc20Abi,
            functionName: "name",
          }),
          client.readContract({
            address: address as Address,
            abi: erc20Abi,
            functionName: "symbol",
          }),
          client.readContract({
            address: address as Address,
            abi: erc20Abi,
            functionName: "decimals",
          }),
        ]);
        return { name, symbol, decimals };
      } catch {
        return undefined;
      }
    },

    readAvaxUsd: async () => {
      const round = await client.readContract({
        address: CHAINLINK_AVAX_USD as Address,
        abi: aggregatorAbi,
        functionName: "latestRoundData",
      });
      return Number(round[1]) / 10 ** CHAINLINK_DECIMALS;
    },
  };
};

export const isAvaxDenominated = (currencyAddress: string): boolean => {
  const lowered = currencyAddress.toLowerCase();
  return lowered === NATIVE_CURRENCY || lowered === WAVAX.toLowerCase();
};
