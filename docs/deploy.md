# Deployment

## Nine contracts, in order

The order is mandatory — each one needs an address produced by an earlier step.

| # | Contract | Why it must come first |
|---|---|---|
| 1 | `ProtocolRewards` | where fees accumulate |
| 2 | `LeakAirlock` | `dopplerFeeRecipient()` calls `owner()` on it **on every swap** |
| 3 | `TrustedMsgSenderLookup` | the hook's constructor does `require(!= address(0))` |
| 4 | `HookUpgradeGate` | same |
| 5 | `LimitOrderBook` | same |
| 6 | `LeakFactory` (proxy) | the hook needs the factory address |
| 7 | `LeakHookRegistry` | the hook calls it on every swap to validate itself |
| 8 | `LeakCoinHook` | **CREATE2-mined** — v4 encodes permission flags in the address bits |
| 9 | `LeakCoin` (implementation) | the template that gets cloned |

Then deploy the factory implementation and call `initialize`.

`DeployedCoinVersionLookup` is **not** deployed separately — `LeakFactory` inherits it.
Treating it as a tenth contract is a mistake worth avoiding.

## Locally

```bash
cp docker/.env.example docker/.env
docker compose -f docker/compose.yml --profile all up --build
```

That forks Avalanche at block `93821000` with anvil, deploys all nine contracts onto it,
renders the subgraph manifest against the freshly deployed addresses, and starts web, api
and graph-node.

The deployment script is `DeployAllDevContracts.s.sol`, **not** `Deploy.s.sol`. The latter
calls `signDeploymentWithTurnkey`, a remote signing service that does not exist locally.

Two patches are applied to the fork before deployment. `docker/deployer/deploy-local.sh`
does both:

- **Etch two stubs** at the addresses pinned in `chainConfigs/43114_dev.json`.
  `validateMultisig()` requires a non-empty `getOwners()`, and the Doppler Airlock does not
  exist on Avalanche at all.
- **Temporarily patch WAVAX's `symbol()` to `"WETH"`.** `getWeth()` reverts on any other
  value. It is restored immediately after deployment. Nothing in Leak reads that string at
  runtime — it is a display name.

## Runtime configuration

The web app reads `/runtime/config.json` on page load:

```json
{
  "chainId": 43114,
  "rpcUrl": "https://api.avax.network/ext/bc/C/rpc",
  "factory": "0x…",
  "factoryDeployBlock": "93821000",
  "apiUrl": "http://127.0.0.1:8787"
}
```

Vite inlines environment variables at build time, but the factory address changes with
every rebuild of the local stack — so the configuration must be read at runtime. Under the
`local` profile the deployer writes this file to a shared volume; under `mainnet`,
`config-init` writes it from `docker/.env`.

`factoryDeployBlock` is the lower bound for the `CoinCreatedV4` log scan. Scanning from
block zero on mainnet is tens of millions of blocks and every provider refuses it.

## Verified Avalanche C-Chain addresses

All confirmed with `eth_getCode`:

| | |
|---|---|
| Uniswap v4 PoolManager | `0x06380C0e0912312B5150364B9DC4542BA0DbBc85` |
| Uniswap v4 PositionManager | `0xB74b1F14d2754AcfcbBe1a221023a5cf50Ab8ACD` |
| UniversalRouter | `0x94b75331AE8d42C1b61065089B7d48FE14aA73b7` |
| Permit2 | `0x000000000022D473030F116dDEE9F6B43aC78BA3` |
| WAVAX | `0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7` |

**There is no testnet.** Uniswap v4 is not deployed on Fuji, so everything beneath the
hook is absent there. A fork of mainnet is the only realistic test environment.

## Before mainnet

Not yet done. Blocking items:

- `chainConfigs/43114.json` still has three zero addresses: `PROXY_ADMIN`,
  `LEAK_RECIPIENT`, `METADATA_MANAGER`. The first two must be real Gnosis Safes with
  owners — `validateMultisig()` reverts otherwise.
- `DOPPLER_AIRLOCK` is also zero. Doppler is not deployed on Avalanche, so this must point
  at a locally deployed `LeakAirlock`.
- **`PROTOCOL_REWARDS` has no code on Avalanche.** Deployment succeeds, but the reward
  withdrawal path will revert at runtime.
- `contractName()` is fixed permanently at first deployment.
- Leak's changes to the vendored contracts have not been independently audited. See
  the license headers in the source.
