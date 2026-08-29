import type { Config } from "wagmi";
import {
  getPublicClient as wagmiGetPublicClient,
  getWalletClient as wagmiGetWalletClient,
  sendTransaction as wagmiSendTransaction,
  waitForTransactionReceipt as wagmiWaitForReceipt,
} from "wagmi/actions";
import {
  createCoinCall as sdkCreateCoinCall,
  createQuote as sdkCreateQuote,
} from "@leak/sdk-lite";
import type { PoolKey } from "@leak/sdk-lite";
import type { WebConfig } from "./config";
import {
  coinCreatedV4Event,
  toCoinRow,
  sortNewestFirst,
  type CoinRow,
} from "./coinEvents";
import { applySlippage, buildTradeParameters, type TradeSide } from "./trade";

/**
 * Every outbound call — chain or SDK — goes through this object. Tests inject a double,
 * so they need no chain, and the double is typed from the real signatures rather than
 * written from memory.
 */
export type ActionDeps = {
  getPublicClient: typeof wagmiGetPublicClient;
  getWalletClient: typeof wagmiGetWalletClient;
  sendTransaction: typeof wagmiSendTransaction;
  waitForTransactionReceipt: typeof wagmiWaitForReceipt;
  createCoinCall: typeof sdkCreateCoinCall;
  createQuote: typeof sdkCreateQuote;
};

const defaultDeps: ActionDeps = {
  getPublicClient: wagmiGetPublicClient,
  getWalletClient: wagmiGetWalletClient,
  sendTransaction: wagmiSendTransaction,
  waitForTransactionReceipt: wagmiWaitForReceipt,
  createCoinCall: sdkCreateCoinCall,
  createQuote: sdkCreateQuote,
};

export type CreateCoinInput = {
  name: string;
  symbol: string;
  uri: string;
  poolConfig: `0x${string}`;
};

export type TradeInput = {
  side: TradeSide;
  poolKey: PoolKey;
  coin: `0x${string}`;
  amountIn: bigint;
  slippage: number;
};

export type QuoteResult = { amountOut: bigint; minAmountOut: bigint };

export type LeakActions = {
  createCoin(
    input: CreateCoinInput,
  ): Promise<{ coin: `0x${string}`; hash: `0x${string}` }>;
  /** Preview only; sends no transaction. */
  quote(input: TradeInput): Promise<QuoteResult>;
  trade(input: TradeInput): Promise<{ hash: `0x${string}`; amountOut: bigint }>;
  listCoins(): Promise<CoinRow[]>;
};

export function createLeakActions(
  wagmi: Config,
  web: WebConfig,
  deps: ActionDeps = defaultDeps,
): LeakActions {
  async function requireWallet() {
    const wallet = await deps.getWalletClient(wagmi);
    if (!wallet?.account?.address) {
      throw new Error(
        "No wallet connected. Connect MetaMask before sending a transaction.",
      );
    }
    return wallet.account.address as `0x${string}`;
  }

  return {
    async createCoin(input) {
      const sender = await requireWallet();
      const publicClient = deps.getPublicClient(wagmi);

      // `sender` must be whoever SENDS the transaction: LeakFactoryImpl.deploy derives
      // its salt from msg.sender, so passing the creator here predicts the wrong address.
      const { calls, predictedCoinAddress } = await deps.createCoinCall({
        creator: sender,
        sender,
        factory: web.factory,
        poolConfig: input.poolConfig,
        name: input.name,
        symbol: input.symbol,
        metadata: { type: "RAW_URI", uri: input.uri },
        publicClient,
        skipMetadataValidation: true,
      } as never);

      const call = calls[0]!;
      const hash = await deps.sendTransaction(wagmi, {
        to: call.to,
        data: call.data,
        value: call.value,
      } as never);
      await deps.waitForTransactionReceipt(wagmi, { hash } as never);
      return {
        coin: predictedCoinAddress as `0x${string}`,
        hash: hash as `0x${string}`,
      };
    },

    async quote(input) {
      const sender = await requireWallet();
      const publicClient = deps.getPublicClient(wagmi);
      const params = buildTradeParameters({ ...input, sender });
      const q = await deps.createQuote({ ...params, publicClient } as never);
      const amountOut = BigInt(q.quote.amountOut);
      return {
        amountOut,
        minAmountOut: applySlippage(amountOut, input.slippage),
      };
    },

    async trade(input) {
      const sender = await requireWallet();
      const publicClient = deps.getPublicClient(wagmi);

      const params = buildTradeParameters({ ...input, sender });
      const quote = await deps.createQuote({
        ...params,
        publicClient,
      } as never);

      const hash = await deps.sendTransaction(wagmi, {
        to: quote.call.target as `0x${string}`,
        data: quote.call.data as `0x${string}`,
        value: BigInt(quote.call.value),
      } as never);
      await deps.waitForTransactionReceipt(wagmi, { hash } as never);
      return {
        hash: hash as `0x${string}`,
        amountOut: BigInt(quote.quote.amountOut),
      };
    },

    async listCoins() {
      const publicClient = deps.getPublicClient(wagmi);
      // Scan from the factory's deployment block. Starting at 0 on a mainnet fork is
      // tens of millions of blocks, which every RPC refuses.
      const logs = await (
        publicClient as never as {
          getLogs: (a: unknown) => Promise<unknown[]>;
        }
      ).getLogs({
        address: web.factory,
        event: coinCreatedV4Event,
        fromBlock: web.factoryDeployBlock,
        toBlock: "latest",
      });
      return sortNewestFirst(logs.map((l) => toCoinRow(l as never)));
    },
  };
}
