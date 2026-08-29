# Architecture

Five layers. Each one reads the layer below and knows nothing about the layer above.

```
                      ┌──────────────┐
                      │  apps/web    │  React 19 + wagmi
                      └──────┬───────┘
                             │
              ┌──────────────┴──────────────┐
              ▼                             ▼
      ┌───────────────┐            ┌────────────────┐
      │ @leak/sdk-lite│            │   apps/api     │  Hono + Postgres
      │  build calldata│           │  metadata, JWT │
      └───────┬───────┘            └────────┬───────┘
              │                             │
              │                    ┌────────▼───────┐
              │                    │ apps/subgraph  │  graph-node
              │                    └────────┬───────┘
              ▼                             ▼
      ┌────────────────────────────────────────────┐
      │        Avalanche C-Chain                    │
      │  LeakFactory · LeakCoinHook · Uniswap v4    │
      └────────────────────────────────────────────┘
```

`@leak/sdk` sits on top of `@leak/sdk-lite` and adds the read layer (subgraph client plus
a generated API client). A consumer picks one; see [`sdk.md`](sdk.md).

## What each layer owns

**`packages/coins`** — the protocol. Factory, coin implementations, the v4 hook, the curve
encoding. Everything else is derived from what this emits.

**`packages/leak-sdk-lite`** — turns intent into calldata, locally. It reads chain state
through a viem `PublicClient` and never calls a backend. That property is the reason it
exists: an integrator can build a transaction with nothing but an RPC URL.

**`apps/subgraph`** — indexes events into five entities. It is the only component that
maintains history; the chain has state, the subgraph has the story of how it got there.

**`apps/api`** — the things a subgraph structurally cannot do: pin metadata to IPFS, issue
upload JWTs, hold API keys, serve profiles.

**`apps/web`** — three screens. It reads `CoinCreatedV4` logs directly rather than going
through the subgraph, because the event carries everything a list view needs and that
removes an entire dependency from the critical path.

## Where the layers drift, and what stops it

A protocol split across Solidity, AssemblyScript and TypeScript has three seams where a
change on one side silently breaks the other. Each has a mechanical guard.

**Solidity → subgraph.** The subgraph's ABIs are copied from forge build artifacts by
`apps/subgraph/scripts/sync-abis.mjs` rather than hand-maintained. Change an event, rebuild
the contracts, and codegen fails loudly instead of the handler silently reading a garbage
field.

**Solidity → SDK.** ABIs come from `wagmiGenerated.ts`, produced by `@wagmi/cli` from the
same artifacts. `@leak/sdk-lite` bundles the three ABIs it uses at build time, so a
published SDK cannot resolve a different contract version than it was built against.

**Deployed addresses → subgraph manifest.** `subgraph.yaml` in the repository is a rendered
template with `address: 0x000…0` and `startBlock: 0`, valid only for codegen and tests.
`scripts/render-manifest.mjs` fills in real addresses at deploy time. Deploying the
committed manifest indexes nothing — which is why the docker entrypoint renders first and
refuses to proceed without addresses.

**Event shape → web.** `apps/web/src/lib/coinEvents.ts` declares the `CoinCreatedV4` ABI
event copied verbatim from `ILeakFactory.sol`, including which three parameters are
indexed. Indexed position determines the log topic, so getting it wrong returns an empty
result set rather than an error — the test pins the shape.

## Runtime configuration

The web app reads `/runtime/config.json` when the page loads, rather than having values
baked in at build time:

```json
{
  "chainId": 43114,
  "rpcUrl": "https://api.avax.network/ext/bc/C/rpc",
  "factory": "0x…",
  "factoryDeployBlock": "93821000",
  "apiUrl": "http://127.0.0.1:8787"
}
```

Vite inlines environment variables at build time, but the factory address changes every
time the local stack is rebuilt. One image, many environments, requires runtime config.

`factoryDeployBlock` is the lower bound for the `CoinCreatedV4` log scan. Scanning from
block zero on mainnet is tens of millions of blocks and every RPC provider refuses it.

## Test strategy

| Layer | Approach |
|---|---|
| `packages/coins` | Foundry against a pinned Avalanche fork — real PoolManager, real WAVAX |
| `packages/leak-sdk-lite` | vitest; calldata assertions offline, chain interaction against anvil |
| `apps/subgraph` | matchstick, handlers driven with synthesised events |
| `apps/api` | vitest against a real Postgres, not a mock |
| `apps/web` | vitest + Testing Library; every outbound call goes through an injected `ActionDeps` |

The fork is pinned to block `93821000` everywhere. Contracts, SDK and the local docker
stack all see the same chain state, so a discrepancy between layers is a real
disagreement rather than two different snapshots.
