#!/usr/bin/env node
// Syncs ABIs from the forge build artifacts into apps/subgraph/abis/.
// Source: packages/coins/out/<File>.sol/<File>.json
// graph-cli accepts a full artifact, but we extract just the `abi` array so the
// bytecode is not uploaded to IPFS.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const outDir = resolve(repoRoot, "packages/coins/out");
const abisDir = resolve(here, "../abis");

// Contract name -> artifact file name. LeakFactoryImpl emits CoinCreatedV4,
// LeakCoinHook phát Swapped và CoinMarketRewardsV4 (E-051, E-052),
// ContentCoin phát CoinTransfer (E-043, E-054).
const CONTRACTS = ["LeakFactoryImpl", "LeakCoinHook", "ContentCoin"];

mkdirSync(abisDir, { recursive: true });

let failures = 0;
for (const name of CONTRACTS) {
  const artifactPath = resolve(outDir, `${name}.sol`, `${name}.json`);
  let artifact;
  try {
    artifact = JSON.parse(readFileSync(artifactPath, "utf8"));
  } catch (err) {
    console.error(
      `[sync-abis] khong doc duoc ${artifactPath}: ${err.message}\n` +
        `            chay truoc: cd packages/coins && forge build src/ --no-metadata`,
    );
    failures += 1;
    continue;
  }
  if (!Array.isArray(artifact.abi)) {
    console.error(`[sync-abis] ${artifactPath} khong co truong "abi" dang mang`);
    failures += 1;
    continue;
  }
  const target = resolve(abisDir, `${name}.json`);
  writeFileSync(target, `${JSON.stringify(artifact.abi, null, 2)}\n`);
  const events = artifact.abi.filter((e) => e.type === "event").length;
  console.log(`[sync-abis] ${name}.json  ${artifact.abi.length} muc, ${events} event`);
}

if (failures > 0) process.exit(1);
