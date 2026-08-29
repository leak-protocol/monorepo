import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { error?: Error };

/**
 * Catches throws from the subtree. React 19 still has no hook equivalent — catching a
 * render error requires a class component.
 *
 * Without it, one `throw` in any screen — say `curveChoiceById` meeting an unknown id —
 * makes React unmount the whole tree, leaving a blank page with no message and no way
 * to tell what happened.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = {};

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[leak-web] render error:", error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <section className="panel">
        <h2>Something went wrong</h2>
        {/* Shown verbatim: a contract revert message is exactly what a user needs to
            hand to support. Swallowing it leaves nobody able to diagnose anything. */}
        <p className="error mono">{error.message}</p>
        <button type="button" onClick={() => window.location.reload()}>
          Reload
        </button>
      </section>
    );
  }
}
