-- ============================================
-- CEREBRA V2.0 DATABASE SCHEMA
-- Matches v1 feature parity exactly
-- ============================================
-- SQLite creates a single .db file. All tables live in it.
-- File location: <userData>/cerebra.db
--   Mac:     ~/Library/Application Support/Cerebra/cerebra.db
--   Windows: C:\Users\<user>\AppData\Roaming\Cerebra\cerebra.db
-- ============================================


-- FOLDERS TABLE
-- Supports hierarchical/nested folder structure via self-referencing parent_id.
--
-- Column notes:
--   id          → INTEGER PRIMARY KEY AUTOINCREMENT: auto-assigned unique ID
--   name        → TEXT NOT NULL: folder name, required
--   parent_id   → NULL = root-level folder, number = subfolder (child of parent_id)
--                 REFERENCES folders(id) = self-referential FK (same table!)
--                 ON DELETE CASCADE = deleting a parent auto-deletes all its children
--   created_at  → stored as ISO 8601 string (SQLite has no native DATE type)
--   modified_at → updated on rename
--
-- Why TEXT for timestamps instead of INTEGER (unix epoch)?
-- ISO strings are human-readable in the DB browser and sort correctly as strings.
CREATE TABLE IF NOT EXISTS folders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  parent_id INTEGER REFERENCES folders(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  modified_at TEXT NOT NULL
);


-- NOTES TABLE
-- Plain text notes belonging to a specific folder.
--
-- Column notes:
--   content     → TEXT DEFAULT '': empty string if no content yet (never NULL)
--   folder_id   → NOT NULL: notes must always belong to a folder (no orphans)
--                 ON DELETE CASCADE: when a folder is deleted, all its notes are too
--
-- Sorted by modified_at DESC in getNotesByFolder() so recent edits appear first.
CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  folder_id INTEGER NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  modified_at TEXT NOT NULL
);


-- STICKY NOTES TABLE
-- Quick notes without any folder association — global/standalone.
--
-- Column notes:
--   title   → TEXT DEFAULT 'Quick Note': optional title shown on the card
--   content → TEXT NOT NULL: the main body of the sticky note (required)
--
-- Unlike regular notes, sticky notes are shown on the homepage sidebar
-- and in the main homepage grid. No folder_id column.
CREATE TABLE IF NOT EXISTS sticky_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT DEFAULT 'Quick Note',
  content TEXT NOT NULL,
  created_at TEXT NOT NULL,
  modified_at TEXT NOT NULL
);


-- SETTINGS TABLE
-- Simple key-value store for app configuration.
--
-- Column notes:
--   key   → TEXT PRIMARY KEY: unique string key (no duplicates allowed)
--   value → TEXT NOT NULL: all values stored as strings
--
-- Known keys (initialized in init.ts):
--   appName       → the name shown in the sidebar header (default: 'CEREBRA')
--   theme         → 'light' or 'dark'
--   fontSize      → 'small', 'medium', or 'large'
--   animations    → 'true' or 'false'
--   confirmDelete → 'true' or 'false'
--
-- Upsert pattern used in settings.ts:
--   INSERT ... ON CONFLICT(key) DO UPDATE SET value = excluded.value
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);


-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
-- Indexes speed up WHERE and ORDER BY queries at the cost of slightly
-- slower INSERT/UPDATE (the index must be updated too).
-- For a small dataset like this app, the tradeoff is always worth it.


-- Speed up "find all subfolders of parent X" queries
-- Used in: folders.ts getFolderItemCounts() subquery
-- Without this index, SQLite would scan ALL folders to find children
CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON folders(parent_id);

-- Speed up "get all notes in folder X" queries
-- Used in: notes.ts getNotesByFolder(folderId)
-- This is the most-used query in the app — called every time a folder is opened
CREATE INDEX IF NOT EXISTS idx_notes_folder_id ON notes(folder_id);

-- Speed up "sort notes by last modified" queries
-- Used in: notes.ts getNotesByFolder() ORDER BY modified_at DESC
-- Also helps searchNotes() which also orders by modified_at DESC
CREATE INDEX IF NOT EXISTS idx_notes_modified_at ON notes(modified_at DESC);

-- Speed up "search notes by title" queries
-- Used in: notes.ts searchNotes() WHERE title LIKE ?
-- Note: LIKE with a leading % (e.g., '%word%') cannot use a B-tree index efficiently,
-- but a leading non-wildcard (e.g., 'word%') can. This index still helps for title searches.
CREATE INDEX IF NOT EXISTS idx_notes_title ON notes(title);
