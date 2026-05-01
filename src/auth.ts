/**
 * Session-token authentication for the Unitrends Backup REST API.
 *
 * Login flow:
 *
 *   POST /api/login  { "username": "...", "password": "..." }
 *   →    { "token": "...", "expires": <epochSeconds> }
 *
 * The token is sent on subsequent requests as `Authorization: Bearer <token>`.
 * Tokens have a 60-minute idle timeout (sliding window). When a 401 is observed
 * mid-session, the {@link SessionAuth} performs single-flight re-authentication
 * and retries the request once.
 */

import type { ResolvedConfig } from './config.js';
import { UnitrendsAuthenticationError } from './errors.js';

/** Successful login response shape. */
export interface LoginResponse {
  token: string;
  /** Token expiry in Unix epoch seconds. */
  expires: number;
}

/** Internal session state. */
interface Session {
  token: string;
  expires: number;
}

/**
 * Single-flight session-token manager. Login requests are deduplicated so
 * that concurrent callers all receive the same fresh token.
 */
export class SessionAuth {
  private readonly config: ResolvedConfig;
  private readonly fetcher: typeof fetch;
  private readonly requestInit: () => RequestInit;
  private session: Session | null = null;
  private inflight: Promise<Session> | null = null;

  constructor(
    config: ResolvedConfig,
    fetcher: typeof fetch,
    requestInit: () => RequestInit
  ) {
    this.config = config;
    this.fetcher = fetcher;
    this.requestInit = requestInit;
  }

  /** Currently cached token, if any. Mostly useful for tests. */
  getCachedToken(): string | null {
    return this.session?.token ?? null;
  }

  /** Force the next request to re-authenticate (e.g. after a mid-session 401). */
  invalidate(): void {
    this.session = null;
  }

  /**
   * Get a valid token, logging in (or refreshing) as needed.
   *
   * Concurrent callers share a single in-flight login.
   */
  async getToken(): Promise<string> {
    if (this.isSessionFresh(this.session)) {
      return this.session.token;
    }
    if (!this.inflight) {
      this.inflight = this.doLogin().finally(() => {
        this.inflight = null;
      });
    }
    const session = await this.inflight;
    this.session = session;
    return session.token;
  }

  private isSessionFresh(session: Session | null): session is Session {
    if (!session) return false;
    // 30-second clock-skew safety buffer.
    return session.expires * 1000 > Date.now() + 30_000;
  }

  private async doLogin(): Promise<Session> {
    const url = `${this.config.baseUrl}/login`;
    const response = await this.fetcher(url, {
      ...this.requestInit(),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        username: this.config.username,
        password: this.config.password,
      }),
    });

    if (!response.ok) {
      let body: unknown;
      try {
        body = await response.json();
      } catch {
        body = undefined;
      }
      throw new UnitrendsAuthenticationError(
        `Login failed: ${response.status} ${response.statusText}`,
        response.status,
        body
      );
    }

    const payload = (await response.json()) as Partial<LoginResponse>;
    if (typeof payload.token !== 'string' || typeof payload.expires !== 'number') {
      throw new UnitrendsAuthenticationError(
        'Login response missing token or expires fields',
        response.status,
        payload
      );
    }
    return { token: payload.token, expires: payload.expires };
  }
}
