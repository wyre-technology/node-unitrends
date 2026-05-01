/**
 * @wyre-technology/node-unitrends
 *
 * Comprehensive, fully-typed Node.js/TypeScript library for the
 * Unitrends Backup REST API.
 */

// Main client
export { UnitrendsClient } from './client.js';

// Configuration
export type { UnitrendsConfig, RateLimitConfig, ResolvedConfig } from './config.js';
export { DEFAULT_RATE_LIMIT_CONFIG } from './config.js';

// Errors
export {
  UnitrendsError,
  UnitrendsAuthenticationError,
  UnitrendsForbiddenError,
  UnitrendsNotFoundError,
  UnitrendsRateLimitError,
  UnitrendsServerError,
} from './errors.js';

// Auth (exported for advanced users / testing)
export { SessionAuth } from './auth.js';
export type { LoginResponse } from './auth.js';

// Pagination
export {
  PaginatedIterable,
  buildPaginationParams,
  MAX_PAGE_SIZE,
  DEFAULT_PAGE_SIZE,
} from './pagination.js';
export type { PaginationParams, PaginatedResponse } from './pagination.js';

// HTTP (deps for advanced testing)
export { HttpClient } from './http.js';
export type { HttpClientDeps, RequestOptions } from './http.js';

// Resource classes
export { AppliancesResource } from './resources/appliances.js';
export { AssetsResource, type AssetListParams } from './resources/assets.js';
export { JobsResource, type JobListParams } from './resources/jobs.js';
export {
  RecoveryPointsResource,
  type RecoveryPointListParams,
} from './resources/recoveryPoints.js';
export { RestoresResource } from './resources/restores.js';
export { ReplicationResource } from './resources/replication.js';
export { AlertsResource } from './resources/alerts.js';
export { ReportsResource, type SuccessRateParams } from './resources/reports.js';

// Domain types
export * from './types/index.js';
