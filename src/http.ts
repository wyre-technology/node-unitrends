/**
 * HTTP layer for the Unitrends API.
 *
 * Responsibilities:
 *   - Inject `Authorization: Bearer <token>` from the {@link SessionAuth}
 *   - Single-flight re-auth + single retry on a 401 mid-session
 *   - Map HTTP status codes to typed error classes
 *   - Inject a self-signed-cert-friendly HTTPS agent when `verifyTls === false`
 *   - Retry 503 (appliance overloaded) with a long backoff
 */

import type { ResolvedConfig } from './config.js';
import type { RateLimiter } from './rate-limiter.js';
import { SessionAuth } from './auth.js';
import {
  UnitrendsError,
  UnitrendsAuthenticationError,
  UnitrendsForbiddenError,
  UnitrendsNotFoundError,
  UnitrendsRateLimitError,
  UnitrendsServerError,
} from './errors.js';

/** Options for an HTTP request. */
export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
  /** Skip auth (used internally for /login). */
  skipAuth?: boolean;
}

/**
 * Allow injecting a custom fetch + per-request init for tests and for
 * supporting `verifyTls: false` without a hard dependency on `node:https`.
 */
export interface HttpClientDeps {
  fetcher?: typeof fetch;
  /**
   * Returns extra `RequestInit` fields to merge into every fetch call.
   * Used to inject the `dispatcher`/`agent` for self-signed certs.
   */
  perRequestInit?: () => RequestInit;
}

/** Authenticated HTTP client for the Unitrends API. */
export class HttpClient {
  private readonly config: ResolvedConfig;
  private readonly rateLimiter: RateLimiter;
  private readonly fetcher: typeof fetch;
  private readonly perRequestInit: () => RequestInit;
  private readonly auth: SessionAuth;

  constructor(config: ResolvedConfig, rateLimiter: RateLimiter, deps: HttpClientDeps = {}) {
    this.config = config;
    this.rateLimiter = rateLimiter;
    this.fetcher = deps.fetcher ?? fetch;
    this.perRequestInit = deps.perRequestInit ?? ((): RequestInit => ({}));
    this.auth = new SessionAuth(config, this.fetcher, this.perRequestInit);
  }

  /** Expose the auth manager (for tests + advanced callers). */
  getAuth(): SessionAuth {
    return this.auth;
  }

  /** Make an authenticated request. */
  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, params, skipAuth = false } = options;
    const url = this.buildUrl(path, params);
    const bodyString = body === undefined ? '' : JSON.stringify(body);
    return this.executeRequest<T>(url, method, bodyString, skipAuth, 0, false);
  }

  /** Convenience: JSON GET. */
  async get<T>(path: string, params?: RequestOptions['params']): Promise<T> {
    return this.request<T>(path, { method: 'GET', params });
  }

  /** Convenience: JSON POST. */
  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, { method: 'POST', body });
  }

  private buildUrl(
    path: string,
    params?: Record<string, string | number | boolean | undefined>
  ): string {
    const base = `${this.config.baseUrl}${path}`;
    if (!params) return base;
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined) continue;
      search.append(key, String(value));
    }
    const qs = search.toString();
    return qs ? `${base}?${qs}` : base;
  }

  private async executeRequest<T>(
    url: string,
    method: string,
    bodyString: string,
    skipAuth: boolean,
    retryCount: number,
    didReauth: boolean
  ): Promise<T> {
    await this.rateLimiter.waitForSlot();

    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    if (bodyString !== '') headers['Content-Type'] = 'application/json';
    if (!skipAuth) {
      const token = await this.auth.getToken();
      headers['Authorization'] = `Bearer ${token}`;
    }

    this.rateLimiter.recordRequest();

    const response = await this.fetcher(url, {
      ...this.perRequestInit(),
      method,
      headers,
      body: bodyString || undefined,
    });

    return this.handleResponse<T>(response, url, method, bodyString, skipAuth, retryCount, didReauth);
  }

  private async handleResponse<T>(
    response: Response,
    url: string,
    method: string,
    bodyString: string,
    skipAuth: boolean,
    retryCount: number,
    didReauth: boolean
  ): Promise<T> {
    if (response.ok) {
      const contentType = response.headers.get('content-type') ?? '';
      if (contentType.includes('application/json')) {
        return (await response.json()) as T;
      }
      const text = await response.text();
      return (text === '' ? ({} as T) : (text as unknown as T));
    }

    let responseBody: unknown;
    try {
      responseBody = await response.clone().json();
    } catch {
      try {
        responseBody = await response.text();
      } catch {
        responseBody = undefined;
      }
    }

    switch (response.status) {
      case 401: {
        // Single-flight re-auth and retry exactly once.
        if (!skipAuth && !didReauth) {
          this.auth.invalidate();
          return this.executeRequest<T>(url, method, bodyString, skipAuth, retryCount, true);
        }
        throw new UnitrendsAuthenticationError(
          'Authentication failed (token rejected after re-auth)',
          401,
          responseBody
        );
      }
      case 403:
        throw new UnitrendsForbiddenError(
          'Access forbidden — user lacks role on this appliance',
          responseBody
        );
      case 404:
        throw new UnitrendsNotFoundError('Resource not found', responseBody);
      case 429: {
        const retryAfterHeader = response.headers.get('retry-after');
        const retryAfterSeconds =
          retryAfterHeader !== null && retryAfterHeader !== ''
            ? parseInt(retryAfterHeader, 10)
            : undefined;
        if (this.rateLimiter.shouldRetry(retryCount)) {
          const delay = this.rateLimiter.calculateRetryDelay(retryCount, retryAfterSeconds);
          await this.sleep(delay);
          return this.executeRequest<T>(url, method, bodyString, skipAuth, retryCount + 1, didReauth);
        }
        throw new UnitrendsRateLimitError(
          'Rate limit exceeded and max retries reached',
          (retryAfterSeconds ?? 5) * 1000,
          responseBody
        );
      }
      case 503: {
        // Appliance overloaded — long backoff before retry.
        if (this.rateLimiter.shouldRetry(retryCount)) {
          await this.sleep(this.rateLimiter.getApplianceOverloadBackoffMs());
          return this.executeRequest<T>(url, method, bodyString, skipAuth, retryCount + 1, didReauth);
        }
        throw new UnitrendsServerError(
          'Appliance overloaded (503) — max retries reached',
          503,
          responseBody
        );
      }
      default:
        if (response.status >= 500) {
          if (retryCount === 0) {
            await this.sleep(1000);
            return this.executeRequest<T>(url, method, bodyString, skipAuth, 1, didReauth);
          }
          throw new UnitrendsServerError(
            `Server error: ${response.status} ${response.statusText}`,
            response.status,
            responseBody
          );
        }
        throw new UnitrendsError(
          `Request failed: ${response.status} ${response.statusText}`,
          response.status,
          responseBody
        );
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
