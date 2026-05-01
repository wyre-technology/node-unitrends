/**
 * Configuration types and defaults for the Unitrends client.
 *
 * Unitrends is per-appliance: every customer (or MSP Console) has its own
 * base URL of the form `https://<appliance>/api`. There is no shared regional
 * endpoint, so {@link UnitrendsConfig.baseUrl} is required.
 */

/**
 * Rate limiting configuration. Defaults are defensive — Unitrends rate limits
 * are appliance-tier-dependent, so we cap concurrency low.
 */
export interface RateLimitConfig {
  /** Whether rate limiting is enabled (default: true). */
  enabled: boolean;
  /** Maximum requests per window (default: 60). */
  maxRequests: number;
  /** Window duration in milliseconds (default: 60000). */
  windowMs: number;
  /** Threshold percentage to start throttling (default: 0.8 = 80%). */
  throttleThreshold: number;
  /** Default delay between retries on 429 (default: 5000ms). */
  retryAfterMs: number;
  /** Maximum retry attempts on rate limit / 503 errors (default: 3). */
  maxRetries: number;
  /** Backoff (ms) when an appliance returns 503 (overloaded). Default: 30000. */
  applianceOverloadBackoffMs: number;
}

/**
 * Default rate limit configuration tuned for a single Unitrends appliance.
 */
export const DEFAULT_RATE_LIMIT_CONFIG: RateLimitConfig = {
  enabled: true,
  maxRequests: 60,
  windowMs: 60_000,
  throttleThreshold: 0.8,
  retryAfterMs: 5_000,
  maxRetries: 3,
  applianceOverloadBackoffMs: 30_000,
};

/**
 * Configuration for the Unitrends client.
 */
export interface UnitrendsConfig {
  /**
   * Required. Per-appliance base URL, e.g. `https://backup.example.com/api`
   * or for the MSP Console `https://msp-console.example.com/api`.
   */
  baseUrl: string;
  /** Username for the session-token login. */
  username: string;
  /** Password for the session-token login. */
  password: string;
  /**
   * Whether to verify TLS certificates (default: true).
   *
   * On-prem Unitrends Backup appliances frequently ship with self-signed
   * certificates. Setting `verifyTls: false` disables certificate validation
   * for the underlying HTTPS agent. Only disable on trusted internal networks.
   */
  verifyTls?: boolean;
  /**
   * Whether this client is talking to an MSP Console (which aggregates
   * multiple appliances) rather than a single appliance. When true, the SDK
   * enforces that asset-level operations include an `applianceId`.
   */
  mspConsole?: boolean;
  /** Rate limiting configuration overrides. */
  rateLimit?: Partial<RateLimitConfig>;
}

/**
 * Resolved configuration with defaults applied.
 */
export interface ResolvedConfig {
  baseUrl: string;
  username: string;
  password: string;
  verifyTls: boolean;
  mspConsole: boolean;
  rateLimit: RateLimitConfig;
}

/**
 * Resolve an {@link UnitrendsConfig} by applying defaults.
 */
export function resolveConfig(config: UnitrendsConfig): ResolvedConfig {
  if (!config.baseUrl) {
    throw new Error('baseUrl is required (e.g. https://backup.example.com/api)');
  }
  if (!config.username || !config.password) {
    throw new Error('Both username and password must be provided');
  }
  return {
    baseUrl: config.baseUrl.replace(/\/+$/, ''),
    username: config.username,
    password: config.password,
    verifyTls: config.verifyTls ?? true,
    mspConsole: config.mspConsole ?? false,
    rateLimit: {
      ...DEFAULT_RATE_LIMIT_CONFIG,
      ...config.rateLimit,
    },
  };
}
