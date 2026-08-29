import type { ReactElement, ReactNode } from "react";
import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { connect } from "wagmi/actions";
import { mock } from "wagmi/connectors";
import { avalanche } from "viem/chains";

export const TEST_ACCOUNT =
  "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" as const;

/**
 * wagmi's mock connector, standing in for MetaMask.
 *
 * The transport points at anvil's port but no test ever reaches it: every on-chain call
 * goes through the `actions` object injected from outside.
 */
export function makeTestWagmiConfig() {
  return createConfig({
    chains: [avalanche],
    connectors: [mock({ accounts: [TEST_ACCOUNT] })],
    transports: { [avalanche.id]: http("http://127.0.0.1:8545") },
    // storage: null is mandatory. By default wagmi persists `state.current` but NOT
    // `state.connections`, which holds live connector instances and cannot be serialised.
    // At mount the provider hydrates from storage: `current` is restored while
    // `connections` is empty, so useAccount reports status=connected with
    // address=undefined. Dropping storage removes the hydration step that would
    // otherwise overwrite the state connect() just built.
    storage: null,
  });
}

/**
 * Renders with wagmi's provider.
 *
 * The "connected" state is built by **calling connect() explicitly and awaiting it**,
 * not by relying on `features.defaultConnected` plus reconnect-at-mount. Reconnect runs
 * asynchronously after mount and depends on storage, which makes tests flaky. Calling
 * explicitly means the state is ready before the first render.
 */
export async function renderWithWagmi(ui: ReactElement, connected = true) {
  const wagmiConfig = makeTestWagmiConfig();
  if (connected) {
    await connect(wagmiConfig, { connector: wagmiConfig.connectors[0]! });
  }
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <WagmiProvider config={wagmiConfig} reconnectOnMount={false}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
  return render(ui, { wrapper: Wrapper });
}
