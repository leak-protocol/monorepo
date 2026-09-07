# Leak Protocol

*The AI-first Digital RWA tokenization platform on Avalanche.*

---

## 1. Overview

**An independent, permissionless tokenization layer. Prove ownership, get a market — same transaction.**

- **Ownership first** — proven through the platform that already custodies the asset. No new account, no listing application
- **Launch and trade in one step** — supply goes into a single Uniswap v4 pool for about a cent. No curve phase, no graduation threshold, no migration
- **The curve is a parameter** — shape, fee and settlement currency set per asset class by a v4 hook
- **AI first** — agents, models and datasets lead; repositories, posts and media follow
- **Many markets, medium TVL each, an active lifecycle** — not one launch spike

---

## 2. Problems

**Graduation gates the market. Of 832,941 pump.fun launches in a month, 0.198% ever traded.**

```figure:graduation```

- **The rest never got a life.** Priced by a formula, liquidity that could not leave, no market at any point. Down 3.18× in eight months
- **Knowledge compounds faster than it can be funded.** Agents, models and datasets gain value weekly; nothing tokenizes an intellectual asset at that size
- **Small and medium projects have no instrument.** Grants need an application, sponsorship needs an audience, equity needs a company
- **The venues are fragmented, and each is locked to one unit.** pump.fun tokenizes a name · bags.fm a name plus a social · zora.co a post inside Zora · daos.fun a fund · flyingtulips its own venue. Every one ships its own curve and its own front end, and none of them can be called by anyone else
- **Modelling an asset and tokenizing it are separate jobs.** No one has split them, so every platform rebuilds both

---

## 3. What we tokenize

**Digital RWA: a real asset with a verifiable owner, held natively on the platform that hosts it.**

| Class | Ownership proven by | Public signal |
|---|---|---|
| **Agents, models, datasets** | platform auth | usage, installs, downloads |
| **Repositories** | platform auth | stars, forks |
| Posts, short media | platform auth | reach, views |
| NFT | the chain itself | floor, holders |

- The token is a position on the asset's **attention** — not equity, not revenue share, no governance
- The signal is published by the custodian, continuously, by parties with no stake in the token
- Ownership is established by the custodian's own auth, so no off-chain paperwork sits between an asset and its market. That is what lets this layer be permissionless

---

## 4. How it works

**Layer 2 decides what a token means. Layer 1 makes it tradable. Neither works without the other.**

```figure:layers```

- **Layer 2 — Leak Digital RWA Tokenization.** Proves ownership against the custodian, resolves metadata, and picks the curve and settlement currency for the asset class. This is where a token stops being a string and starts being a claim on something
- **Layer 1 — permissionless launch.** Mints the coin, opens the pool, splits the fee. Built client-side: no API key, no allowlist, no server in the path
- **Third parties sit at Layer 2 too** — meme launches, launchpads, auctions, creator coins — and earn the same 0.20%. Ours holds no privilege theirs does not

---

## 5. Revenue

**One revenue stream, distributed on-chain to everyone who made the market exist.**

```figure:feesplit```

- **0.50% to the owner** for the life of the market — no vesting cliff to sell into
- **0.20% re-minted as liquidity nobody can withdraw**, so depth grows with volume
- **0.20% to any platform that brings an asset** — no agreement to sign, no revenue share to invoice
- Leak takes 0.25% as the front end, 0.05% when a third party is. **No token is required for the protocol to run**

---

## 6. Why Avalanche

**One app on this chain cleared $450M in two months.**

| First two months after relaunch | |
|---|---:|
| Registered users | 200,000+ |
| Trading volume | $450M+ |
| Fees | 35,000+ AVAX |

- Roughly $225M a month, from a curve launchpad inside a social feed. The audience is already here
- **The chain is already pushing this direction** — founding member of the Agentic Payments Alliance, ecosystem workshops on agent payments, and a DeFAI product tokenizing AI agents
- **Tokenization is accelerating**: RWA transfer volume reached **$365M in 30 days**, up 360% month on month, and 724 tokenized US equities went live here
- Those equities matter twice: as assets to tokenize, and as **settlement currencies** an asset can be priced against
- Complementary, not competing: that app holds the creator relationship, Leak holds the asset

---

## 7. Why Leak, and why not anyone else

**Everyone else needs the curve. Removing it removes their product.**

```figure:twosides```

- **The curve exists to fund the migration.** It collects currency until there is enough to cover the cost of moving into a real pool — that point is the threshold
- **So it cannot be removed.** Take out the curve and the pricing engine, the reserve custody and the graduation event go with it. **bags.fm** rebuilt creator economics on top of this design — **$5B of cumulative volume** — and still kept the curve and the migration intact
- **We never needed one.** Minting only the coin side means the first buyer brings the currency. No collection phase, nothing for a threshold to pay for
- **And it is one platform, not a fork per use case.** Two layers: tokenization above, permissionless launch below — each extends without touching the other

---

## 8. GTM

**We are not starting from zero. The team, the product and the community are already in place — the plan is to ship on top of them.**

- **A team that has shipped this before.** Spot and perpetuals, launchpads, NFT marketplaces, AI agents — built, launched and operated. Nothing here is a first attempt
- **A product that ships in slices.** Permissionless launch first, then verification, then issuer checks. Each one goes live on its own, so there is no single launch date to miss
- **A community that already exists.** The first markets and the first reach come from people who asked for this product, not from paid acquisition
- **Points before mainnet.** Verifying an asset, opening a market, referring an issuer — actions, not signatures. They set the launch queue, and TGE and revenue sharing settle against the same record
- **Then the ecosystem.** Everything above we do alone; the next slide is the part we cannot

---

## 9. Working with the ecosystem

**A launch layer compounds with what is already here. Four places where that compounding starts.**

- **Composability with existing products** — any Avalanche protocol can call the launch layer and keep 0.20% of what it brings, with no agreement to sign and nothing to integrate on our side
- **Existing on-chain assets become listable** — a currency-registry entry, not new protocol code, so assets already trading here gain a second venue rather than losing one
- **AI projects first** — the chain is already building agent payments and DeFAI; those are exactly the assets this platform is built to price
- **A first cohort from inside** — the ecosystem's own creators, KOLs and projects opening the first markets, with ecosystem reach at mainnet

---

## 10. Roadmap

**Testnet builds the queue. Mainnet opens it.**

| **Phase 1 — Testnet** | Layer 1 live · Layer 2 for agents, skills, repositories, X, Instagram, short media · SDK published · waitlist scored by points |
|---|---|
| **Phase 2 — Mainnet** | Audit published · light issuer verification · first markets open |
| **Phase 3 — Scale** | HuggingFace models and datasets · full KYB · settlement beyond AVAX · curve authoring opened to anyone |

**Where it stands today**

| Contracts | **244 / 246** tests green against a pinned Avalanche fork |
|---|---|
| Off-chain | Two SDKs, subgraph, API, web app, Docker stack |
| Layer 2 · Audit · Mainnet | specified, not built · not started · **not deployed** |

---

## 11. Team

| | |
|---|---|
| Aaron | Founder |
| Henry | Co-Founder |
| Oliver | Head of Growth |
| Balwin | Head of Contract |
| AllSky | Head of UI/UX |
| GetLeft | Head of Social |

- Built, shipped and operated **spot and perpetuals, launchpads, NFT marketplaces and AI agents** — every category this protocol draws on
