import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CoinList } from "./CoinList";
import { COIN, stubActions } from "./fixtures";

describe("CoinList", () => {
  it("reports loading while loading", () => {
    render(
      <CoinList
        actions={stubActions({
          listCoins: vi.fn(() => new Promise(() => {})) as never,
        })}
      />,
    );
    expect(screen.getByText(/reading/i)).toBeInTheDocument();
  });

  it("shows name, symbol and a link to the trade screen", async () => {
    render(<CoinList actions={stubActions()} />);
    expect(await screen.findByText("Test Coin")).toBeInTheDocument();
    expect(screen.getByText("TEST")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /buy \/ sell/i })).toHaveAttribute(
      "href",
      `#/coin/${COIN}`,
    );
  });

  it("says it is empty rather than showing an error", async () => {
    render(
      <CoinList actions={stubActions({ listCoins: vi.fn(async () => []) })} />,
    );
    expect(await screen.findByText(/no tokens/i)).toBeInTheDocument();
  });

  it("surfaces an error when reading logs fails", async () => {
    render(
      <CoinList
        actions={stubActions({
          listCoins: vi.fn(async () => {
            throw new Error("RPC did not respond");
          }),
        })}
      />,
    );
    expect(await screen.findByText(/RPC did not respond/)).toBeInTheDocument();
  });
});
