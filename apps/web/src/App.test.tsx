import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { App } from "./App";
import type { WebConfig } from "./lib/config";
import { stubActions, ROW } from "./screens/fixtures";

const web: WebConfig = {
  chainId: 43114,
  rpcUrl: "http://127.0.0.1:8545",
  factory: "0x1111111111111111111111111111111111111111",
  factoryDeployBlock: 100n,
  apiUrl: "http://localhost:8787",
};

function boot(over: { loadConfig?: () => Promise<WebConfig> } = {}) {
  const actions = stubActions();
  render(
    <App
      loadConfig={over.loadConfig ?? (async () => web)}
      createActions={() => actions}
    />,
  );
  return actions;
}

beforeEach(() => {
  window.location.hash = "";
});

describe("App", () => {
  it("shows the product name and two navigation links", () => {
    boot();
    expect(screen.getByRole("heading", { name: /leak/i })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /danh sách/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /create token/i }),
    ).toBeInTheDocument();
  });

  it("says so plainly on a broken config instead of showing a blank screen", async () => {
    boot({
      loadConfig: async () => {
        throw new Error("chainId: must be an integer");
      },
    });
    expect(
      await screen.findByText(/chainId: must be an integer/),
    ).toBeInTheDocument();
  });

  it("an empty hash opens the list", async () => {
    const actions = boot();
    expect(await screen.findByText(ROW.name)).toBeInTheDocument();
    await waitFor(() => expect(actions.listCoins).toHaveBeenCalled());
  });

  it("#/create opens the create screen", async () => {
    window.location.hash = "#/create";
    boot();
    expect(
      await screen.findByRole("button", { name: /create token/i }),
    ).toBeInTheDocument();
  });

  it("#/coin/<address> opens the trade screen for that coin", async () => {
    window.location.hash = `#/coin/${ROW.coin}`;
    boot();
    expect(
      await screen.findByRole("button", { name: /quote/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: ROW.name })).toBeInTheDocument();
  });

  it("the connect button appears only after the config has loaded", async () => {
    boot();
    expect(
      screen.queryByRole("button", { name: /connect metamask/i }),
    ).not.toBeInTheDocument();
    expect(
      await screen.findByRole("button", { name: /connect metamask/i }),
    ).toBeInTheDocument();
  });
});

it("reports loading while the config is still being fetched", () => {
  render(
    <App
      loadConfig={() => new Promise(() => {})}
      createActions={() => stubActions()}
    />,
  );
  expect(screen.getByText(/loading configuration/i)).toBeInTheDocument();
});

it("calls loadWebConfig itself when no props are given", async () => {
  const fetchSpy = vi
    .spyOn(globalThis, "fetch")
    .mockRejectedValue(new Error("network down"));
  render(<App />);
  await waitFor(() =>
    expect(fetchSpy).toHaveBeenCalledWith(
      "/runtime/config.json",
      expect.anything(),
    ),
  );
  fetchSpy.mockRestore();
});
