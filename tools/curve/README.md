# Curve tooling

Reimplements the Uniswap v4 liquidity-ladder construction in Python, so a curve can be
inspected without deploying a contract.

- `build_ladder.py` — decodes `poolConfig` bytes, runs the `setupPool` and position
  calculations, and prints the resulting positions. Writes `positions.json`.
- `walk_curve.py` — walks a simulated buyer along the ladder and reports how far a given
  amount of AVAX moves the price.

Use it as a **differential check** against the Solidity. If the Python and the contracts
disagree about where a band lands or how much a trade moves the price, one of them is
wrong — and it is much cheaper to find out here than on mainnet.

Every curve number in [`../../docs/curves.md`](../../docs/curves.md) was reproduced with
these scripts and cross-checked against a fork.

```bash
python3 build_ladder.py --help
python3 walk_curve.py --help
```
