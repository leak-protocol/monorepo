// SKIP: hook beforeAll deploy 9 contract len anvil fork qua RPC cong khai,
// timeout 900s. Khong phai loi code. Bo .skip khi co endpoint archive tra phi.
// Xem docs/engineering/DEBTS.md muc D-2.
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  createPublicClient,
  createWalletClient,
  type PublicClient,
  type WalletClient,
} from "viem";
import { startAnvil, forkTransport } from "../setup/anvil";
import { deployLeak } from "../setup/deployLeak";
import { ACCOUNT, createTestCoin } from "../setup/coin";
import { quoteExactInputSingle } from "../../src/onchain/quote";
import type { PoolKey } from "../../src/types";

let publicClient: PublicClient;
let walletClient: WalletClient;
let poolKey: PoolKey;
let stop: () => void;

beforeAll(async () => {
  const a = await startAnvil();
  stop = a.stop;
  publicClient = createPublicClient({ transport: forkTransport(a.rpcUrl) });
  walletClient = createWalletClient({
    account: ACCOUNT,
    transport: forkTransport(a.rpcUrl),
  });
  const factory = await deployLeak(a.rpcUrl);
  ({ poolKey } = await createTestCoin({ publicClient, walletClient, factory }));
}, 900_000);
afterAll(() => stop?.());

describe.skip("quoteExactInputSingle", () => {
  it("quotes a positive amount for a 1 AVAX buy", async () => {
    const { amountOut } = await quoteExactInputSingle({
      publicClient,
      poolKey,
      zeroForOne: true,
      exactAmount: 10n ** 18n,
    });
    expect(amountOut).toBeGreaterThan(0n);
  });

  it("buying ten times as much does not yield ten times the coin — the curve has slope", async () => {
    const one = await quoteExactInputSingle({
      publicClient,
      poolKey,
      zeroForOne: true,
      exactAmount: 10n ** 18n,
    });
    const ten = await quoteExactInputSingle({
      publicClient,
      poolKey,
      zeroForOne: true,
      exactAmount: 10n ** 19n,
    });
    expect(ten.amountOut).toBeLessThan(one.amountOut * 10n);
  });
});
