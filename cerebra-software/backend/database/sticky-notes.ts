/**
 * STICKY NOTE CRUD OPERATIONS — backend/database/sticky-notes.ts
 *
 * PURPOSE:
 * All database operations for the `sticky_notes` table.
 * Sticky notes differ from regular notes: they are NOT folder-scoped.
 * They are global quick-capture notes shown on the homepage and sidebar.
 *
 * DIFFERENCES FROM notes.ts:
 * - No folder_id field (sticky notes are standalone)
 * - getAllStickyNotes() has no filter — always returns all sticky notes
 * - title defaults to 'Quick Note' (optional at creation)
 * - content is required (NOT NULL in schema, unlike regular notes)
 *
 * The CRUD pattern (prepare → run → re-fetch) is identical to notes.ts.
 */

import { db } from "./connection";
import { StickyNote, CreateStickyNoteInput } from "./types";

/**
 * getAllStickyNotes()
 *
 * Returns ALL sticky notes, sorted by most recently modified first.
 * No filter needed — sticky notes are global, not folder-scoped.
 * Called by useStickyNotes hook on app load.
 */
export const getAllStickyNotes = (): StickyNote[] => {
  const stmt = db.prepare('SELECT * FROM sticky_notes ORDER BY modified_at DESC');
  return stmt.all() as StickyNote[];
};

/**
 * getStickyNoteById()
 *
 * Fetches a single sticky note by primary key.
 * Used internally after INSERT or UPDATE to return the fresh row.
 */
export const getStickyNoteById = (id: number): StickyNote | undefined => {
  const stmt = db.prepare('SELECT * FROM sticky_notes WHERE id = ?');
  return stmt.get(id) as StickyNote | undefined;
};

/**
 * createStickyNote()
 *
 * Inserts a new sticky note and returns the created row.
 *
 * input.title ?? 'Quick Note' → title is optional; if not provided, use 'Quick Note'.
 * Note: Unlike notes, we handle the default in JS here rather than relying purely on
 * the SQL DEFAULT, because we want to be explicit about what gets stored.
 *
 * content is required — there's no content ?? '' fallback like in notes.
 */
export const createStickyNote = (input: CreateStickyNoteInput): StickyNote => {
  const now = new Date().toISOString();
  const stmt = db.prepare(
    'INSERT INTO sticky_notes (title, content, created_at, modified_at) VALUES (?, ?, ?, ?)'
  );
  const result = stmt.run(input.title ?? 'Quick Note', input.content, now, now);
  return getStickyNoteById(result.lastInsertRowid as number) as StickyNote;
};

/**
 * updateStickyNote()
 *
 * Updates a sticky note's title and/or content using the merge pattern.
 * Identical merge approach to updateNote() in notes.ts.
 * modified_at is bumped on every update.
 * Returns undefined if the id doesn't exist.
 *
 * NOTE: The input type is inlined as { title?: string; content?: string }
 * rather than using a named UpdateStickyNoteInput interface.
 * Both approaches work — named interfaces are just easier to reuse.
 */
export const updateStickyNote = (
  id: number,
  input: { title?: string; content?: string }
): StickyNote | undefined => {
  const existing = getStickyNoteById(id);
  if (!existing) return undefined;

  const now = new Date().toISOString();
  // Merge: use new values if provided, otherwise keep existing
  const title = input.title ?? existing.title;
  const content = input.content ?? existing.content;

  const stmt = db.prepare(
    'UPDATE sticky_notes SET title = ?, content = ?, modified_at = ? WHERE id = ?'
  );
  stmt.run(title, content, now, id);
  return getStickyNoteById(id);
};

/**
 * deleteStickyNote()
 *
 * Deletes a sticky note by id.
 * Returns true if deleted, false if id wasn't found.
 * result.changes = 0 (not found) or 1 (deleted).
 */
export const deleteStickyNote = (id: number): boolean => {
  const stmt = db.prepare('DELETE FROM sticky_notes WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
};
