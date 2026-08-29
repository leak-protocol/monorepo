import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
});

/**
 * Blocks every HTTP call in the tests.
 *
 * wagmi's `mock` connector answers `eth_chainId` and `eth_requestAccounts` itself, but
 * `eth_accounts` — which `isAuthorized()` uses to decide whether to reconnect — falls
 * through to the real transport and fires a request at anvil's port. There is no anvil
 * in the tests, so that request hangs and then throws outside any test's lifetime.
 *
 * This answers, in place, the minimal set of methods wagmi needs at mount. Every other
 * method throws a clear error: screen tests must go through the injected `actions`
 * object and never touch a chain.
 */
const TEST_ACCOUNTS = ["0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"];
const CANNED: Record<string, unknown> = {
  eth_accounts: TEST_ACCOUNTS,
  eth_requestAccounts: TEST_ACCOUNTS,
  eth_chainId: "0xa86a",
  net_version: "43114",
  eth_blockNumber: "0x0",
};

function answer(payload: { id?: number; method: string }) {
  const result = CANNED[payload.method];
  if (result === undefined) {
    return {
      jsonrpc: "2.0",
      id: payload.id ?? 1,
      error: { code: -32601, message: `Test RPC does not serve "${payload.method}"` },
    };
  }
  return { jsonrpc: "2.0", id: payload.id ?? 1, result };
}

globalThis.fetch = (async (_input: unknown, init?: { body?: string }) => {
  const raw = typeof init?.body === "string" ? init.body : "{}";
  const parsed = JSON.parse(raw) as { id?: number; method: string } | { id?: number; method: string }[];
  const body = Array.isArray(parsed) ? parsed.map(answer) : answer(parsed);
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}) as unknown as typeof fetch;
