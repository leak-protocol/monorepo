import { useEffect, useMemo, useState } from "react";
import { WagmiProvider, useAccount, type Config } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { loadWebConfig, type WebConfig } from "./lib/config";
import { createLeakWagmiConfig } from "./lib/wagmi";
import { createLeakActions, type LeakActions } from "./lib/actions";
import { parseRoute, routeHref, type Route } from "./lib/route";
import { WalletBar } from "./components/WalletBar";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { CoinList } from "./screens/CoinList";
import { CreateCoin } from "./screens/CreateCoin";
import { TradeCoin } from "./screens/TradeCoin";

type Props = {
  /** Injectable so tests need no network. Defaults to the real functions. */
  loadConfig?: () => Promise<WebConfig>;
  createActions?: (wagmi: Config, web: WebConfig) => LeakActions;
};

type Boot =
  | { kind: "loading" }
  | { kind: "ready"; web: WebConfig; wagmi: Config; actions: LeakActions }
  | { kind: "failed"; message: string };

/** Hash routing, no external router: three screens do not justify a dependency. */
function useHashRoute(): Route {
  const [hash, setHash] = useState(() =>
    typeof window === "undefined" ? "" : window.location.hash,
  );
  useEffect(() => {
    const onChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return parseRoute(hash);
}

function Screens({ actions }: { actions: LeakActions }) {
  const route = useHashRoute();
  const { address } = useAccount();
  switch (route.name) {
    case "create":
      return <CreateCoin actions={actions} account={address} />;
    case "trade":
      return (
        <TradeCoin actions={actions} account={address} coin={route.coin} />
      );
    default:
      return <CoinList actions={actions} />;
  }
}

export function App({
  loadConfig = loadWebConfig,
  createActions = createLeakActions,
}: Props = {}) {
  const [boot, setBoot] = useState<Boot>({ kind: "loading" });
  const queryClient = useMemo(() => new QueryClient(), []);

  useEffect(() => {
    let alive = true;
    loadConfig()
      .then((web) => {
        if (!alive) return;
        const wagmi = createLeakWagmiConfig(web);
        setBoot({
          kind: "ready",
          web,
          wagmi,
          actions: createActions(wagmi, web),
        });
      })
      .catch((err: unknown) => {
        if (alive) {
          setBoot({
            kind: "failed",
            message: err instanceof Error ? err.message : String(err),
          });
        }
      });
    return () => {
      alive = false;
    };
  }, [loadConfig, createActions]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Leak</h1>
        <nav>
          <a href={routeHref({ name: "list" })}>Danh sách</a>
          <a href={routeHref({ name: "create" })}>Create token</a>
        </nav>
        {boot.kind === "ready" ? (
          <WagmiProvider config={boot.wagmi}>
            <QueryClientProvider client={queryClient}>
              <WalletBar />
            </QueryClientProvider>
          </WagmiProvider>
        ) : null}
      </header>
      <main className="app-main">
        {boot.kind === "loading" ? <p>Loading configuration…</p> : null}
        {boot.kind === "failed" ? (
          <p className="error">
            Could not load /runtime/config.json: {boot.message}
          </p>
        ) : null}
        {boot.kind === "ready" ? (
          <WagmiProvider config={boot.wagmi}>
            <QueryClientProvider client={queryClient}>
              <ErrorBoundary>
                <Screens actions={boot.actions} />
              </ErrorBoundary>
            </QueryClientProvider>
          </WagmiProvider>
        ) : null}
      </main>
    </div>
  );
}
