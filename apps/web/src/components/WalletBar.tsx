import { useAccount, useConnect, useDisconnect } from "wagmi";

export function shortAddress(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function WalletBar() {
  const { address: account, isConnected } = useAccount();
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected && account) {
    return (
      <div className="wallet-bar">
        <span className="mono">{shortAddress(account)}</span>
        <button type="button" onClick={() => disconnect()}>
          Disconnect
        </button>
      </div>
    );
  }

  // The config declares exactly one connector (createLeakWagmiConfig), so take index 0.
  const connector = connectors[0];
  return (
    <div className="wallet-bar">
      <button
        type="button"
        disabled={!connector || isPending}
        onClick={() => connector && connect({ connector })}
      >
        {isPending ? "Connecting…" : "Connect MetaMask"}
      </button>
      {error ? <p className="error">{error.message}</p> : null}
    </div>
  );
}
