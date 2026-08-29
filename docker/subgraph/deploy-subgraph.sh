#!/bin/sh
# Renders the manifest against REAL addresses, then deploys to graph-node.
#
# The subgraph.yaml committed in the repo has address 0x000...0 and startBlock 0 —
# rendered with --allow-unset so codegen and tests work without a deployment.
# Deploying it unmodified indexes nothing, which is why this render step is
# mandatory rather than decorative.
set -eu

GRAPH_NODE="${GRAPH_NODE:-http://graph-node:8020}"
IPFS_URL="${IPFS_URL:-http://ipfs:5001}"
SUBGRAPH_NAME="${SUBGRAPH_NAME:-leak/subgraph}"
VERSION_LABEL="${VERSION_LABEL:-v0.0.1}"
RUNTIME_DIR="${RUNTIME_DIR:-/runtime}"

# local profile: the deployer writes addresses to the shared volume.
# mainnet profile: addresses come from compose environment variables.
if [ -f "$RUNTIME_DIR/addresses.env" ]; then
  echo "== doc dia chi tu $RUNTIME_DIR/addresses.env =="
  . "$RUNTIME_DIR/addresses.env"
fi
export LEAK_FACTORY LEAK_COIN_HOOK LEAK_START_BLOCK

: "${LEAK_FACTORY:?LEAK_FACTORY bat buoc (deployer chua chay, hoac chua dat trong .env)}"
: "${LEAK_COIN_HOOK:?LEAK_COIN_HOOK bat buoc}"
: "${LEAK_START_BLOCK:=0}"
echo "factory=$LEAK_FACTORY hook=$LEAK_COIN_HOOK startBlock=$LEAK_START_BLOCK"

# graph-node mat vai chuc giay moi nghe cong 8020. Doi bang vong lap thay vi
# healthcheck, de khong phai doan xem anh graph-node co curl/wget hay khong.
echo "== cho graph-node =="
i=0
until node -e "
fetch('$GRAPH_NODE', {method:'POST', headers:{'content-type':'application/json'},
  body: JSON.stringify({jsonrpc:'2.0',id:1,method:'subgraph_reassign',params:{}})})
  .then(()=>process.exit(0)).catch(()=>process.exit(1));
" 2>/dev/null; do
  i=$((i + 1))
  [ "$i" -lt 120 ] || { echo "graph-node khong len sau 120 lan thu" >&2; exit 1; }
  sleep 2
done
echo "graph-node san sang"

# sync-abis doc packages/coins/out (artifact forge) — thu muc do bi .dockerignore
# loai va cung khong can: apps/subgraph/abis/ da commit san trong repo.
echo "== render manifest =="
node scripts/render-manifest.mjs
grep -n 'address:\|startBlock:' subgraph.yaml

echo "== codegen + build =="
pnpm exec graph codegen
pnpm exec graph build

echo "== create + deploy =="
# create bao loi neu subgraph da ton tai — khong phai loi that, bo qua.
pnpm exec graph create --node "$GRAPH_NODE/" "$SUBGRAPH_NAME" || true
pnpm exec graph deploy --node "$GRAPH_NODE/" --ipfs "$IPFS_URL" \
  --version-label "$VERSION_LABEL" "$SUBGRAPH_NAME"
echo "== xong: $GRAPH_NODE -> $SUBGRAPH_NAME =="
