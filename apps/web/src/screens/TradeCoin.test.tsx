import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TradeCoin } from "./TradeCoin";
import { ACCOUNT, COIN, ROW, stubActions, mockCalls } from "./fixtures";

describe("TradeCoin", () => {
  it("shows the coin name and defaults to buy", async () => {
    render(<TradeCoin actions={stubActions()} account={ACCOUNT} coin={COIN} />);
    expect(await screen.findByText("Test Coin")).toBeInTheDocument();
    expect(screen.getByLabelText(/buy/i)).toBeChecked();
  });

  it("quotes the entered amount and shows the minimum received", async () => {
    const actions = stubActions();
    render(<TradeCoin actions={actions} account={ACCOUNT} coin={COIN} />);
    await screen.findByText("Test Coin");
    fireEvent.change(screen.getByLabelText(/amount/i), {
      target: { value: "1" },
    });
    fireEvent.click(screen.getByRole("button", { name: /quote/i }));

    await waitFor(() => expect(actions.quote).toHaveBeenCalledTimes(1));
    const arg = mockCalls(actions.quote)[0]![0] as Record<string, unknown>;
    expect(arg.side).toBe("buy");
    expect(arg.amountIn).toBe(10n ** 18n);
    expect(arg.poolKey).toEqual(ROW.poolKey);
    expect(
      await screen.findByText(/minimum received 1\.9/i),
    ).toBeInTheDocument();
  });

  it("switching to sell changes the side", async () => {
    const actions = stubActions();
    render(<TradeCoin actions={actions} account={ACCOUNT} coin={COIN} />);
    await screen.findByText("Test Coin");
    fireEvent.click(screen.getByLabelText(/^sell$/i));
    fireEvent.change(screen.getByLabelText(/amount/i), {
      target: { value: "1" },
    });
    fireEvent.click(screen.getByRole("button", { name: /quote/i }));
    await waitFor(() => expect(actions.quote).toHaveBeenCalled());
    const arg = mockCalls(actions.quote)[0]![0] as Record<string, unknown>;
    expect(arg.side).toBe("sell");
  });

  it("reports an error and calls no quote for invalid input", async () => {
    const actions = stubActions();
    render(<TradeCoin actions={actions} account={ACCOUNT} coin={COIN} />);
    await screen.findByText("Test Coin");
    fireEvent.change(screen.getByLabelText(/amount/i), {
      target: { value: "abc" },
    });
    fireEvent.click(screen.getByRole("button", { name: /quote/i }));
    expect(await screen.findByText(/invalid amount/i)).toBeInTheDocument();
    expect(actions.quote).not.toHaveBeenCalled();
  });

  it("executes the trade and shows the hash", async () => {
    const actions = stubActions();
    render(<TradeCoin actions={actions} account={ACCOUNT} coin={COIN} />);
    await screen.findByText("Test Coin");
    fireEvent.change(screen.getByLabelText(/amount/i), {
      target: { value: "1" },
    });
    fireEvent.click(screen.getByRole("button", { name: /execute/i }));
    await waitFor(() => expect(actions.trade).toHaveBeenCalledTimes(1));
    expect(await screen.findByText(/0xtrade/)).toBeInTheDocument();
  });

  it("disables execute when no wallet is connected", async () => {
    render(
      <TradeCoin actions={stubActions()} account={undefined} coin={COIN} />,
    );
    await screen.findByText("Test Coin");
    expect(screen.getByRole("button", { name: /execute/i })).toBeDisabled();
  });

  it("says so plainly when the coin is not found", async () => {
    const actions = stubActions({ listCoins: vi.fn(async () => []) });
    render(<TradeCoin actions={actions} account={ACCOUNT} coin={COIN} />);
    expect(await screen.findByText(/was not found/i)).toBeInTheDocument();
  });
});
