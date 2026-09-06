#!/usr/bin/env node
// Builds Notion-import-ready copies of docs/*.md into build/notion/.
//
// The originals stay untouched: their relative links are correct on GitHub, and
// rewriting them in place would break the repository's own documentation.
//
// Import the generated folder into Notion as a ZIP, not file by file. Notion
// resolves relative links between files that arrive in the same import; files
// imported one at a time leave those links as inert text.

import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync } from "node:fs";
import { join, resolve, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../..");
const srcDir = join(repoRoot, "docs");
const outDir = join(repoRoot, "build/notion");

/** Order defines the reading order of the index page. */
const ORDER = [
  ["litepaper.md", "Litepaper", "The full argument: problem, mechanism, market"],
  ["protocol.md", "Protocol", "Life of a coin, single-sided liquidity, architecture"],
  ["curves.md", "Curves", "How poolConfig encodes a curve, and designing your own"],
  ["fees.md", "Fees", "Where the 1% goes, and the launch-fee decay"],
  ["architecture.md", "Architecture", "How the layers fit together and where they drift"],
  ["sdk.md", "SDK", "sdk-lite versus sdk, with worked examples"],
  ["subgraph.md", "Subgraph", "Entities, handlers, example queries"],
  ["api.md", "API", "Endpoints, authentication, CORS"],
  ["development.md", "Development", "Local setup, test suites, common failures"],
  ["deploy.md", "Deployment", "Deployment order and runtime configuration"],
];

/**
 * Notion renders a fence with no language as an undifferentiated block. Tagging
 * ASCII diagrams as `text` stops it guessing a language and colouring the box
 * drawing characters as if they were syntax.
 */
function tagBareFences(md) {
  let inFence = false;
  return md
    .split("\n")
    .map((line) => {
      if (!line.startsWith("```")) return line;
      if (inFence) {
        inFence = false;
        return line;
      }
      inFence = true;
      return line.trim() === "```" ? "```text" : line;
    })
    .join("\n");
}

/**
 * Links out of docs/ cannot resolve inside Notion. Point them at the repository
 * instead of leaving a dead link.
 */
const REPO_URL = "https://github.com/leak-protocol/monorepo/blob/main";
function absolutiseEscapingLinks(md) {
  return md.replace(/\]\((\.\.\/[^)]+)\)/g, (_, p) => {
    const clean = p.replace(/^\.\.\//, "");
    return `](${REPO_URL}/${clean})`;
  });
}

/**
 * Notion's importer takes the first H1 as the page title and then repeats it as
 * a heading in the body. Dropping it leaves the title alone.
 */
function dropLeadingH1(md) {
  const lines = md.split("\n");
  const i = lines.findIndex((l) => l.trim() !== "");
  if (i >= 0 && lines[i].startsWith("# ")) {
    lines.splice(i, 1);
    while (lines[i] !== undefined && lines[i].trim() === "") lines.splice(i, 1);
  }
  return lines.join("\n");
}

function convert(md) {
  return [dropLeadingH1, tagBareFences, absolutiseEscapingLinks].reduce(
    (acc, fn) => fn(acc),
    md,
  );
}

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const present = new Set(readdirSync(srcDir).filter((f) => f.endsWith(".md")));
const known = new Set(ORDER.map(([f]) => f));
const missing = ORDER.filter(([f]) => !present.has(f)).map(([f]) => f);
const unlisted = [...present].filter((f) => f !== "README.md" && !known.has(f));

for (const [file] of ORDER) {
  if (!present.has(file)) continue;
  const out = convert(readFileSync(join(srcDir, file), "utf8"));
  writeFileSync(join(outDir, file), out);
}

const index = [
  "Asset tokenization launchpad on Avalanche C-Chain.",
  "",
  "The litepaper is also in the repository as a PDF (`docs/LitePaper.pdf`); upload it",
  "to this page in Notion if a shareable file is useful.",
  "",
  "| Page | What it covers |",
  "| --- | --- |",
  ...ORDER.filter(([f]) => present.has(f)).map(
    ([file, title, blurb]) => `| [${title}](${file}) | ${blurb} |`,
  ),
  "",
  "---",
  "",
  `Generated from \`docs/\` by \`tools/notion/build.mjs\`. Source of truth is the`,
  `repository; edit there and rebuild rather than editing in Notion.`,
  "",
].join("\n");
writeFileSync(join(outDir, "Leak Protocol.md"), index);

const built = ORDER.filter(([f]) => present.has(f)).length;
console.log(`[notion] ${built} pages + index -> build/notion/`);
if (missing.length) console.log(`[notion] listed but absent: ${missing.join(", ")}`);
if (unlisted.length)
  console.log(`[notion] present but not in ORDER, skipped: ${unlisted.join(", ")}`);
