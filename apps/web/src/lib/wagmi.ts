import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { avalanche } from "viem/chains";
import type { WebConfig } from "./config";

/**
 * Leak runs on one network. An anvil fork keeps the upstream chain id (43114) —
 * verified with `cast chain-id` against a fork at block 93821000 — so local and
 * mainnet share a chain definition and differ only in RPC URL.
 *
 * There is no testnet branch: Uniswap v4 is not deployed on Fuji, so everything
 * beneath the hook is absent there.
 */
export function leakChain(cfg: WebConfig) {
  if (cfg.chainId !== avalanche.id) {
    throw new Error(
      `Leak runs only on Avalanche C-Chain (${avalanche.id}); the config declares ${cfg.chainId}. ` +
        "There is no test network: Uniswap v4 does not exist on Fuji.",
    );
  }
  return {
    ...avalanche,
    rpcUrls: { default: { http: [cfg.rpcUrl] } },
  } as const;
}

/**
 * MetaMask only. `target: "metaMask"` matches the EIP-1193 provider's `isMetaMask`
 * flag, so the connector does not pick up another wallet sharing `window.ethereum`.
 */
export function createLeakWagmiConfig(cfg: WebConfig) {
  const chain = leakChain(cfg);
  return createConfig({
    chains: [chain],
    connectors: [injected({ target: "metaMask" })],
    transports: { [chain.id]: http(cfg.rpcUrl) },
  });
}
