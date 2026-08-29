import { iPermit2ABI as permit2ABI } from "@zoralabs/coins/package/wagmiGenerated";
import {
  Account,
  Address,
  encodeFunctionData,
  erc20Abi,
  Hex,
  maxUint256,
  type PublicClient,
  TransactionReceipt,
  WalletClient,
} from "viem";
import { BundlerClient, SmartAccount } from "viem/account-abstraction";
import { avalanche } from "viem/chains";
import { quoteExactInputSingle } from "../onchain/quote";
import { encodeV4Swap } from "../onchain/routerEncode";
import { EXTERNAL_43114 } from "../external-registry";
import type { PoolKey } from "../types";
import { GenericCall, toUserOperationCalls } from "../utils/calls";
import { GenericPublicClient } from "../utils/genericPublicClient";
import {
  prepareUserOperation,
  submitUserOperation,
} from "../utils/userOperation";

/** Canonical Permit2, identical on every chain. See external-registry. */
const PERMIT2_ADDRESS = "0x000000000022D473030F116dDEE9F6B43aC78BA3" as Address;

const universalRouterAbi = [
  {
    type: "function",
    name: "execute",
    stateMutability: "payable",
    inputs: [
      { name: "commands", type: "bytes" },
      { name: "inputs", type: "bytes[]" },
      { name: "deadline", type: "uint256" },
    ],
    outputs: [],
  },
] as const;

type TradeERC20 = {
  type: "erc20";
  address: Address;
};

type TradeETH = {
  type: "eth";
};

type PermitDetails = {
  token: Address;
  amount: bigint;
  expiration: number;
  nonce: number;
};

type Permit = {
  details: PermitDetails;
  spender: Address;
  sigDeadline: bigint;
};

type PermitDetailsStringAmounts = {
  token: Address;
  amount: string;
  expiration: number;
  nonce: number;
};

type PermitStringAmounts = {
  details: PermitDetailsStringAmounts;
  spender: Address;
  sigDeadline: string;
};

type SignatureWithPermit<TPermit = Permit> = {
  signature: Hex;
  permit: TPermit;
};

function convertBigIntToString(permit: Permit): PermitStringAmounts {
  return {
    ...permit,
    details: {
      ...permit.details,
      amount: `${permit.details.amount}`,
    },
    sigDeadline: `${permit.sigDeadline}`,
  };
}

const PERMIT_SINGLE_TYPES = {
  PermitSingle: [
    { name: "details", type: "PermitDetails" },
    { name: "spender", type: "address" },
    { name: "sigDeadline", type: "uint256" },
  ],
  PermitDetails: [
    { name: "token", type: "address" },
    { name: "amount", type: "uint160" },
    { name: "expiration", type: "uint48" },
    { name: "nonce", type: "uint48" },
  ],
};

type TradeCurrency = TradeERC20 | TradeETH;

export type TradeParameters = {
  sell: TradeCurrency;
  buy: TradeCurrency;
  /** The v4 pool to route through. Read from the coin with `getPoolKey()`. */
  poolKey: PoolKey;
  /** Used to call the on-chain V4Quoter. */
  publicClient: PublicClient;
  amountIn: bigint;
  slippage?: number;
  // can be smart wallet or EOA here.
  sender: Address;
  // needs to be EOA, if signer is blank assumes EOA in sender.
  signer?: Address;
  recipient?: Address;
  signatures?: SignatureWithPermit<PermitStringAmounts>[];
  permitActiveSeconds?: number;
};

type SignPermitTypedData = (params: {
  domain: { name: string; chainId: number; verifyingContract: Address };
  types: typeof PERMIT_SINGLE_TYPES;
  primaryType: "PermitSingle";
  message: Permit;
}) => Promise<Hex>;

/**
 * Resolves the permit2 requirements for a trade quote.
 *
 * For each permit the quote requires, reads the on-chain permit2 nonce and the
 * token's permit2 allowance, signs the permit2 `PermitSingle` typed data with the
 * provided signer, and — when the token's permit2 allowance is insufficient —
 * collects the ERC20 `approve(permit2, max)` call needed before the trade.
 *
 * The approval is returned as a {@link GenericCall} rather than executed, so the
 * caller decides how to run it: `tradeCoin` (EOA) sends it as a prior
 * transaction; `tradeCoinSmartWallet` batches it into the trade's user operation.
 */
