import type { AbiEvent } from "viem";
import type { PoolKey } from "@leak/sdk-lite";

/**
 * The event LeakFactory emits when a coin is created.
 *
 * Copied from the declaration at `packages/coins/src/interfaces/ILeakFactory.sol:45-57`,
 * NOT from its doc comment. The first three parameters are indexed, in declaration
 * order — indexed position determines the log topic, so one mistake returns no logs
 * at all.
 */
export const coinCreatedV4Event = {
  type: "event",
  name: "CoinCreatedV4",
  inputs: [
    { name: "caller", type: "address", indexed: true },
    { name: "payoutRecipient", type: "address", indexed: true },
    { name: "platformReferrer", type: "address", indexed: true },
    { name: "currency", type: "address", indexed: false },
    { name: "uri", type: "string", indexed: false },
    { name: "name", type: "string", indexed: false },
    { name: "symbol", type: "string", indexed: false },
    { name: "coin", type: "address", indexed: false },
    {
      name: "poolKey",
      type: "tuple",
      indexed: false,
      components: [
        { name: "currency0", type: "address" },
        { name: "currency1", type: "address" },
        { name: "fee", type: "uint24" },
        { name: "tickSpacing", type: "int24" },
        { name: "hooks", type: "address" },
      ],
    },
    { name: "poolKeyHash", type: "bytes32", indexed: false },
    { name: "version", type: "string", indexed: false },
  ],
} as const satisfies AbiEvent;

export type DecodedCoinCreatedLog = {
  args: {
    caller: `0x${string}`;
    payoutRecipient: `0x${string}`;
    platformReferrer: `0x${string}`;
    currency: `0x${string}`;
    uri: string;
    name: string;
    symbol: string;
    coin: `0x${string}`;
    poolKey: PoolKey;
    poolKeyHash: `0x${string}`;
    version: string;
  };
  blockNumber: bigint;
  transactionHash: `0x${string}`;
  logIndex: number;
};

export type CoinRow = {
  /** Unique per (tx, logIndex) — one transaction can create several coins. */
  id: string;
  coin: `0x${string}`;
  name: string;
  symbol: string;
  uri: string;
  creator: `0x${string}`;
  currency: `0x${string}`;
  poolKey: PoolKey;
  blockNumber: bigint;
  logIndex: number;
  transactionHash: `0x${string}`;
};

export function toCoinRow(log: DecodedCoinCreatedLog): CoinRow {
  const a = log.args;
  return {
    id: `${log.transactionHash}-${log.logIndex}`,
    coin: a.coin,
    name: a.name,
    symbol: a.symbol,
    uri: a.uri,
    creator: a.payoutRecipient,
    currency: a.currency,
    poolKey: a.poolKey,
    blockNumber: log.blockNumber,
    logIndex: log.logIndex,
    transactionHash: log.transactionHash,
  };
}

/** Newest first. Returns a new array; the input is not mutated. */
export function sortNewestFirst(rows: CoinRow[]): CoinRow[] {
  return [...rows].sort((x, y) => {
    if (x.blockNumber !== y.blockNumber)
      return x.blockNumber > y.blockNumber ? -1 : 1;
    return y.logIndex - x.logIndex;
  });
}
