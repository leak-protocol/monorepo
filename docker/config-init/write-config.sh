#!/bin/sh
# mainnet profile: deploys nothing, only writes the web app's runtime config.
set -eu

LEAK_FACTORY="${LEAK_FACTORY:?LEAK_FACTORY is required}"
LEAK_FACTORY_DEPLOY_BLOCK="${LEAK_FACTORY_DEPLOY_BLOCK:?LEAK_FACTORY_DEPLOY_BLOCK is required}"
WEB_RPC_URL="${WEB_RPC_URL:?WEB_RPC_URL is required}"
API_URL="${API_URL:-http://127.0.0.1:8787}"
RUNTIME_DIR="${RUNTIME_DIR:-/runtime}"

case "$LEAK_FACTORY" in
  0x0000000000000000000000000000000000000000)
    echo "LEAK_FACTORY is still the zero address — set a real one in docker/.env first." >&2
    exit 1
    ;;
esac

mkdir -p "$RUNTIME_DIR"
cat > "$RUNTIME_DIR/config.json" <<EOF
{
  "chainId": 43114,
  "rpcUrl": "$WEB_RPC_URL",
  "factory": "$LEAK_FACTORY",
  "factoryDeployBlock": "$LEAK_FACTORY_DEPLOY_BLOCK",
  "apiUrl": "$API_URL"
}
EOF
cat "$RUNTIME_DIR/config.json"
