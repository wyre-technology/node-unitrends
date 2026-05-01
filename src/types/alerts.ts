/**
 * Alert types.
 */

import type { ApplianceId, ApplianceScopedId } from './common.js';

type LooseString<T extends string> = T | (string & Record<never, never>);
export type AlertSeverity = LooseString<'info' | 'warning' | 'error' | 'critical'>;

export interface Alert {
  id: ApplianceScopedId;
  applianceId?: ApplianceId;
  severity?: AlertSeverity;
  message?: string;
  createdAt?: number;
  acknowledged?: boolean;
  [key: string]: unknown;
}
