import { db } from "../connection";
import { Note, CreateNoteInput, UpdateNoteInput } from "../types";

const stmtGetNotesByFolder = db.prepare('SELECT id, title, content, folder_id, created_at, modified_at FROM notes WHERE folder_id = ? ORDER BY modified_at DESC');
const stmtGetNoteById = db.prepare('SELECT id, title, content, folder_id, created_at, modified_at FROM notes WHERE id = ?');
const stmtCreateNote = db.prepare('INSERT INTO notes (title, content, folder_id, created_at, modified_at) VALUES (?, ?, ?, ?, ?)');
const stmtUpdateNote = db.prepare('UPDATE notes SET title = ?, content = ?, modified_at = ? WHERE id = ?');
const stmtDeleteNote = db.prepare('DELETE FROM notes WHERE id = ?');
const stmtSearchNotes = db.prepare('SELECT id, title, content, folder_id, created_at, modified_at FROM notes WHERE title LIKE ? OR content LIKE ? ORDER BY modified_at DESC');


export const getNotesByFolder = (folderId: number): Note[] => {
  try {
    return stmtGetNotesByFolder.all(folderId) as Note[];
  } catch (error) {
    console.error(`Error fetching notes for folder_id ${folderId}:`, error);
    throw error;
  }
};

export const getNoteById = (id: number): Note | undefined => {
  try {
    if (!id || id <= 0) throw new Error('Invalid note id');

    return stmtGetNoteById.get(id) as Note | undefined;
  } catch (error) {
    console.error(`Error fetching note with id ${id}:`, error);
    throw error;
  }
};

export const createNote = (input: CreateNoteInput): Note => {
  try {
    if (!input.title || !input.title.trim()) {
      throw new Error('Note name cannot be empty');
    }

    if (input.title.trim().length > 255) {
      throw new Error('Note name cannot exceed 255 characters');
    }

    const now = new Date().toISOString();
    const result = stmtCreateNote.run(input.title.trim(), input.content ?? '', input.folder_id, now, now);

    return getNoteById(result.lastInsertRowid as number) as Note;
  } catch (error) {
    console.error('Error creating note:', error);
    throw error;
  }
};

export const updateNote = (id: number, input: UpdateNoteInput): Note | undefined => {
  try {
    if (!id || id <= 0) throw new Error('Invalid note id');

    if (input.title && input.title.trim().length > 255) {
      throw new Error('Note name cannot exceed 255 characters');
    }

    if (input.content && input.content.trim().length > 10000) {
      throw new Error('Note content cannot exceed 10000 characters');
    }

    const existing = getNoteById(id);
    if (!existing) return undefined;

    const now = new Date().toISOString();
    const title = input.title ? input.title.trim() : existing.title;
    const content = input.content ?? existing.content;

    stmtUpdateNote.run(title, content, now, id);

    return { ...existing, title, content, modified_at: now };
  } catch (error) {
    console.error(`Error updating note with id ${id}:`, error);
    throw error;
  }
};

export const deleteNote = (id: number): boolean => {
  try {
    if (!id || id <= 0) throw new Error('Invalid note id');

    const result = stmtDeleteNote.run(id);

    return result.changes > 0;
  } catch (error) {
    console.error(`Error deleting note with id ${id}:`, error);
    throw error;
  }
};

export const searchNotes = (query: string): Note[] => {
  try {
    if (!query || !query.trim()) {
      throw new Error('Search query cannot be empty');
    }

    if (query.trim().length > 500) {
      throw new Error('Search query cannot exceed 500 characters');
    }

    const pattern = `%${query.trim()}%`;

    return stmtSearchNotes.all(pattern, pattern) as Note[];
  } catch (error) {
    console.error(`Error searching notes with query "${query}":`, error);
    throw error;
  }
};