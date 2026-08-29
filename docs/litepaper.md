# Leak Protocol — Litepaper

*A permissionless platform to tokenize everything.*

Digital RWA · Avalanche C-Chain · Uniswap v4

---

## 1. Overview

Any digital asset with a provable owner becomes a token with a live market, in
one transaction, for about a cent.

**Digital RWA** is the asset class: real assets, real owners, real demand
signals, no legal wrapper. Media and social interaction came first, GitHub made
code an addressable unit, and **AI assets** — agents, skills, models, datasets —
changed the shape of the category. Each is independently owned, independently
forked, independently measured. None has a price.

Leak Protocol is two layers, and the front tier is the one that matters to a
user. The **asset tokenization layer** classifies a digital asset, proves who owns
it through the platform that already custodies it, and mints against that proof.
It also picks what the market settles in.

Beneath it, a **token launch platform** mints supply straight into a single
Uniswap v4 pool — tradable in the next block, no bonding-curve phase, no
graduation threshold, no migration. That layer is permissionless: any platform can
tokenize through it without an agreement and without depending on a server Leak Protocol
Protocol operates. Curve shape and pair
currency are both parameters, so each asset class gets a market built for it, and
every trade splits across five roles on-chain.

| | |
|---|---|
| **$0.01** | cost to open a market |
| **0s** | wait before the first trade |
| **5** | roles paid from one 1% fee |
| **0.198%** | of graduation-model launches ever reach a market |

---

## 2. Why now

### AI assets are produced faster than they can be funded

