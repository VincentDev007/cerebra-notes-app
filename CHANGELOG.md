# Changelog

All notable changes to Cerebra will be documented here.

## [Unreleased]

## [0.5.0] - 2026-04-13
### Added
- FTS5 full-text search across notes
- Lucide icons replacing all emoji usage throughout the UI
- Scrollable sidebar and back button navigation
- ESLint and Prettier with lint/format scripts
- Date formatting utility (`dateFormat.ts`)

### Changed
- Rewrote IPC layer with structured error handling across all handlers
- Replaced `any` types in all IPC handlers with proper input types
- Converted `require()` calls in `electron/main.ts` to `await import()`
- Optimized all database queries across notes, folders, sticky notes, and settings repositories
- Eliminated redundant DB queries; frontend now filters in-memory where appropriate
- Consolidated frontend services into hooks, removing standalone service files
- Refactored `app.tsx` and all modal/card components for cleaner structure
- Upgraded `moduleResolution` to `node16` in electron and backend tsconfigs
- Cleaned up comments across all source files

### Fixed
- Packaged app not displaying UI — replaced `NODE_ENV` check with `app.isPackaged`
- Frontend path resolution in packaged build pointing to wrong directory
- `useFolders.remove` refetching entire folder list on delete
- FTS5 parse errors returning a crash instead of empty results
- Unused catch bindings across hooks and backend repositories
- Removed General tab from settings (redundant)
- Simplified About section in settings

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