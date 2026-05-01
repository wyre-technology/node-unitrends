/**
 * Asset (protected client) types.
 */

import type { ApplianceId, ApplianceScopedId } from './common.js';

/**
 * A protected asset on a Unitrends appliance.
 *
 * NOTE: `id` is appliance-scoped. {@link applianceId} disambiguates assets
 * across appliances when used with an MSP Console.
 */
export interface Asset {
  id: ApplianceScopedId;
  /** Owning appliance — required when retrieved via the MSP Console. */
  applianceId?: ApplianceId;
  name?: string;
  hostname?: string;
  os?: string;
  type?: string;
  isPaused?: boolean;
  lastBackup?: number;
  [key: string]: unknown;
}
