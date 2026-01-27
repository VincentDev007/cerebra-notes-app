-- ============================================
-- CEREBRA V2.0 DATABASE SCHEMA
-- Matches v1 feature parity exactly
-- ============================================

-- FOLDERS TABLE
-- Supports hierarchical/nested folder structure
CREATE TABLE IF NOT EXISTS folders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  parent_id INTEGER REFERENCES folders(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  modified_at TEXT NOT NULL
);

-- NOTES TABLE
-- Plain text notes belonging to folders
CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  folder_id INTEGER NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  modified_at TEXT NOT NULL
);

-- STICKY NOTES TABLE
-- Quick notes without folder association
CREATE TABLE IF NOT EXISTS sticky_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT DEFAULT 'Quick Note',
  content TEXT NOT NULL,
  created_at TEXT NOT NULL,
  modified_at TEXT NOT NULL
);

-- SETTINGS TABLE
-- Key-value pairs for app settings
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Speed up folder hierarchy queries
CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON folders(parent_id);

-- Speed up "get notes by folder" queries
CREATE INDEX IF NOT EXISTS idx_notes_folder_id ON notes(folder_id);

-- Speed up sorting notes by modification date
CREATE INDEX IF NOT EXISTS idx_notes_modified_at ON notes(modified_at DESC);

-- Speed up full-text search on note content
CREATE INDEX IF NOT EXISTS idx_notes_title ON notes(title);
