import { db } from "./connection";
import { Note, CreateNoteInput, UpdateNoteInput } from "./types";

export const getNotesByFolder = (folderId: number): Note[] => {
  const stmt = db.prepare(
    'SELECT * FROM notes WHERE folder_id = ? ORDER BY modified_at DESC'
  );
  return stmt.all(folderId) as Note[];
};

export const getNoteById = (id: number): Note | undefined => {
  const stmt = db.prepare('SELECT * FROM notes WHERE id = ?');
  return stmt.get(id) as Note | undefined;
};

export const createNote = (input: CreateNoteInput): Note => {
  const now = new Date().toISOString();
  const stmt = db.prepare(
    'INSERT INTO notes (title, content, folder_id, created_at, modified_at) VALUES (?, ?, ?, ?, ?)'
  );
  const result = stmt.run(input.title, input.content ?? '', input.folder_id, now, now);
  return getNoteById(result.lastInsertRowid as number) as Note;
};

export const updateNote = (id: number, input: UpdateNoteInput): Note | undefined => {
  const existing = getNoteById(id);
  if (!existing) return undefined;

  const now = new Date().toISOString();
  const title = input.title ?? existing.title;
  const content = input.content ?? existing.content;

  const stmt = db.prepare(
    'UPDATE notes SET title = ?, content = ?, modified_at = ? WHERE id = ?'
  );
  stmt.run(title, content, now, id);
  return getNoteById(id);
};

export const deleteNote = (id: number): boolean => {
  const stmt = db.prepare('DELETE FROM notes WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
};

export const searchNotes = (query: string): Note[] => {
  const stmt = db.prepare(
    'SELECT * FROM notes WHERE title LIKE ? OR content LIKE ? ORDER BY modified_at DESC'
  );
  const pattern = `%${query}%`;
  return stmt.all(pattern, pattern) as Note[];
};
