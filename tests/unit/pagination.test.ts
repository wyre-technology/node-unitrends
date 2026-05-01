import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server.js';
import { BASE } from '../mocks/handlers.js';
import { UnitrendsClient } from '../../src/client.js';
import { PaginatedIterable, MAX_PAGE_SIZE, buildPaginationParams } from '../../src/pagination.js';

function makeClient(): UnitrendsClient {
  return new UnitrendsClient({
    baseUrl: BASE,
    username: 'u',
    password: 'p',
    rateLimit: { maxRetries: 0, retryAfterMs: 1, enabled: false },
  });
}

describe('PaginatedIterable', () => {
  it('iterates across multiple pages, stopping at total', async () => {
    const c = makeClient();
    const seen: number[] = [];
    for await (const a of c.assets.listAll({ limit: 2 })) {
      seen.push(Number(a.id));
    }
    expect(seen).toEqual([1, 2, 3]);
  });

  it('toArray collects all items', async () => {
    const c = makeClient();
    const items = await c.assets.listAll({ limit: 2 }).toArray();
    expect(items.map((a) => a.id)).toEqual([1, 2, 3]);
  });

  it('honors a starting offset', async () => {
    const c = makeClient();
    const items = await c.assets.listAll({ limit: 2, offset: 1 }).toArray();
    expect(items.map((a) => a.id)).toEqual([2, 3]);
  });

  it('caps limit at MAX_PAGE_SIZE', async () => {
    const c = makeClient();
    let observedLimit: string | null = null;
    server.use(
      http.get(`${BASE}/assets`, ({ request }) => {
        observedLimit = new URL(request.url).searchParams.get('limit');
        return HttpResponse.json({ items: [], total: 0, limit: 50, offset: 0 });
      })
    );
    await c.assets.listAll({ limit: 99_999 }).toArray();
    expect(observedLimit).toBe(String(MAX_PAGE_SIZE));
  });

  it('returns immediately on an empty page', async () => {
    const c = makeClient();
    server.use(
      http.get(`${BASE}/assets`, () =>
        HttpResponse.json({ items: [], total: 0, limit: 50, offset: 0 })
      )
    );
    const items = await c.assets.listAll().toArray();
    expect(items).toEqual([]);
  });

  it('PaginatedIterable can be constructed standalone', () => {
    const c = makeClient();
    const http2 = (c as unknown as { httpClient: import('../../src/http.js').HttpClient })
      .httpClient;
    const it = new PaginatedIterable(http2, '/assets', { limit: 5 });
    expect(it).toBeInstanceOf(PaginatedIterable);
  });

  it('buildPaginationParams maps fields', () => {
    expect(buildPaginationParams({ limit: 10, offset: 20 })).toEqual({
      limit: 10,
      offset: 20,
    });
    expect(buildPaginationParams()).toEqual({});
  });
});
