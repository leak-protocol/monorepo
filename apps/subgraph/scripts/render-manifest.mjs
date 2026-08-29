#!/usr/bin/env node
// Sinh subgraph.yaml tu subgraph.template.yaml + so dia chi cua coins-deployments.
// So dia chi: packages/coins-deployments/addresses/<chainid>.json (E-071),
// khoa LEAK_FACTORY va LEAK_COIN_HOOK (E-070). File 43114.json hien la {} (E-072),
// nen mac dinh script BAO LOI; --allow-unset dung dia chi 0 de codegen/test chay duoc.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");

const CHAIN_ID = process.env.LEAK_CHAIN_ID ?? "43114";
const ZERO = "0x0000000000000000000000000000000000000000";
const allowUnset = process.argv.includes("--allow-unset");

const addressesPath = resolve(
  repoRoot,
  "packages/coins-deployments/addresses",
  `${CHAIN_ID}.json`,
);
let addresses = {};
if (existsSync(addressesPath)) {
  addresses = JSON.parse(readFileSync(addressesPath, "utf8"));
} else if (!allowUnset) {
  console.error(`[render-manifest] khong thay ${addressesPath}`);
  process.exit(1);
}

const factory = process.env.LEAK_FACTORY ?? addresses.LEAK_FACTORY ?? "";
const hook = process.env.LEAK_COIN_HOOK ?? addresses.LEAK_COIN_HOOK ?? "";
const startBlock = process.env.LEAK_START_BLOCK ?? "0";

const missing = [];
if (!/^0x[0-9a-fA-F]{40}$/.test(factory)) missing.push("LEAK_FACTORY");
if (!/^0x[0-9a-fA-F]{40}$/.test(hook)) missing.push("LEAK_COIN_HOOK");
if (missing.length > 0 && !allowUnset) {
  console.error(
    `[render-manifest] thieu ${missing.join(", ")} trong ${addressesPath}\n` +
      `                  deploy contract truoc, hoac dat bien moi truong cung ten,\n` +
      `                  hoac chay voi --allow-unset (chi dung cho codegen va test).`,
  );
  process.exit(1);
}
if (missing.length > 0) {
  console.warn(`[render-manifest] --allow-unset: ${missing.join(", ")} dung dia chi 0`);
}
if (!/^\d+$/.test(startBlock)) {
  console.error(`[render-manifest] LEAK_START_BLOCK khong phai so nguyen: ${startBlock}`);
  process.exit(1);
}

const templatePath = resolve(here, "../subgraph.template.yaml");
const rendered = readFileSync(templatePath, "utf8")
  .replaceAll("__LEAK_FACTORY__", missing.includes("LEAK_FACTORY") ? ZERO : factory)
  .replaceAll("__LEAK_COIN_HOOK__", missing.includes("LEAK_COIN_HOOK") ? ZERO : hook)
  .replaceAll("__START_BLOCK__", startBlock);

if (rendered.includes("__")) {
  console.error("[render-manifest] con placeholder chua thay trong subgraph.yaml");
  process.exit(1);
}

const outPath = resolve(here, "../subgraph.yaml");
writeFileSync(outPath, rendered);
console.log(`[render-manifest] subgraph.yaml  factory=${factory || ZERO} hook=${hook || ZERO} startBlock=${startBlock}`);
