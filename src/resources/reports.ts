/**
 * Report operations.
 */

import type { HttpClient } from '../http.js';
import type { SuccessRateReport } from '../types/reports.js';
import type { ApplianceId, EpochSeconds } from '../types/common.js';

export interface SuccessRateParams {
  applianceId?: ApplianceId;
  startTime?: EpochSeconds;
  endTime?: EpochSeconds;
}

/**
 * Operations on canned reports.
 */
export class ReportsResource {
  private readonly httpClient: HttpClient;

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
  }

  /** Get the backup success-rate report. */
  async successRate(params?: SuccessRateParams): Promise<SuccessRateReport> {
    return this.httpClient.get<SuccessRateReport>('/reports/successrate', {
      applianceId: params?.applianceId,
      startTime: params?.startTime,
      endTime: params?.endTime,
    });
  }
}
