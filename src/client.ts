/**
 * Main Unitrends client.
 */

import { createRequire } from 'node:module';

import type { UnitrendsConfig, ResolvedConfig } from './config.js';
import { resolveConfig } from './config.js';
import { HttpClient, type HttpClientDeps } from './http.js';
import { RateLimiter } from './rate-limiter.js';
import { AppliancesResource } from './resources/appliances.js';
import { AssetsResource } from './resources/assets.js';
import { JobsResource } from './resources/jobs.js';
import { RecoveryPointsResource } from './resources/recoveryPoints.js';
import { RestoresResource } from './resources/restores.js';
import { ReplicationResource } from './resources/replication.js';
import { AlertsResource } from './resources/alerts.js';
import { ReportsResource } from './resources/reports.js';

/**
 * Unitrends Backup REST API client.
 *
 * @example
 * ```typescript
 * import { UnitrendsClient } from '@wyre-technology/node-unitrends';
 *
 * const client = new UnitrendsClient({
 *   baseUrl:  'https://backup.example.com/api',
 *   username: process.env.UNITRENDS_USER!,
 *   password: process.env.UNITRENDS_PASS!,
 *   verifyTls: false, // only on trusted internal networks
 * });
 *
 * for await (const asset of client.assets.listAll()) {
 *   console.log(asset.id, asset.hostname);
 * }
 * ```
 */
export class UnitrendsClient {
  private readonly config: ResolvedConfig;
  private readonly rateLimiter: RateLimiter;
  private readonly httpClient: HttpClient;

  /** Appliance operations (MSP Console only). */
  readonly appliances: AppliancesResource;
  /** Protected asset operations. */
  readonly assets: AssetsResource;
  /** Backup job operations. */
  readonly jobs: JobsResource;
  /** Recovery point operations. */
  readonly recoveryPoints: RecoveryPointsResource;
  /** Restore operations. */
  readonly restores: RestoresResource;
  /** Replication queue operations. */
  readonly replication: ReplicationResource;
  /** Alert operations. */
  readonly alerts: AlertsResource;
  /** Canned report operations. */
  readonly reports: ReportsResource;

  constructor(config: UnitrendsConfig, deps: HttpClientDeps = {}) {
    this.config = resolveConfig(config);
    this.rateLimiter = new RateLimiter(this.config.rateLimit);

    // If TLS verification is disabled and no perRequestInit was provided,
    // wire up a node:https Agent that accepts self-signed certs.
    const resolvedDeps: HttpClientDeps = { ...deps };
    if (!this.config.verifyTls && !resolvedDeps.perRequestInit) {
      resolvedDeps.perRequestInit = createInsecureAgentInit();
    }

    this.httpClient = new HttpClient(this.config, this.rateLimiter, resolvedDeps);

    this.appliances = new AppliancesResource(this.httpClient);
    this.assets = new AssetsResource(this.httpClient, this.config);
    this.jobs = new JobsResource(this.httpClient);
    this.recoveryPoints = new RecoveryPointsResource(this.httpClient);
    this.restores = new RestoresResource(this.httpClient);
    this.replication = new ReplicationResource(this.httpClient);
    this.alerts = new AlertsResource(this.httpClient);
    this.reports = new ReportsResource(this.httpClient);
  }

  /** Get the resolved configuration. */
  getConfig(): Readonly<ResolvedConfig> {
    return this.config;
  }
}

/**
 * Build a `perRequestInit` factory that injects a Node `undici` dispatcher
 * configured to accept self-signed TLS certificates.
 *
 * Lazily initialized on the first request — keeps the SDK usable in environments
 * (e.g. browsers, Cloudflare Workers) where `node:https`/`undici` aren't available.
 */
function createInsecureAgentInit(): () => RequestInit {
  let dispatcher: unknown = undefined;
  let initialized = false;

  // Use createRequire so this works under both ESM and CJS bundle outputs.
  const requireFn = createRequire(import.meta.url);

  return () => {
    if (!initialized) {
      initialized = true;
      try {
        // Prefer undici Agent (matches Node 22 fetch internals).
        const undici = requireFn('undici') as { Agent: new (opts: unknown) => unknown };
        dispatcher = new undici.Agent({ connect: { rejectUnauthorized: false } });
      } catch {
        try {
          const https = requireFn('node:https') as { Agent: new (opts: unknown) => unknown };
          dispatcher = new https.Agent({ rejectUnauthorized: false });
        } catch {
          dispatcher = undefined;
        }
      }
    }
    if (dispatcher === undefined) return {};
    // Node's fetch reads `dispatcher`; older agents are read via `agent`.
    return { dispatcher } as unknown as RequestInit;
  };
}
