# 1.0.0 (2026-05-01)


### Features

* initial SDK scaffold for Unitrends Backup REST API ([c45d0e3](https://github.com/wyre-technology/node-unitrends/commit/c45d0e32be1f731f5c68485f6373a3659ba79175))

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial SDK scaffold for the Unitrends Backup REST API.
- Resources: appliances (MSP Console), assets, jobs (backups + history), recovery points, restores, replication queue, alerts, reports (success rate).
- Session-token auth with single-flight re-auth on 401.
- Self-signed TLS support (`verifyTls: false`).
- Page-based pagination with async iterator `listAll()`.
- Typed error hierarchy (`UnitrendsError`, `UnitrendsAuthenticationError`, `UnitrendsForbiddenError`, `UnitrendsNotFoundError`, `UnitrendsRateLimitError`, `UnitrendsServerError`).
- MSP Console safety: enforces `applianceId` on asset operations to prevent cross-appliance ID collisions.
