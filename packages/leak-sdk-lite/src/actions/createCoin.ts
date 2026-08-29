import { leakFactoryImplABI as zoraFactoryImplABI } from "@zoralabs/coins/package/wagmiGenerated";
import {
  Account,
  Address,
  ContractEventArgsFromTopics,
  encodeFunctionData,
  Hex,
  parseEventLogs,
  TransactionReceipt,
  WalletClient,
} from "viem";
import { BundlerClient } from "viem/account-abstraction";
import { validateMetadataURIContent } from "../metadata";
import { ValidMetadataURI } from "../uploader/types";
import { GenericCall, toUserOperationCalls } from "../utils/calls";
import { GenericPublicClient } from "../utils/genericPublicClient";
import { getChainFromId } from "../utils/getChainFromId";
import { rethrowDecodedRevert } from "../utils/rethrowDecodedRevert";
import {
  prepareUserOperation,
  submitUserOperation,
} from "../utils/userOperation";
import { validateClientNetwork } from "../utils/validateClientNetwork";

export type CoinDeploymentLogArgs = ContractEventArgsFromTopics<
  typeof zoraFactoryImplABI,
  "CoinCreatedV4"
>;

const STARTING_MARKET_CAPS = {
  LOW: "LOW",
  HIGH: "HIGH",
} as const;
export type StartingMarketCap = keyof typeof STARTING_MARKET_CAPS;

export interface RawUriMetadata {
  type: "RAW_URI";
  uri: string;
}

const CONTENT_COIN_CURRENCIES = {
  CREATOR_COIN: "CREATOR_COIN",
  ZORA: "ZORA",
  ETH: "ETH",
  CREATOR_COIN_OR_ZORA: "CREATOR_COIN_OR_ZORA",
} as const;
export type ContentCoinCurrency = keyof typeof CONTENT_COIN_CURRENCIES;

export const CreateConstants = {
  StartingMarketCaps: STARTING_MARKET_CAPS,
  ContentCoinCurrencies: CONTENT_COIN_CURRENCIES,
} as const;

export type CreateCoinArgs = {
  creator: Address;
  name: string;
  symbol: string;
  metadata: RawUriMetadata;
  platformReferrer?: Address;
  additionalOwners?: Address[];
  payoutRecipientOverride?: Address;
  skipMetadataValidation?: boolean;
  /** Address of the LeakFactory proxy. */
  factory: Address;
  /**
   * The address that WILL SEND the transaction. The factory derives its salt from
   * `msg.sender`, so this must be the actual sender — not the creator — when the two
   * differ. On the smart-wallet path, for example, msg.sender is the smart wallet
   * rather than the EOA. Defaults to `creator`.
   */
  sender?: Address;
  /** From encodeCurve(). Determines the backing currency and the curve shape. */
  poolConfig: Hex;
  /** Used to read factory.coinAddress(). */
  publicClient: GenericPublicClient;
  salt?: Hex;
};

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as Address;
const ZERO_SALT =
  "0x0000000000000000000000000000000000000000000000000000000000000000" as Hex;

type TransactionParameters = {
  to: Address;
  data: Hex;
  value: bigint;
};

type CreateCoinCallResponse = {
  calls: TransactionParameters[];
  predictedCoinAddress: Address;
  /**
   * Whether the API applied smart wallet routing. False (or undefined) means the
   * call targets the factory directly (EOA creation); true means it is wrapped in
   * the smart wallet's `execute`.
   */
  usedSmartWalletRouting?: boolean;
};

