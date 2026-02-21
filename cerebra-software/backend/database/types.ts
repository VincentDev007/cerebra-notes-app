/**
 * DATABASE TYPES — backend/database/types.ts
 *
 * PURPOSE:
 * TypeScript interfaces that describe the shape of database rows and input objects.
 * These types live in the backend and are used by the CRUD modules (folders.ts, notes.ts, etc.).
 *
 * NOTE ON DUPLICATION:
 * There is a parallel set of interfaces in frontend/src/types/electron.d.ts.
 * They look identical here, but that's intentional — the backend types describe
 * the raw database shape, while the frontend types describe what crosses the IPC bridge.
 * In a larger project you might share them via a package, but for this desktop app
 * keeping them separate avoids coupling the frontend to backend internals.
 *
 * PATTERN — Separate "full" types from "input" types:
 *   Folder          → what you get BACK from the database (has id, timestamps)
 *   CreateFolderInput → what you SEND IN to create a new record (no id, no timestamps)
 *   UpdateFolderInput → partial update — all fields optional (you set only what changes)
 */

// ─────────────────────────────────────────────────────────────────
// ENTITY TYPES — Mirror the columns in the database tables
// ─────────────────────────────────────────────────────────────────

/**
 * Folder — represents a row from the `folders` table.
 *
 * parent_id: null  → root-level folder (shown on the homepage)
 * parent_id: number → subfolder (child of another folder)
 * This enables the recursive/hierarchical folder tree structure.
 *
 * created_at / modified_at are stored as ISO 8601 strings (e.g. "2024-01-15T10:30:00.000Z")
 * because SQLite has no native date type — TEXT is the standard approach.
 */
export interface Folder {
    id: number;
    name: string;
    parent_id: number | null;  // null = root folder, number = subfolder
    created_at: string;         // ISO 8601 string
    modified_at: string;        // ISO 8601 string — updated on every edit
}

/**
 * Note — represents a row from the `notes` table.
 *
 * folder_id references the parent folder — required (no orphan notes).
 * content defaults to '' (empty string) if not provided at creation.
 */
export interface Note {
  id: number;
  title: string;
  content: string;      // Empty string if no content yet (NOT NULL in schema)
  folder_id: number;    // FK → folders.id (ON DELETE CASCADE)
  created_at: string;
  modified_at: string;
}

/**
 * StickyNote — represents a row from the `sticky_notes` table.
 *
 * Unlike Note, sticky notes are NOT associated with any folder.
 * They are a global quick-capture mechanism.
 * title defaults to 'Quick Note' in the database schema.
 */
export interface StickyNote {
  id: number;
  title: string;    // Defaults to 'Quick Note'
  content: string;  // Required (NOT NULL in schema)
  created_at: string;
  modified_at: string;
}

/**
 * Setting — represents a row from the `settings` table.
 *
 * The settings table is a flat key-value store.
 * key is the PRIMARY KEY (unique, no duplicates).
 * All values are strings — booleans are 'true'/'false', enums are plain strings.
 */
export interface Setting {
  key: string;
  value: string;
}

// ─────────────────────────────────────────────────────────────────
// INPUT TYPES — Used as parameters for create/update functions
// ─────────────────────────────────────────────────────────────────

/**
 * CreateFolderInput — data needed to create a new folder.
 * parent_id is optional because root folders don't have a parent.
 * `undefined` and `null` both result in NULL in the database.
 */
export interface CreateFolderInput {
  name: string;
  parent_id?: number | null;  // Omit or set null for root folders
}

/**
 * UpdateFolderInput — all fields optional for partial updates.
 * The update function reads the existing record and merges in only the provided fields.
 * This avoids requiring the caller to re-send unchanged data.
 */
export interface UpdateFolderInput {
  name?: string;
  parent_id?: number | null;
}

/**
 * CreateNoteInput — data needed to create a new note.
 * content is optional — defaults to '' (empty string) in createNote().
 * folder_id is required — notes must belong to a folder.
 */
export interface CreateNoteInput {
  title: string;
  content?: string;   // Optional — defaults to empty string
  folder_id: number;  // Required — which folder this note belongs to
}

/**
 * UpdateNoteInput — partial update for notes.
 * Both fields are optional — you can update just the title, just the content, or both.
 */
export interface UpdateNoteInput {
  title?: string;
  content?: string;
}

/**
 * CreateStickyNoteInput — data to create a sticky note.
 * title is optional — if omitted, the DB default 'Quick Note' is used.
 * content is required (the actual note text).
 */
export interface CreateStickyNoteInput {
  title?: string;   // Optional — defaults to 'Quick Note'
  content: string;  // Required — must have content
}
