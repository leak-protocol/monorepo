import { useState } from "react";
import { CURVE_CHOICES } from "../lib/presets";
import { validateCreateForm, type CreateFormErrors } from "../lib/createForm";
import type { LeakActions } from "../lib/actions";

type Props = {
  actions: LeakActions;
  account?: `0x${string}`;
};

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "done"; hash: string; coin: string }
  | { kind: "failed"; message: string };

export function CreateCoin({ actions, account }: Props) {
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [uri, setUri] = useState("");
  const [curveId, setCurveId] = useState<string>(CURVE_CHOICES[0]!.id);
  const [errors, setErrors] = useState<CreateFormErrors>({});
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function submit() {
    if (!account) return;
    const result = validateCreateForm({ name, symbol, uri, curveId });
    if (!result.valid || !result.poolConfig) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    setStatus({ kind: "sending" });
    try {
      // The payout recipient is the connected wallet; changing it belongs to a
      // post-creation admin screen, not to this flow.
      const res = await actions.createCoin({
        name: name.trim(),
        symbol,
        uri: uri.trim(),
        poolConfig: result.poolConfig,
      });
      setStatus({ kind: "done", hash: res.hash, coin: res.coin });
    } catch (err) {
      setStatus({
        kind: "failed",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return (
    <section className="panel">
      <h2>Create token</h2>

      <label className="field" htmlFor="name">
        <span>Token name</span>
        <input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      {errors.name ? <p className="error">{errors.name}</p> : null}

      <label className="field" htmlFor="symbol">
        <span>Symbol</span>
        <input
          id="symbol"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
        />
      </label>
      {errors.symbol ? <p className="error">{errors.symbol}</p> : null}

      <label className="field" htmlFor="uri">
        <span>Metadata URI</span>
        <input
          id="uri"
          placeholder="ipfs://…"
          value={uri}
          onChange={(e) => setUri(e.target.value)}
        />
      </label>
      {errors.uri ? <p className="error">{errors.uri}</p> : null}

      <fieldset className="curve-picker">
        <legend>Issuance curve</legend>
        {CURVE_CHOICES.map((choice) => (
          <label
            key={choice.id}
            className="curve-option"
            htmlFor={`curve-${choice.id}`}
          >
            <input
              id={`curve-${choice.id}`}
              type="radio"
              name="curve"
              value={choice.id}
              checked={curveId === choice.id}
              onChange={() => setCurveId(choice.id)}
            />
            <span className="curve-label">{choice.label}</span>
            <span className="curve-range">
              {choice.fdvRange.from}–{choice.fdvRange.to} AVAX FDV · range{" "}
              {choice.multiple}x
            </span>
            <span className="curve-detail">{choice.description}</span>
          </label>
        ))}
      </fieldset>
      {errors.curveId ? <p className="error">{errors.curveId}</p> : null}

      <button
        type="button"
        disabled={!account || status.kind === "sending"}
        onClick={submit}
      >
        {status.kind === "sending" ? "Sending…" : "Create token"}
      </button>
      {!account ? <p className="error">Connect MetaMask first.</p> : null}

      {status.kind === "done" ? (
        <p className="mono">
          Created. Token address: {status.coin} — transaction {status.hash}
        </p>
      ) : null}
      {status.kind === "failed" ? (
        <p className="error">{status.message}</p>
      ) : null}
    </section>
  );
}
