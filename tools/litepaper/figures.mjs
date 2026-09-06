// Diagrams for the litepaper.
//
// The markdown carries these as ASCII inside fenced blocks, which is readable in
// a terminal and unreadable on a page. Each one is matched here by a fragment of
// its own text and replaced with the markup the stylesheet already draws —
// .band / .mods for the layer stack, .hop-row for the pair chains, .splitbar for
// the fee split. Nothing is invented: the labels come from the same ASCII.
//
// A block that matches nothing falls through to <pre>, so an unrecognised
// diagram degrades to legible text rather than disappearing.

const esc = (t) =>
  t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const mods = (rows) =>
  `<div class="mods">${rows
    .map(([name, desc]) => `<div class="mod"><b>${esc(name)}</b><span>${esc(desc)}</span></div>`)
    .join("")}</div>`;

const band = (tag, role, rows) =>
  `<div class="band"><div class="band-head">` +
  `<span class="band-tag">${esc(tag)}</span>` +
  `<span class="band-role">${esc(role)}</span>` +
  `</div>${mods(rows)}</div>`;

const flow = (label) =>
  `<div class="flow"><span class="stem"></span>` +
  `<span class="act">${esc(label)}</span>` +
  `<span class="stem"></span><span class="arrowhead"></span></div>`;

const hopRow = (tag, nodes, good) =>
  `<div class="hop-row is-${good ? "good" : "bad"}">` +
  `<span class="hop-tag">${esc(tag)}</span>` +
  `<div class="hop-chain">${nodes
    .map(
      (n, i) =>
        `<span class="node${i === nodes.length - 1 ? " base" : ""}">${esc(n)}</span>` +
        (i < nodes.length - 1 ? '<span class="arrow"></span>' : ""),
    )
    .join("")}</div></div>`;

/** The three-layer stack in §4. */
function architecture() {
  return (
    `<figure class="diagram">` +
    band("Layer 2 — Asset tokenization · verify · onboard · connect", "the front tier", [
      ["Custody connectors", "OAuth to HuggingFace, SeekClaw, Skills, GitHub, X, Instagram; IPFS for direct uploads"],
      ["Ownership verifier", "identifier → tier: on-chain / verified / attested / reject"],
      ["Metadata resolver", "name, media, adoption metrics from the custodian API"],
      ["Market selector", "curve mode + settlement currency per asset class"],
    ]) +
    flow("deploy(owner, proof, uri, curveMode, currency, salt)") +
    band("Layer 1 — Token launch platform · permissionless", "one pool per asset", [
      ["Factory", "CREATE2 deploy, predicts the coin address"],
      ["Coin — ERC-20", "mints 1B: 1% to the owner, 99% to the hook"],
      ["Curve registry", "poolConfig bytes per mode; pays its author 0.01%"],
      ["Currency registry", "admitted settlement assets; one hop from base"],
      ["Hook", "afterInitialize mints the ladder · beforeSwap sets the dynamic fee · afterSwap splits it"],
      ["Router", "native-AVAX entry, passes trade referrer to the hook"],
    ]) +
    flow("initialize(poolKey, sqrtPrice) · mint 31 single-sided positions") +
    band("Uniswap v4 PoolManager · singleton", "settlement", [
      ["Pool", "one per asset, dynamic-fee flag, tick spacing 200"],
      ["Ladder + tail", "nested positions to the discovery top, one tail to MAX"],
      ["Fee accrual", "collected on every swap, routed back to the hook"],
      ["Quoter", "the only price source; simulated per quote"],
    ]) +
    `<figcaption>Two layers over the Uniswap v4 singleton, read top-down.</figcaption>` +
    `</figure>`
  );
}

/** The one-hop / chained-pair comparison in §6. */
function hops() {
  return (
    `<figure class="diagram hops">` +
    hopRow("One hop", ["asset coin", "AVAX"], true) +
    hopRow("Chained pairs", ["asset coin", "another coin", "protocol token", "base asset"], false) +
    `<figcaption>A coin is never deeper than the asset it settles against, so every ` +
    `link in the chain is a ceiling.</figcaption>` +
    `</figure>`
  );
}

/** The six-way fee split in §6. */
function splitbar() {
  const segs = [
    ["Liquidity", 20],
    ["Creator", 50],
    ["Platform", 20],
    ["Owner", 5],
    ["Referrer", 4],
    ["Curve", 1],
  ];
  const label = segs.map(([n, p]) => `${n.toLowerCase()} ${p}%`).join(", ");
  return (
    `<figure class="diagram">` +
    `<div class="splitbar" role="img" aria-label="The 1% fee splits into ${label}">` +
    segs
      .map(
        ([name, pct], i) =>
          `<div class="seg a${i + 1}" style="flex:${pct}">` +
          `<span>${esc(name)} ${pct}%</span></div>`,
      )
      .join("") +
    `</div>` +
    `<figcaption>One 1% pool fee, six destinations. The liquidity share is ` +
    `re-minted and never leaves.</figcaption>` +
    `</figure>`
  );
}

const FIGURES = [
  { match: (b) => b.includes("LAYER 2") && b.includes("PoolManager"), render: architecture },
  { match: (b) => b.includes("one hop") && b.includes("chained pairs"), render: hops },
  { match: (b) => b.includes("LIQUIDITY 20%") && b.includes("CREATOR 50%"), render: splitbar },
];

/** Returns diagram markup for an ASCII block, or null to fall back to <pre>. */
export function figureFor(block) {
  const hit = FIGURES.find((f) => f.match(block));
  return hit ? hit.render() : null;
}
