# Documentation

## Start here

| | |
|---|---|
| [`litepaper.md`](litepaper.md) | What Leak Protocol is, why it exists, and how the two layers fit together. The specification the rest of these documents implement. |

## The protocol

| | |
|---|---|
| [`protocol.md`](protocol.md) | The life of a coin, single-sided liquidity, on-chain architecture |
| [`curves.md`](curves.md) | How `poolConfig` encodes a curve, the presets, designing your own |
| [`fees.md`](fees.md) | Where the 1% goes, the launch-fee decay, claiming rewards |

## Integrating

| | |
|---|---|
| [`sdk.md`](sdk.md) | `@leak/sdk-lite` vs `@leak/sdk`, worked examples |
| [`subgraph.md`](subgraph.md) | Entities, handlers, example queries |
| [`api.md`](api.md) | Endpoints, authentication, CORS |

## Running it

| | |
|---|---|
| [`architecture.md`](architecture.md) | How the layers fit together and where they drift |
| [`development.md`](development.md) | Local setup, the test suites, common failures |
| [`deploy.md`](deploy.md) | Deployment order, chain config, runtime config |

The litepaper is the specification; the documents under **The protocol** describe what is
implemented today. Where the two differ, the litepaper states the intent and the code has
not caught up yet.

Deeper material — the full derivation of the pricing mechanism, the feature matrix, and
the chain-specific address mapping — is internal and does not ship here.
