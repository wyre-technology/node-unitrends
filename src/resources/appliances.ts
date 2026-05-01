/**
 * Appliance operations.
 *
 * @remarks MSP Console only — single-appliance deployments do not expose this
 * endpoint.
 */

import type { HttpClient } from '../http.js';
import type { Appliance } from '../types/appliances.js';
import { PaginatedIterable, type PaginationParams, type PaginatedResponse } from '../pagination.js';

/**
 * Operations on appliances registered with an MSP Console.
 *
 * @remarks MSP Console only.
 */
export class AppliancesResource {
  private readonly httpClient: HttpClient;

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
  }

  /**
   * List appliances (single page).
   * @remarks MSP Console only.
   */
  async list(params?: PaginationParams): Promise<PaginatedResponse<Appliance>> {
    return this.httpClient.get<PaginatedResponse<Appliance>>('/appliances', {
      limit: params?.limit,
      offset: params?.offset,
    });
  }

  /**
   * Iterate over every appliance.
   * @remarks MSP Console only.
   */
  listAll(params?: PaginationParams): PaginatedIterable<Appliance> {
    return new PaginatedIterable<Appliance>(this.httpClient, '/appliances', params);
  }
}
