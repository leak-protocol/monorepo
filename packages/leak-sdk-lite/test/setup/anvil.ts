import { spawn, type ChildProcess } from "node:child_process";
import { join } from "node:path";
import { existsSync } from "node:fs";
import { createPublicClient, http } from "viem";

/** The same block the Solidity tests use, so both layers see identical state. */
export const FORK_BLOCK = 93821000n;
const UPSTREAM = "https://api.avax.network/ext/bc/C/rpc";
const PORT = 8546;

/**
 * anvil loads state from this file on startup and writes it back on shutdown.
 *
 * Avalanche's public RPC is very slow when anvil has to pull cold state: a deploy
 * script run against a cold fork takes over ten minutes, against a warm one a few
 * seconds. Persisting state across runs makes that a one-time cost.
 * Delete this file to rebuild from scratch.
 */
export const STATE_FILE = join(__dirname, ".anvil-state.json");

export const hasCachedState = () => existsSync(STATE_FILE);

/**
 * anvil pulls cold state from Avalanche's public RPC, so a single `eth_estimateGas`
 * for a coin-creation transaction can take more than ten seconds — past viem's
 * default. Every client in the fork tests uses this transport.
 */
export const forkTransport = (rpcUrl: string) =>
  http(rpcUrl, { timeout: 300_000, retryCount: 2 });

export async function startAnvil() {
  const proc: ChildProcess = spawn(
    "anvil",
    [
      "--fork-url",
      UPSTREAM,
      "--fork-block-number",
      String(FORK_BLOCK),
      "--port",
      String(PORT),
      // Without these two flags anvil asks upstream for `eth_feeHistory` at the
      // pinned block, which Avalanche's public RPC no longer serves.
      // ("request beyond historical limit") và forge script treo lúc broadcast.
      "--gas-price",
      "25000000000",
      "--base-fee",
      "25000000000",
      "--no-rate-limit",
      "--state",
      STATE_FILE,
      "--silent",
    ],
    { stdio: "ignore" },
  );

  const rpcUrl = `http://127.0.0.1:${PORT}`;
  const client = createPublicClient({ transport: forkTransport(rpcUrl) });

  for (let i = 0; i < 120; i++) {
    try {
      await client.getBlockNumber();
      return {
        rpcUrl,
        // SIGTERM so anvil can flush --state to disk; SIGKILL would lose the cache.
        stop: () => proc.kill("SIGTERM"),
      };
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  proc.kill();
  throw new Error("anvil did not come up within 60s");
}
