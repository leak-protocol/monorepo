# @leak/subgraph

Indexes four Leak events on Avalanche C-Chain into five entities.

Entities, handlers and example queries: [`../../docs/subgraph.md`](../../docs/subgraph.md).

## The manifest is generated

`subgraph.yaml` is rendered from `subgraph.template.yaml` plus deployed addresses. The
copy committed here has `address: 0x000…0` and `startBlock: 0` — valid for codegen and
tests, useless for deployment.

```bash
pnpm run codegen      # sync ABIs, render with --allow-unset, graph codegen
pnpm run build        # same, then compile the mappings
pnpm run build:deploy # strict: refuses to run without real addresses
```

`render-manifest.mjs` reads `LEAK_FACTORY`, `LEAK_COIN_HOOK` and `LEAK_START_BLOCK` from
the environment, falling back to
`packages/coins-deployments/addresses/<chainId>.json`.

**Deploying the committed manifest indexes nothing.** It points at the zero address. The
docker entrypoint renders first and refuses to proceed without real values.

## ABIs are copied, not maintained

`scripts/sync-abis.mjs` copies ABIs out of the forge build artifacts in
`packages/coins/out/`. Do not hand-edit anything in `abis/`.

The point is that changing a Solidity event and rebuilding makes codegen fail loudly,
instead of a handler silently reading a field that moved.

## Testing

```bash
pnpm run test    # matchstick
```

## Deploying locally

```bash
docker compose -f ../../docker/compose.yml --profile all up --build
```

The `indexing` profile builds an image that renders the manifest against freshly deployed
addresses, waits for graph-node, then creates and deploys the subgraph. See
[`../../docs/development.md`](../../docs/development.md).
