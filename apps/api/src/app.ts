import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { apiKeyMiddleware } from "./auth";
import type { ApiVariables, AppDeps } from "./deps";
import { formatIssues, problem } from "./problem";
import { registerApiKeyRoute } from "./routes/apiKey";
import { registerExploreRoute } from "./routes/explore";
import { registerCreateUploadJwtRoute } from "./routes/createUploadJwt";
import { registerIpfsRoute } from "./routes/ipfs";
import { registerProfileRoute } from "./routes/profile";
import { registerTokenInfoRoute } from "./routes/tokenInfo";

export const OPENAPI_DOC_PATH = "/openapi";

export const createApp = (
  deps: AppDeps,
): OpenAPIHono<{ Variables: ApiVariables }> => {
  const app = new OpenAPIHono<{ Variables: ApiVariables }>({
    defaultHook: (result, c) => {
      if (!result.success) {
        return problem(c, "bad-request", formatIssues(result.error));
      }
      return undefined;
    },
  });

  // CORS runs BEFORE the api-key check: a preflight OPTIONS carries no auth header,
  // so checking the key first blocks the browser at the very first request.
  const allowedOrigins = deps.env.LEAK_CORS_ORIGINS.split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  app.use(
    "*",
    cors({
      origin: (origin) => (allowedOrigins.includes(origin) ? origin : null),
      allowHeaders: ["content-type", "api-key"],
      allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      maxAge: 600,
    }),
  );

  app.use("*", async (c, next) => {
    c.set("deps", deps);
    return next();
  });
  app.use("*", apiKeyMiddleware());

  // Touches no database and needs no key: a health check must answer even while
  // Postgres is down, otherwise an orchestrator kills an otherwise healthy container.
  app.get("/healthz", (c) => c.json({ status: "ok" }));

  app.notFound((c) => problem(c, "not-found", "No route matches this path."));

  app.onError((err, c) => {
    console.error("[leak-api]", err);
    return problem(c, "internal", "Unexpected error");
  });

  app.openAPIRegistry.registerComponent("securitySchemes", "api-key", {
    type: "apiKey",
    name: "api-key",
    in: "header",
  });

  registerApiKeyRoute(app);
  registerCreateUploadJwtRoute(app);
  registerIpfsRoute(app);
  registerProfileRoute(app);
  registerTokenInfoRoute(app);
  registerExploreRoute(app);

  app.doc(OPENAPI_DOC_PATH, {
    openapi: "3.1.0",
    info: { title: "Leak API", version: "1.0.0" },
    servers: [{ url: "http://localhost:8787/" }],
  });

  return app;
};
