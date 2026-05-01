/**
 * Replication queue types.
 */

import type { ApplianceId, ApplianceScopedId } from './common.js';

export interface ReplicationQueueItem {
  id: ApplianceScopedId;
  applianceId?: ApplianceId;
  assetId?: ApplianceScopedId;
  status?: string;
  queuedAt?: number;
  bytesRemaining?: number;
  [key: string]: unknown;
}
