import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CreateCoin } from "./CreateCoin";
import { ACCOUNT, COIN, stubActions, mockCalls } from "./fixtures";

function fill(values: { name?: string; symbol?: string; uri?: string }) {
  if (values.name !== undefined)
    fireEvent.change(screen.getByLabelText(/token name/i), {
      target: { value: values.name },
    });
  if (values.symbol !== undefined)
    fireEvent.change(screen.getByLabelText(/symbol/i), {
      target: { value: values.symbol },
    });
  if (values.uri !== undefined)
    fireEvent.change(screen.getByLabelText(/metadata uri/i), {
      target: { value: values.uri },
    });
}

describe("CreateCoin", () => {
  it("shows both curves with their range, meme preselected", () => {
    render(<CreateCoin actions={stubActions()} account={ACCOUNT} />);
    expect(screen.getByLabelText(/meme/i)).toBeChecked();
    expect(screen.getByText(/244x/)).toBeInTheDocument();
    expect(screen.getByText(/8\.2x/)).toBeInTheDocument();
  });

  it("disables submit when no wallet is connected", () => {
    render(<CreateCoin actions={stubActions()} account={undefined} />);
    expect(
      screen.getByRole("button", { name: /create token/i }),
    ).toBeDisabled();
  });

  it("shows an error and calls no action when the form is invalid", async () => {
    const actions = stubActions();
    render(<CreateCoin actions={actions} account={ACCOUNT} />);
    fill({ name: "A", symbol: "x", uri: "http://x" });
    fireEvent.click(screen.getByRole("button", { name: /create token/i }));
    expect(await screen.findByText(/ipfs:\/\//i)).toBeInTheDocument();
    expect(actions.createCoin).not.toHaveBeenCalled();
  });

  it("calls createCoin with the selected curve's poolConfig when the form is valid", async () => {
    const actions = stubActions();
    render(<CreateCoin actions={actions} account={ACCOUNT} />);
    fill({ name: "Test Coin", symbol: "TEST", uri: "ipfs://bafytest" });
    fireEvent.click(screen.getByLabelText(/stable/i));
    fireEvent.click(screen.getByRole("button", { name: /create token/i }));

    await waitFor(() => expect(actions.createCoin).toHaveBeenCalledTimes(1));
    const arg = mockCalls(actions.createCoin)[0]![0] as Record<string, unknown>;
    expect(arg.name).toBe("Test Coin");
    expect(arg.symbol).toBe("TEST");
    expect(String(arg.poolConfig)).toMatch(/^0x[0-9a-f]+$/i);
    expect(await screen.findByText(new RegExp(COIN, "i"))).toBeInTheDocument();
  });

  it("shows a chain error verbatim", async () => {
    const actions = stubActions({
      createCoin: vi.fn(async () => {
        throw new Error("Coin__InvalidCurrencyLowerTick");
      }),
    });
    render(<CreateCoin actions={actions} account={ACCOUNT} />);
    fill({ name: "Test Coin", symbol: "TEST", uri: "ipfs://bafytest" });
    fireEvent.click(screen.getByRole("button", { name: /create token/i }));
    expect(
      await screen.findByText(/Coin__InvalidCurrencyLowerTick/),
    ).toBeInTheDocument();
  });
});
