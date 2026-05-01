/**
 * Job operations.
 */

import type { HttpClient } from '../http.js';
import type { Job } from '../types/jobs.js';
import type { ApplianceId } from '../types/common.js';
import { PaginatedIterable, type PaginationParams, type PaginatedResponse } from '../pagination.js';

export interface JobListParams extends PaginationParams {
  applianceId?: ApplianceId;
}

/**
 * Operations on backup jobs (active and historical).
 */
export class JobsResource {
  private readonly httpClient: HttpClient;

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
  }

  /** List currently active backup jobs (single page). */
  async listBackups(params?: JobListParams): Promise<PaginatedResponse<Job>> {
    return this.httpClient.get<PaginatedResponse<Job>>('/jobs/backups', {
      limit: params?.limit,
      offset: params?.offset,
      applianceId: params?.applianceId,
    });
  }

  /** Iterate over every active backup job. */
  listAllBackups(params?: JobListParams): PaginatedIterable<Job> {
    return new PaginatedIterable<Job>(this.httpClient, '/jobs/backups', params, {
      applianceId: params?.applianceId,
    });
  }

  /** List historical jobs (single page). */
  async listHistory(params?: JobListParams): Promise<PaginatedResponse<Job>> {
    return this.httpClient.get<PaginatedResponse<Job>>('/jobs/history', {
      limit: params?.limit,
      offset: params?.offset,
      applianceId: params?.applianceId,
    });
  }

  /** Iterate over every historical job. */
  listAllHistory(params?: JobListParams): PaginatedIterable<Job> {
    return new PaginatedIterable<Job>(this.httpClient, '/jobs/history', params, {
      applianceId: params?.applianceId,
    });
  }
}
