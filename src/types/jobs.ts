/**
 * Job types.
 *
 * IMPORTANT: a Job's `status` field reports whether the job *ran* successfully.
 * It does NOT necessarily mean the resulting recovery point is recoverable —
 * see `verifyState`, which reports the verification outcome separately. A job
 * can have `status: 'success'` and `verifyState: 'failed'`, in which case the
 * recovery point may be degraded.
 */

import type { ApplianceId, ApplianceScopedId } from './common.js';

// Common values are documented as a union with string fallback for forward
// compatibility. We use `(string & {})` so TS keeps the literal autocomplete.
type LooseString<T extends string> = T | (string & Record<never, never>);

export type JobStatus = LooseString<
  'success' | 'warning' | 'failure' | 'running' | 'queued' | 'cancelled'
>;
export type VerifyState = LooseString<
  'verified' | 'unverified' | 'failed' | 'pending' | 'unknown'
>;

export interface Job {
  id: ApplianceScopedId;
  /** Owning appliance — required when retrieved via the MSP Console. */
  applianceId?: ApplianceId;
  /** Asset the job operated on. */
  assetId?: ApplianceScopedId;
  type?: string;
  /**
   * Whether the job *ran* to completion. Does NOT guarantee the recovery
   * point is restorable — see {@link verifyState}.
   */
  status?: JobStatus;
  /** Independent verification state of the resulting recovery point. */
  verifyState?: VerifyState;
  startTime?: number;
  endTime?: number;
  message?: string;
  [key: string]: unknown;
}
