import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ErrorBoundary } from "./ErrorBoundary";

function Boom(): never {
  throw new Error("hook revert: Coin__InvalidCurrencyLowerTick");
}

afterEach(() => vi.restoreAllMocks());

describe("ErrorBoundary", () => {
  it("a throw in the subtree does not blank the whole page", () => {
    // React logs to console when it catches; silence it so the test output stays readable.
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );
    expect(
      screen.getByRole("heading", { name: /went wrong/i }),
    ).toBeInTheDocument();
  });

  it("shows the error verbatim rather than swallowing it", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );
    expect(
      screen.getByText(/Coin__InvalidCurrencyLowerTick/),
    ).toBeInTheDocument();
  });

  it("renders children normally when there is no error", () => {
    render(
      <ErrorBoundary>
        <p>fine</p>
      </ErrorBoundary>,
    );
    expect(screen.getByText("fine")).toBeInTheDocument();
  });
});
