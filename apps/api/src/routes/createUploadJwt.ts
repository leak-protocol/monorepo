import { createRoute, type OpenAPIHono } from "@hono/zod-openapi";
import { sign } from "hono/jwt";
import type { ApiVariables } from "../auth";
import { requireApiKey } from "../auth";
import { problem } from "../problem";
import { ERROR_RESPONSES } from "./apiKey";
import { UploadJwtBody, UploadJwtResponse } from "../schemas/uploadJwt";

export const UPLOAD_JWT_TTL_SECONDS = 3600;

export const setCreateUploadJwtRoute = createRoute({
  method: "post",
  path: "/createUploadJWT",
  operationId: "setCreateUploadJwt",
  summary: "leakSDK_createUploadJWT mutation",
  security: [{ "api-key": [] }],
  request: {
    body: {
      required: false,
      content: { "application/json": { schema: UploadJwtBody } },
    },
  },
  responses: {
    200: {
      description: "Successful operation",
      content: { "application/json": { schema: UploadJwtResponse } },
    },
    ...ERROR_RESPONSES,
  },
});

export const registerCreateUploadJwtRoute = (
  app: OpenAPIHono<{ Variables: ApiVariables }>,
): void => {
  app.openapi(setCreateUploadJwtRoute, async (c) => {
    const key = requireApiKey(c);
    if (key === undefined) {
      return problem(
        c,
        "unauthorized",
        "An api-key header is required to mint an upload token.",
      );
    }

    const body = c.req.valid("json") as { creatorAddress: string } | undefined;
    const subject = body?.creatorAddress ?? key.ownerAddress;
    const deps = c.get("deps");
    const issuedAt = Math.floor(deps.now() / 1000);

    const token = await sign(
      {
        sub: subject,
        iat: issuedAt,
        exp: issuedAt + UPLOAD_JWT_TTL_SECONDS,
      },
      deps.env.LEAK_UPLOAD_JWT_SECRET,
      "HS256",
    );

    return c.json({ createUploadJwtFromApiKey: token }, 200);
  });
};
