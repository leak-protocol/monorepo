import { describe, it, expect } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithWagmi } from "../test/renderWithWagmi";
import { WalletBar } from "./WalletBar";

describe("WalletBar", () => {
  it("shows the connect button when disconnected", async () => {
    await renderWithWagmi(<WalletBar />, false);
    expect(
      await screen.findByRole("button", { name: /connect metamask/i }),
    ).toBeInTheDocument();
  });

  it("shows the shortened address and a disconnect button when connected", async () => {
    await renderWithWagmi(<WalletBar />, true);
    await waitFor(() => {
      expect(screen.getByText(/0xf39F…2266/)).toBeInTheDocument();
    });
    expect(
      screen.getByRole("button", { name: /disconnect/i }),
    ).toBeInTheDocument();
  });
});
