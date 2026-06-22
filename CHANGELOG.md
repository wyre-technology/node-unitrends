## [1.0.2](https://github.com/wyre-technology/node-unitrends/compare/v1.0.1...v1.0.2) (2026-06-22)


### Bug Fixes

* **tsconfig:** restore include/exclude globs ([#32](https://github.com/wyre-technology/node-unitrends/issues/32)) ([662d015](https://github.com/wyre-technology/node-unitrends/commit/662d015bc3598719b828d12ac322d652c03569d8))

## [1.0.1](https://github.com/wyre-technology/node-unitrends/compare/v1.0.0...v1.0.1) (2026-05-20)


### Bug Fixes

* correct packaging exports so .cjs/.d.cts resolve ([#2](https://github.com/wyre-technology/node-unitrends/issues/2)) ([c8adae9](https://github.com/wyre-technology/node-unitrends/commit/c8adae9dd3ba71f790f0c0268364bc55a6ea2974))

# 1.0.0 (2026-05-01)


### Features

* initial SDK scaffold for Unitrends Backup REST API ([c45d0e3](https://github.com/wyre-technology/node-unitrends/commit/c45d0e32be1f731f5c68485f6373a3659ba79175))

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- Added `"type": "module"` so `tsup` emits files matching the `exports` map.

### Changed

- Build target raised to `node22`; `@types/node` bumped to `^22`.

### Added

- CI workflow (`.github/workflows/ci.yml`) running lint, typecheck, build, and tests on pull requests and pushes (Node 22).
- `CODE_OF_CONDUCT.md` (Contributor Covenant).

## [0.1.0] - 2026-05-20

### Added

- Initial SDK scaffold for the Unitrends Backup REST API.
- Resources: appliances (MSP Console), assets, jobs (backups + history), recovery points, restores, replication queue, alerts, reports (success rate).
- Session-token auth with single-flight re-auth on 401.
- Self-signed TLS support (`verifyTls: false`).
- Page-based pagination with async iterator `listAll()`.
- Typed error hierarchy (`UnitrendsError`, `UnitrendsAuthenticationError`, `UnitrendsForbiddenError`, `UnitrendsNotFoundError`, `UnitrendsRateLimitError`, `UnitrendsServerError`).
- MSP Console safety: enforces `applianceId` on asset operations to prevent cross-appliance ID collisions.
