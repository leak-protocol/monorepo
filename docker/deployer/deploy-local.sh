#!/bin/sh
# Deploys Leak onto an anvil fork, then writes /runtime/config.json for the web app.
#
# Takes the same path that packages/leak-sdk-lite/test/setup/deployLeak.ts already
# proves green: etch two stubs, temporarily patch WAVAX's symbol, run
# DeployAllDevContracts. NOT Deploy.s.sol — that calls signDeploymentWithTurnkey
# (CoinsDeployerBase.sol:336), a remote signing service unavailable here.
set -eu

RPC_URL="${RPC_URL:?RPC_URL is required}"
DEPLOYER="${DEPLOYER:-0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266}"
API_URL="${API_URL:-http://127.0.0.1:8787}"
WEB_RPC_URL="${WEB_RPC_URL:-http://127.0.0.1:8545}"
RUNTIME_DIR="${RUNTIME_DIR:-/runtime}"

DEPLOYMENTS=/repo/packages/coins-deployments
ADDRESSES="$DEPLOYMENTS/addresses/43114_dev.json"

# Matches PROXY_ADMIN / LEAK_RECIPIENT / METADATA_MANAGER in chainConfigs/43114_dev.json.
DEV_MULTISIG=0x00000000000000000000000000000000000005A1
# Matches DOPPLER_AIRLOCK in the same file. Doppler is not deployed on Avalanche.
DEV_AIRLOCK=0x660eAaEdEBc968f8f3694354FA8EC0b4c5Ba8D12
WAVAX=0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7
SYMBOL_SLOT=0x0000000000000000000000000000000000000000000000000000000000000001
SYMBOL_WETH=0x5745544800000000000000000000000000000000000000000000000000000008
SYMBOL_WAVAX=0x574156415800000000000000000000000000000000000000000000000000000a

# Minimal runtime: CODECOPY the constant that follows the code, then RETURN,
# regardless of calldata. validateMultisig (ProxyDeployerScript.sol:290-304) only
# calls getOwners(); getDopplerAirlock (…:247-257) only requires code at the address.
SAFE_STUB=0x6060600c60003960606000f300000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000001000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb92266
AIRLOCK_STUB=0x6020600c60003960206000f3000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb92266

echo "== waiting for anvil =="
i=0
until cast block-number --rpc-url "$RPC_URL" >/dev/null 2>&1; do
  i=$((i + 1))
  [ "$i" -lt 120 ] || { echo "anvil did not come up after 120 attempts" >&2; exit 1; }
  sleep 1
done
echo "anvil ready at block $(cast block-number --rpc-url "$RPC_URL")"

CHAIN_ID=$(cast chain-id --rpc-url "$RPC_URL")
[ "$CHAIN_ID" = "43114" ] || {
  echo "chain id is $CHAIN_ID, expected 43114 — is anvil forking Avalanche?" >&2
  exit 1
}

echo "== etch stub =="
cast rpc --rpc-url "$RPC_URL" anvil_setCode "$DEV_MULTISIG" "$SAFE_STUB" >/dev/null
cast rpc --rpc-url "$RPC_URL" anvil_setCode "$DEV_AIRLOCK" "$AIRLOCK_STUB" >/dev/null
cast rpc --rpc-url "$RPC_URL" anvil_setBalance "$DEPLOYER" 0x21e19e0c9bab2400000 >/dev/null

# getWeth() (ProxyDeployerScript.sol:205-219) reverts unless symbol() == "WETH".
# On Avalanche the wrapped native token is WAVAX. Patch the display string
# temporarily and restore it; nothing in Leak reads it at runtime.
restore_symbol() {
  cast rpc --rpc-url "$RPC_URL" anvil_setStorageAt "$WAVAX" "$SYMBOL_SLOT" "$SYMBOL_WAVAX" >/dev/null || true
}
trap restore_symbol EXIT
cast rpc --rpc-url "$RPC_URL" anvil_setStorageAt "$WAVAX" "$SYMBOL_SLOT" "$SYMBOL_WETH" >/dev/null

DEPLOY_BLOCK=$(cast block-number --rpc-url "$RPC_URL")

echo "== deploy =="
cd "$DEPLOYMENTS"
rm -f "$ADDRESSES"
# DEV=true is required: deployLimitOrderBook and deploySwapRouter both
# require(isDevEnvironment()) (CoinsDeployerBase.sol:464,475). It also switches
# reads to chainConfigs/43114_dev.json and writes to addresses/43114_dev.json, so
# the mainnet address book is NOT touched.
DEV=true FOUNDRY_NO_STORAGE_CACHING=true \
  forge script script/DeployAllDevContracts.s.sol \
  --rpc-url "$RPC_URL" --broadcast --unlocked --legacy --sender "$DEPLOYER"

# The script writes addresses to addresses/43114_dev.json via vm.writeJson
# (CoinsDeployerBase.saveDeployment) and does NOT print them, so read the file.
LEAK_FACTORY=$(sed -n 's/.*"LEAK_FACTORY"[[:space:]]*:[[:space:]]*"\(0x[0-9a-fA-F]\{40\}\)".*/\1/p' "$ADDRESSES")
case "$LEAK_FACTORY" in
  0x0000000000000000000000000000000000000000 | "")
    echo "LEAK_FACTORY is invalid in $ADDRESSES" >&2
    exit 1
    ;;
esac
echo "LEAK_FACTORY: $LEAK_FACTORY"

LEAK_COIN_HOOK=$(sed -n 's/.*"LEAK_COIN_HOOK"[[:space:]]*:[[:space:]]*"\(0x[0-9a-fA-F]\{40\}\)".*/\1/p' "$ADDRESSES")
case "$LEAK_COIN_HOOK" in
  0x0000000000000000000000000000000000000000 | "")
    echo "LEAK_COIN_HOOK khong hop le trong $ADDRESSES" >&2
    exit 1
    ;;
esac
echo "LEAK_COIN_HOOK: $LEAK_COIN_HOOK"

echo "== writing config =="
mkdir -p "$RUNTIME_DIR"
cat > "$RUNTIME_DIR/config.json" <<EOF
{
  "chainId": 43114,
  "rpcUrl": "$WEB_RPC_URL",
  "factory": "$LEAK_FACTORY",
  "factoryDeployBlock": "$DEPLOY_BLOCK",
  "apiUrl": "$API_URL"
}
EOF
cat "$RUNTIME_DIR/config.json"

# Subgraph can dia chi va block bat dau. Ghi ra cung volume de subgraph-deploy
# doc, thay vi bat no mount lai so dia chi cua coins-deployments.
cat > "$RUNTIME_DIR/addresses.env" <<EOF
LEAK_FACTORY=$LEAK_FACTORY
LEAK_COIN_HOOK=$LEAK_COIN_HOOK
LEAK_START_BLOCK=$DEPLOY_BLOCK
EOF
cat "$RUNTIME_DIR/addresses.env"