export async function createCoinCall({
  creator,
  name,
  symbol,
  metadata,
  factory,
  poolConfig,
  publicClient,
  payoutRecipientOverride,
  additionalOwners,
  platformReferrer,
  skipMetadataValidation = false,
  salt = ZERO_SALT,
  sender,
}: CreateCoinArgs): Promise<CreateCoinCallResponse> {
  if (!skipMetadataValidation) {
    await validateMetadataURIContent(metadata.uri as ValidMetadataURI);
  }

  const payoutRecipient = payoutRecipientOverride ?? creator;
  const owners = [creator, ...(additionalOwners ?? [])];
  const referrer = platformReferrer ?? ZERO_ADDRESS;

  // LeakFactoryImpl.deploy() derives the salt from msg.sender:
  //   _buildSalt(msg.sender, name, symbol, poolConfig, platformReferrer, coinSalt)
  // so this must be whoever sends the transaction, not the creator.
  const msgSender = sender ?? creator;

  // The predicted address comes from the contract itself; CREATE2 is not recomputed here.
  const predictedCoinAddress = (await publicClient.readContract({
    address: factory,
    abi: zoraFactoryImplABI,
    functionName: "coinAddress",
    args: [msgSender, name, symbol, poolConfig, referrer, salt],
  })) as Address;

  const data = encodeFunctionData({
    abi: zoraFactoryImplABI,
    functionName: "deploy",
    args: [
      payoutRecipient,
      owners,
      metadata.uri,
      name,
      symbol,
      poolConfig,
      referrer,
      ZERO_ADDRESS,
      "0x" as Hex,
      salt,
    ],
  });

  return {
    calls: [{ to: factory, data, value: 0n }],
    predictedCoinAddress,
  };
}

/**
 * Checks the invariants this SDK supports: exactly one call, pointing at the factory
 * that was passed in, carrying no value (no buy-at-creation).
 */
export function validateCreateCoinCalls(
  calls: GenericCall[],
  factory: Address,
): void {
  if (calls.length !== 1) {
    throw new Error("this SDK supports exactly one call");
  }
  const call = calls[0]!;
  if (call.to.toLowerCase() !== factory.toLowerCase()) {
    throw new Error(
      `call must target factory ${factory}, but targets ${call.to}`,
    );
  }
  if (call.value !== 0n) {
    throw new Error("buy-at-creation is not supported in this version");
  }
}

/**
 * Gets the deployed coin address from transaction receipt logs
 * @param receipt Transaction receipt containing the CoinCreated event
 * @returns The deployment information if found
 */
export function getCoinCreateFromLogs(
  receipt: TransactionReceipt,
): CoinDeploymentLogArgs | undefined {
  const eventLogs = parseEventLogs({
    abi: zoraFactoryImplABI,
    logs: receipt.logs,
  });

  return eventLogs.find((log) => log.eventName === "CoinCreatedV4")?.args;
}

type CreateCoinOptions = {
  gasMultiplier?: number;
  account?: Account | Address;
  skipValidateTransaction?: boolean;
};

/**
 * Selects the account used to sign and send the create transaction.
 *
 * Prefers a LocalAccount from the wallet client when available to ensure offline
 * signing (eth_sendRawTransaction) instead of wallet_sendTransaction, which can
 * error when a `from` field is present.
 */
function selectExecutionAccount(
  walletClient: WalletClient,
  account?: Account | Address,
): Account {
  const selected =
    (typeof account === "string" ? undefined : account) ?? walletClient.account;

  if (!selected) {
    throw new Error("Account is required");
  }

  return selected;
}

/**
 * Simulates, gas-estimates, sends and awaits a single create call, then parses
 * the deployment from the receipt logs. Shared by {@link createCoin} (factory
 * call) and {@link createCoinSmartWallet} (smart wallet `execute` call) so both
 * return the same shape.
 */
async function executeCreateContentCall({
  createContentCall,
  account,
  walletClient,
  publicClient,
  skipValidateTransaction,
}: {
  createContentCall: GenericCall;
  account: Account;
  walletClient: WalletClient;
  publicClient: GenericPublicClient;
  skipValidateTransaction?: boolean;
}) {
  const viemCall = {
    ...createContentCall,
    account,
  };

  // simulate call
  if (!skipValidateTransaction) {
    try {
      await publicClient.call(viemCall);
    } catch (err) {
      rethrowDecodedRevert(err, zoraFactoryImplABI);
    }
  }

  const gasEstimate = skipValidateTransaction
    ? 10_000_000n
    : await publicClient.estimateGas(viemCall);
  const gasPrice = await publicClient.getGasPrice();

  const hash = await (async () => {
    try {
      return await walletClient.sendTransaction({
        ...viemCall,
        gasPrice,
        gas: gasEstimate,
        chain: publicClient.chain,
      });
    } catch (err) {
      rethrowDecodedRevert(err, zoraFactoryImplABI);
    }
  })();

  const receipt = await publicClient.waitForTransactionReceipt({
    hash,
  });

  const deployment = getCoinCreateFromLogs(receipt);

  return {
    hash,
    receipt,
    address: deployment?.coin,
    deployment,
    chain: getChainFromId(publicClient.chain.id),
  };
}

