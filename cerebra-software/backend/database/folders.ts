/**
 * FOLDER CRUD OPERATIONS — backend/database/folders.ts
 *
 * PURPOSE:
 * All database operations for the `folders` table.
 * Each function is called by the corresponding IPC handler in electron/main.ts.
 *
 * BETTER-SQLITE3 PATTERN USED THROUGHOUT:
 *   db.prepare(sql) → creates a prepared statement (compiled SQL, reusable, safe)
 *   stmt.all(args)  → runs a SELECT, returns ALL matching rows as an array
 *   stmt.get(args)  → runs a SELECT, returns the FIRST row or undefined
 *   stmt.run(args)  → runs INSERT/UPDATE/DELETE, returns { changes, lastInsertRowid }
 *
 * ALL OPERATIONS ARE SYNCHRONOUS — no async/await needed.
 * better-sqlite3 executes queries synchronously, which is perfect for a single-user desktop app.
 *
 * PARTIAL UPDATE PATTERN (used in updateFolder):
 * Read the existing record, then merge: use new value if provided, else keep existing.
 * This lets callers only send the fields they want to change.
 */

import { db } from './connection';
import { Folder, CreateFolderInput, UpdateFolderInput } from './types';

/**
 * getAllFolders()
 *
 * Returns ALL folders from the database, sorted alphabetically by name.
 *
 * WHY return all folders at once (not just root or filtered)?
 * The React frontend receives all folders and filters client-side:
 *   rootFolders = folders.filter(f => f.parent_id === null)   → homepage grid
 *   subfolders  = folders.filter(f => f.parent_id === folderId) → folder view
 * This avoids extra DB round-trips every time the user navigates folders.
 */
export const getAllFolders = (): Folder[] => {
    const stmt = db.prepare('SELECT * FROM folders ORDER BY name ASC');
    return stmt.all() as Folder[];
}

/**
 * getFolderById()
 *
 * Fetches a single folder by primary key.
 * Used internally after INSERT or UPDATE to return the fresh row from DB.
 * Returns undefined if no folder with that id exists.
 */
export const getFolderById = (id: number): Folder | undefined => {
  const stmt = db.prepare('SELECT * FROM folders WHERE id = ?');
  return stmt.get(id) as Folder | undefined;
};

/**
 * createFolder()
 *
 * Inserts a new folder and returns the created row.
 *
 * Timestamps: both created_at and modified_at are set to the current ISO 8601 string.
 * Format: "2024-01-15T10:30:00.000Z" — human-readable and sortable as a string.
 *
 * input.parent_id ?? null → if parent_id is undefined, store SQL NULL (root folder).
 *
 * Pattern: INSERT → get lastInsertRowid → SELECT the new row → return it.
 * Re-fetching instead of constructing the object manually ensures the returned data
 * matches exactly what's in the DB (including any DB-applied defaults).
 */
export const createFolder = (input: CreateFolderInput): Folder => {
  const now = new Date().toISOString();
  const stmt = db.prepare(
    'INSERT INTO folders (name, parent_id, created_at, modified_at) VALUES (?, ?, ?, ?)'
  );
  const result = stmt.run(input.name, input.parent_id ?? null, now, now);
  // result.lastInsertRowid is the auto-incremented id of the newly inserted row
  return getFolderById(result.lastInsertRowid as number) as Folder;
};

/**
 * updateFolder()
 *
 * Updates an existing folder's name and/or parent_id. Uses the merge pattern.
 *
 * MERGE PATTERN:
 *   const name = input.name ?? existing.name;
 *   → If input.name is provided, use it. Otherwise keep the existing name.
 *
 * SPECIAL CASE for parent_id:
 *   We use `input.parent_id !== undefined` instead of `??`.
 *   WHY? Because null is a valid value for parent_id (means "move folder to root level").
 *   Using `??` would treat null as "not provided" and keep the old value — that's wrong.
 *   Using `!== undefined` correctly distinguishes:
 *     - undefined → "not provided, keep existing"
 *     - null      → "explicitly move to root"
 *     - number    → "move to this parent folder"
 *
 * modified_at is always updated to now on any edit.
 * Returns undefined if the folder doesn't exist.
 */
export const updateFolder = (id: number, input: UpdateFolderInput): Folder | undefined => {
  const existing = getFolderById(id);
  if (!existing) return undefined;

  const now = new Date().toISOString();
  const name = input.name ?? existing.name;
  // null is valid (means "move to root"), so we can't use ?? here
  const parent_id = input.parent_id !== undefined ? input.parent_id : existing.parent_id;

  const stmt = db.prepare(
    'UPDATE folders SET name = ?, parent_id = ?, modified_at = ? WHERE id = ?'
  );
  stmt.run(name, parent_id, now, id);
  return getFolderById(id);
};

/**
 * deleteFolder()
 *
 * Deletes a folder by id.
 *
 * CASCADE DELETE (automatic, handled by SQLite):
 * Schema defines ON DELETE CASCADE on:
 *   notes.folder_id    → all notes in this folder are deleted
 *   folders.parent_id  → all subfolders (and their notes) are deleted recursively
 * REQUIRES: foreign_keys = ON (set in connection.ts) — without it, CASCADE is silently ignored.
 *
 * result.changes = number of rows deleted (0 if id didn't exist, 1 if it did)
 * Returns true if something was deleted, false if the id wasn't found.
 */
export const deleteFolder = (id: number): boolean => {
  const stmt = db.prepare('DELETE FROM folders WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
};

/**
 * getFolderItemCounts()
 *
 * Returns total item counts for ALL folders in one query.
 * "Items" = direct notes + direct subfolders (not recursive).
 * This is shown as "3 ITEMS" on folder cards in the UI.
 *
 * SQL EXPLANATION:
 * For each folder f, two correlated subqueries run:
 *   (SELECT COUNT(*) FROM notes WHERE folder_id = f.id)    → direct notes
 * + (SELECT COUNT(*) FROM folders WHERE parent_id = f.id)  → direct subfolders
 * The + operator adds them for a single item_count value per folder.
 *
 * WHY fetch all at once?
 * Avoids N+1 queries (one per folder). One query → convert to a lookup map.
 *
 * Result format: Record<folderId, itemCount>
 * Example: { 1: 5, 2: 0, 3: 12 }
 * React uses it as: itemCounts[folder.id] → O(1) lookup
 */
export const getFolderItemCounts = (): Record<number, number> => {
  const stmt = db.prepare(`
    SELECT f.id,
      (SELECT COUNT(*) FROM notes WHERE folder_id = f.id) +
      (SELECT COUNT(*) FROM folders WHERE parent_id = f.id) AS item_count
    FROM folders f
  `);
  const rows = stmt.all() as { id: number; item_count: number }[];

  // Convert array of { id, item_count } rows into a plain object for fast lookup
  const counts: Record<number, number> = {};
  for (const row of rows) {
    counts[row.id] = row.item_count;
  }
  return counts;
};




