# Curves

The curve is the product decision. Everything else in the protocol is fixed; this is the
knob.

## What `poolConfig` actually contains

`createCoin` takes the curve as `bytes poolConfig`. Decoded, it is four parallel arrays —
one entry per position:

| Field | Type | Meaning |
|---|---|---|
| `tickLower` | `int24` | lower bound of the band |
| `tickUpper` | `int24` | upper bound of the band |
| `numDiscoveryPositions` | `uint16` | how many sub-positions to spread across the band |
| `maxDiscoverySupplyShare` | `uint256` | fraction of total supply placed in this band, `1e18` = 100% |

Whatever supply is not claimed by a discovery band becomes the **tail position** — a
single wide position above the bands that catches price once discovery is exhausted.

Because ticks are logarithmic, a band is a *price ratio*, not a price. Tick `-196_000` to
`-140_800` is the same ratio wherever the pool starts.

## The one rule that matters

> **Liquidity density = share of supply ÷ tick width.**

Everything about price impact follows from this.

Position count does **not** change depth. `numDiscoveryPositions` controls how smoothly
the liquidity is stepped across the band and therefore gas cost — eleven positions cost
more gas than three and produce a less jagged chart, but a buyer spending 1 AVAX moves the
price by the same amount either way.

This is worth internalising because it is the most common mistake: adding positions to
"make the curve deeper" does nothing.

## `LEAK_MEME`

One wide band, thin liquidity.

```
tickLower[0]               = -196_000
tickUpper[0]               = -140_800     → 55,200 ticks wide
numDiscoveryPositions[0]   = 11
maxDiscoverySupplyShare[0] = 0.05e18      → 5% of supply
```

5% of supply across 55,200 ticks is very thin. Measured on a fork: **the first 1 AVAX
moves the price 7,486 ticks**. Over the band, FDV runs 3.08 → 768 AVAX, a **244×**
multiple.

Use it when the point is that early entrants are rewarded and the chart is supposed to be
violent.

## `LEAK_STABLE`

Three overlapping bands, each narrower and denser than the last.

```
band 0:  -161_200 → -147_200   (14,000 ticks)   5%    of supply
band 1:  -149_200 → -140_200   ( 9,000 ticks)   12.5% of supply
band 2:  -143_200 → -140_200   ( 3,000 ticks)   20%   of supply
```

Note the overlaps: bands 0 and 1 share ticks `-149_200 … -147_200`, bands 1 and 2 share
`-143_200 … -140_200`. Where they overlap, densities add. The result is a curve that gets
progressively harder to push as price rises.

Measured: **the first 1 AVAX moves the price 223 ticks** — 33.6× less than `LEAK_MEME`.
FDV runs 99.9 → 816 AVAX, an **8.2×** multiple.

Use it when the asset has a reference price and a 244× swing would be nonsense.

## Designing a third preset

Work backwards from the two numbers a product person actually has: **starting FDV** and
**the multiple you want**.

1. **Multiple fixes the band width.** The ratio between `tickUpper` and `tickLower` is
   `1.0001^(tickUpper - tickLower)`. A 10× multiple is about 23,000 ticks wide; 100× is
   about 46,000.
2. **Starting FDV fixes where the band sits.** Shift both bounds together; width is
   unchanged, so the multiple is unchanged.
3. **Supply share fixes the impact.** With width already decided, the share is the only
   remaining lever on how much 1 AVAX moves the price.
4. **Stack bands if you want increasing resistance.** Overlapping narrower bands with
   larger shares, as `LEAK_STABLE` does, makes each successive price level harder to
   reach.

Ticks must be multiples of the pool's `tickSpacing` (200). Both presets use round
hundreds for this reason.

## Verifying before you deploy

`tools/curve/` recomputes tick ranges and the liquidity ladder in Python, independently of
the Solidity:

```bash
python3 tools/curve/build_ladder.py --help
python3 tools/curve/walk_curve.py --help
```

Use it as a differential check: if the Python and the Solidity disagree about where a
band lands, one of them is wrong and you want to know which before mainnet.

## Using a preset from the SDK

```ts
import { encodeCurve, LEAK_MEME } from "@leak/sdk-lite";

const NATIVE = "0x0000000000000000000000000000000000000000";
const poolConfig = encodeCurve(LEAK_MEME, NATIVE);
```

`poolConfig` is then passed straight to `createCoinCall`. See [`sdk.md`](sdk.md).
