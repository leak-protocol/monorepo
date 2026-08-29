export type ExternalEntry = {
  address: `0x${string}`;
  functions: { signature: string; selector: `0x${string}` }[];
  verifiedAt: string;
};

/**
 * Contracts Leak does not control, on Avalanche C-Chain (43114).
 * Every selector here was verified present in the deployed bytecode.
 * Only add an entry after the external-registry test confirms it.
 */
export const EXTERNAL_43114 = {
  universalRouter: {
    // The 0x8B844f88... build has a different ExactInputSingleParams layout and
    // reverts while decoding.
    address: "0x94b75331AE8d42C1b61065089B7d48FE14aA73b7",
    functions: [
      { signature: "execute(bytes,bytes[],uint256)", selector: "0x3593564c" },
    ],
    verifiedAt: "2026-08-28",
  },
  permit2: {
    address: "0x000000000022D473030F116dDEE9F6B43aC78BA3",
    functions: [
      {
        signature: "approve(address,address,uint160,uint48)",
        selector: "0x87517c45",
      },
      {
        signature: "allowance(address,address,address)",
        selector: "0x927da105",
      },
    ],
    verifiedAt: "2026-08-28",
  },
  poolManager: {
    address: "0x06380C0e0912312B5150364B9DC4542BA0DbBc85",
    functions: [{ signature: "unlock(bytes)", selector: "0x48c89491" }],
    verifiedAt: "2026-08-28",
  },
  v4Quoter: {
    address: "0xbE40675BB704506a3c2Ccfb762DCFd1e979845C2",
    functions: [
      {
        // The parameter is ONE wrapping struct. The four-loose-parameter variant
        // (0x6501a3ce) is NOT in the bytecode — which is why this registry exists.
        signature:
          "quoteExactInputSingle(((address,address,uint24,int24,address),bool,uint128,bytes))",
        selector: "0xaa9d21cb",
      },
    ],
    verifiedAt: "2026-08-28",
  },
  chainlinkAvaxUsd: {
    address: "0x0A77230d17318075983913bC2145DB16C7366156",
    functions: [{ signature: "latestRoundData()", selector: "0xfeaf968c" }],
    verifiedAt: "2026-08-28",
  },
} as const satisfies Record<string, ExternalEntry>;

export const TOKENS_43114 = {
  wavax: "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7",
  usdc: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
} as const;