// Update createCoin to return both receipt and coin address
export async function createCoin({
  call,
  walletClient,
  publicClient,
  options,
}: {
  call: CreateCoinArgs;
  walletClient: WalletClient;
  publicClient: GenericPublicClient;
  options?: CreateCoinOptions;
}) {
  validateClientNetwork(publicClient);

  const { calls } = await createCoinCall(call);

  validateCreateCoinCalls(calls, call.factory);

  const createContentCall = calls[0]!;

  const account = selectExecutionAccount(walletClient, options?.account);

  return executeCreateContentCall({
    createContentCall,
    account,
    walletClient,
    publicClient,
    skipValidateTransaction: options?.skipValidateTransaction,
  });
}

/**
 * Creates a coin owned by the caller's smart wallet via a user operation.
 *
 * Requests smart wallet routing from the API, which resolves the creator's
 * linked smart wallet and returns the deploy wrapped in the smart wallet's
 * `execute`. That wrapped call is unwrapped to its inner factory call and
 * submitted as a user operation through `bundlerClient` — so the smart wallet
 * deploys and owns the coin while gas is paid from the smart wallet's
 * user-operation prefund (rather than from an owner EOA). The bundler/account
 * re-wraps the inner call in `execute` itself, and the smart wallet remains
 * `msg.sender`, so the deployed coin's CREATE2 address matches the API's
 * prediction.
 *
 * Mirrors {@link createCoin}'s return shape. Throws if the API did not apply
 * routing (e.g. the creator has no linked smart wallet) — use {@link createCoin}
 * for EOA creation in that case.
 */
export async function createCoinSmartWallet({
  call,
  bundlerClient,
  publicClient,
}: {
  call: CreateCoinArgs;
  bundlerClient: BundlerClient;
  publicClient: GenericPublicClient;
  // `options` is accepted for signature parity with createCoin but does not
  // apply to the user-operation path: the account comes from the bundler client,
  // and gas/validation are handled by the bundler during preparation.
  options?: CreateCoinOptions;
}) {
  validateClientNetwork(publicClient);

  const account = bundlerClient.account;
  if (!account) {
    throw new Error("Account is required: the bundler client has no account");
  }

  // The salt comes from msg.sender, and on this path msg.sender is the SMART WALLET,
  // not the creator's EOA. Getting it wrong makes the predicted address diverge from
  // the deployed one.
  const { calls } = await createCoinCall({
    ...call,
    sender: account.address,
  });

  // Calldata is built locally and already targets the factory directly — there is no
  // smart-wallet execute wrapper left to unwrap.
  validateCreateCoinCalls(calls, call.factory);

  const innerCall = calls[0]!;

  const userOperation = await prepareUserOperation({
    bundlerClient,
    account,
    calls: toUserOperationCalls([innerCall]),
  });

  const userOpReceipt = await submitUserOperation({
    bundlerClient,
    account,
    userOperation,
  });

  if (!userOpReceipt.success) {
    throw new Error(
      `User operation reverted${userOpReceipt.reason ? `: ${userOpReceipt.reason}` : ""}`,
    );
  }

  // Parse the deployment from this user operation's own logs (not the whole
  // bundle's), so a co-bundled CoinCreatedV4 can't be misattributed.
  const eventLogs = parseEventLogs({
    abi: zoraFactoryImplABI,
    logs: userOpReceipt.logs,
  });
  const deployment = eventLogs.find(
    (log) => log.eventName === "CoinCreatedV4",
  )?.args;

  return {
    hash: userOpReceipt.receipt.transactionHash,
    receipt: userOpReceipt.receipt,
    address: deployment?.coin,
    deployment,
    chain: getChainFromId(publicClient.chain.id),
  };
}
