import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server.js';
import { BASE, callCounts, resetCallCounts } from '../mocks/handlers.js';
import { UnitrendsClient } from '../../src/client.js';
import { UnitrendsAuthenticationError } from '../../src/errors.js';

function makeClient(overrides: Partial<{ username: string; password: string }> = {}): UnitrendsClient {
  return new UnitrendsClient({
    baseUrl: BASE,
    username: overrides.username ?? 'u',
    password: overrides.password ?? 'p',
    rateLimit: { maxRetries: 0, retryAfterMs: 1, enabled: false },
  });
}

beforeEach(() => {
  resetCallCounts();
});

describe('Session-token login', () => {
  it('captures token + expires from /login and reuses it across requests', async () => {
    const c = makeClient();
    await c.assets.list();
    await c.assets.list();
    await c.alerts.list();
    expect(callCounts.login).toBe(1);
    const auth = (c as unknown as { httpClient: { getAuth: () => { getCachedToken: () => string | null } } })
      .httpClient.getAuth();
    expect(auth.getCachedToken()).toBe('tok-1');
  });

  it('throws UnitrendsAuthenticationError on bad credentials', async () => {
    const c = makeClient({ username: 'baduser' });
    await expect(c.assets.list()).rejects.toBeInstanceOf(UnitrendsAuthenticationError);
  });

  it('rejects login responses missing token/expires', async () => {
    server.use(
      http.post(`${BASE}/login`, () => HttpResponse.json({ ok: true }))
    );
    const c = makeClient();
    await expect(c.assets.list()).rejects.toBeInstanceOf(UnitrendsAuthenticationError);
  });

  it('sends Authorization: Bearer header on requests', async () => {
    let capturedAuth: string | null = null;
    server.use(
      http.get(`${BASE}/assets`, ({ request }) => {
        capturedAuth = request.headers.get('authorization');
        return HttpResponse.json({ items: [], total: 0, limit: 50, offset: 0 });
      })
    );
    const c = makeClient();
    await c.assets.list();
    expect(capturedAuth).toMatch(/^Bearer tok-\d+$/);
  });
});

describe('Single-flight re-auth on 401', () => {
  it('re-logs-in once and retries on a mid-session 401', async () => {
    let assetCalls = 0;
    server.use(
      http.get(`${BASE}/assets`, () => {
        assetCalls += 1;
        if (assetCalls === 1) {
          return HttpResponse.json({ message: 'token expired' }, { status: 401 });
        }
        return HttpResponse.json({ items: [], total: 0, limit: 50, offset: 0 });
      })
    );
    const c = makeClient();
    await c.assets.list();
    expect(assetCalls).toBe(2);
    expect(callCounts.login).toBe(2);
  });

  it('only re-auths once even if the retry also 401s', async () => {
    let assetCalls = 0;
    server.use(
      http.get(`${BASE}/assets`, () => {
        assetCalls += 1;
        return HttpResponse.json({ message: 'still bad' }, { status: 401 });
      })
    );
    const c = makeClient();
    await expect(c.assets.list()).rejects.toBeInstanceOf(UnitrendsAuthenticationError);
    expect(assetCalls).toBe(2);
    expect(callCounts.login).toBe(2);
  });

  it('deduplicates concurrent logins (single-flight)', async () => {
    const c = makeClient();
    await Promise.all([c.assets.list(), c.assets.list(), c.assets.list()]);
    // Single login regardless of concurrency.
    expect(callCounts.login).toBe(1);
  });
});
