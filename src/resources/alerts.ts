/**
 * Alert operations.
 */

import type { HttpClient } from '../http.js';
import type { Alert } from '../types/alerts.js';
import { PaginatedIterable, type PaginationParams, type PaginatedResponse } from '../pagination.js';

/**
 * Operations on alerts.
 */
export class AlertsResource {
  private readonly httpClient: HttpClient;

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
  }

  /** List alerts (single page). */
  async list(params?: PaginationParams): Promise<PaginatedResponse<Alert>> {
    return this.httpClient.get<PaginatedResponse<Alert>>('/alerts', {
      limit: params?.limit,
      offset: params?.offset,
    });
  }

  /** Iterate over every alert. */
  listAll(params?: PaginationParams): PaginatedIterable<Alert> {
    return new PaginatedIterable<Alert>(this.httpClient, '/alerts', params);
  }
}
