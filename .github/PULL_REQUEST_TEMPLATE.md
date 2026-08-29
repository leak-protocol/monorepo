## What changed

<!-- One paragraph. What changed and why. Don't restate the diff. -->

## Evidence

<!-- Paste real command output. Not "tested it". For example:
     forge test --match-contract LeakBondingCurve  -> 9/9
     pnpm --filter @leak/web test                  -> 90/90
-->

```
```

## Before opening

- [ ] `pnpm run lint` `pnpm run typecheck` `pnpm run build` `pnpm run test:js` all green
- [ ] Touched `.sol` → `forge test` green, and named which contracts need redeploying
- [ ] Touched `docker/` → `docker compose -f docker/compose.yml --profile all config --quiet` exits 0
- [ ] Touched the subgraph schema → `pnpm --filter @leak/subgraph run test` green
- [ ] Any judgement call made without being able to ask → recorded in the internal debt log

## Risk

<!-- What could break, and how you'd find out. "No risk" is almost always wrong. -->

## On-chain impact

- [ ] Nothing already deployed is affected
- [ ] Bytecode changed → **list the contracts that need redeploying**
- [ ] ABI changed → **list the SDK / subgraph / web changes that must follow**
- [ ] Storage layout changed → **describe the upgrade path** (ERC-7201 namespaces are hardcoded keccak constants)
