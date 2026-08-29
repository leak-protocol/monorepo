import { randomBytes } from "node:crypto";
import { baseCoinABI } from "@zoralabs/coins/package/wagmiGenerated";
import type { Hex, PublicClient, WalletClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { createCoinCall } from "../../src/actions/createCoin";
import { encodeCurve, LEAK_MEME } from "../../src/curves";
import type { PoolKey } from "../../src/types";

/** anvil account #0. */
export const ACCOUNT = privateKeyToAccount(
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
);

export const NATIVE = "0x0000000000000000000000000000000000000000" as const;

/**
 * anvil state persists between runs, so a fixed salt would collide with an existing
 * coin and revert. Each creation uses a random salt.
 */
export const randomSalt = (): Hex => `0x${randomBytes(32).toString("hex")}`;

/** Creates a native-backed coin and returns its address and poolKey. */
export async function createTestCoin({
  publicClient,
  walletClient,
  factory,
  name = "Quote Coin",
  symbol = "QUOTE",
}: {
  publicClient: PublicClient;
  walletClient: WalletClient;
  factory: `0x${string}`;
  name?: string;
  symbol?: string;
}): Promise<{ coin: `0x${string}`; poolKey: PoolKey }> {
  const res = await createCoinCall({
    publicClient,
    factory,
    creator: ACCOUNT.address,
    name,
    symbol,
    metadata: { type: "RAW_URI", uri: "ipfs://test" },
    poolConfig: encodeCurve(LEAK_MEME, NATIVE),
    skipMetadataValidation: true,
    salt: randomSalt(),
  });

  const hash = await walletClient.sendTransaction({
    to: res.calls[0]!.to,
    data: res.calls[0]!.data,
    value: res.calls[0]!.value,
    account: ACCOUNT,
    chain: null,
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success") {
    throw new Error("coin creation failed");
  }

  const coin = res.predictedCoinAddress;
  const poolKey = (await publicClient.readContract({
    address: coin,
    abi: baseCoinABI,
    functionName: "getPoolKey",
  })) as PoolKey;

  return { coin, poolKey };
}