async function resolveTradePermits({
  quote,
  owner,
  publicClient,
  signTypedData,
}: {
  quote: QuoteResult;
  owner: Address;
  publicClient: GenericPublicClient;
  signTypedData: SignPermitTypedData;
}): Promise<{
  signatures: SignatureWithPermit<PermitStringAmounts>[];
  approvalCalls: GenericCall[];
}> {
  const signatures: SignatureWithPermit<PermitStringAmounts>[] = [];
  const approvalCalls: GenericCall[] = [];

  if (!quote.permits) {
    return { signatures, approvalCalls };
  }

  for (const permit of quote.permits) {
    // permit2 allowance returns [amount, expiration, nonce]
    const [, , nonce] = await publicClient.readContract({
      abi: permit2ABI,
      address: PERMIT2_ADDRESS,
      functionName: "allowance",
      args: [
        owner,
        permit.permit.details.token as Address,
        permit.permit.spender as Address,
      ],
    });

    const permitToken = permit.permit.details.token as Address;
    const allowance = await publicClient.readContract({
      abi: erc20Abi,
      address: permitToken,
      functionName: "allowance",
      args: [owner, PERMIT2_ADDRESS],
    });

    if (allowance < BigInt(permit.permit.details.amount)) {
      approvalCalls.push({
        to: permitToken,
        data: encodeFunctionData({
          abi: erc20Abi,
          functionName: "approve",
          args: [PERMIT2_ADDRESS, maxUint256],
        }),
        value: 0n,
      });
    }

    const message: Permit = {
      details: {
        token: permit.permit.details.token as Address,
        amount: BigInt(permit.permit.details.amount!),
        expiration: Number(permit.permit.details.expiration!),
        nonce,
      },
      spender: permit.permit.spender as Address,
      sigDeadline: BigInt(permit.permit.sigDeadline!),
    };

    const signature = await signTypedData({
      domain: {
        name: "Permit2",
        chainId: avalanche.id,
        verifyingContract: PERMIT2_ADDRESS,
      },
      primaryType: "PermitSingle",
      types: PERMIT_SINGLE_TYPES,
      message,
    });

    signatures.push({
      signature,
      permit: convertBigIntToString(message),
    });
  }

  return { signatures, approvalCalls };
}

export async function tradeCoin({
  tradeParameters,
  walletClient,
  account,
  publicClient,
  validateTransaction = true,
}: {
  tradeParameters: TradeParameters;
  walletClient: WalletClient;
  account?: Account | Address;
  publicClient: GenericPublicClient;
  validateTransaction?: boolean;
}): Promise<TransactionReceipt> {
  const quote = await createTradeCall(tradeParameters);

  if (!account) {
    account = walletClient.account;
  }
  if (!account) {
    throw new Error("Account is required");
  }
  const resolvedAccount = account;
  const owner =
    typeof resolvedAccount === "string"
      ? resolvedAccount
      : resolvedAccount.address;

  // Set default recipient to wallet sender address if not provided
  if (!tradeParameters.recipient) {
    tradeParameters.recipient = owner;
  }

  const { signatures, approvalCalls } = await resolveTradePermits({
    quote,
    owner,
    publicClient,
    signTypedData: (typedData) =>
      walletClient.signTypedData({ ...typedData, account: resolvedAccount }),
  });

  // EOA path: execute each required permit2 approval as its own transaction
  for (const approvalCall of approvalCalls) {
    const approvalTx = await walletClient.sendTransaction({
      ...approvalCall,
      account: resolvedAccount,
      chain: avalanche,
    });
    await publicClient.waitForTransactionReceipt({ hash: approvalTx });
  }

  const newQuote = await createTradeCall({
    ...tradeParameters,
    signatures,
  });

  const call = {
    to: newQuote.call.target as Address,
    data: newQuote.call.data as Hex,
    value: BigInt(newQuote.call.value),
    chain: avalanche,
    account: resolvedAccount,
  };

  // simulate call
  if (validateTransaction) {
    await publicClient.call(call);
  }

  const gasEstimate = validateTransaction
    ? await publicClient.estimateGas(call)
    : 10_000_000n;
  const gasPrice = await publicClient.getGasPrice();

  const tx = await walletClient.sendTransaction({
    ...call,
    gasPrice,
    gas: gasEstimate,
  });

  const receipt = await publicClient.waitForTransactionReceipt({
    hash: tx,
  });

  return receipt;
}

/**
 * Executes a trade from the caller's smart wallet via a user operation.
 *
 * Mirrors {@link tradeCoin} but routes through a bundler client: the smart
 * account is both the token holder and the permit2 signer (ERC-1271), and any
 * required permit2 approval is batched into the same user operation as the trade
 * (rather than sent as a prior transaction). Returns the settled transaction
 * receipt.
 */
