# @wyre-technology/node-unitrends

Comprehensive, fully-typed Node.js / TypeScript client library for the
Unitrends Backup REST API.

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)

## Features

- Full coverage of the documented endpoints: appliances, assets, jobs (backups + history), recovery points, restores, replication queue, alerts, reports
- Session-token (`POST /api/login`) auth with single-flight re-auth on 401
- Self-signed TLS support (`verifyTls: false`) for on-prem appliances
- Page-based pagination via `list()` + async iterator `listAll()`
- Defensive client-side rate limiting tuned for per-appliance limits, with 503 = "appliance overloaded" backoff
- Typed error hierarchy
- ESM + CommonJS dual exports, full `.d.ts` types
- Zero `any` in the public API

## Install

```bash
npm install @wyre-technology/node-unitrends
```

The package is published to GitHub Packages under the `@wyre-technology` scope.
Add this to a project-local `.npmrc`:

```
@wyre-technology:registry=https://npm.pkg.github.com
```

## Quick start

```typescript
import { UnitrendsClient } from '@wyre-technology/node-unitrends';

const client = new UnitrendsClient({
  baseUrl:  'https://backup.example.com/api',
  username: process.env.UNITRENDS_USER!,
  password: process.env.UNITRENDS_PASS!,
});

// One page at a time
const page = await client.assets.list({ limit: 100 });
console.log(page.total);

// Stream every asset, fetching pages on demand
for await (const asset of client.assets.listAll({ limit: 200 })) {
  console.log(asset.id, asset.hostname);
}
```

## Configuration

```typescript
new UnitrendsClient({
  baseUrl:  'https://backup.example.com/api', // required
  username: 'admin',
  password: '...',

  // Talking to an aggregating MSP Console rather than a single appliance.
  // When true, asset operations REQUIRE an applianceId.
  mspConsole: false,

  // On-prem appliances often ship with self-signed certs.
  // Disable verification ONLY on trusted internal networks.
  verifyTls: true,

  // Optional — tune client-side rate limiting (defaults shown).
  rateLimit: {
    enabled: true,
    maxRequests: 60,
    windowMs: 60_000,
    throttleThreshold: 0.8,
    retryAfterMs: 5_000,
    maxRetries: 3,
    applianceOverloadBackoffMs: 30_000,
  },
});
```

## Authentication

The SDK calls `POST /api/login` with `{ username, password }`, captures the
returned `token` + `expires`, and sends `Authorization: Bearer <token>` on all
subsequent requests. Tokens have a 60-minute idle (sliding) timeout.

If a request fails with 401 mid-session, the SDK invalidates the cached token,
re-authenticates **once** under a single-flight lock (concurrent callers share
one in-flight login), and retries the request.

## Self-signed certificates

Many on-prem Unitrends Backup appliances use a self-signed TLS certificate.
Set `verifyTls: false` to disable certificate validation:

```typescript
const client = new UnitrendsClient({
  baseUrl: 'https://backup.internal/api',
  username: '...',
  password: '...',
  verifyTls: false,
});
```

> **Security:** disabling certificate verification removes the only protection
> against man-in-the-middle attacks. Only do this on trusted internal networks.
> Prefer installing the appliance's CA into your system trust store.

## Pagination

| Param   | Default | Max |
| ------- | ------- | --- |
| `limit` | 50      | 500 |
| `offset`| 0       | —   |

Responses include `total`. Use `listAll()` to iterate all pages automatically.

## API surface

```typescript
client.appliances.list(params)            // MSP Console only
client.appliances.listAll(params)         // MSP Console only

client.assets.list({ applianceId?, limit?, offset? })
client.assets.listAll({ applianceId?, limit?, offset? })
client.assets.get(assetId, applianceId?)

client.jobs.listBackups({ applianceId?, ... })
client.jobs.listAllBackups({ applianceId?, ... })
client.jobs.listHistory({ applianceId?, ... })
client.jobs.listAllHistory({ applianceId?, ... })

client.recoveryPoints.list({ assetId?, applianceId?, ... })
client.recoveryPoints.listAll({ assetId?, applianceId?, ... })

client.restores.queue({ recoveryPointId, applianceId?, ... }) // POST /api/restores
client.restores.get(restoreId)

client.replication.listQueue(params)
client.replication.listAllQueue(params)

client.alerts.list(params)
client.alerts.listAll(params)

client.reports.successRate({ applianceId?, startTime?, endTime? })
```

## Error handling

```typescript
import {
  UnitrendsError,
  UnitrendsAuthenticationError,
  UnitrendsForbiddenError,
  UnitrendsNotFoundError,
  UnitrendsRateLimitError,
  UnitrendsServerError,
} from '@wyre-technology/node-unitrends';

try {
  await client.assets.get(123);
} catch (err) {
  if (err instanceof UnitrendsRateLimitError) {
    await new Promise((r) => setTimeout(r, err.retryAfter));
  } else if (err instanceof UnitrendsServerError && err.statusCode === 503) {
    // Appliance is overloaded — already auto-retried with 30s backoff.
  } else {
    throw err;
  }
}
```

## Gotchas

- **Asset IDs are appliance-scoped.** Asset `123` on appliance A is NOT the
  same record as asset `123` on appliance B. The `Asset` type carries
  `applianceId` for this reason. When `mspConsole: true` the SDK enforces that
  asset operations include `applianceId`.
- **MSP Console exposes a subset of endpoints.** Asset-level operations like
  `restores.queue(...)` typically must target the owning appliance directly.
- **Job `status` ≠ "data is recoverable".** A job can have `status: 'success'`
  while its resulting recovery point has `verifyState: 'failed'`. The `Job`
  type exposes both fields.
- **Self-signed certs.** See above — `verifyTls: false` disables MITM
  protection; use only on trusted networks.

## Development

```bash
npm install
npm test
npm run typecheck
npm run lint
npm run build
```

## License

Apache-2.0
