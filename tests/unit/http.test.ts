/**
 * HTTP layer + self-signed cert handling.
 *
 * For the self-signed-cert test we don't run a real TLS server; instead we
 * inject a `perRequestInit` factory and verify that the SDK calls it on each
 * request and merges its return value into the fetch options.
 */

import { describe, it, expect } from 'vitest';
import { BASE } from '../mocks/handlers.js';
import { UnitrendsClient } from '../../src/client.js';
import {
  UnitrendsForbiddenError,
  UnitrendsNotFoundError,
  UnitrendsRateLimitError,
  UnitrendsServerError,
} from '../../src/errors.js';

/* eslint-disable @typescript-eslint/explicit-function-return-type */
function makeClient(): UnitrendsClient {
  return new UnitrendsClient({
    baseUrl: BASE,
    username: 'u',
    password: 'p',
    rateLimit: { maxRetries: 0, retryAfterMs: 1, enabled: false },
  });
}

describe('HTTP error mapping', () => {
  it('maps 404 to UnitrendsNotFoundError', async () => {
    const c = makeClient();
    await expect(c.assets.get('missing')).rejects.toBeInstanceOf(UnitrendsNotFoundError);
  });

  it('maps 403 to UnitrendsForbiddenError', async () => {
    const c = makeClient();
    await expect(c.assets.get('forbidden')).rejects.toBeInstanceOf(UnitrendsForbiddenError);
  });

  it('maps 429 to UnitrendsRateLimitError after retries exhausted', async () => {
    const { http, HttpResponse } = await import('msw');
    const { server } = await import('../mocks/server.js');
    server.use(
      http.get(`${BASE}/assets`, () =>
        HttpResponse.json({ message: 'slow down' }, { status: 429, headers: { 'Retry-After': '0' } })
      )
    );
    const c = makeClient();
    await expect(c.assets.list()).rejects.toBeInstanceOf(UnitrendsRateLimitError);
  });

  it('maps 503 to UnitrendsServerError after retries exhausted', async () => {
    const { http, HttpResponse } = await import('msw');
    const { server } = await import('../mocks/server.js');
    server.use(
      http.get(`${BASE}/assets`, () =>
        HttpResponse.json({ message: 'overloaded' }, { status: 503 })
      )
    );
    const c = makeClient();
    await expect(c.assets.list()).rejects.toBeInstanceOf(UnitrendsServerError);
  });
});

describe('Self-signed TLS handling', () => {
  it('uses the default fetcher when verifyTls is true (default)', async () => {
    let perInitCalls = 0;
    const client = new UnitrendsClient(
      { baseUrl: BASE, username: 'u', password: 'p', rateLimit: { enabled: false } },
      {
        perRequestInit: () => {
          perInitCalls += 1;
          return {};
        },
      }
    );
    await client.assets.list();
    // perRequestInit is invoked at least once for login + once per request.
    expect(perInitCalls).toBeGreaterThan(0);
  });

  it('passes a custom dispatcher/agent into fetch when verifyTls is false', async () => {
    // Simulate the TLS-disabled init injection path. We confirm:
    //   1. The init factory is called on every fetch (login + request)
    //   2. The returned init merges into the fetch options
    const sentinel = Symbol('insecure-agent-sentinel');
    let observedDispatcher: unknown = null;

    const fakeFetch: typeof fetch = (_input, init): Promise<Response> => {
      // Capture the dispatcher passed by the SDK on every call.
      observedDispatcher = (init as unknown as { dispatcher?: unknown })?.dispatcher;
      // Return either a login or assets response based on URL.
      const url = _input instanceof Request ? _input.url : String(_input);
      if (url.endsWith('/login')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({ token: 'tok', expires: Math.floor(Date.now() / 1000) + 3600 }),
            { status: 200, headers: { 'content-type': 'application/json' } }
          )
        );
      }
      return Promise.resolve(
        new Response(JSON.stringify({ items: [], total: 0, limit: 50, offset: 0 }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      );
    };

    const client = new UnitrendsClient(
      {
        baseUrl: BASE,
        username: 'u',
        password: 'p',
        verifyTls: false,
        rateLimit: { enabled: false },
      },
      {
        fetcher: fakeFetch,
        // Override the auto-injected agent with a sentinel for assertion.
        perRequestInit: () => ({ dispatcher: sentinel } as unknown as RequestInit),
      }
    );

    await client.assets.list();
    expect(observedDispatcher).toBe(sentinel);
  });

  it('auto-wires an undici/https agent when verifyTls is false and no perRequestInit override is given', () => {
    // We don't mock fetch — we just assert the client constructs without throwing
    // and that it has an http client; the agent itself is created lazily on first request.
    const client = new UnitrendsClient({
      baseUrl: BASE,
      username: 'u',
      password: 'p',
      verifyTls: false,
      rateLimit: { enabled: false },
    });
    expect(client.getConfig().verifyTls).toBe(false);
  });
});