export async function tradeCoinSmartWallet({
  tradeParameters,
  bundlerClient,
  account,
  publicClient,
}: {
  tradeParameters: TradeParameters;
  bundlerClient: BundlerClient;
  account?: SmartAccount;
  publicClient: GenericPublicClient;
}) {
  const resolvedAccount = account ?? bundlerClient.account;
  if (!resolvedAccount) {
    throw new Error("Account is required");
  }

  const owner = resolvedAccount.address;

  // The smart wallet is both the sender (token holder) and the permit signer.
  const params: TradeParameters = {
    ...tradeParameters,
    sender: owner,
    recipient: tradeParameters.recipient ?? owner,
  };

  const quote = await createTradeCall(params);

  const { signatures, approvalCalls } = await resolveTradePermits({
    quote,
    owner,
    publicClient,
    signTypedData: (typedData) => resolvedAccount.signTypedData(typedData),
  });

  const newQuote = await createTradeCall({
    ...params,
    signatures,
  });

  const tradeCall: GenericCall = {
    to: newQuote.call.target as Address,
    data: newQuote.call.data as Hex,
    value: BigInt(newQuote.call.value),
  };

  // Batch any required permit2 approvals + the trade into one user operation
  const calls = toUserOperationCalls([...approvalCalls, tradeCall]);

  const userOp = await prepareUserOperation({
    bundlerClient,
    account: resolvedAccount,
    calls,
  });

  const userOpReceipt = await submitUserOperation({
    bundlerClient,
    account: resolvedAccount,
    userOperation: userOp,
  });

  if (!userOpReceipt.success) {
    throw new Error(
      `User operation reverted${userOpReceipt.reason ? `: ${userOpReceipt.reason}` : ""}`,
    );
  }

  return userOpReceipt.receipt;
}

/**
 * Replaces QuoteResult. Same shape, so downstream code needs no change.
 *
 * `permits` is kept for the token-sell path through Permit2 — the Permit2 machinery
 * above reads exactly this field. Buying with native produces no permits.
 */
export type QuoteResult = {
  success: boolean;
  call: { target: `0x${string}`; data: `0x${string}`; value: string };
  trade: { commands: `0x${string}`; inputs: `0x${string}`[]; value: string };
  quote: { amountOut: string; slippage?: number };
  permits?: { permit: PermitStringAmounts }[];
};

/**
 * Validates the parameters for a trade.
 *
 * Asserts slippage is within bounds and a non-zero input amount is provided.
 * Shared by the quote builder (`createTradeCall`) and the user-operation path so
 * both validate identically before any network request is made.
 */
export function validateTradeParameters(
  tradeParameters: TradeParameters,
): void {
  if (tradeParameters.slippage && tradeParameters.slippage > 1) {
    throw new Error("Slippage must be less than 1, max 0.99");
  }
  if (tradeParameters.amountIn === BigInt(0)) {
    throw new Error("Amount in must be greater than 0");
  }
}

export async function createTradeCall(
  tradeParameters: TradeParameters,
): Promise<QuoteResult> {
  return createQuote(tradeParameters);
}

export async function createQuote(
  tradeParameters: TradeParameters,
): Promise<QuoteResult> {
  validateTradeParameters(tradeParameters);

  const { poolKey, publicClient, amountIn, sell } = tradeParameters;
  const slippage = tradeParameters.slippage ?? 0;

  // Derived from poolKey exactly as the Solidity does:
  //   bool zeroForOne = Currency.unwrap(key.currency0) == currencyIn;
  // Do NOT derive it from sell.type — that only holds for native-paired pools and
  // breaks the moment a coin is paired with USDC or any other token.
  const sellAddress =
    sell.type === "eth"
      ? ("0x0000000000000000000000000000000000000000" as const)
      : sell.address;
  const zeroForOne =
    poolKey.currency0.toLowerCase() === sellAddress.toLowerCase();

  const { amountOut } = await quoteExactInputSingle({
    publicClient,
    poolKey,
    zeroForOne,
    exactAmount: amountIn,
  });

  // slippage is a fraction, e.g. 0.05 = 5%
  const minAmountOut =
    (amountOut * BigInt(Math.round((1 - slippage) * 10_000))) / 10_000n;

  const { commands, inputs } = encodeV4Swap({
    poolKey,
    zeroForOne,
    amountIn,
    minAmountOut,
  });

  const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200);
  const data = encodeFunctionData({
    abi: universalRouterAbi,
    functionName: "execute",
    args: [commands, inputs, deadline],
  });

  // Only attach AVAX when selling native.
  const value = sell.type === "eth" ? amountIn : 0n;

  return {
    success: true,
    call: {
      target: EXTERNAL_43114.universalRouter.address,
      data,
      value: value.toString(),
    },
    trade: { commands, inputs, value: value.toString() },
    quote: { amountOut: amountOut.toString(), slippage },
  };
}
