import { createRoute, type OpenAPIHono } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";
import type { ApiVariables } from "../auth";
import { coinMetadata, coinStats } from "../db/schema";
import { problem } from "../problem";
import { TokenInfoQuery, TokenInfoResponse } from "../schemas/tokenInfo";
import { isAvaxDenominated, LEAK_CHAIN_ID } from "../sources/chain";
import { ERROR_RESPONSES } from "./apiKey";

export const getTokenInfoRoute = createRoute({
  method: "get",
  path: "/tokenInfo",
  operationId: "getTokenInfo",
  summary: "leakSDK_tokenInfo query",
  security: [{ "api-key": [] }],
  request: { query: TokenInfoQuery },
  responses: {
    200: {
      description: "Successful operation",
      content: { "application/json": { schema: TokenInfoResponse } },
    },
    ...ERROR_RESPONSES,
  },
});

const trimZeros = (value: string): string =>
  value.includes(".") ? value.replace(/0+$/, "").replace(/\.$/, "") : value;

export const registerTokenInfoRoute = (
  app: OpenAPIHono<{ Variables: ApiVariables }>,
): void => {
  app.openapi(getTokenInfoRoute, async (c) => {
    const { address, chainId } = c.req.valid("query");
    if (chainId !== undefined && chainId !== LEAK_CHAIN_ID) {
      return problem(
        c,
        "bad-request",
        `Leak only serves chainId ${LEAK_CHAIN_ID}.`,
      );
    }

    const deps = c.get("deps");
    const lowered = address.toLowerCase();

    const erc20 = await deps.chain.readErc20(lowered);
    if (erc20 === undefined) {
      return c.json({}, 200);
    }

    const [stats] = await deps.db
      .select({
        priceInPoolToken: coinStats.priceInPoolToken,
        currencyAddress: coinStats.currencyAddress,
      })
      .from(coinStats)
      .where(eq(coinStats.address, lowered))
      .limit(1);

    const [meta] = await deps.db
      .select({ icon: coinMetadata.icon })
      .from(coinMetadata)
      .where(eq(coinMetadata.address, lowered))
      .limit(1);

    let priceUsd: string | undefined;
    if (stats !== undefined && isAvaxDenominated(stats.currencyAddress)) {
      const avaxUsd = await deps.chain.readAvaxUsd();
      priceUsd = trimZeros(
        (Number(stats.priceInPoolToken) * avaxUsd).toFixed(18),
      );
    }

    const currency: Record<string, unknown> = {};
    if (priceUsd !== undefined) currency.priceUsd = priceUsd;
    currency.decimals = erc20.decimals;
    currency.name = erc20.name;
    currency.symbol = erc20.symbol;
    if (meta?.icon != null) currency.icon = meta.icon;

    return c.json({ erc20Token: { currency } }, 200);
  });
};
