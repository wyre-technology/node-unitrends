/**
 * Asset operations.
 */

import type { HttpClient } from '../http.js';
import type { ResolvedConfig } from '../config.js';
import type { Asset } from '../types/assets.js';
import type { ApplianceId, ApplianceScopedId } from '../types/common.js';
import { PaginatedIterable, type PaginationParams, type PaginatedResponse } from '../pagination.js';

/** List filter for assets. */
export interface AssetListParams extends PaginationParams {
  /** Filter to a single appliance (required when using the MSP Console). */
  applianceId?: ApplianceId;
}

/**
 * Operations on protected assets.
 */
export class AssetsResource {
  private readonly httpClient: HttpClient;
  private readonly config: ResolvedConfig;

  constructor(httpClient: HttpClient, config: ResolvedConfig) {
    this.httpClient = httpClient;
    this.config = config;
  }

  /**
   * List protected assets (single page).
   *
   * When the client is configured with `mspConsole: true`, `applianceId` MUST
   * be supplied to disambiguate appliance-scoped IDs.
   */
  async list(params?: AssetListParams): Promise<PaginatedResponse<Asset>> {
    this.requireApplianceIdOnMsp(params?.applianceId);
    return this.httpClient.get<PaginatedResponse<Asset>>('/assets', {
      limit: params?.limit,
      offset: params?.offset,
      applianceId: params?.applianceId,
    });
  }

  /** Iterate over every asset. */
  listAll(params?: AssetListParams): PaginatedIterable<Asset> {
    this.requireApplianceIdOnMsp(params?.applianceId);
    return new PaginatedIterable<Asset>(this.httpClient, '/assets', params, {
      applianceId: params?.applianceId,
    });
  }

  /**
   * Get a single asset.
   *
   * @param assetId - Appliance-scoped asset id.
   * @param applianceId - Required when targeting an MSP Console.
   */
  async get(assetId: ApplianceScopedId, applianceId?: ApplianceId): Promise<Asset> {
    this.requireApplianceIdOnMsp(applianceId);
    return this.httpClient.get<Asset>(`/assets/${encodeURIComponent(String(assetId))}`, {
      applianceId,
    });
  }

  private requireApplianceIdOnMsp(applianceId: ApplianceId | undefined): void {
    if (this.config.mspConsole && applianceId === undefined) {
      throw new Error(
        'applianceId is required when using the MSP Console (asset IDs are appliance-scoped)'
      );
    }
  }
}
