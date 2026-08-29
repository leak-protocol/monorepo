# Leak

Asset tokenization launchpad on Avalanche C-Chain.

Anyone can call one function to deploy an ERC20 whose entire circulating supply is
already placed as single-sided liquidity in **one** Uniswap v4 pool. Trading opens in
that same transaction. No graduation step, no seed capital, no way to pull the liquidity.

> **Not deployed to mainnet.** No real funds are at risk. Contracts have not been
> independently audited in their current form.

## How this differs from a classic bonding curve

| | |
|---|---|
| **No graduation** | The `poolId` minted at creation is the `poolId` forever. No market-cap threshold, no migration to another DEX |
| **No seed capital** | The pool holds only the coin; there is no AVAX in it until the first buyer |
| **The curve is data** | Shape is passed in as `bytes poolConfig`. Changing the product means changing parameters, not deploying a new contract |

## Layout

```
packages/
  coins/                Solidity: hook, factory, coin, curves       [vendored + 3 edited files]
  limit-orders/         limit order book                            [vendored]
  coins-deployments/    deployment sequence                         [vendored]
  shared-contracts/     shared interfaces                           [vendored]
  leak-sdk-lite/        contract-only SDK, builds calldata locally
  leak-sdk/             sdk-lite plus the read layer (subgraph, api)
apps/
  subgraph/             indexes events, one dynamic data source per coin
  api/                  Hono + Postgres: metadata, explore, upload JWT
  web/                  React 19 + wagmi: list, create, trade
docker/                 compose with three profiles, four images built here
docs/                   protocol, deployment
tools/curve/            Python: recompute tick ranges and the liquidity ladder,
                        as an independent cross-check against the Solidity
```

## Running it

```bash
corepack enable && corepack prepare pnpm@9.0.0 --activate
pnpm install

pnpm run lint        #  4s
pnpm run typecheck   # 16s
pnpm run build       # 42s
pnpm run test:js     # 32s — 224 tests
pnpm run test:sol    # ~47 min, Avalanche fork
```

The whole MVP in one command:

```bash
cp docker/.env.example docker/.env
docker compose -f docker/compose.yml --profile all up --build
```

Then open <http://127.0.0.1:5173>. The `all` profile forks Avalanche at block
`93821000` with anvil, deploys the real contracts onto it, renders the subgraph against
those freshly deployed addresses, and runs web, api and graph-node.

## Status

| Module | Tests | Notes |
|---|---|---|
| `packages/coins` | 244/246 | 2 red: a regression from the rename pass |
| `packages/leak-sdk-lite` | 40 | 5 skipped — they need a paid archive RPC |
| `packages/leak-sdk` | 13 | |
| `apps/api` | 57 | |
| `apps/subgraph` | 24 | matchstick |
| `apps/web` | 90 | |
| `docker` | 4 profiles parse | **never actually brought up** |
| CI | 4 jobs | **never run** — the repo had no remote |

## The two curve presets

Measured on an Avalanche fork. Not estimates.

| Preset | FDV range | Multiple | First AVAX moves | For |
|---|---|---|---|---|
| `LEAK_MEME` | 3.08 → 768 AVAX | 244× | 7,486 ticks | Memes, rewarding early entrants |
| `LEAK_STABLE` | 99.9 → 816 AVAX | 8.2× | 223 ticks | Assets with a reference price |

A **33.6×** difference in price impact. The rule: liquidity density = share of supply ÷
tick width. Position count only affects smoothness and gas, never depth.

## 1% per trade

| Recipient | % of volume |
|---|---|
| Coin creator | 0.50% |
| Compounded back into LP | 0.20% |
| Platform referrer | 0.20% |
| Protocol | 0.05% |
| Trade referrer | 0.04% |
| Curve owner | 0.01% |

Uniswap takes **nothing** — `protocolFeeController()` on the Avalanche PoolManager is
`address(0)`.

The fee starts at **99%** and decays linearly to 1% over the first 10 seconds. Snipers
are priced out rather than locked out, and the penalty flows back into the pool instead
of disappearing.

## How work is done here

**Conclusions need evidence.** Any claim about contract behaviour, an address, or a
function signature must point at a `file:line` or a command you can run — never at
memory. This rule exists because one plan written from memory contained five errors.

The evidence ledger, technical debt log, detailed implementation plans, and the
contributor guide are **internal documents** and are not part of this repository.

## Documentation

| | |
|---|---|
| [`docs/protocol.md`](docs/protocol.md) | curves, fees, the life of a coin |
| [`docs/deploy.md`](docs/deploy.md) | deployment order, runtime configuration |
| [`docker/README.md`](docker/README.md) | the three profiles and how they stack |
