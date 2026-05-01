import { describe, it, expect } from 'vitest';
import { resolveConfig, DEFAULT_RATE_LIMIT_CONFIG } from '../../src/config.js';

describe('resolveConfig', () => {
  it('throws if baseUrl missing', () => {
    expect(() =>
      resolveConfig({ baseUrl: '', username: 'u', password: 'p' })
    ).toThrow(/baseUrl/);
  });

  it('throws if username/password missing', () => {
    expect(() =>
      resolveConfig({ baseUrl: 'https://x/api', username: '', password: 'p' })
    ).toThrow(/username and password/);
  });

  it('strips trailing slashes from baseUrl', () => {
    const c = resolveConfig({
      baseUrl: 'https://x/api///',
      username: 'u',
      password: 'p',
    });
    expect(c.baseUrl).toBe('https://x/api');
  });

  it('defaults verifyTls to true and mspConsole to false', () => {
    const c = resolveConfig({ baseUrl: 'https://x/api', username: 'u', password: 'p' });
    expect(c.verifyTls).toBe(true);
    expect(c.mspConsole).toBe(false);
    expect(c.rateLimit).toEqual(DEFAULT_RATE_LIMIT_CONFIG);
  });

  it('merges rate limit overrides', () => {
    const c = resolveConfig({
      baseUrl: 'https://x/api',
      username: 'u',
      password: 'p',
      rateLimit: { maxRequests: 10 },
    });
    expect(c.rateLimit.maxRequests).toBe(10);
    expect(c.rateLimit.windowMs).toBe(DEFAULT_RATE_LIMIT_CONFIG.windowMs);
  });
});
