import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { testDeps } from "./setup/db";

const HERE = fileURLToPath(new URL(".", import.meta.url));

const COMMITTED_TYPES = join(
  HERE,
  "../../../packages/leak-sdk/src/client/types.gen.ts",
);

const OPENAPI_TS_BIN = join(
  HERE,
  "../node_modules/@hey-api/openapi-ts/bin/index.cjs",
);

const OPERATIONS = [
  "GetApiKey",
  "SetCreateUploadJwt",
  "GetTokenInfo",
  "GetExplore",
  "GetProfile",
] as const;

const normalise = (text: string): string =>
  text
    .replace(/\/\*\*[\s\S]*?\*\//g, "")
    .replace(/'/g, '"')
    .replace(/\s+/g, " ")
    .replace(/\{ \| /g, "{ ")
    .replace(/: \| /g, ": ")
    .trim();

const block = (source: string, operation: string): string => {
  const start = source.indexOf(`export type ${operation}Data`);
  const aliasAt = source.indexOf(`export type ${operation}Response =`, start);
  if (start < 0 || aliasAt < 0) {
    throw new Error(`block for ${operation} not found`);
  }
  const end = source.indexOf(";", aliasAt);
  return normalise(source.slice(start, end + 1));
};

const deps = await testDeps();

afterAll(async () => {
  await deps.close();
});

const generate = (): string => {
  const dir = mkdtempSync(join(tmpdir(), "leak-api-parity-"));
  return dir;
};

const runOpenapiTs = (dir: string): void => {
  execFileSync(
    process.execPath,
    [
      OPENAPI_TS_BIN,
      "--input",
      "openapi.json",
      "--output",
      "generated",
      "--plugins",
      "@hey-api/client-fetch",
    ],
    { cwd: dir, stdio: "pipe" },
  );
};

describe("the client generated from /openapi matches packages/leak-sdk/src/client", () => {
  it("all five operations match character for character once JSDoc is stripped", async () => {
    const dir = generate();
    const res = await createApp(deps).request("/openapi");
    expect(res.status).toBe(200);
    writeFileSync(join(dir, "openapi.json"), await res.text(), "utf8");

    runOpenapiTs(dir);

    const generated = readFileSync(
      join(dir, "generated", "types.gen.ts"),
      "utf8",
    );
    const committed = readFileSync(COMMITTED_TYPES, "utf8");

    for (const operation of OPERATIONS) {
      expect(block(generated, operation), operation).toBe(
        block(committed, operation),
      );
    }
  });

  it("generated function names match the names the SDK imports", async () => {
    const dir = generate();
    const res = await createApp(deps).request("/openapi");
    writeFileSync(join(dir, "openapi.json"), await res.text(), "utf8");

    runOpenapiTs(dir);

    const sdk = readFileSync(join(dir, "generated", "sdk.gen.ts"), "utf8");
    for (const name of [
      "getApiKey",
      "setCreateUploadJwt",
      "getTokenInfo",
      "getExplore",
      "getProfile",
    ]) {
      expect(sdk).toContain(`export const ${name} =`);
    }
    expect(sdk).not.toContain("postCreateUploadJwt");
  });

  it("every operation carries the api-key security block", async () => {
    const dir = generate();
    const res = await createApp(deps).request("/openapi");
    writeFileSync(join(dir, "openapi.json"), await res.text(), "utf8");

    runOpenapiTs(dir);

    const sdk = readFileSync(join(dir, "generated", "sdk.gen.ts"), "utf8");
    const occurrences = sdk.split("name: 'api-key'").length - 1;
    expect(occurrences).toBe(5);
  });
});
