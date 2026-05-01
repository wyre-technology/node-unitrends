/**
 * Rate limiting for the Unitrends API.
 *
 * Unitrends rate limits are tier-dependent and per-appliance. Defaults cap at
 * ~60 req/min per client. 503 from an appliance indicates overload — back off
 * 30 seconds before retrying.
 */

import type { RateLimitConfig } from './config.js';

/**
 * Sliding-window rate limiter.
 */
export class RateLimiter {
  private readonly config: RateLimitConfig;
  private requestTimestamps: number[] = [];

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  /** Wait until it's safe to make another request. */
  async waitForSlot(): Promise<void> {
    if (!this.config.enabled) return;

    this.pruneOldTimestamps();

    const currentRate = this.requestTimestamps.length / this.config.maxRequests;

    if (currentRate >= this.config.throttleThreshold) {
      const delayMs = Math.min(
        1000 * (currentRate - this.config.throttleThreshold + 0.1) * 10,
        5000
      );
      await this.sleep(delayMs);
    }

    if (this.requestTimestamps.length >= this.config.maxRequests) {
      const oldest = this.requestTimestamps[0];
      if (oldest !== undefined) {
        const waitTime = oldest + this.config.windowMs - Date.now();
        if (waitTime > 0) await this.sleep(waitTime);
      }
    }
  }

  /** Record that a request was made. */
  recordRequest(): void {
    if (!this.config.enabled) return;
    this.requestTimestamps.push(Date.now());
  }

  /** Current usage as fraction of the limit. */
  getCurrentRate(): number {
    this.pruneOldTimestamps();
    return this.requestTimestamps.length / this.config.maxRequests;
  }

  /** Remaining requests in the current window. */
  getRemainingRequests(): number {
    this.pruneOldTimestamps();
    return Math.max(0, this.config.maxRequests - this.requestTimestamps.length);
  }

  /** Compute exponential backoff delay capped at 30s. */
  calculateRetryDelay(retryCount: number, retryAfterSeconds?: number): number {
    if (retryAfterSeconds !== undefined && retryAfterSeconds > 0) {
      return Math.min(retryAfterSeconds * 1000, 30_000);
    }
    return Math.min(this.config.retryAfterMs * Math.pow(2, retryCount), 30_000);
  }

  /** Backoff to use when an appliance returns 503. */
  getApplianceOverloadBackoffMs(): number {
    return this.config.applianceOverloadBackoffMs;
  }

  /** Whether another retry is allowed. */
  shouldRetry(retryCount: number): boolean {
    return retryCount < this.config.maxRetries;
  }

  private pruneOldTimestamps(): void {
    const cutoff = Date.now() - this.config.windowMs;
    this.requestTimestamps = this.requestTimestamps.filter((ts) => ts > cutoff);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
