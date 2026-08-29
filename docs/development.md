# Development

## Prerequisites

```bash
node --version                  # >= 22, see .nvmrc
corepack enable && corepack prepare pnpm@9.0.0 --activate
curl -L https://foundry.paradigm.xyz | bash && foundryup --version v1.3.5
pnpm install
```

Versions are pinned deliberately. `pnpm` must be 9.x — the lockfile is `lockfileVersion:
9.0`. Foundry `v1.3.5` is the toolchain the current test results were produced with.

## The loop

```bash
pnpm run lint        # formatting only — prettier, including .sol
pnpm run typecheck   # tsc --noEmit
pnpm run build       # turbo, respecting the dependency graph
pnpm run test:js     # sdk-lite, api, sdk, web, subgraph — 224 tests
pnpm run test:sol    # forge, ~47 minutes against an Avalanche fork
```

`lint` and `typecheck` are **different things** here. `lint` only checks formatting; type
checking is `typecheck`. The two used to be conflated and it caused confusion — keep them
apart.

## Formatting Solidity

Use prettier, not `forge fmt`:

```bash
pnpm run fmt:sol
pnpm run fmt:sol:check
```

`.prettierrc` sets `printWidth: 160` for `.sol`. `forge fmt` defaults to 120 and reports
123 files as misformatted even though they are correct. This is the single most common
false alarm in the repository.

## Running the whole stack

```bash
cp docker/.env.example docker/.env
docker compose -f docker/compose.yml --profile all up --build
```

Three profiles, described in full in [`../docker/README.md`](../docker/README.md):

| Profile | Brings up |
|---|---|
| `local` | anvil fork, deployer, web |
| `mainnet` | config-init, web — points at real Avalanche |
| `indexing` | postgres, ipfs, graph-node, subgraph-deploy, api |
| `all` | `local` + `indexing` |

`indexing` **does not run alone** — graph-node and the API need a chain endpoint that
`local` or `mainnet` provides. Startup order is enforced by `depends_on`:

```
anvil(healthy) → deployer → subgraph-deploy → api
                    ↓            ↑
                   web      graph-node ← postgres, ipfs
```

## Repository conventions

**Conclusions need evidence.** Any claim about contract behaviour, an address, or a
function signature must cite a `file:line` or a runnable command. This rule exists because
one plan written from memory contained five errors.

**Two things must never be renamed:**

- SPDX license headers in `.sol`. They are part of the file, not decoration.
- ERC-7201 storage namespace strings. The slot is a hardcoded keccak constant; changing
  the string without recomputing the hash makes the comment and the slot disagree
  silently, and no test catches it.

## Touching contracts

Deployed contracts are immutable. Before editing `.sol`:

1. Run `forge test` **first** for a baseline. Do not trust the previous run's green.
2. If the change is formatting only, prove the bytecode is unchanged rather than assuming
   it. Normalise library link placeholders, then strip the trailing CBOR metadata —
   Solidity hashes the source **text** into that trailer, so comparing raw bytecode
   compares the wrong thing.
3. State in the pull request which contracts must be redeployed.

## Common failures

**`forge fmt --check` reports ~123 files.** Wrong tool. Use `pnpm run fmt:sol:check`.

**`TS7016: Could not find a declaration file for '@leak/sdk-lite'`.** The declaration
files were not emitted before a consumer built. Run `pnpm --filter @leak/sdk-lite run
build`, which emits JS and `.d.ts` sequentially.

**`render-manifest` says `missing LEAK_FACTORY, LEAK_COIN_HOOK`.** Nothing has been
deployed, so there are no addresses to render. Use `pnpm run codegen` or `build`, both of
which pass `--allow-unset`.

**Subgraph deploys but indexes nothing.** The committed `subgraph.yaml` has
`address: 0x000…0`. It must be re-rendered with real addresses first.

**Solidity tests are slow or flaky.** They fetch fork state over RPC. Reduce parallelism
with `forge test -j 4`; the on-disk fork cache makes the second run much faster.

## Committing

[Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `chore:`,
`docs:`, `build:`. The body explains **why**, not what the diff already shows.
