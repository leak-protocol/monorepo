import type { OpenAPIHono } from "@hono/zod-openapi";
import { verify } from "hono/jwt";
import type { ApiVariables } from "../auth";
import { problem } from "../problem";

type KuboAddResponse = { Name: string; Hash: string; Size: string };

export const registerIpfsRoute = (
  app: OpenAPIHono<{ Variables: ApiVariables }>,
): void => {
  app.post("/ipfs/add", async (c) => {
    const header = c.req.header("authorization") ?? "";
    if (!header.startsWith("Bearer ")) {
      return problem(
        c,
        "unauthorized",
        "Expected an Authorization: Bearer token.",
      );
    }

    const deps = c.get("deps");
    try {
      await verify(header.slice(7), deps.env.LEAK_UPLOAD_JWT_SECRET, "HS256");
    } catch {
      return problem(
        c,
        "unauthorized",
        "The upload token is invalid or expired.",
      );
    }

    const form = await c.req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return problem(
        c,
        "bad-request",
        "Expected a multipart field named file.",
      );
    }

    const upstream = new FormData();
    upstream.append("file", file, file.name);
    const res = await fetch(
      `${deps.env.LEAK_IPFS_API_URL}/api/v0/add?cid-version=1`,
      { method: "POST", body: upstream },
    );
    if (!res.ok) {
      return problem(c, "internal", "The IPFS node rejected the upload.");
    }

    const added = (await res.json()) as KuboAddResponse;
    return c.json({
      cid: added.Hash,
      size: Number(added.Size),
      mimeType: file.type === "" ? undefined : file.type,
    });
  });
};
