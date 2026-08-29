# Running Leak with docker compose

Two main profiles plus an overlay. There is no testnet profile: Uniswap v4 is not deployed
on Fuji, so everything beneath the hook is absent there.

```bash
cp docker/.env.example docker/.env
```

## `all` — the whole MVP in one command

```bash
docker compose -f docker/compose.yml --profile all up --build
```

Equivalent to `local` + `indexing`. Startup order is enforced by `depends_on`:

```
anvil (healthy) → deployer → subgraph-deploy → api
                     ↓            ↑
                    web       graph-node ← postgres, ipfs
```

## `local` — anvil fork, real deployment, web

```bash
docker compose -f docker/compose.yml --profile local up --build
```

- **`anvil`** forks Avalanche C-Chain at block `93821000` — the same block the Solidity
  and SDK test suites pin, so every layer sees identical chain state. anvil keeps the
  upstream chain id, `43114`.
- **`deployer`** runs `DeployAllDevContracts.s.sol` (not `Deploy.s.sol`, which needs
  Turnkey remote signing), then writes `/runtime/config.json` and `/runtime/addresses.env`.
- **`web`** is nginx serving the built `dist/`, reading its configuration from the shared
  `runtime` volume.

Then open <http://127.0.0.1:5173>. Quick checks:

```bash
curl -s http://127.0.0.1:5173/runtime/config.json
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:5173/
```

## `mainnet` — web only, pointed at real Avalanche

Fill in `LEAK_FACTORY` and `LEAK_FACTORY_DEPLOY_BLOCK` in `docker/.env` first —
`packages/coins-deployments/addresses/43114.json` is still empty.

```bash
docker compose -f docker/compose.yml --profile mainnet up --build
```

## `indexing` — postgres, ipfs, graph-node, subgraph, api

**Does not run alone.** graph-node and the API need a chain endpoint that `local` or
`mainnet` provides. Stack it:

```bash
docker compose -f docker/compose.yml --profile local --profile indexing up --build
```

Or just use `--profile all`, which is exactly that pair.

Four joins that are easy to get wrong, already wired in `compose.yml`:

- The network name `avalanche` on the left of graph-node's `ethereum` variable must match
  `network: avalanche` in `apps/subgraph/subgraph.template.yaml`.
- `SUBGRAPH_NAME` is shared between `subgraph-deploy` and the API's `LEAK_SUBGRAPH_URL`.
  Changing one without the other breaks the link.
- `subgraph-deploy` **re-renders the manifest** with real addresses before deploying. The
  committed `subgraph.yaml` has `address: 0x000…0` and would index nothing.
- The API uses its own **`leak_api`** database, not graph-node's. graph-node manages its
  own schema; letting drizzle migrate into it corrupts both.

## Tearing down

```bash
docker compose -f docker/compose.yml --profile all down -v
```

`-v` removes the volumes, including the deployed addresses. Leave it off to keep the
anvil state and skip redeployment on the next run.
