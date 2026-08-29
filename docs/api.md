# API

Hono with `@hono/zod-openapi`, backed by Postgres. It covers the things a subgraph
structurally cannot: pinning metadata, issuing upload credentials, holding API keys.

Base URL locally: `http://127.0.0.1:8787`. The OpenAPI document is served at `/openapi`
and is the authoritative description of every schema below.

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/healthz` | liveness — touches no database, needs no key |
| `GET` | `/explore` | list and filter coins |
| `GET` | `/tokenInfo` | metadata and stats for one coin |
| `POST` | `/createUploadJWT` | short-lived credential for uploading metadata |
| `GET` | `/apiKey` | inspect the key on the current request |
| `GET` | `/profile` | profile and linked wallets for an address |
| `GET` | `/openapi` | the OpenAPI 3.1 document |

## Authentication

Send an API key in the `api-key` header:

```bash
curl -H 'api-key: YOUR_KEY' 'http://127.0.0.1:8787/explore'
```

A request with no key is not rejected outright — it proceeds unauthenticated, and routes
decide for themselves what that permits. An **invalid or revoked** key is a hard `401`.

## Errors

Failures use `application/problem+json` (RFC 9457):

```json
{
  "type": "bad-request",
  "title": "Bad Request",
  "status": 400,
  "detail": "chainId: expected integer"
}
```

Validation failures list the offending fields in `detail` rather than returning a bare
400, so a client can point at the input that was wrong.

## CORS

The allow-list comes from `LEAK_CORS_ORIGINS`, comma separated. It defaults to
`http://127.0.0.1:5173,http://localhost:5173` — where the web app runs locally.

**There is no wildcard.** This API issues upload JWTs, so allowing any origin would let an
arbitrary page request an upload credential on a visitor's behalf. Add production origins
explicitly.

The CORS middleware runs **before** the API-key middleware. A preflight `OPTIONS` carries
no auth headers, so checking the key first would fail every preflight and the browser would
never send the real request.

## Health check

```bash
curl -s http://127.0.0.1:8787/healthz
{"status":"ok"}
```

It deliberately does not touch Postgres. A health check that fails when the database is
briefly unavailable causes an orchestrator to kill a process that is otherwise fine.

## Configuration

Every variable is validated at startup by `apps/api/src/env.ts`; the process refuses to
start on a bad value rather than failing on the first request.

| Variable | Default |
|---|---|
| `LEAK_API_PORT` | `8787` |
| `LEAK_DATABASE_URL` | `postgres://localhost:5432/leak_api` |
| `LEAK_SUBGRAPH_URL` | `http://localhost:8000/subgraphs/name/leak` |
| `LEAK_RPC_URL` | `https://api.avax.network/ext/bc/C/rpc` |
| `LEAK_IPFS_API_URL` | `http://localhost:5001` |
| `LEAK_UPLOAD_JWT_SECRET` | none — **required**, minimum 32 characters |
| `LEAK_CORS_ORIGINS` | the two localhost origins above |

`apps/api/.env.example` has a working set for running outside docker.

**Use a database separate from graph-node's.** The API runs drizzle migrations; graph-node
owns and manages the schema in its own database. Pointing both at one database corrupts
both. The docker compose setup creates `leak_api` alongside `graph-node` for this reason.

## Generating a client

The OpenAPI document drives client generation:

```bash
pnpm --filter @leak/sdk exec openapi-ts
```

`@leak/sdk` ships the generated client. Treat the generated types as the source of truth
about the API surface — a hand-written description drifts, generated types cannot.

## Running it

```bash
cp apps/api/.env.example apps/api/.env
pnpm --filter @leak/api exec drizzle-kit migrate
pnpm --filter @leak/api run dev
```

Or bring up the whole stack with docker; see [`development.md`](development.md).
