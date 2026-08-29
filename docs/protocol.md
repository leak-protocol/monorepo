# The protocol

Every number here was measured on an Avalanche C-Chain fork at block `93821000`. None
of them are estimates.

## The life of a coin

```
createCoin(name, symbol, uri, poolConfig)
  │
  ├─ deploy an ERC20 clone           entire supply minted at once, 1 billion tokens
  ├─ mint 100% of supply to the hook
  ├─ initialise a Uniswap v4 pool    coin/AVAX pair, hook bound into the poolKey
  └─ place SINGLE-SIDED liquidity    coin only, no AVAX
        │
        └─► trading is open in the SAME transaction
```

There is no graduation step. The `poolId` minted at creation is the `poolId` forever —
no market-cap threshold, no migration to another DEX, and no path for anyone to withdraw
the liquidity.

The pool starts holding **no AVAX at all**. The first AVAX in the pool belongs to the
first buyer. That is why no seed capital is needed: the creator is not providing one side
of a pair, they are providing the entire supply on one side and letting the market bring
the other.

## Single-sided liquidity, concretely

A normal AMM position needs both assets. Here the hook places the coin across a band of
Uniswap v4 ticks *below* the current price, so every position is pure coin. A buyer
walking up the band converts AVAX into coin tick by tick; the AVAX they pay stays in the
pool as the other side.

Two consequences worth stating plainly:

- **The price only discovers upward at first.** Until someone sells, there is no coin
  above the current tick to buy back into.
- **Liquidity cannot be rugged.** There is no `decreaseLiquidity` path exposed to the
  creator. The positions belong to the hook.

## The curve is data, not code

The curve shape is passed in as `bytes poolConfig` — an array of positions, each one
`(tickLower, tickUpper, numDiscoveryPositions, maxDiscoverySupplyShare)`. Changing the
product means changing parameters, not deploying a new contract.

Two presets ship in the repository:

| Preset | FDV range | Multiple | First AVAX moves | For |
|---|---|---|---|---|
| `LEAK_MEME` | 3.08 → 768 AVAX | 244× | 7,486 ticks | Memes, rewarding early entrants |
| `LEAK_STABLE` | 99.9 → 816 AVAX | 8.2× | 223 ticks | Assets with a reference price |

A **33.6×** difference in price impact between them. See [`curves.md`](curves.md) for how
that falls out of the parameters and how to design a third.

## Fees: 1% per trade

| Recipient | % of volume | Constant |
|---|---|---|
| Coin creator | 0.50% | `CREATOR_REWARD_BPS = 6250` |
| Compounded back into LP | 0.20% | `LP_REWARD_BPS = 2000` |
| Platform referrer | 0.20% | `CREATE_REFERRAL_REWARD_BPS = 2500` |
| Protocol | 0.05% | remainder |
| Trade referrer | 0.04% | `TRADE_REFERRAL_REWARD_BPS = 500` |
| Curve owner | 0.01% | `DOPPLER_REWARD_BPS = 125` |

Uniswap takes **nothing**: `protocolFeeController()` on the Avalanche PoolManager
(`0x06380C0e0912312B5150364B9DC4542BA0DbBc85`) returns `address(0)`.

Full detail, including what happens when a referrer is not declared, in
[`fees.md`](fees.md).

## Snipers are priced out, not locked out

The swap fee starts at **99%** (`LAUNCH_FEE_START = 990_000`) and decays linearly to 1%
over the first **10 seconds** (`LAUNCH_FEE_DURATION = 10 seconds`).

This is deliberately not a trading lock. The pool never closes; someone who wants to buy
in the first second still can — they just pay 99% for the privilege. And that penalty
**flows back into the pool** rather than vanishing, so later buyers are the ones who
benefit from an early sniper.

## On-chain architecture

```
LeakFactory (proxy)
    │ deploys
    ├─► ERC20 clone (ContentCoin | TrendCoin)
    └─► Uniswap v4 pool with the hook already bound
              │
              ▼
       LeakCoinHook  ── beforeSwap: compute the time-decayed fee
              │       ── afterSwap: split fees, compound the LP share
              ├─► LeakHookRegistry        validates the hook, called on every swap
              ├─► TrustedMsgSenderLookup  identifies trusted routers
              ├─► LeakLimitOrderBook      fills limit orders during a swap
              └─► ProtocolRewards         where claimable fees accumulate
```

The hook address is **mined with CREATE2**. Uniswap v4 encodes a hook's permission flags
in the low bits of its own address, so the hook must be deployed to an address matching an
exact bit pattern. That salt lives in `packages/coins-deployments/addresses/`.

## How this differs from a classic bonding curve

| | Typical bonding curve | Leak |
|---|---|---|
| Initial liquidity | needs seed capital | none — coin only |
| On reaching a threshold | graduates to a DEX | no threshold, no graduation |
| Pricing | bespoke formula | Uniswap v4 ticks, reusing the whole stack |
| Withdrawing liquidity | usually possible | no path exists |
| Curve shape | hardcoded in the contract | a `bytes` parameter |

Reusing v4 ticks is the load-bearing choice: routers, quoters, position managers and
analytics that already understand Uniswap understand these pools too.

## Known limits

- **The quote asset is native AVAX**, not a separate ERC-20. Code paths that assume "a
  backing token distinct from native" — such as the hook that buys supply through a
  Uniswap v3 hop — cannot work and are not deployed.
- **Not deployed to mainnet.** `packages/coins-deployments/addresses/43114.json` is still
  empty.
- **`PROTOCOL_REWARDS` has no code on Avalanche.** Deployment succeeds, but the reward
  withdrawal path will fail at runtime until that is resolved.
- The contracts have **not been independently audited** in their current form.
