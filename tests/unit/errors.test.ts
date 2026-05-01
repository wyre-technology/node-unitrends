import { describe, it, expect } from 'vitest';
import {
  UnitrendsError,
  UnitrendsAuthenticationError,
  UnitrendsForbiddenError,
  UnitrendsNotFoundError,
  UnitrendsRateLimitError,
  UnitrendsServerError,
} from '../../src/errors.js';

describe('error class hierarchy', () => {
  it('all errors descend from UnitrendsError', () => {
    expect(new UnitrendsAuthenticationError('x')).toBeInstanceOf(UnitrendsError);
    expect(new UnitrendsForbiddenError('x')).toBeInstanceOf(UnitrendsError);
    expect(new UnitrendsNotFoundError('x')).toBeInstanceOf(UnitrendsError);
    expect(new UnitrendsRateLimitError('x')).toBeInstanceOf(UnitrendsError);
    expect(new UnitrendsServerError('x')).toBeInstanceOf(UnitrendsError);
  });

  it('preserves status codes', () => {
    expect(new UnitrendsAuthenticationError('x').statusCode).toBe(401);
    expect(new UnitrendsForbiddenError('x').statusCode).toBe(403);
    expect(new UnitrendsNotFoundError('x').statusCode).toBe(404);
    expect(new UnitrendsRateLimitError('x').statusCode).toBe(429);
    expect(new UnitrendsServerError('x').statusCode).toBe(500);
  });

  it('rate-limit error carries retryAfter', () => {
    const e = new UnitrendsRateLimitError('x', 12_000);
    expect(e.retryAfter).toBe(12_000);
  });

  it('preserves response payload', () => {
    const body = { message: 'nope' };
    const e = new UnitrendsNotFoundError('x', body);
    expect(e.response).toEqual(body);
  });
});
