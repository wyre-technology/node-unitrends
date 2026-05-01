/**
 * MSW handlers mocking the Unitrends Backup REST API.
 */

import { http, HttpResponse } from 'msw';

export const BASE = 'https://appliance.test/api';

/** Counts of how many times each path has been hit (reset per test). */
export const callCounts = {
  login: 0,
};

export function resetCallCounts(): void {
  callCounts.login = 0;
}

function paginated<T>(
  items: T[],
  url: URL
): { items: T[]; total: number; limit: number; offset: number } {
  const limit = parseInt(url.searchParams.get('limit') ?? '50', 10);
  const offset = parseInt(url.searchParams.get('offset') ?? '0', 10);
  const slice = items.slice(offset, offset + limit);
  return { items: slice, total: items.length, limit, offset };
}

const APPLIANCES = [
  { id: 'app-1', name: 'Backup-A' },
  { id: 'app-2', name: 'Backup-B' },
];

const ASSETS_PAGE_ALL = [
  { id: 1, name: 'web01', applianceId: 'app-1' },
  { id: 2, name: 'web02', applianceId: 'app-1' },
  { id: 3, name: 'db01', applianceId: 'app-1' },
];

export const handlers = [
  // Login — token-based auth
  http.post(`${BASE}/login`, async ({ request }) => {
    callCounts.login += 1;
    const body = (await request.json()) as { username?: string; password?: string };
    if (body.username === 'baduser') {
      return HttpResponse.json({ message: 'invalid credentials' }, { status: 401 });
    }
    return HttpResponse.json({
      token: `tok-${callCounts.login}`,
      expires: Math.floor(Date.now() / 1000) + 3600,
    });
  }),

  // Appliances (MSP Console)
  http.get(`${BASE}/appliances`, ({ request }) => {
    return HttpResponse.json(paginated(APPLIANCES, new URL(request.url)));
  }),

  // Assets — supports pagination across two pages
  http.get(`${BASE}/assets`, ({ request }) => {
    const url = new URL(request.url);
    return HttpResponse.json(paginated(ASSETS_PAGE_ALL, url));
  }),

  http.get(`${BASE}/assets/1`, () => HttpResponse.json(ASSETS_PAGE_ALL[0])),
  http.get(`${BASE}/assets/missing`, () =>
    HttpResponse.json({ message: 'not found' }, { status: 404 })
  ),
  http.get(`${BASE}/assets/forbidden`, () =>
    HttpResponse.json({ message: 'forbidden' }, { status: 403 })
  ),

  // Jobs
  http.get(`${BASE}/jobs/backups`, ({ request }) =>
    HttpResponse.json(
      paginated(
        [{ id: 'j1', status: 'success', verifyState: 'verified' }],
        new URL(request.url)
      )
    )
  ),
  http.get(`${BASE}/jobs/history`, ({ request }) =>
    HttpResponse.json(
      paginated(
        [
          { id: 'h1', status: 'success', verifyState: 'failed' },
          { id: 'h2', status: 'failure', verifyState: 'unknown' },
        ],
        new URL(request.url)
      )
    )
  ),

  // Recovery points
  http.get(`${BASE}/recovery_points`, ({ request }) => {
    const url = new URL(request.url);
    const assetId = url.searchParams.get('assetId');
    const items =
      assetId === '1'
        ? [{ id: 'rp1', assetId: 1, timestamp: 1700000000 }]
        : [{ id: 'rp1', assetId: 1, timestamp: 1700000000 }, { id: 'rp2', assetId: 2, timestamp: 1700003600 }];
    return HttpResponse.json(paginated(items, url));
  }),

  // Restores
  http.post(`${BASE}/restores`, async ({ request }) => {
    const body = (await request.json()) as { recoveryPointId?: unknown };
    return HttpResponse.json({
      id: 'restore-1',
      status: 'queued',
      recoveryPointId: body.recoveryPointId,
    });
  }),
  http.get(`${BASE}/restores/restore-1`, () =>
    HttpResponse.json({ id: 'restore-1', status: 'running' })
  ),

  // Replication queue
  http.get(`${BASE}/replication/queue`, ({ request }) =>
    HttpResponse.json(paginated([{ id: 'q1', status: 'pending' }], new URL(request.url)))
  ),

  // Alerts
  http.get(`${BASE}/alerts`, ({ request }) =>
    HttpResponse.json(
      paginated([{ id: 'a1', severity: 'critical', message: 'disk full' }], new URL(request.url))
    )
  ),

  // Reports
  http.get(`${BASE}/reports/successrate`, () =>
    HttpResponse.json({
      totalJobs: 10,
      successfulJobs: 9,
      failedJobs: 1,
      successRate: 0.9,
    })
  ),
];
