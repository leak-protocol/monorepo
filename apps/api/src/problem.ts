import type { Context } from "hono";
import type { z } from "@hono/zod-openapi";

export const PROBLEM_CONTENT_TYPE = "application/problem+json";

export type ProblemKind =
  "bad-request" | "unauthorized" | "not-found" | "internal";

export type Problem = {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance: string;
};

const KINDS: Record<
  ProblemKind,
  { status: 400 | 401 | 404 | 500; title: string }
> = {
  "bad-request": { status: 400, title: "Bad request" },
  unauthorized: { status: 401, title: "Unauthorized" },
  "not-found": { status: 404, title: "Not found" },
  internal: { status: 500, title: "Internal server error" },
};

export const problemBody = (
  kind: ProblemKind,
  instance: string,
  detail?: string,
): Problem => {
  const { status, title } = KINDS[kind];
  return {
    type: `https://leak.ai/problems/${kind}`,
    title,
    status,
    ...(detail === undefined ? {} : { detail }),
    instance,
  };
};

export const problem = (c: Context, kind: ProblemKind, detail?: string) => {
  const body = problemBody(kind, new URL(c.req.url).pathname, detail);
  return c.body(JSON.stringify(body), KINDS[kind].status, {
    "content-type": PROBLEM_CONTENT_TYPE,
  });
};

export const formatIssues = (error: z.ZodError): string =>
  error.issues
    .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("; ");
