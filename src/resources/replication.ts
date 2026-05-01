/**
 * Replication operations.
 */

import type { HttpClient } from '../http.js';
import type { ReplicationQueueItem } from '../types/replication.js';
import { PaginatedIterable, type PaginationParams, type PaginatedResponse } from '../pagination.js';

/**
 * Operations on the replication queue.
 */
export class ReplicationResource {
  private readonly httpClient: HttpClient;

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
  }

  /** List items in the replication queue (single page). */
  async listQueue(params?: PaginationParams): Promise<PaginatedResponse<ReplicationQueueItem>> {
    return this.httpClient.get<PaginatedResponse<ReplicationQueueItem>>('/replication/queue', {
      limit: params?.limit,
      offset: params?.offset,
    });
  }

  /** Iterate over every item in the replication queue. */
  listAllQueue(params?: PaginationParams): PaginatedIterable<ReplicationQueueItem> {
    return new PaginatedIterable<ReplicationQueueItem>(this.httpClient, '/replication/queue', params);
  }
}
