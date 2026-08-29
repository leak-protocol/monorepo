# Fees and rewards

## 1% per trade, split six ways

Every swap through a Leak pool pays a 1% fee. The hook splits it in `afterSwap`:

| Recipient | % of volume | Constant in `CoinConstants.sol` |
|---|---|---|
| Coin creator | 0.50% | `CREATOR_REWARD_BPS = 6250` |
| Compounded back into LP | 0.20% | `LP_REWARD_BPS = 2000` |
| Platform referrer | 0.20% | `CREATE_REFERRAL_REWARD_BPS = 2500` |
| Protocol | 0.05% | the remainder |
| Trade referrer | 0.04% | `TRADE_REFERRAL_REWARD_BPS = 500` |
| Curve owner | 0.01% | `DOPPLER_REWARD_BPS = 125` |

The basis-point constants are shares *of the 1%*, not of volume — `6250` bps of the fee is
62.5% of it, which is 0.50% of volume.

Uniswap itself takes nothing. `protocolFeeController()` on the Avalanche PoolManager
returns `address(0)`, verified with `eth_getCode`.

## Undeclared referrers

Both referrer slots are optional arguments:

- **Platform referrer** is set once, at coin creation, and is immutable afterwards.
- **Trade referrer** is passed per swap and can differ every trade.

When a slot is left empty, that share rolls into the protocol's cut rather than being
skipped. A coin created with no platform referrer and traded with no trade referrer pays
the same 1% — the protocol simply receives 0.29% instead of 0.05%.

## The LP share is compounded, not paid out

The 0.20% marked "compounded back into LP" is not sent anywhere. The hook adds it to the
pool's own liquidity, which deepens the book for everyone still holding. It is the one
slice of the fee that nobody withdraws.

## Launch fee: 99% decaying to 1%

```
LAUNCH_FEE_START    = 990_000     // 99%, in hundredths of a bip
LAUNCH_FEE_DURATION = 10 seconds
```

For the first ten seconds after a coin is created, the swap fee starts at 99% and decays
linearly to the standard 1%.

Three things follow, and they are the point of the design:

1. **The pool is never closed.** Anyone can buy in the first second. It is a price, not a
   permission.
2. **The penalty is not burned.** It flows through the same split as any other fee, and
   the LP share compounds into the pool — so a sniper's haste subsidises later buyers.
3. **It degrades gracefully.** There is no cliff at second ten, no state transition, no
   function anyone has to remember to call.

Contrast with a trading lock, which needs someone to unlock it, creates a scramble at the
unlock instant, and hands the deployer a switch worth abusing.

## Claiming

Fees accumulate in `ProtocolRewards`, keyed by recipient. They are pull-based: nothing is
pushed to an address during a swap, which keeps swap gas bounded and avoids a hostile
recipient contract being able to revert someone else's trade.

> **Not usable on Avalanche yet.** `PROTOCOL_REWARDS` has no code at the configured
> address on Avalanche C-Chain. Deployment succeeds and fees are accounted correctly, but
> the withdrawal path will revert until a `ProtocolRewards` instance is deployed and wired
> in. This is tracked as a blocker for mainnet.

## Revenue, from a creator's point of view

A coin doing 100 AVAX of daily volume produces:

| | AVAX/day |
|---|---|
| Creator | 0.50 |
| Into LP depth | 0.20 |
| Platform referrer | 0.20 |
| Protocol | 0.05 |
| Trade referrer | 0.04 |
| Curve owner | 0.01 |

The creator share is the largest single slice by a factor of two and a half, and it is
attached to the coin, not to who is trading it.
