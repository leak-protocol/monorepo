import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { parseWebConfig } from "./config";

/**
 * A real cross-language boundary: a shell script writes `/runtime/config.json` and the
 * browser reads it with `parseWebConfig`. This test runs that exact script and feeds the
 * result through that exact parser — no double in between, so changing the shape on one
 * side without the other goes red immediately.
 */
const SCRIPT = resolve(
  __dirname,
  "../../../../docker/config-init/write-config.sh",
);

function runScript(env: Record<string, string>) {
  const dir = mkdtempSync(join(tmpdir(), "leak-runtime-"));
  execFileSync("sh", [SCRIPT], {
    env: { ...process.env, RUNTIME_DIR: dir, ...env },
    encoding: "utf8",
  });
  return JSON.parse(readFileSync(join(dir, "config.json"), "utf8")) as unknown;
}

describe("docker/config-init/write-config.sh", () => {
  it("writes JSON that parseWebConfig accepts", () => {
    const raw = runScript({
      LEAK_FACTORY: "0x0205EE0152C0B67409F808F32D69bf65D4B8304E",
      LEAK_FACTORY_DEPLOY_BLOCK: "93821000",
      WEB_RPC_URL: "https://api.avax.network/ext/bc/C/rpc",
      API_URL: "http://127.0.0.1:8787",
    });
    const cfg = parseWebConfig(raw);
    expect(cfg.chainId).toBe(43114);
    expect(cfg.factory).toBe("0x0205EE0152C0B67409F808F32D69bf65D4B8304E");
    expect(cfg.factoryDeployBlock).toBe(93821000n);
    expect(cfg.rpcUrl).toBe("https://api.avax.network/ext/bc/C/rpc");
  });

  it("refuses an empty factory address rather than writing a broken config", () => {
    expect(() =>
      runScript({
        LEAK_FACTORY: "0x0000000000000000000000000000000000000000",
        LEAK_FACTORY_DEPLOY_BLOCK: "0",
        WEB_RPC_URL: "http://127.0.0.1:8545",
      }),
    ).toThrow();
  });
});

/**
 * deploy-local.sh cannot run here — it needs anvil and forge inside a container — but it
 * writes the SAME file for the same reader. At minimum the key sets must match: one key
 * out of step and the web app under the local profile loads a broken config.
 */
function configKeys(path: string): string[] {
  const src = readFileSync(resolve(__dirname, "../../../..", path), "utf8");
  const heredoc =
    /cat > "\$RUNTIME_DIR\/config\.json" <<EOF\n([\s\S]*?)\nEOF/.exec(src);
  if (!heredoc) throw new Error(`config.json heredoc not found in ${path}`);
  return [...heredoc[1]!.matchAll(/"([a-zA-Z]+)":/g)].map((m) => m[1]!).sort();
}

describe("both scripts write the same shape", () => {
  it("deploy-local.sh and write-config.sh share the same key set", () => {
    const keys = configKeys("docker/config-init/write-config.sh");
    expect(configKeys("docker/deployer/deploy-local.sh")).toEqual(keys);
    expect(keys).toEqual([
      "apiUrl",
      "chainId",
      "factory",
      "factoryDeployBlock",
      "rpcUrl",
    ]);
  });
});
