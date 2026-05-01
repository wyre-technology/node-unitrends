/**
 * Appliance types (MSP Console only).
 */

import type { ApplianceId } from './common.js';

/**
 * A Unitrends Backup appliance, as reported by the MSP Console.
 */
export interface Appliance {
  id: ApplianceId;
  name?: string;
  hostname?: string;
  version?: string;
  model?: string;
  status?: string;
  [key: string]: unknown;
}