Agents, skills, models and datasets became individually addressable products in
under two years, and each has a venue: agents on
[SeekClaw](https://www.seekclaw.com), skills on [Skills](https://www.skills.sh/),
models and datasets on [HuggingFace](https://huggingface.co) — forked,
fine-tuned, benchmarked and re-published in the open by people who are not
employed to do it and are not paid when it works.

[Virtuals Protocol](https://www.virtuals.io/) settled the demand side: people
will buy a token representing an AI agent. The gap is on the supply side — the
builders producing these assets have no instrument that converts adoption into
capital at their size.

### Graduation is failing, measurably

Every mainstream launchpad holds a token on a private curve until reserves cross
a fixed threshold, then migrates it to a real AMM.

| Sample | Launches | Graduated | Rate |
|---|---:|---:|---:|
| Sept–Oct 2025 | 655,770 | ~4,130 | 0.63% |
| **8 May – 10 Jun 2026** | 832,941 | ~1,650 | **0.198%** |

*[PumpDotFun](https://pump.fun/) launches. 2026 figure: Wilson 95% CI
0.189–0.208%. A 3.18× decline in eight months.*

> **~831,300** assets paid the launch cost and died inside a curve: priced by a
> formula, with liquidity that could not leave. The threshold is not a quality
> filter. It is a minimum viable size, and it sits far above where most assets
> live.

It persists because it is load-bearing. Graduation funds the migration: the curve
accumulates reserves, the reserves seed the pool, and the threshold is where
reserves finally cover the flat cost of moving them. Lower it and that cost is
paid on tokens whose lifetime fees never repay it. Remove it and the curve phase
has no purpose — which deletes the pricing engine, the reserve custody and the
graduation event the model is built around.

The design's grip is visible in its successors. [Bags](https://bags.fm/) rebuilt
the creator economics on top of it — mandatory, perpetual fee sharing configured
at launch — and kept the curve and the migration intact, because removing them
removes the product.

Leak Protocol has no threshold because it has no migration. Supply is minted directly into
the pool as single-sided liquidity, so no counter-currency is needed to open a
market and the entire cost is one transaction.

### RWA arrived, but only at one end

Tokenized real-world assets crossed $3B on Avalanche — securities, credit and
funds, behind institutional compliance. The long tail of digital assets received
none of it, because every step of that pipeline assumes a legal wrapper.

---

## 3. Digital RWA

The segment has an observable boundary: **the asset has a verifiable owner and no
legal wrapper.**

| Class | Platform | Ownership proven by | Public signal |
|---|---|---|---|
| **Agent** | [SeekClaw](https://www.seekclaw.com) | platform auth | usage, installs |
| **Skill** | [Skills](https://www.skills.sh/) | platform auth | installs |
| **Model, dataset** | [HuggingFace](https://huggingface.co) | platform auth | downloads, forks |
| Repository | [GitHub](https://github.com) | platform auth | stars, forks |
| Social post | [X](https://x.com/) | platform auth | reach |
| Short media — image, video | Leak Platform IPFS | uploader attestation | views |
| NFT | any chain | **the chain itself** | floor, holders |

These are real assets with real off-chain existence. What no token minted against
them does is convey a legal claim — the token is a market on the asset's
attention, not a share in it.

> **Why the boundary is the design.** Because no Digital RWA carries a legal
> wrapper, none crosses the perimeter that makes institutional tokenization slow,
> expensive and permissioned. The constraint and the capability are the same
> fact: that is what allows this layer to be permissionless.

### What tokenizing gives the owner

A maintainer with 400 stars, an agent developer with 2,000 users, a model author
whose fine-tune gets forked weekly: none can convert adoption into capital at
that size. Grants need an application, sponsorship needs an audience, equity
needs a company.

Tokenizing does it in one transaction — **1% of supply at mint, then 0.50% of
every dollar ever traded, permanently.** No application, no company, nothing to
negotiate, and the stream scales with exactly the thing these builders already
produce.

### What the buyer is buying

The negative first, because it makes the rest credible: not equity, not a revenue
share, not a licence, no governance. It is a position on the asset's attention.
Three properties separate that from a pure punt.

| Property | Why it holds |
|---|---|
| **Something to form a view about** | stars, downloads, installs and reach are published by the custodian, updated continuously, and produced by parties with no stake in the token — an observable series, not a narrative |
| **Owner incentive points the same way** | 0.50% of volume for the life of the market and 1% of supply from mint, with no vesting cliff to sell into — paid for the asset staying interesting, not for exiting it |
| **The exit does not decay** | 20% of every fee is re-minted as liquidity nobody can withdraw, so day-one depth is a floor rather than a peak |

---

## 4. Architecture

Two layers over the Uniswap v4 singleton, and the stack is read top-down.
**Layer 2 is the front tier** — where a user arrives and where an asset becomes a
token. Layer 1 is the settlement tier beneath it: a public primitive that knows
nothing about what a token represents.

```
┌─ LAYER 2 — Asset tokenization ───────────── verify · onboard · connect ─┐
│  Custody connectors    OAuth to HuggingFace, SeekClaw, Skills,          │
│                        GitHub, X; IPFS for direct uploads               │
│  Ownership verifier    identifier → tier: on-chain / verified /         │
│                        attested / reject                                │
│  Metadata resolver     name, media, adoption metrics from custodian API │
│  Market selector       curve mode + settlement currency per asset class │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
        deploy(owner, proof, uri, curveMode, currency, salt)
                                    ▼
┌─ LAYER 1 — Token launch platform ───────────────────── permissionless ──┐
│  Factory           CREATE2 deploy, predicts the coin address            │
│  Coin — ERC-20     mints 1B: 1% to the owner, 99% to the hook           │
│  Curve registry    poolConfig bytes per mode; pays its author 0.01%     │
│  Currency registry admitted settlement assets; one hop from base        │
│  Hook              afterInitialize mints the ladder · beforeSwap sets   │
│                    the dynamic fee · afterSwap splits it                │
│  Router            native-AVAX entry, passes trade referrer to the hook │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
        initialize(poolKey, sqrtPrice) · mint 31 single-sided positions
                                    ▼
┌─ Uniswap v4 PoolManager ─────────────────────── singleton · settlement ─┐
│  Pool          one per asset, dynamic-fee flag, tick spacing 200        │
│  Ladder + tail nested positions to the discovery top, one tail to MAX   │
│  Fee accrual   collected on every swap, routed back to the hook         │
│  Quoter        the only price source; simulated per quote               │
└─────────────────────────────────────────────────────────────────────────┘
```

**Layer 1 is a public primitive.** Every call is built client-side by the SDK: no
API key, no rate limit, no server that can change terms. Any platform can call
`deploy` directly.

**Layer 2 is the reference implementation of the caller.** It holds no privilege
inside layer 1 — it earns the same integrator fee leg as any third party that
builds the same thing.

> **The separation is the point.** A launch platform only its own front end can
> use is an app. One that pays outsiders to build on it, automatically, is a
> layer.

---

## 5. Layer 2 — Asset tokenization

The front tier. Every user arrives here, every asset becomes a token here, and
every market gets the currency it settles in here. The launch platform underneath
(§6) is indifferent to what a token represents — this is the layer that decides
whether any of it is a market or a casino.

| Job | What it does | Why it decides the outcome |
|---|---|---|
| **Verify** | reads ownership from the platform that already custodies the asset | a token bound to a proven owner is a different instrument from a token bound to a name anyone can type |
| **Onboard** | the owner signs in to a platform they already use — no new account, no listing application, no review queue | the acquisition surface is the custodian's existing user base, not ours |
| **Connect liquidity** | selects the settlement currency and curve mode at mint | the pair sets the ceiling on depth and decides who can trade the asset without an extra hop |

### Verification: three tiers, assigned once

| Tier | Custody source | Proof | Strength |
|---|---|---|---|
| **On-chain** | any chain | the connected wallet holds the token | cryptographic |
| **Verified** | [HuggingFace](https://huggingface.co) · [SeekClaw](https://www.seekclaw.com) · [Skills](https://www.skills.sh/) · [GitHub](https://github.com) · [X](https://x.com/) | the custodian's own auth reports the owner | as strong as that platform |
| **Attested** | Leak Platform IPFS | the uploader signs the claim | a claim, labelled as one |
| **Reject** | — | ownership cannot be established | not minted |

The tier is written on-chain and shown wherever the asset appears. Attested is
never described as verification — that distinction is the product, and collapsing
it would make every other claim in this document worthless.

### Liquidity: the settlement currency is a Layer 2 decision

Layer 1 exposes the currency as a parameter (§6). Layer 2 chooses it, per asset class,
and that choice is what connects a coin to capital that already exists rather
than capital that has to be recruited.

| Settlement class | Examples | Status | What it unlocks |
|---|---|---:|---|
| **Native** | AVAX | default | one hop from the chain's base asset; depends on no other market |
| **Flagship crypto** | BTC.b · HYPE | phase 2 | the deepest non-native books, and holders who never had to acquire AVAX first |
| **Tokenized equity** | NVDA · SPCX | phase 2 | denominates the coin in a sector — the coin stops being an absolute bet and becomes a **relative** one |

*The registry admits any ERC-20 that clears a depth floor, under the Layer 1
rules (§6): one hop from the base asset, never the protocol's own token as default.*

> **Why tokenized equity is the interesting one.** An open model quoted in AVAX
> asks whether people like the model. The same model quoted in **NVDA** asks
> whether open weights outperform the chip incumbent — a question with a thesis
> behind it, an existing audience, and a counterparty who already holds the other
> side. An agent quoted against a software-sector asset asks the same about a
> category. That instrument does not exist anywhere today, and nothing about it
> requires new protocol code: it is a currency-registry entry.

### Trust assumptions

| Assumption | Consequence if it breaks |
|---|---|
| Custodian auth reports the true owner | tokens minted through that platform are compromised — blast radius is that platform alone, and the tier is on-chain per asset |
| Ownership at mint is what counts | later transfer, suspension or deletion of the account does not retroactively change the token |
| No tier conveys a legal claim | tokenizing a repository or a model does not transfer, license or encumber it |
| Quotes come only from the on-chain quoter | a pool whose hook affects swaps cannot be priced locally, so integrators need an RPC call per quote |

---

## 6. Layer 1 — Token launch platform

### There is no bonding curve

99% of supply is minted straight into one Uniswap v4 pool as single-sided
liquidity, held by a hook. Price moves because the AMM crosses ticks — no pricing
formula, no reserve contract. The pool opens at the bottom of its range, so every
position is denominated purely in the coin.

Positions are *nested* rather than adjacent: each carries an equal share of coin
over a strictly shorter range ending at a common far tick. Depth is therefore
non-decreasing in price across the discovery band, so `L(t_k) ≥ L(t_k−1)` and the
currency needed to move price by a fixed proportion strictly increases as the
market grows.

| Actor | Entry | Exit | Currency in | Coins out | Cost per +10% |
|---|---:|---:|---:|---:|---:|
| Alice | 1.311e-4 | 2.119e-4 | 964.67 | 5,430,624 | 192 |
| Bob | 2.119e-4 | 3.493e-4 | 4,431.88 | 15,656,279 | 845 |
| Carol | 9.122e-4 | 1.070e-3 | 207,358.40 | 207,386,758 | 123,866 |

*Reference multicurve configuration, reproduced with `tools/curve/`. Currency
units generic.*

Moving price 10% costs Carol **647× what it cost Alice**. Early entry is rewarded
with price, late entry with depth: the book becomes hard to move exactly as it
becomes worth moving.

Above the last discovery tick a single tail position runs to the maximum tick, so
depth goes flat rather than continuing to rise. That tail replaces graduation —
the pool cannot run out of coin at any price. No position is withdrawable, so
liquidity cannot be pulled.

### Both sides of the book

Selling walks the same ladder in reverse. Liquidity at a given tick is identical
in both directions, so a seller near the top meets the deepest part of the book
and impact per coin grows as price falls back toward the opening tick. There is
no redemption path and no reserve to drain: every exit is a swap against the same
pool every entry went through.

> **Solvency invariant.** Currency payable out can never exceed currency paid in,
> less fees already distributed. The pool holds no leverage, borrows nothing, and
> promises nothing it is not already holding. There is no state in which a holder
> is owed something the pool does not have — which is the whole reason the
> protocol can be permissionless about what gets listed.

### Curve modes are data, and their authors are paid

The curve is a `poolConfig` byte string — version, currency, and per-curve arrays
of tick bounds, position counts and supply shares. A new mode is a new
configuration: no contract, no upgrade, no governance vote. That makes curve
design a role rather than an internal decision, and the protocol pays it:
**whoever authors the mode a coin launches with earns 0.01% of that coin's
notional volume for the life of the market.**

| Mode | Status | Shape | Fits |
|---|---|---|---|
| **Multicurve** | default · live | several curve segments blended into one book; deep near spot, steep in the tail | assets with a known reference price — media, posts, repositories |
| **Dynamic Dutch** | planned | price decays each epoch until demand meets it, then ratchets up | assets with no obvious opening price — new models, first-run agents |
| **Lockable multicurve** | live | multicurve plus a permanently locked LP position; signals liquidity cannot be pulled | assets sold on trust — datasets, skills, long support horizons |
| **Fixed price** | planned | one price until the depth target fills, then a flat book; reads like a presale, no discovery | assets with an externally set value — NFTs, licensed models |

### The pair currency is the second parameter

A pool opens single-sided: 100% coin, zero currency. Every unit of the currency
side has to be bought in. So the asset a coin settles against decides who can
trade it without an extra hop, what unit its price is quoted in, and what the
creator is actually paid in. Which makes the pair a ceiling: **a coin can never
be deeper than the asset it settles against.**

```
one hop        asset coin ──► AVAX
chained pairs  asset coin ──► another coin ──► protocol token ──► base asset
```

| Rule | Because |
|---|---|
| **One hop from the base asset** | a coin paired against another launched coin inherits that coin's depth as its ceiling; the weakest link caps everything downstream and routers cannot reliably find the path |
| **Never the protocol's own token as default** | it forces two exposures at once — the asset's move and the token's beta — so a coin can rise against the token and still fall in dollars, and the whole market becomes a leveraged position on the protocol |
| **Denomination is a product decision** | against a stable unit the coin is an absolute bet; against a sector asset it is a relative one |

> **The case worth building for.** A Digital RWA quoted against the asset class it
> competes with. An open model priced against a chip-sector asset asks whether the
> open model outperforms the incumbent. An agent priced against a software-sector
> asset asks the same about a category. That is a legible thesis rather than a
> punt, and it falls straight out of currency being a parameter instead of a
> constant.

Phase 1 settles everything in native AVAX. The field is in the pool config from
the first block, so opening it later is a registry change, not a migration.

### The launch fee pays the creator

The pool runs a dynamic fee: 99% at creation, decaying linearly to 1% over 30
seconds. It is a *pool* fee, so none of it is burned — it flows into the same
distribution as any other trade.

| t | 0s | 3s | 15s | ≥30s |
|---|---:|---:|---:|---:|
| fee | 99.00% | 89.20% | 50.00% | 1.00% |

**Dana buys at t = 3s with 100 AVAX · fee 89.20%**

| Destination | AVAX |
|---|---:|
| Re-minted as permanent liquidity | 17.84 |
| Creator | 44.60 |
| Platform that created the coin | 17.84 |
| Platform owner | 4.46 |
| Trading referrer | 3.57 |
| Curve owner | 0.89 |
| Dana's actual purchase | 10.80 |

Sniping inside the launch window is a transfer from the sniper to the creator and
to permanent liquidity. There is no anti-bot heuristic in the protocol — bots are
made to pay for the launch. The creator's own first buy is exempt: a transient
flag charges them 1%, which is why deploy and first buy are a single transaction.

### Five roles, one fee

```
│ LIQUIDITY 20% │      CREATOR 50%      │ PLATFORM 20% │ 5% │4%│1%│
                                          owner  referrer  curve
```

| Role | Notional | Per $1M volume | Paid for |
|---|---:|---:|---|
| Permanent liquidity | 0.20% | $2,000 | re-minted, unwithdrawable — depth grows with volume |
| **Creator** | 0.50% | $5,000 | owning the asset |
| **Third-party platform** | 0.20% | $2,000 | bringing the asset |
| **Platform owner** | 0.05% | $500 | running the protocol |
| **Trading referrer** | 0.04% | $400 | bringing the trade |
| **Curve owner** | 0.01% | $100 | designing the market's shape |

Multi-recipient fee routing is proven, not speculative: Bags has settled over
**$5B** of cumulative volume with fee sharing made mandatory at launch, paid to
designated recipients in perpetuity. The difference here is *what the recipients
are*. Bags splits to wallets a creator names. Leak Protocol splits to **roles defined by a
function performed** — and one of them has no analogue anywhere: no other
launchpad pays for the shape of the market, because no other launchpad lets the
shape vary.

**The re-minted 20% never leaves.** An asset's liquidity becomes a function of
volume already done rather than of anyone's continued willingness to provide it.
**The third-party leg is the business model:** a platform tokenizing its assets
through Leak Protocol earns 0.20% of notional on everything it brings, with no agreement
to sign and no revenue share to invoice.

An asset doing $50,000 of lifetime volume returns $250 to its owner, $100 to that
platform, $25 to the protocol, $5 to the curve author, and adds $100 of liquidity
that can never be removed — against a $0.01 launch cost.

---

## 7. Related work

| Protocol | Unit tokenized | Ownership proven | Tradable at listing | Curve shape | Fee recipients |
|---|---|---|---|---|---|
| [Pump.fun](https://pump.fun/) | a name | no | no — 85 SOL threshold | fixed | creator, 0.05% |
| [Bags](https://bags.fm/) | a name + social | no | no — DBC migration | fixed (Meteora DBC) | creator + named wallets, 1% |
| [Virtuals Protocol](https://www.virtuals.io/) | an agent | no | no — 42,000 VIRTUAL | fixed | protocol |
| [Clanker](https://clanker.world/) | a string | no | yes | fixed | protocol, 20% of LP fees |
| [Zora](https://zora.co/) | a post in Zora | Zora profile | yes | closed endpoint | creator |
| [The Arena](https://arena.social/) | a social account | Arena account | no — curve first | fixed | creator |
| **Leak Protocol** | **a custodied asset** | **yes, by its custodian** | **yes** | **a parameter** | **five protocol roles, incl. the curve author** |

**Pump.fun** created this category and still defines it. Roughly **75–80% of all
Solana launches** run through it, and the bonding-curve-then-migrate design that
every launchpad here inherits — including the ones that criticise it — is its
contribution. The argument in §2 is aimed at the threshold, not at the model:
without Pump.fun there is no reference point for what a permissionless launch
looks like at all. It revised its creator fee schedule in January 2026 after a
volume spike exposed how thin the original incentive was, at 0.05% of trading
fees.

**Bags** is the closest existing work on fee routing, and the reason a five-way
split is an extension rather than a leap. Live since May 2025 on Meteora's
dynamic bonding curve, it makes fee-sharing configuration *mandatory at launch*:
1% of trading volume flows to designated recipients in perpetuity, and a creator
can name additional claimers. Over **$5B** in cumulative on-chain volume. What it
does not do is bind the token to anything but a social account, remove the curve
and the migration, or pay anyone for designing the market — the curve is
Meteora's, and it is the same curve for every token launched.

**Virtuals Protocol** proved demand for agent tokens but tokenizes agents only,
and its curve is a constant. **Clanker** dropped the threshold and the ceremony —
deploy an ERC-20 from a sentence, take 20% of pool-level LP fees, over $8B
cumulative volume — but makes no claim about what the token represents. A
deployer, not a tokenization layer.

**Media-coin launchpads** are the closest existing category, and threshold-free
launching is not claimed here as an invention — that pattern has already shipped.
What none of them do is bind a coin to an asset held by a platform they do not own,
expose curve shape as a caller-supplied parameter, or let an integrator build
without routing through their infrastructure. Those three are where Leak Protocol
differs, and they are the only claims made here.

**The Arena** is the evidence the audience exists on this chain: 200,000+
registered users, $450M+ volume and 35,000+ AVAX in fees within two months of
relaunch, from a curve launchpad inside a social feed. A candidate integrator,
not a competitor.

> **Delta, stated narrowly.** Ownership proven against third-party custodians ·
> curve shape as a per-class parameter whose author is paid · fee routing
> extended from creator-named wallets to **protocol roles, one of which is the
> market designer** · no protocol-operated server in the integration path.

---

## 8. Parameters

| Parameter | Value | Note |
|---|---:|---|
| Total supply | 1,000,000,000 | fixed at mint, no further issuance |
| To market as liquidity | 99% | held by the hook, unwithdrawable |
| To creator at mint | 1% | transferable immediately |
| Pool fee | 1.00% | dynamic flag, hook-controlled |
| Launch fee | 99% → 1% | linear decay over 30s |
| Tick spacing | 200 | |
| Discovery positions per curve | 11 | reference config: 3 curves |
| LP positions minted | 34 → 31 | after overlap dedupe |
| Backing currency | AVAX | native; parameterised for future pairs |
| Deploy cost | ~7M gas | 0.00035 AVAX at 0.05 gwei |

Two invariants are enforced on-chain at deploy: the sum of discovery supply
shares must be strictly below 100% of supply, and total positions must fall
between 2 and 200. Violations revert.

---

## 9. Roadmap

Phase 1 ships the primitive and proves it by being its own first caller. Phase 2
widens what can be tokenized and what it can be priced in. Nothing in phase 2 is
required for the protocol to function.

### Phase 1 — Both layers live on mainnet

| | |
|---|---|
| **Layer 1** | Permissionless launch platform on Avalanche mainnet. Multicurve and lockable multicurve live, five-way fee split settling on-chain, curve and currency registries deployed. Anyone can call `deploy` without asking. |
| **Layer 2** | Custodian-verified tokenization for **Agents**, **Skills**, **GitHub repositories**, **X posts** and **Short Media** — ownership proven at mint, tier written on-chain. |
| **SDK** | **Both layers published as open interfaces.** A third party can launch a market through Layer 1 and verify ownership through Layer 2 from their own front end, building every call client-side — no API key, no allowlist, and no server operated by Leak Protocol anywhere in the path. |
| **Assurance** | Third-party audit published; contracts verified on the explorer. |

### Phase 2 — Wider assets, wider money

| | |
|---|---|
| **Layer 1** | Dynamic Dutch and Fixed price modes. **Curve authoring opened as a public role** — anyone can publish a mode and earn 0.01% of the notional volume of every coin launched with it. |
| **Layer 2** | **HuggingFace** models and datasets; **NFT**. |
| **Currency** | Settlement opened well beyond AVAX: **USDC** for a stable unit, **BTC.b** and **HYPE** for the deepest crypto books, and **tokenized equities** — NVDA, SPCX — so an asset can be quoted against the sector it competes with. |
| **Governance** | LEAK admitted as an *optional* pair currency. Never the default, for the reason given in §6. |
