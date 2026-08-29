# SDK

Two packages. Pick the smaller one unless you need the read layer.

| | `@leak/sdk-lite` | `@leak/sdk` |
|---|---|---|
| Builds calldata | yes | yes |
| Reads chain state | yes, via your `PublicClient` | yes |
| Needs a backend | **no** | yes, for the read layer |
| Subgraph queries | no | yes |
| API client | no | yes |

`@leak/sdk` re-exports everything `@leak/sdk-lite` exports, so migrating up is an import
change and nothing else. A test in the repository pins that property: all 45 lite exports
must be present in the full package.

## Install

```bash
pnpm add @leak/sdk-lite viem
```

## Creating a coin

```ts
import { createPublicClient, http } from "viem";
import { avalanche } from "viem/chains";
import { createCoinCall, encodeCurve, LEAK_MEME } from "@leak/sdk-lite";

const publicClient = createPublicClient({
  chain: avalanche,
  transport: http("https://api.avax.network/ext/bc/C/rpc"),
});

const NATIVE = "0x0000000000000000000000000000000000000000";

const { calls, predictedCoinAddress } = await createCoinCall({
  creator: account,
  sender: account,          // must be the address that SENDS the transaction
  factory: LEAK_FACTORY,
  poolConfig: encodeCurve(LEAK_MEME, NATIVE),
  name: "Test Coin",
  symbol: "TEST",
  metadata: { type: "RAW_URI", uri: "ipfs://bafy…" },
  publicClient,
});

const hash = await walletClient.sendTransaction(calls[0]);
```

**`sender` must be the transaction sender, not the creator.** `LeakFactoryImpl` derives
the CREATE2 salt from `msg.sender`, so passing a different address gives you a
`predictedCoinAddress` that will not match what is deployed. If the two roles differ in
your application, `sender` is the one that matters.

`calls` is an array because a create can require an approval first. Send them in order.

## Quoting and trading

```ts
import { createQuote } from "@leak/sdk-lite";

const quote = await createQuote({
  poolKey,
  sell: { type: "eth" },
  buy: { type: "erc20", address: coin },
  amountIn: 10n ** 18n,      // 1 AVAX
  slippage: 0.05,            // 5%
  sender: account,
  recipient: account,
  publicClient,
});

const hash = await walletClient.sendTransaction({
  to: quote.call.target,
  data: quote.call.data,
  value: BigInt(quote.call.value),
});
```

Selling is the same call with `sell` and `buy` swapped. Leak pools always pair against
native AVAX, so one side is always `{ type: "eth" }`.

**Slippage of 5% is a sensible default on a fresh pool.** Early liquidity is thin by
design; tighter tolerances make the first trades revert.

## Quoting without building a transaction

```ts
import { quoteExactInputSingle } from "@leak/sdk-lite";

const amountOut = await quoteExactInputSingle({
  poolKey,
  zeroForOne: true,
  exactAmount: 10n ** 18n,
  publicClient,
});
```

This calls the v4 Quoter directly. Use it for display; use `createQuote` when you intend
to send.

## Curve presets

```ts
import { encodeCurve, LEAK_MEME, LEAK_STABLE } from "@leak/sdk-lite";

encodeCurve(LEAK_MEME, NATIVE);    // wide band, 244× range
encodeCurve(LEAK_STABLE, NATIVE);  // three stacked bands, 8.2× range
```

See [`curves.md`](curves.md) for what the parameters mean and how to build your own.

## Reading created coins from logs

The factory emits `CoinCreatedV4` with everything a listing needs — coin address, name,
symbol, uri, and the full `poolKey`. No indexer is required to build a list view:

```ts
const logs = await publicClient.getLogs({
  address: LEAK_FACTORY,
  event: coinCreatedV4Event,
  fromBlock: FACTORY_DEPLOY_BLOCK,   // never 0 — mainnet is tens of millions of blocks
  toBlock: "latest",
});
```

The first three parameters (`caller`, `payoutRecipient`, `platformReferrer`) are indexed.
Indexed position determines the log topic, so an ABI with them in the wrong order returns
an empty result rather than an error.

## One sharp edge

`validateClientNetwork` — called internally by the high-level `createCoin`, `tradeCoin`,
`updateCoinURI` and `updatePayoutRecipient` helpers — hardcodes Base chain IDs and throws
on `43114`.

Use the `…Call` variants (`createCoinCall`, `createTradeCall`, `updateCoinURICall`,
`updatePayoutRecipientCall`) and send the transaction yourself. They build the same
calldata without the network assertion. Every example in this document uses them.
