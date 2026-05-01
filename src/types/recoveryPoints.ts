/**
 * Recovery point types.
 */

import type { ApplianceId, ApplianceScopedId, EpochSeconds } from './common.js';

export interface RecoveryPoint {
  id: ApplianceScopedId;
  /** Owning appliance — required when retrieved via the MSP Console. */
  applianceId?: ApplianceId;
  assetId: ApplianceScopedId;
  timestamp: EpochSeconds;
  type?: string;
  size?: number;
  verified?: boolean;
  [key: string]: unknown;
}
