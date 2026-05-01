# node-unitrends

Node.js/TypeScript SDK for the Unitrends Backup REST API.

## Project info

- **GitHub**: https://github.com/wyre-technology/node-unitrends
- **Package**: `@wyre-technology/node-unitrends` (GitHub Packages)
- **Sister SDK**: [`node-datto-bcdr`](https://github.com/wyre-technology/node-datto-bcdr) — same overall architecture, different auth model (HMAC instead of session tokens).

## Architecture

- `src/client.ts` — composition root (`UnitrendsClient`)
- `src/config.ts` — config resolution + rate-limit defaults
- `src/auth.ts` — `SessionAuth`: token capture, single-flight re-auth
- `src/http.ts` — fetch + retry + error mapping; injectable `perRequestInit` for self-signed TLS
- `src/rate-limiter.ts` — sliding-window limiter (60/min default)
- `src/pagination.ts` — `PaginatedIterable` for `limit`/`offset` async iteration
- `src/resources/*.ts` — one class per API entity
- `src/types/*.ts` — domain types (intentionally permissive — `[key: string]: unknown` on most interfaces)

## Auth model gotchas

- `POST /api/login` returns `{ token, expires }`. Send `Authorization: Bearer <token>` thereafter.
- 60-minute idle (sliding) timeout. On a mid-session 401, the HTTP client invalidates the token, re-logs-in once, and retries — exactly once.
- Concurrent callers share one in-flight login (single-flight via `SessionAuth.inflight`).

## Self-signed cert handling

- `verifyTls: false` triggers `createInsecureAgentInit()` which lazily requires `undici` (preferred) or `node:https` and constructs an Agent with `rejectUnauthorized: false`. The agent is passed via `dispatcher` on every fetch.
- Tests inject a custom `perRequestInit` to verify the SDK calls it on every request and merges it into fetch options — no need to spin up a TLS server.

## MSP Console gotcha

- Asset IDs (and many other IDs) are appliance-scoped — `id: 123` on appliance A is NOT the same record as on appliance B.
- When `mspConsole: true`, `AssetsResource` throws if `applianceId` is missing. This catches a whole category of cross-appliance bugs.

## Job semantics

- `status` = whether the job *ran* successfully.
- `verifyState` = whether the resulting recovery point is verifiable.
- A job can be `status: success` + `verifyState: failed`. Both are exposed on the `Job` type.

## Build / test

```bash
npm install
npm test
npm run typecheck
npm run lint
npm run build
```

## Release

Pushes to `main` trigger semantic-release via `.github/workflows/release.yml`, which publishes to GitHub Packages.
