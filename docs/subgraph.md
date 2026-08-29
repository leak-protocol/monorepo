# Subgraph

Indexes Leak events into five entities. Network name is `avalanche`; it must match the
left-hand side of graph-node's `ethereum` variable or the subgraph will not sync.

## Entities

### `Coin` — mutable

Created from `CoinCreatedV4`, updated by every subsequent event.

```
id  caller  payoutRecipient  platformReferrer  currency  uri  name  symbol
version  poolKeyHash  currency0  currency1  fee  tickSpacing  hooks
coinIsToken0  decimals  totalSupply  holderCount  swapCount  volumeCurrency
lastPrice  lastSqrtPriceX96  createdAt  createdAtBlock  createdTx
swaps  holders  candles  rewardPayouts
```

`coinIsToken0` matters more than it looks. Uniswap orders pool tokens by address, so
whether the coin is `currency0` or `currency1` is effectively random per coin, and it
inverts the meaning of a price. Every price computation in the mappings branches on it.

### `Swap` — immutable

One row per swap.

```
id  coin  sender  trader  isTrustedSwapSender  isCoinBuy  zeroForOne
amountSpecified  coinAmount  currencyAmount  amount0  amount1
sqrtPriceX96  priceInCurrency  timestamp  blockNumber  txHash  logIndex
```

`sender` is the contract that called the pool — usually a router. `trader` is the person.
They differ on every routed swap, and attributing volume to `sender` would credit the
router for everything.

### `Candle` — mutable

OHLCV, bucketed. `id` is `<coin>-<interval>-<periodStart>`.

```
id  coin  interval  periodStart  open  high  low  close  volumeCurrency  swapCount
```

### `Holder` — mutable

Balance per (coin, owner), maintained from `CoinTransfer`.

```
id  coin  owner  balance  updatedAt
```

### `RewardPayout` — immutable

One row per fee distribution, from `CoinMarketRewardsV4`.

```
id  coin  currency  role  recipient  amountCurrency  amountCoin
timestamp  blockNumber  txHash  logIndex
```

`role` distinguishes creator, platform referrer, trade referrer, protocol and curve owner
— the six-way split described in [`fees.md`](fees.md).

## Handlers

| Event | Handler | Source |
|---|---|---|
| `CoinCreatedV4` | `handleCoinCreatedV4` | factory |
| `Swapped` | `handleSwapped` | hook |
| `CoinMarketRewardsV4` | `handleCoinMarketRewardsV4` | hook |
| `CoinTransfer` | `handleCoinTransfer` | per-coin template |

`handleCoinCreatedV4` spawns a **dynamic data source** for each new coin, so transfers on
a coin that did not exist when the subgraph was deployed are still indexed. That is why
there is no hardcoded list of coins anywhere.

## Example queries

Newest coins:

```graphql
{
  coins(first: 20, orderBy: createdAt, orderDirection: desc) {
    id name symbol uri totalSupply holderCount swapCount volumeCurrency lastPrice
  }
}
```

Recent trades for one coin:

```graphql
{
  swaps(
    where: { coin: "0x…" }
    first: 50
    orderBy: timestamp
    orderDirection: desc
  ) {
    trader isCoinBuy coinAmount currencyAmount priceInCurrency timestamp txHash
  }
}
```

Hourly candles:

```graphql
{
  candles(
    where: { coin: "0x…", interval: "1h" }
    orderBy: periodStart
    orderDirection: desc
    first: 168
  ) {
    periodStart open high low close volumeCurrency swapCount
  }
}
```

Top holders:

```graphql
{
  holders(
    where: { coin: "0x…", balance_gt: "0" }
    orderBy: balance
    orderDirection: desc
    first: 100
  ) { owner balance updatedAt }
}
```

Creator earnings:

```graphql
{
  rewardPayouts(
    where: { recipient: "0x…", role: "CREATOR" }
    orderBy: timestamp
    orderDirection: desc
  ) { coin { symbol } amountCurrency timestamp }
}
```

## Building and deploying

```bash
pnpm --filter @leak/subgraph run codegen   # sync ABIs, render manifest, graph codegen
pnpm --filter @leak/subgraph run test      # matchstick
pnpm --filter @leak/subgraph run build     # compiles the mappings
```

`build` renders the manifest with `--allow-unset`, so it works before anything is deployed.
`build:deploy` is the strict variant and refuses to run without real addresses — that is
the one the docker entrypoint uses.

The `subgraph.yaml` committed here has `address: 0x000…0` and `startBlock: 0`. Deploying it
unmodified indexes nothing. `scripts/render-manifest.mjs` fills in the real values from
`LEAK_FACTORY`, `LEAK_COIN_HOOK` and `LEAK_START_BLOCK`.

Locally, the `indexing` docker profile does all of this. See [`development.md`](development.md).
