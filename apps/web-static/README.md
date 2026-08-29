# leak.ai — static export

Everything needed to serve the app from any static host.

```
static-export/
├─ index.html      ← the app (325 KB): markup, styles, and all 10 SDK modules
├─ support.js      ← the component runtime
├─ uploads/        ← 97 media assets
└─ _ds/            ← design-system tokens, stylesheet, bundle, and 11 font files
```

## Serve it

**nginx**

```nginx
server {
    listen 80;
    root /var/www/leak-ai;   # this folder
    index index.html;
    location / { try_files $uri $uri/ /index.html; }
}
```

**Anything else** — drop the folder on Netlify, Vercel, S3, GitHub Pages, or run
`python3 -m http.server` inside it. No server-side code is involved.

Verified at export: 997 nodes render, all six font faces load, no broken images,
and all 91 runtime asset paths resolve.

## Why assets are files rather than one inlined bundle

A single-file build of this app is 5.3 MB, because the bundler stores every asset
as a base64 payload and unpacks it in JavaScript before first paint — slow enough
to time out a 10 s load budget. Serving the assets as files instead gives a
325 KB document that paints immediately, loads assets in parallel, and lets the
browser cache them between visits. Keep the four entries above together and the
relative paths resolve.

## Contents of `uploads/`

- **72 pixel variants** — `pixv-{agent,skill,model,dataset,github,post}-0..11.png`,
  the per-class token marks. Assignment is by rank within a class, so no two
  markets of one class repeat until the class exceeds 12.
- **6 base pixel marks** and **5 base-pair coin icons** (AVAX, USDC, NVDA, SPCX, HYPE)
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

`index.html` is `leak.ai.dc.html` with the 10 `src/sdk/` modules inlined into its
logic block. They must be inlined rather than left as `<script src>` tags,
because the runtime evaluates the logic class before deferred scripts resolve.
Re-run that step after editing anything under `src/sdk/`.
