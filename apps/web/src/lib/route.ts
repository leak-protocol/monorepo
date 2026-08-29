export type Route =
  | { name: "list" }
  | { name: "create" }
  | { name: "trade"; coin: `0x${string}` };

const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;

/** Hash routing, so nginx can serve the app statically with no rewrite rules. */
export function parseRoute(hash: string): Route {
  const path = hash.replace(/^#/, "");
  if (path === "" || path === "/") return { name: "list" };
  if (path === "/create") return { name: "create" };
  const coinMatch = /^\/coin\/(.+)$/.exec(path);
  if (coinMatch && ADDRESS_RE.test(coinMatch[1]!)) {
    return { name: "trade", coin: coinMatch[1] as `0x${string}` };
  }
  return { name: "list" };
}

export function routeHref(route: Route): string {
  switch (route.name) {
    case "create":
      return "#/create";
    case "trade":
      return `#/coin/${route.coin}`;
    default:
      return "#/";
  }
}
