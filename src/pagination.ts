/**
 * Pagination utilities for the Unitrends API.
 *
 * List endpoints use page-based pagination via `limit` (default 50, max 500)
 * and `offset` (default 0). Responses include a `total` count.
 *
 *     {
 *       items: T[],
 *       total: number,
 *       limit: number,
 *       offset: number
 *     }
 */

import type { HttpClient } from './http.js';

/** Pagination request parameters. */
export interface PaginationParams {
  /** Items per page (default 50, max 500). */
  limit?: number;
  /** Number of records to skip (default 0). */
  offset?: number;
}

/** Generic paginated response shape. */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

/** Maximum allowed page size per the Unitrends API. */
export const MAX_PAGE_SIZE = 500;
/** Default page size used when none is provided. */
export const DEFAULT_PAGE_SIZE = 50;

/** Map {@link PaginationParams} to the wire-format query parameters. */
export function buildPaginationParams(
  params?: PaginationParams
): Record<string, string | number | undefined> {
  if (!params) return {};
  return {
    limit: params.limit,
    offset: params.offset,
  };
}

/**
 * Async iterable over every item in a paginated endpoint, automatically
 * fetching subsequent pages as needed.
 */
export class PaginatedIterable<T> implements AsyncIterable<T> {
  private readonly httpClient: HttpClient;
  private readonly path: string;
  private readonly extraParams: Record<string, string | number | boolean | undefined>;
  private readonly limit: number;
  private readonly startOffset: number;

  constructor(
    httpClient: HttpClient,
    path: string,
    params: PaginationParams | undefined,
    extraParams?: Record<string, string | number | boolean | undefined>
  ) {
    this.httpClient = httpClient;
    this.path = path;
    this.extraParams = extraParams ?? {};
    const requested = params?.limit ?? DEFAULT_PAGE_SIZE;
    this.limit = Math.min(Math.max(1, requested), MAX_PAGE_SIZE);
    this.startOffset = params?.offset ?? 0;
  }

  async *[Symbol.asyncIterator](): AsyncIterator<T> {
    let offset = this.startOffset;
    while (true) {
      const response = await this.httpClient.get<PaginatedResponse<T>>(this.path, {
        ...this.extraParams,
        limit: this.limit,
        offset,
      });

      const items = response.items ?? [];
      for (const item of items) yield item;

      offset += items.length;
      const total = response.total ?? offset;
      if (items.length === 0 || offset >= total) return;
    }
  }

  /** Collect every item into an array. */
  async toArray(): Promise<T[]> {
    const out: T[] = [];
    for await (const item of this) out.push(item);
    return out;
  }
}
