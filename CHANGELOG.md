# Changelog

All notable changes to Cerebra will be documented here.

## [Unreleased]

## [0.5.0] - 2026-04-09
### Added
- FTS5 full-text search across notes
- Lucide icons replacing all emoji usage throughout the UI
- Scrollable sidebar and back button navigation
- Prettier config and ESLint config for consistent code formatting
- Date formatting utility (`dateFormat.ts`)

### Changed
- Rewrote IPC layer with structured error handling across all handlers
- Optimized all database queries across notes, folders, sticky notes, and settings repositories
- Eliminated redundant DB queries; frontend now filters in-memory where appropriate
- Consolidated frontend services into hooks, removing standalone service files
- Refactored `app.tsx` and all modal/card components for cleaner structure
- Updated `tsconfig.json` across backend, electron, and frontend — removed deprecated `baseUrl`, unused aliases, and invalid project references

### Fixed
- tsconfig errors causing CI build failures
- CI working directory path issue

## [0.1.0] - 2026-03-22
### Added
- Initial database setup with SQLite
- Notes and folders CRUD operations
- Sticky notes CRUD operations
- Settings management
- Dark mode
- Persistent tabs
- Input validation and error handling across all database repositories
- WAL mode for better database performance
- Graceful database shutdown