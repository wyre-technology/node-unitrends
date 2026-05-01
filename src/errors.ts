/**
 * Custom error classes for the Unitrends client.
 */

/**
 * Base error class for all Unitrends errors.
 */
export class UnitrendsError extends Error {
  /** HTTP status code (0 for non-HTTP failures). */
  readonly statusCode: number;
  /** Raw response body, if available. */
  readonly response: unknown;

  constructor(message: string, statusCode: number = 0, response?: unknown) {
    super(message);
    this.name = 'UnitrendsError';
    this.statusCode = statusCode;
    this.response = response;
    Object.setPrototypeOf(this, UnitrendsError.prototype);
  }
}

/**
 * Authentication error (401, expired or invalid token).
 */
export class UnitrendsAuthenticationError extends UnitrendsError {
  constructor(message: string, statusCode: number = 401, response?: unknown) {
    super(message, statusCode, response);
    this.name = 'UnitrendsAuthenticationError';
    Object.setPrototypeOf(this, UnitrendsAuthenticationError.prototype);
  }
}

/**
 * Forbidden (403) — credentials valid but lack the required role on this appliance.
 */
export class UnitrendsForbiddenError extends UnitrendsError {
  constructor(message: string, response?: unknown) {
    super(message, 403, response);
    this.name = 'UnitrendsForbiddenError';
    Object.setPrototypeOf(this, UnitrendsForbiddenError.prototype);
  }
}

/**
 * Resource not found (404).
 */
export class UnitrendsNotFoundError extends UnitrendsError {
  constructor(message: string, response?: unknown) {
    super(message, 404, response);
    this.name = 'UnitrendsNotFoundError';
    Object.setPrototypeOf(this, UnitrendsNotFoundError.prototype);
  }
}

/**
 * Rate limit exceeded (429).
 *
 * Uncommon on Unitrends but possible on aggregating MSP Consoles.
 */
export class UnitrendsRateLimitError extends UnitrendsError {
  /** Suggested retry delay in milliseconds (parsed from Retry-After). */
  readonly retryAfter: number;

  constructor(message: string, retryAfter: number = 5000, response?: unknown) {
    super(message, 429, response);
    this.name = 'UnitrendsRateLimitError';
    this.retryAfter = retryAfter;
    Object.setPrototypeOf(this, UnitrendsRateLimitError.prototype);
  }
}

/**
 * Server error (500-503).
 *
 * 503 specifically indicates the appliance is overloaded — the SDK backs off
 * 30 seconds before retrying.
 */
export class UnitrendsServerError extends UnitrendsError {
  constructor(message: string, statusCode: number = 500, response?: unknown) {
    super(message, statusCode, response);
    this.name = 'UnitrendsServerError';
    Object.setPrototypeOf(this, UnitrendsServerError.prototype);
  }
}
