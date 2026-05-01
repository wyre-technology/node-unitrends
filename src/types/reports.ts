/**
 * Report types.
 */

export interface SuccessRateReport {
  windowStart?: number;
  windowEnd?: number;
  totalJobs: number;
  successfulJobs: number;
  failedJobs: number;
  successRate: number;
  [key: string]: unknown;
}
