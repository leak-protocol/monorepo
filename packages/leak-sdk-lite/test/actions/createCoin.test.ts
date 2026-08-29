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
import { deployLeak, restoreAddresses } from "../setup/deployLeak";
import { ACCOUNT, NATIVE, randomSalt } from "../setup/coin";
import { createCoinCall } from "../../src/actions/createCoin";
import { encodeCurve, LEAK_MEME } from "../../src/curves";

let publicClient: PublicClient;
let walletClient: WalletClient;
let factory: `0x${string}`;
let stop: () => void;

beforeAll(async () => {
  const a = await startAnvil();
  stop = a.stop;
  publicClient = createPublicClient({ transport: forkTransport(a.rpcUrl) });
  walletClient = createWalletClient({
    account: ACCOUNT,
    transport: forkTransport(a.rpcUrl),
  });
  factory = await deployLeak(a.rpcUrl);
}, 300_000);
afterAll(() => {
  restoreAddresses();
  stop?.();
});

describe.skip("createCoinCall", () => {
  it("builds calldata locally, making no network call beyond RPC", async () => {
    const res = await createCoinCall({
      publicClient,
      factory,
      creator: ACCOUNT.address,
      name: "Test Coin",
      symbol: "TEST",
      metadata: { type: "RAW_URI", uri: "ipfs://test" },
      poolConfig: encodeCurve(LEAK_MEME, NATIVE),
      skipMetadataValidation: true,
    });

    expect(res.calls).toHaveLength(1);
    expect(res.calls[0]!.to.toLowerCase()).toBe(factory.toLowerCase());
    expect(res.calls[0]!.value).toBe(0n);
    expect(res.calls[0]!.data.startsWith("0x")).toBe(true);
    expect(res.predictedCoinAddress).toMatch(/^0x[0-9a-fA-F]{40}$/);
  });

  it("the predicted address matches the deployed one after sending", async () => {
    const res = await createCoinCall({
      publicClient,
      factory,
      creator: ACCOUNT.address,
      name: "Predict",
      symbol: "PRED",
      metadata: { type: "RAW_URI", uri: "ipfs://p" },
      poolConfig: encodeCurve(LEAK_MEME, NATIVE),
      skipMetadataValidation: true,
      // anvil state persists across runs, so a fixed salt would collide with an
      // existing coin.
      salt: randomSalt(),
    });

    const hash = await walletClient.sendTransaction({
      to: res.calls[0]!.to,
      data: res.calls[0]!.data,
      value: res.calls[0]!.value,
      account: ACCOUNT,
      chain: null,
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    expect(receipt.status).toBe("success");

    const code = await publicClient.getCode({
      address: res.predictedCoinAddress,
    });
    expect(
      code,
      "the predicted address must have bytecode after deployment",
    ).toBeDefined();
  });

  it("a sender different from the creator yields a different predicted address", async () => {
    const common = {
      publicClient,
      factory,
      creator: ACCOUNT.address,
      name: "Sender",
      symbol: "SND",
      metadata: { type: "RAW_URI" as const, uri: "ipfs://s" },
      poolConfig: encodeCurve(LEAK_MEME, NATIVE),
      skipMetadataValidation: true,
    };
    const asCreator = await createCoinCall(common);
    const asOther = await createCoinCall({
      ...common,
      sender: "0x000000000000000000000000000000000000dEaD",
    });
    // The factory derives its salt from msg.sender, so the two must differ.
    expect(asOther.predictedCoinAddress).not.toBe(
      asCreator.predictedCoinAddress,
    );
  });
});
