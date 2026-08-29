import { describe, it, expect, afterAll } from "vitest";
import { createPublicClient, getAddress } from "viem";
import { startAnvil, FORK_BLOCK, forkTransport } from "./anvil";

let stop: () => void;
afterAll(() => stop?.());

describe("anvil fork", () => {
  it("forks the pinned block and sees real Avalanche state", async () => {
    const a = await startAnvil();
    stop = a.stop;
    const client = createPublicClient({ transport: forkTransport(a.rpcUrl) });

    // Not an equality check: anvil reloads --state, so the block has advanced past
    // the previous run.
    expect(await client.getBlockNumber()).toBeGreaterThanOrEqual(FORK_BLOCK);
    expect(await client.getChainId()).toBe(43114);

    // WAVAX only exists if the fork really points at Avalanche C-Chain.
    const wavax = getAddress("0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7");
    const code = await client.getCode({ address: wavax });
    expect(code).toBeDefined();
    expect(code!.length).toBeGreaterThan(2);
  });
});
