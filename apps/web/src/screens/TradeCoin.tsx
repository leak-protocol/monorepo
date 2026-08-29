import { useEffect, useState } from "react";
import type { CoinRow } from "../lib/coinEvents";
import type { LeakActions, QuoteResult } from "../lib/actions";
import { formatAmount, parseAmount, type TradeSide } from "../lib/trade";

type Props = {
  actions: LeakActions;
  account?: `0x${string}`;
  coin: `0x${string}`;
};

/** 5% by default: a fresh pool is very thin, and anything tighter reverts the first trades. */
const DEFAULT_SLIPPAGE = 0.05;

type Load =
  | { kind: "loading" }
  | { kind: "ready"; row: CoinRow }
  | { kind: "missing" }
  | { kind: "failed"; message: string };

export function TradeCoin({ actions, account, coin }: Props) {
  const [load, setLoad] = useState<Load>({ kind: "loading" });
  const [side, setSide] = useState<TradeSide>("buy");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [quote, setQuote] = useState<QuoteResult | undefined>();
  const [hash, setHash] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    actions
      .listCoins()
      .then((rows) => {
        if (!alive) return;
        const row = rows.find(
          (r) => r.coin.toLowerCase() === coin.toLowerCase(),
        );
        setLoad(row ? { kind: "ready", row } : { kind: "missing" });
      })
      .catch((err: unknown) => {
        if (alive) {
          setLoad({
            kind: "failed",
            message: err instanceof Error ? err.message : String(err),
          });
        }
      });
    return () => {
      alive = false;
    };
  }, [actions, coin]);

  if (load.kind === "loading")
    return <section className="panel">Loading…</section>;
  if (load.kind === "missing") {
    return (
      <section className="panel">
        <p className="error">Token {coin} was not found in the factory logs.</p>
      </section>
    );
  }
  if (load.kind === "failed") {
    return (
      <section className="panel">
        <p className="error">{load.message}</p>
      </section>
    );
  }

  const row = load.row;

  /** The sell side sets the input's decimals: AVAX and the coin are both 18. */
  function readAmount(): bigint | undefined {
    const parsed = parseAmount(amount);
    if (parsed === null) {
      setError("Invalid amount");
      return undefined;
    }
    setError(undefined);
    return parsed;
  }

  async function run(kind: "quote" | "trade") {
    const amountIn = readAmount();
    if (amountIn === undefined) return;
    setBusy(true);
    try {
      const input = {
        side,
        poolKey: row.poolKey,
        coin,
        amountIn,
        slippage: DEFAULT_SLIPPAGE,
      };
      if (kind === "quote") {
        setQuote(await actions.quote(input));
      } else {
        const res = await actions.trade(input);
        setHash(res.hash);
        setQuote({ amountOut: res.amountOut, minAmountOut: res.amountOut });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  const outSymbol = side === "buy" ? row.symbol : "AVAX";

  return (
    <section className="panel">
      <h2>{row.name}</h2>
      <p className="mono">{row.coin}</p>

      <fieldset className="side-picker">
        <legend>Direction</legend>
        <label htmlFor="side-buy">
          <input
            id="side-buy"
            type="radio"
            name="side"
            checked={side === "buy"}
            onChange={() => setSide("buy")}
          />
          <span>Buy</span>
        </label>
        <label htmlFor="side-sell">
          <input
            id="side-sell"
            type="radio"
            name="side"
            checked={side === "sell"}
            onChange={() => setSide("sell")}
          />
          <span>Sell</span>
        </label>
      </fieldset>

      <label className="field" htmlFor="amount">
        <span>Amount in {side === "buy" ? "AVAX" : row.symbol}</span>
        <input
          id="amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </label>
      {error ? <p className="error">{error}</p> : null}

      <div className="actions">
        <button type="button" disabled={busy} onClick={() => run("quote")}>
          Quote
        </button>
        <button
          type="button"
          disabled={busy || !account}
          onClick={() => run("trade")}
        >
          Execute
        </button>
      </div>
      {!account ? <p className="error">Connect MetaMask first.</p> : null}

      {quote ? (
        <p>
          Estimated {formatAmount(quote.amountOut)} {outSymbol} — minimum
          received {formatAmount(quote.minAmountOut)} {outSymbol} at a slippage
          of {DEFAULT_SLIPPAGE * 100}%
        </p>
      ) : null}
      {hash ? <p className="mono">Transaction {hash}</p> : null}
    </section>
  );
}
