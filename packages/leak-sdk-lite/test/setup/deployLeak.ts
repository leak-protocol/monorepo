import { execSync } from "node:child_process";
import { readFileSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { createPublicClient } from "viem";
import { forkTransport } from "./anvil";

const DEPLOYMENTS = join(__dirname, "../../../coins-deployments");

/**
 * An anvil fork keeps the upstream chain id, so it is 43114 and not 31337
 * (verified: `cast chain-id` against the fork returns 43114).
 *
 * Deployment runs with DEV=true because DeployAllDevContracts requires it:
 * `deployLimitOrderBook`/`deploySwapRouter` có `require(isDevEnvironment())`
 * (CoinsDeployerBase.sol:464,475). DEV=true has two consequences:
 *   - it reads chainConfigs/43114_dev.json instead of 43114.json
 *   - it writes addresses/43114_dev.json instead of 43114.json, so the mainnet
 *     address book is NOT touched.
 */
const ADDRESSES = join(DEPLOYMENTS, "addresses/43114_dev.json");

/** Matches PROXY_ADMIN and LEAK_RECIPIENT in chainConfigs/43114_dev.json. */
const DEV_MULTISIG = "0x00000000000000000000000000000000000005A1";
/** Matches DOPPLER_AIRLOCK in chainConfigs/43114_dev.json. */
const DEV_AIRLOCK = "0x660eAaEdEBc968f8f3694354FA8EC0b4c5Ba8D12";
/** anvil account #0 — the nominal owner of both stubs. */
const DEV_OWNER = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

/** WAVAX — Avalanche's wrapped native token, matching WETH in chainConfigs. */
const WAVAX = "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7";
/** WAVAX is a classic WETH9: slot 0 = name, slot 1 = symbol. */
const WAVAX_SYMBOL_SLOT =
  "0x0000000000000000000000000000000000000000000000000000000000000001";
/** Short string "WAVAX", 5 characters, so the last byte is 2*5. */
const SYMBOL_WAVAX =
  "0x574156415800000000000000000000000000000000000000000000000000000a";
/** Short string "WETH", 4 characters, so the last byte is 2*4. */
const SYMBOL_WETH =
  "0x5745544800000000000000000000000000000000000000000000000000000008";

/**
 * Minimal runtime: copy the `size` constant bytes that follow the code and return
 * them, whatever the calldata. Enough for a single view function.
 *
 *   PUSH1 size; PUSH1 0x0c; PUSH1 0x00; CODECOPY; PUSH1 size; PUSH1 0x00; RETURN
 */
function constantReturnRuntime(sizeHex: string, data: string): `0x${string}` {
  return (`0x60${sizeHex}600c600039` +
    `60${sizeHex}6000f3` +
    data) as `0x${string}`;
}

const word = (hex: string) =>
  hex.replace(/^0x/, "").toLowerCase().padStart(64, "0");

/**
 * `validateMultisig` (ProxyDeployerScript.sol:290-304) requires code at the address
 * and `getOwners().length > 0`. Leak has no Safe on Avalanche, so etch a contract
 * that returns exactly `address[1]`.
 */
const SAFE_STUB = constantReturnRuntime(
  "60",
  word("0x20") + word("0x01") + word(DEV_OWNER),
);

/**
 * `getDopplerAirlock` (ProxyDeployerScript.sol:247-257) requires code. The Doppler
 * Airlock does not exist on Avalanche, and BaseCoin only calls `owner()` on it
 * (see LeakAirlock.sol). Etch a contract that returns exactly one address.
 */
const AIRLOCK_STUB = constantReturnRuntime("20", word(DEV_OWNER));

async function rpc(rpcUrl: string, method: string, params: unknown[]) {
  const res = await fetch(rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const json = (await res.json()) as { error?: { message: string } };
  if (json.error)
    throw new Error(`${method} ${params[0]}: ${json.error.message}`);
}

async function etchStubs(rpcUrl: string) {
  await rpc(rpcUrl, "anvil_setCode", [DEV_MULTISIG, SAFE_STUB]);
  await rpc(rpcUrl, "anvil_setCode", [DEV_AIRLOCK, AIRLOCK_STUB]);
}

/**
 * `getWeth()` (ProxyDeployerScript.sol:205-219) reverts unless `symbol() == "WETH"`.
 * On Avalanche the wrapped native token is WAVAX, so the production deploy script
 * cannot run unmodified. Patch the symbol slot for the duration of the deployment
 * and restore it — it is a display string, and nothing in Leak reads it at runtime.
 */
async function withWethSymbol<T>(rpcUrl: string, fn: () => T): Promise<T> {
  await rpc(rpcUrl, "anvil_setStorageAt", [
    WAVAX,
    WAVAX_SYMBOL_SLOT,
    SYMBOL_WETH,
  ]);
  try {
    return fn();
  } finally {
    await rpc(rpcUrl, "anvil_setStorageAt", [
      WAVAX,
      WAVAX_SYMBOL_SLOT,
      SYMBOL_WAVAX,
    ]);
  }
}

/**
 * Deploys Leak onto anvil using the production script itself, so the tests take the
 * same path mainnet will.
 *
 * The script writes addresses to ./addresses/<chainid>_dev.json via vm.writeJson
 * (CoinsDeployerBase.saveDeployment) and does NOT print them, so read the file.
 */
export async function deployLeak(rpcUrl: string): Promise<`0x${string}`> {
  // anvil reloads state from the previous run (see STATE_FILE in anvil.ts). If the
  // factory already has bytecode, redeploying is both redundant and costs 10+ minutes.
  const cached = readFactoryAddress();
  if (cached) {
    const client = createPublicClient({ transport: forkTransport(rpcUrl) });
    const code = await client.getCode({ address: cached });
    if (code && code.length > 2) return cached;
  }

  await etchStubs(rpcUrl);

  if (existsSync(ADDRESSES)) rmSync(ADDRESSES);

  // KHONG dung Deploy.s.sol: no goi signDeploymentWithTurnkey
  // (CoinsDeployerBase.sol:336) — Turnkey la dich vu ky tu xa, khong co tren anvil.
  // DeployAllDevContracts.s.sol la duong deploy cuc bo, khong ky tu xa.
  await withWethSymbol(rpcUrl, () =>
    execSync(
      `forge script script/DeployAllDevContracts.s.sol --rpc-url ${rpcUrl} --broadcast --unlocked --legacy --sender ${DEV_OWNER}`,
      {
        cwd: DEPLOYMENTS,
        encoding: "utf8",
        stdio: "pipe",
        env: {
          ...process.env,
          DEV: "true",
          // forge cache state fork theo (chainId, block). Fork Solidity trong
          // packages/coins already cached WAVAX's slots at this exact block, so the
          // symbol patch above is masked by that cache unless it is disabled.
          FOUNDRY_NO_STORAGE_CACHING: "true",
        },
      },
    ),
  );

  const factory = readFactoryAddress();
  if (!factory) {
    throw new Error(`LEAK_FACTORY is invalid in ${ADDRESSES}`);
  }
  return factory;
}

function readFactoryAddress(): `0x${string}` | undefined {
  if (!existsSync(ADDRESSES)) return undefined;
  const json = JSON.parse(readFileSync(ADDRESSES, "utf8"));
  const factory = json.LEAK_FACTORY;
  return /^0x[0-9a-fA-F]{40}$/.test(factory ?? "")
    ? (factory as `0x${string}`)
    : undefined;
}

/**
 * DEV=true writes to addresses/43114_dev.json, so the mainnet address book is NOT
 * touched and there is nothing to restore. The dev file is kept deliberately: paired
 * with anvil's cached state, it lets the next run skip deployment entirely.
 */
export function restoreAddresses() {}
