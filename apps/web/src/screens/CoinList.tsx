import { useEffect, useState } from "react";
import type { CoinRow } from "../lib/coinEvents";
import type { LeakActions } from "../lib/actions";
import { routeHref } from "../lib/route";
import { formatAmount } from "../lib/trade";

type Props = { actions: LeakActions };

type State =
  | { kind: "loading" }
  | { kind: "ready"; rows: CoinRow[] }
  | { kind: "failed"; message: string };

export function CoinList({ actions }: Props) {
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    let alive = true;
    actions
      .listCoins()
      .then((rows) => {
        if (alive) setState({ kind: "ready", rows });
      })
      .catch((err: unknown) => {
        if (alive) {
          setState({
            kind: "failed",
            message: err instanceof Error ? err.message : String(err),
          });
        }
      });
    // The `alive` flag keeps state from being set after the component has unmounted.
    return () => {
      alive = false;
    };
  }, [actions]);

  if (state.kind === "loading") {
    return <section className="panel">Reading CoinCreatedV4 logs…</section>;
  }
  if (state.kind === "failed") {
    return (
      <section className="panel">
        <p className="error">{state.message}</p>
      </section>
    );
  }
  if (state.rows.length === 0) {
    return <section className="panel">No tokens on this factory yet.</section>;
  }

  return (
    <section className="panel">
      <h2>Tokens issued</h2>
      <table className="coin-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Symbol</th>
            <th>Address</th>
            <th>Block</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {state.rows.map((row) => (
            <tr key={row.id}>
              <td>{row.name}</td>
              <td>{row.symbol}</td>
              <td className="mono">{row.coin}</td>
              <td className="num">{formatAmount(row.blockNumber, 0, 0)}</td>
              <td>
                <a href={routeHref({ name: "trade", coin: row.coin })}>
                  Buy / sell
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
