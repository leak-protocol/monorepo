# leak.ai — static export

Every local file needed to serve the app from any static host. Three scripts
still come from unpkg at runtime — see "Network dependencies" below.

```
static-export/
├─ index.html      ← the app (413 KB): markup, styles, and all 11 SDK modules
├─ support.js      ← the component runtime
├─ uploads/        ← 114 media assets
└─ _ds/            ← design-system tokens, stylesheet, bundle, and 11 font files
```

## Serve it

**Do not open `index.html` directly** — a `file://` page cannot connect a wallet.
MetaMask only injects `window.ethereum` on `http://localhost` or `https://`, so on
`file://` the app finds no provider and falls back to the demo account. `fetch()`
is also CORS-blocked there (the AVAX price falls back to its cached quote), and
X's OAuth redirect needs a real origin for its callback URI.

**Simplest local run** — any static server over localhost works:

```bash
cd static-export
python3 -m http.server 8080     # then open http://localhost:8080
```

```bash
npx serve .                     # or this
```

**nginx**

```nginx
server {
    listen 80;
    server_name leak.local;          # or your domain
    root /var/www/leak-ai;           # this folder
    index index.html;
    location / { try_files $uri $uri/ /index.html; }
}
```

That serves fine and MetaMask still injects over plain HTTP. One caveat: a
non-localhost `http://` origin is **not a secure context**, so `crypto.subtle` is
unavailable and the X OAuth PKCE flow throws (the copy-callback button also
needs `navigator.clipboard`). Wallet connect, trading, and tokenize all work
regardless.

| Origin | Wallet + trading | X OAuth |
|---|---|---|
| `file://` | ✗ no provider | ✗ |
| `http://localhost:8080` | ✓ | ✓ |
| `http://<ip-or-domain>` | ✓ | ✗ not a secure context |
| `https://<domain>` | ✓ | ✓ |

So put TLS in front of nginx (Let's Encrypt) if you need the real X login;
otherwise plain HTTP is enough for the wallet and market flows.

**Anything else** — drop the folder on Netlify, Vercel, S3, GitHub Pages, or run
`python3 -m http.server` inside it. No server-side code is involved.

Verified at export: 1,176 nodes render, all 11 declared font faces resolve, no broken images,
and every runtime asset path resolves (45 on the market list, plus the KYC tier
ticks) — checked by HEAD request from the served page, not by inspection.

## Network dependencies — the folder is NOT offline-complete

Three scripts load from unpkg — two injected at runtime by `support.js`, one
declared in `index.html`:

    react@18.3.1/umd/react.production.min.js           ← support.js
    react-dom@18.3.1/umd/react-dom.production.min.js   ← support.js
    lightweight-charts@4.2.0/…standalone.production.js ← index.html

(`support.js` also references `@babel/standalone`, but this app never triggers
it — verified `window.Babel` is undefined on a fully loaded page.)

**Without network access the page renders blank.** The whole UI is mounted by
that CDN React — `support.js` has nothing to mount without it — so this is not
a degraded mode, it is a non-starter. The same applies to a proxy that blocks
unpkg: all three share one host, so blocking it takes out React, not just charts.

There is no crash and no error message, which makes the failure easy to
misdiagnose: you get an empty page and a clean console.

### Making it genuinely self-contained

The runtime has a documented override hook, so **no generated file needs
editing**. `support.js` resolves its CDN scripts through:

    function cdnScriptFor(url, sri) {
      const v = window.__resources?.[url];
      return v ? { src: v } : { src: url, integrity: sri };
    }

When a mapping exists it returns `{ src }` with **no `integrity` key**, so SRI
never applies on this path — there is nothing to drop or recompute.

1. Download the three files into `vendor/`.
2. Add this **before** the existing `<script src="./support.js">` in
   `index.html`:

   ```html
   <script>
   window.__resources = {
     "https://unpkg.com/react@18.3.1/umd/react.production.min.js": "vendor/react.production.min.js",
     "https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js": "vendor/react-dom.production.min.js"
   };
   </script>
   ```

3. Repoint the `lightweight-charts` `<script src>` in `index.html` to
   `vendor/lightweight-charts.js`. That one is a plain tag with no integrity
   attribute, so it really is a path swap.

Do **not** edit `support.js` — its first line reads `GENERATED … do not edit`,
so any change there is lost when the runtime is regenerated. The same
`__resources` map also covers Babel, stylesheets, and child components, and
`window.__resourceBlobs` is the Blob-based equivalent the single-file build uses
to vendor React.

Until you do this, serve the folder somewhere with outbound HTTPS to unpkg.

## Contents of `uploads/`

- **84 pixel variants** — `pixv-{agent,skill,model,dataset,github,post,instagram}-0..11.png`,
  the per-class token marks. Assignment is by rank within a class, so no two
  markets of one class repeat until the class exceeds 12.
- **7 base pixel marks** and **5 base-pair coin icons** (AVAX, USDC, NVDA, SPCX, HYPE)
- **4 punk stills**, **2 GIF clips** with poster frames, the eye logo, and the
  GitHub / X / Hugging Face / claw source marks

## Notes

- MetaMask connects for real, restricted to Avalanche Fuji (43113) and C-Chain
  mainnet (43114). The wallet layer is read-only — no signing path exists, so
  nothing can prompt for a transaction.
- An unfunded account falls back to a demo balance, tagged `DEMO` in the UI.
- The AVAX price widget calls CoinGecko and falls back to a cached quote offline.
- X linking is redirect-OAuth only. It needs a client id from developer.x.com
  entered once in the X modal; the callback URI is derived and shown to copy.
  A demo account is available for recording without credentials.

## Rebuilding

`index.html` is `leak.ai.dc.html` with the 11 `src/sdk/` modules inlined into its
logic block. They must be inlined rather than left as `<script src>` tags,
because the runtime evaluates the logic class before deferred scripts resolve.
Re-run that step after editing anything under `src/sdk/`.
