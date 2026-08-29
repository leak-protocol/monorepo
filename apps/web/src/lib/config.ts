/**
 * Web configuration loaded at runtime, not at build time.
 *
 * Why: the deployment address book for chain 43114 is empty
 * (`packages/coins-deployments/addresses/43114.json` = `{}`), and on an anvil fork the
 * factory address changes on every rebuild because the proxy uses CREATE, not CREATE2.
 * So the address can only come from a file the deployer produces.
 */
export type WebConfig = {
  chainId: number;
  rpcUrl: string;
  factory: `0x${string}`;
  /** Lower bound for the CoinCreatedV4 log scan, so it never starts at block 0. */
  factoryDeployBlock: bigint;
  apiUrl: string;
};

export class ConfigError extends Error {
  constructor(field: string, reason: string) {
    super(`runtime/config.json: field "${field}" ${reason}`);
    this.name = "ConfigError";
  }
}

const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;
const ZERO_ADDRESS_RE = /^0x0{40}$/;
const HTTP_URL_RE = /^https?:\/\/.+/;

export function parseWebConfig(raw: unknown): WebConfig {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new ConfigError("<root>", "must be a JSON object");
  }
  const o = raw as Record<string, unknown>;

  const chainId = o.chainId;
  if (
    typeof chainId !== "number" ||
    !Number.isInteger(chainId) ||
    chainId <= 0
  ) {
    throw new ConfigError("chainId", "must be a positive integer");
  }

  const rpcUrl = o.rpcUrl;
  if (typeof rpcUrl !== "string" || !HTTP_URL_RE.test(rpcUrl)) {
    throw new ConfigError("rpcUrl", "must be an http or https URL");
  }

  const factory = o.factory;
  if (typeof factory !== "string" || !ADDRESS_RE.test(factory)) {
    throw new ConfigError("factory", "must be a 20-byte 0x… address");
  }
  if (ZERO_ADDRESS_RE.test(factory)) {
    throw new ConfigError(
      "factory",
      "has not been written by the deployer (still all zeroes)",
    );
  }

  const rawBlock = o.factoryDeployBlock;
  if (typeof rawBlock !== "string" && typeof rawBlock !== "number") {
    throw new ConfigError(
      "factoryDeployBlock",
      "must be a number or a numeric string",
    );
  }
  let factoryDeployBlock: bigint;
  try {
    factoryDeployBlock = BigInt(rawBlock);
  } catch {
    throw new ConfigError("factoryDeployBlock", "is not an integer");
  }
  if (factoryDeployBlock < 0n) {
    throw new ConfigError("factoryDeployBlock", "must not be negative");
  }

  const apiUrl = o.apiUrl;
  if (typeof apiUrl !== "string" || !HTTP_URL_RE.test(apiUrl)) {
    throw new ConfigError("apiUrl", "must be an http or https URL");
  }

  return {
    chainId,
    rpcUrl,
    factory: factory as `0x${string}`,
    factoryDeployBlock,
    apiUrl,
  };
}

export async function loadWebConfig(
  fetchImpl: typeof fetch = fetch,
): Promise<WebConfig> {
  const res = await fetchImpl("/runtime/config.json", { cache: "no-store" });
  if (!res.ok) {
    throw new ConfigError("<file>", `fetch failed with HTTP ${res.status}`);
  }
  return parseWebConfig((await res.json()) as unknown);
}
