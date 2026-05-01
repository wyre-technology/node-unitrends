/**
 * Common types shared across Unitrends resources.
 */

/** Unix epoch seconds. */
export type EpochSeconds = number;

/** ISO-8601 timestamp string. */
export type IsoTimestamp = string;

/**
 * An identifier that is unique only within a single Unitrends appliance.
 *
 * Asset IDs (and many other IDs) are appliance-scoped: ID `123` on appliance
 * A is NOT the same record as ID `123` on appliance B. When using the MSP
 * Console, always pair these with the owning {@link ApplianceId}.
 */
export type ApplianceScopedId = string | number;

/** Identifier of an appliance registered with an MSP Console. */
export type ApplianceId = string | number;
