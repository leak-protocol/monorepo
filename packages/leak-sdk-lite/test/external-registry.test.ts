import { describe, it, expect } from "vitest";
import { createPublicClient, http, toFunctionSelector } from "viem";
import { avalanche } from "viem/chains";
import { EXTERNAL_43114 } from "../src/external-registry";

const client = createPublicClient({
  chain: avalanche,
  transport: http("https://api.avax.network/ext/bc/C/rpc"),
});

describe("external-registry", () => {
  it("each declared selector matches its declared signature", () => {
    for (const entry of Object.values(EXTERNAL_43114)) {
      for (const fn of entry.functions) {
        expect(toFunctionSelector(fn.signature)).toBe(fn.selector);
      }
    }
  });

  it("every selector is present in the deployed bytecode", async () => {
    for (const [name, entry] of Object.entries(EXTERNAL_43114)) {
      const code = await client.getCode({ address: entry.address });
      expect(code, `${name} has no bytecode`).toBeDefined();
      for (const fn of entry.functions) {
        expect(
          code!.includes(fn.selector.slice(2)),
          `${name}.${fn.signature} (${fn.selector}) is not in the bytecode`,
        ).toBe(true);
      }
    }
  }, 120_000);
});
