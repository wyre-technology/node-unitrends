/**
 * Recovery point operations.
 */

import type { HttpClient } from '../http.js';
import type { RecoveryPoint } from '../types/recoveryPoints.js';
import type { ApplianceId, ApplianceScopedId } from '../types/common.js';
import { PaginatedIterable, type PaginationParams, type PaginatedResponse } from '../pagination.js';

export interface RecoveryPointListParams extends PaginationParams {
  /** Filter to recovery points for a single asset. */
  assetId?: ApplianceScopedId;
  applianceId?: ApplianceId;
}

/**
 * Operations on recovery points.
 */
export class RecoveryPointsResource {
  private readonly httpClient: HttpClient;

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
  }

  /** List recovery points (single page). */
  async list(params?: RecoveryPointListParams): Promise<PaginatedResponse<RecoveryPoint>> {
    return this.httpClient.get<PaginatedResponse<RecoveryPoint>>('/recovery_points', {
      limit: params?.limit,
      offset: params?.offset,
      assetId: params?.assetId,
      applianceId: params?.applianceId,
    });
  }

  /** Iterate over every recovery point. */
  listAll(params?: RecoveryPointListParams): PaginatedIterable<RecoveryPoint> {
    return new PaginatedIterable<RecoveryPoint>(this.httpClient, '/recovery_points', params, {
      assetId: params?.assetId,
      applianceId: params?.applianceId,
    });
  }
}
