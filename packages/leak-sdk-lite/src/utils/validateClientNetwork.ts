import { PublicClient } from "viem";
import { avalanche } from "viem/chains";

/** Leak runs only on Avalanche C-Chain. Any other chain is a misconfiguration; fail fast. */
export const validateClientNetwork = (
  publicClient: PublicClient<any, any, any, any>,
) => {
  const clientChainId = publicClient?.chain?.id;
  if (clientChainId === avalanche.id) {
    return;
  }
  throw new Error(
    `Leak supports only Avalanche C-Chain (${avalanche.id}); the client is on chain ${clientChainId}`,
  );
};
