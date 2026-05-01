/**
 * Restore types.
 */

import type { ApplianceId, ApplianceScopedId } from './common.js';

export interface RestoreRequest {
  recoveryPointId: ApplianceScopedId;
  /** Required when targeting an MSP Console. */
  applianceId?: ApplianceId;
  targetAssetId?: ApplianceScopedId;
  targetPath?: string;
  options?: Record<string, unknown>;
}

type LooseString<T extends string> = T | (string & Record<never, never>);
export type RestoreStatus = LooseString<
  'queued' | 'running' | 'success' | 'failure' | 'cancelled'
>;

export interface Restore {
  id: ApplianceScopedId;
  applianceId?: ApplianceId;
  status?: RestoreStatus;
  recoveryPointId?: ApplianceScopedId;
  startTime?: number;
  endTime?: number;
  message?: string;
  [key: string]: unknown;
}
