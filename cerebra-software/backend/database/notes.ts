/**
 * NOTE CRUD OPERATIONS — backend/database/notes.ts
 *
 * PURPOSE:
 * All database operations for the `notes` table.
 * Called by IPC handlers in electron/main.ts for each 'notes:*' channel.
 *
 * NOTES ARE FOLDER-SCOPED:
 * Every note belongs to exactly one folder (folder_id is NOT NULL).
 * getNotesByFolder() is the primary read operation — called every time a folder is opened.
 * searchNotes() is the exception — it searches across ALL folders.
 *
 * SORT ORDER:
 * All note queries sort by modified_at DESC — most recently edited notes appear first.
 *
 * TIMESTAMP PATTERN:
 * created_at is set once at creation and never changes.
 * modified_at is bumped on every updateNote() call.
 */

import { db } from "./connection";
import { Note, CreateNoteInput, UpdateNoteInput } from "./types";

/**
 * getNotesByFolder()
 *
 * Fetches all notes belonging to a specific folder, sorted newest-edited first.
 * Called by useNotes hook in React every time a folder tab is activated.
 * The idx_notes_folder_id and idx_notes_modified_at indexes keep this fast.
 */
export const getNotesByFolder = (folderId: number): Note[] => {
  const stmt = db.prepare(
    'SELECT * FROM notes WHERE folder_id = ? ORDER BY modified_at DESC'
  );
  return stmt.all(folderId) as Note[];
};

/**
 * getNoteById()
 *
 * Fetches a single note by primary key.
 * Used internally after INSERT or UPDATE to return the fresh row from DB.
 */
export const getNoteById = (id: number): Note | undefined => {
  const stmt = db.prepare('SELECT * FROM notes WHERE id = ?');
  return stmt.get(id) as Note | undefined;
};

/**
 * createNote()
 *
 * Inserts a new note and returns the created row.
 * input.content ?? '' → if no content provided, store an empty string (never null).
 * Both timestamps set to the same value at creation time.
 */
export const createNote = (input: CreateNoteInput): Note => {
  const now = new Date().toISOString();
  const stmt = db.prepare(
    'INSERT INTO notes (title, content, folder_id, created_at, modified_at) VALUES (?, ?, ?, ?, ?)'
  );
  const result = stmt.run(input.title, input.content ?? '', input.folder_id, now, now);
  // Re-fetch from DB to return exactly what was stored (handles any DB defaults)
  return getNoteById(result.lastInsertRowid as number) as Note;
};

/**
 * updateNote()
 *
 * Updates a note's title and/or content using the merge pattern.
 *
 * MERGE PATTERN:
 *   const title   = input.title   ?? existing.title;
 *   const content = input.content ?? existing.content;
 * → Keeps existing values for any fields not provided in input.
 * → ?? is safe here (unlike folders.parent_id) because null is never a valid note value.
 *
 * modified_at is always bumped to now. created_at is never changed.
 * Returns undefined if note id doesn't exist.
 */
export const updateNote = (id: number, input: UpdateNoteInput): Note | undefined => {
  const existing = getNoteById(id);
  if (!existing) return undefined;

  const now = new Date().toISOString();
  // Merge provided values with existing values
  const title = input.title ?? existing.title;
  const content = input.content ?? existing.content;

  const stmt = db.prepare(
    'UPDATE notes SET title = ?, content = ?, modified_at = ? WHERE id = ?'
  );
  stmt.run(title, content, now, id);
  return getNoteById(id);
};

/**
 * deleteNote()
 *
 * Deletes a note by id.
 * result.changes = 0 if id not found, 1 if deleted.
 * Returns true if deleted, false if not found.
 */
export const deleteNote = (id: number): boolean => {
  const stmt = db.prepare('DELETE FROM notes WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
};

/**
 * searchNotes()
 *
 * Searches ALL notes (across all folders) for a query string.
 * Matches against both title and content using LIKE pattern matching.
 *
 * LIKE PATTERN: `%${query}%`
 *   The % wildcard matches any sequence of characters.
 *   So "%hello%" matches any string CONTAINING "hello" anywhere in it.
 *   SQLite LIKE is case-insensitive for ASCII by default.
 *
 * The same `pattern` is passed TWICE — once for the title match, once for content.
 * Results are sorted by most recently modified first.
 *
 * LIMITATION: LIKE with a leading % cannot use a B-tree index efficiently (full table scan).
 * This is acceptable for a personal notes app (small dataset).
 * For large datasets, SQLite FTS5 (Full-Text Search) would be more appropriate.
 */
export const searchNotes = (query: string): Note[] => {
  const stmt = db.prepare(
    'SELECT * FROM notes WHERE title LIKE ? OR content LIKE ? ORDER BY modified_at DESC'
  );
  const pattern = `%${query}%`;  // Wrap in wildcards: "word" becomes "%word%"
  return stmt.all(pattern, pattern) as Note[];  // Pass pattern for both ? placeholders
};
