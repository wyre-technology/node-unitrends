import { describe, it, expect } from 'vitest';
import { BASE } from '../mocks/handlers.js';
import { UnitrendsClient } from '../../src/client.js';

function makeClient(mspConsole = false): UnitrendsClient {
  return new UnitrendsClient({
    baseUrl: BASE,
    username: 'u',
    password: 'p',
    mspConsole,
    rateLimit: { maxRetries: 0, retryAfterMs: 1, enabled: false },
  });
}

describe('UnitrendsClient', () => {
  it('exposes all resource namespaces', () => {
    const c = makeClient();
    expect(c.appliances).toBeDefined();
    expect(c.assets).toBeDefined();
    expect(c.jobs).toBeDefined();
    expect(c.recoveryPoints).toBeDefined();
    expect(c.restores).toBeDefined();
    expect(c.replication).toBeDefined();
    expect(c.alerts).toBeDefined();
    expect(c.reports).toBeDefined();
  });

  it('lists appliances (MSP Console endpoint)', async () => {
    const c = makeClient(true);
    const page = await c.appliances.list();
    expect(page.items).toHaveLength(2);
    expect(page.total).toBe(2);
  });

  it('lists, gets, and iterates assets', async () => {
    const c = makeClient();
    const page = await c.assets.list();
    expect(page.items).toHaveLength(3);
    const one = await c.assets.get(1);
    expect(one.id).toBe(1);
  });

  it('asset shape carries applianceId', async () => {
    const c = makeClient();
    const page = await c.assets.list();
    expect(page.items[0]?.applianceId).toBe('app-1');
  });

  it('lists backup jobs and exposes status + verifyState separately', async () => {
    const c = makeClient();
    const backups = await c.jobs.listBackups();
    expect(backups.items[0]).toMatchObject({ status: 'success', verifyState: 'verified' });
    const history = await c.jobs.listHistory();
    // Successful job with failed verification — the docs gotcha.
    expect(history.items[0]).toMatchObject({ status: 'success', verifyState: 'failed' });
  });

  it('lists recovery points filtered by asset', async () => {
    const c = makeClient();
    const page = await c.recoveryPoints.list({ assetId: 1 });
    expect(page.items).toHaveLength(1);
    expect(page.items[0]?.assetId).toBe(1);
  });

  it('queues a restore and gets its status', async () => {
    const c = makeClient();
    const queued = await c.restores.queue({ recoveryPointId: 'rp1' });
    expect(queued).toMatchObject({ id: 'restore-1', status: 'queued' });
    const status = await c.restores.get('restore-1');
    expect(status.status).toBe('running');
  });

  it('lists replication queue, alerts, and the success-rate report', async () => {
    const c = makeClient();
    expect((await c.replication.listQueue()).items).toHaveLength(1);
    expect((await c.alerts.list()).items[0]?.severity).toBe('critical');
    const report = await c.reports.successRate();
    expect(report.successRate).toBe(0.9);
  });

  it('exposes a frozen-ish config snapshot via getConfig', () => {
    const c = makeClient();
    const cfg = c.getConfig();
    expect(cfg.baseUrl).toBe(BASE);
    expect(cfg.username).toBe('u');
  });
});

describe('MSP Console asset-id safety', () => {
  it('throws when listing assets without an applianceId on an MSP Console client', async () => {
    const c = makeClient(true);
    await expect(c.assets.list()).rejects.toThrow(/applianceId is required/);
    expect(() => c.assets.listAll()).toThrow(/applianceId is required/);
    await expect(c.assets.get(1)).rejects.toThrow(/applianceId is required/);
  });

  it('does NOT throw when applianceId is provided on an MSP Console client', async () => {
    const c = makeClient(true);
    const page = await c.assets.list({ applianceId: 'app-1' });
    expect(page.items.length).toBeGreaterThan(0);
  });

  it('does NOT throw when not an MSP Console (single-appliance mode)', async () => {
    const c = makeClient(false);
    const page = await c.assets.list();
    expect(page.items.length).toBeGreaterThan(0);
  });
});
