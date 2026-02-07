import { db } from "./connection";
import { StickyNote, CreateStickyNoteInput } from "./types";

export const getAllStickyNotes = (): StickyNote[] => {
  const stmt = db.prepare('SELECT * FROM sticky_notes ORDER BY modified_at DESC');
  return stmt.all() as StickyNote[];
};

export const getStickyNoteById = (id: number): StickyNote | undefined => {
  const stmt = db.prepare('SELECT * FROM sticky_notes WHERE id = ?');
  return stmt.get(id) as StickyNote | undefined;
};

export const createStickyNote = (input: CreateStickyNoteInput): StickyNote => {
  const now = new Date().toISOString();
  const stmt = db.prepare(
    'INSERT INTO sticky_notes (title, content, created_at, modified_at) VALUES (?, ?, ?, ?)'
  );
  const result = stmt.run(input.title ?? 'Quick Note', input.content, now, now);
  return getStickyNoteById(result.lastInsertRowid as number) as StickyNote;
};

export const updateStickyNote = (
  id: number,
  input: { title?: string; content?: string }
): StickyNote | undefined => {
  const existing = getStickyNoteById(id);
  if (!existing) return undefined;

  const now = new Date().toISOString();
  const title = input.title ?? existing.title;
  const content = input.content ?? existing.content;

  const stmt = db.prepare(
    'UPDATE sticky_notes SET title = ?, content = ?, modified_at = ? WHERE id = ?'
  );
  stmt.run(title, content, now, id);
  return getStickyNoteById(id);
};

export const deleteStickyNote = (id: number): boolean => {
  const stmt = db.prepare('DELETE FROM sticky_notes WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
};
