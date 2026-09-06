# Leak Protocol

*The AI-first Digital RWA tokenization platform on Avalanche.*

---

## 1. Overview

**Any owned digital asset becomes a live market in one transaction, for about a cent.**

- Ownership is proven against the platform that already holds the asset — no new account, no listing application
- Supply is minted straight into one Uniswap v4 pool, tradable in the next block
- **AI first**: agents, models and datasets lead. Repositories, posts and media follow on the same rails

---

## 2. The problem

**0.198% of launches ever reach a market.**

```figure:graduation```

- 832,941 launches in one month; about 1,650 opened a real market. Down 3.18× in eight months
- The rest paid to launch, then sat priced by a formula with liquidity that could not leave
- **The threshold is not a quality filter. It is a minimum size**, far above where most assets live

---

## 3. What we tokenize

**Digital RWA: a real asset, a verifiable owner, no legal wrapper.**

| Class | Ownership proven by | Public signal |
|---|---|---|
| **Agents, models, datasets** | platform auth | usage, installs, downloads |
| **Repositories** | platform auth | stars, forks |
| Posts, short media | platform auth | reach, views |
| NFT | the chain itself | floor, holders |

- The token is a position on the asset's **attention** — not equity, not revenue share, no governance
- The signal is published by the custodian, continuously, by parties with no stake in the token
- No legal wrapper means no compliance perimeter. That is what lets this layer be permissionless

---

## 4. How it works

**Two layers. The lower one is a public primitive anyone can call.**

```figure:layers```

- **Layer 2** reads ownership from the custodian and picks the curve and settlement currency
- **Layer 1** mints the coin and opens the pool. Every call is built client-side: no API key, no allowlist, no server in the path
- Curve shape and currency are parameters, so a meme launch, a launchpad, an auction and asset tokenization all use the same layer

---

## 5. Fees

**One 1% trading fee, split six ways, settled on-chain per swap.**

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
- Tokenized RWA crossed **$3B** on Avalanche, but only behind institutional compliance. The long tail received none of it
- Complementary, not competing: that app holds the creator relationship, Leak holds the asset

---

## 7. Why nobody removed the threshold

**It persists because it is load-bearing. A market needs two sides, and everyone else collects the second side before opening.**

```figure:twosides```

- **Graduation funds the migration.** The curve accumulates reserves, the reserves seed the pool, and the threshold is exactly where reserves finally cover the flat cost of moving them
- **Lower the threshold** and that cost is paid on tokens whose lifetime fees never repay it
- **Remove it** and the curve phase has no purpose — which deletes the pricing engine, the reserve custody and the graduation event the whole model is built around
- The grip shows in the successors: the strongest recent entrant rebuilt creator economics on top of this design, **$5B of cumulative volume**, and kept the curve and the migration intact
- Minting only the coin side removes all three at once. The first buyer brings the currency, so there is no collection phase and nothing for a threshold to pay for

---

## 8. Go to market

**Five levers. The last one has the highest ceiling, and none of it is money.**

- **Ship the product in slices.** Permissionless launch first, then verification, then issuer checks. Each slice goes live and gets used on its own — no big-bang launch to coordinate, and every slice is a fresh reason for someone new to arrive
- **Waitlist, contributor points, then TGE and revenue sharing.** Points accrue before mainnet for actions rather than signatures — verifying an asset, opening a market, referring an issuer, providing the first trades. They set queue order on day one, and they are the record both settle against
- **Operating range, lean team, low cost base.** Launchpads, DEXs, perpetuals and NFT markets already built and run. Five people can operate all three tiers because the team has operated each of them before, and the cost base is small enough that trading fees cover it
- **Virality from a community that already exists.** The first markets and the first reach come from people who asked for this product, at zero acquisition cost
- **Close collaboration with the Avalanche Foundation** — media and an accelerator programme connecting into the ecosystem. This is the lever that matters most, and the next slide is what it unlocks

---

## 9. The ask

**Introductions, not money.**

- **Introductions across the ecosystem** — a permissionless launch platform other Avalanche products can call and earn 0.20% from, without an agreement to sign
- **Assets already live here become admissible** — existing on-chain assets tokenize or trade through Leak, so the two compound instead of competing
- **A first cohort from inside** — the ecosystem's own KOLs, creators and projects opening the first successful markets
- **AI projects on Avalanche first** — maximum support for tokenizing the chain's leading AI assets, which is the class this platform prioritises
- **Co-marketing at mainnet** — ecosystem reach at the moment the first markets open

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
| Balwin | Head of Contract |
| AllSky | Head of UI/UX |
| GetLeft | Head of Social |

- Built and run **launchpads, DEXs, perpetuals and NFT marketplaces** — the four categories this protocol sits between
- Operating cost is a handful of contracts and an indexer
