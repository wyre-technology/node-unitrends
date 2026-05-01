/**
 * Restore operations.
 *
 * @remarks Restore operations target a specific recovery point on a specific
 * appliance. The MSP Console exposes restore status, but the queue operation
 * typically must hit the owning appliance directly.
 */

import type { HttpClient } from '../http.js';
import type { Restore, RestoreRequest } from '../types/restores.js';
import type { ApplianceScopedId } from '../types/common.js';

/**
 * Operations on restore jobs.
 */
export class RestoresResource {
  private readonly httpClient: HttpClient;

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
  }

  /**
   * Queue a restore.
   *
   * @remarks Targets the appliance directly — the MSP Console may not accept
   * this operation.
   */
  async queue(request: RestoreRequest): Promise<Restore> {
    return this.httpClient.post<Restore>('/restores', request);
  }

  /** Get a restore's status. */
  async get(restoreId: ApplianceScopedId): Promise<Restore> {
    return this.httpClient.get<Restore>(`/restores/${encodeURIComponent(String(restoreId))}`);
  }
}
