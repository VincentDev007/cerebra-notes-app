import { db } from '../connection';
import { StickyNote, CreateStickyNoteInput, UpdateStickyNoteInput } from '../types';

const stmtGetAllStickyNotes = db.prepare(
  'SELECT id, title, content, created_at, modified_at FROM sticky_notes ORDER BY modified_at DESC'
);
const stmtGetStickyNoteById = db.prepare(
  'SELECT id, title, content, created_at, modified_at FROM sticky_notes WHERE id = ?'
);
const stmtCreateStickyNote = db.prepare(
  'INSERT INTO sticky_notes (title, content, created_at, modified_at) VALUES (?, ?, ?, ?)'
);
const stmtUpdateStickyNote = db.prepare(
  'UPDATE sticky_notes SET title = ?, content = ?, modified_at = ? WHERE id = ?'
);
const stmtDeleteStickyNote = db.prepare('DELETE FROM sticky_notes WHERE id = ?');
const stmtSearchStickyNotes = db.prepare(
  'SELECT sticky_notes.id, sticky_notes.title, sticky_notes.content, sticky_notes.created_at, sticky_notes.modified_at FROM sticky_notes_fts JOIN sticky_notes ON sticky_notes.id = sticky_notes_fts.rowid WHERE sticky_notes_fts MATCH ? ORDER BY rank'
);

export const getAllStickyNotes = (): StickyNote[] => {
  try {
    return stmtGetAllStickyNotes.all() as StickyNote[];
  } catch (error) {
    console.error('Error fetching sticky notes:', error);
    throw error;
  }
};

export const getStickyNoteById = (id: number): StickyNote | undefined => {
  try {
    if (!id || id <= 0) throw new Error('Invalid sticky note id');

    return stmtGetStickyNoteById.get(id) as StickyNote | undefined;
  } catch (error) {
    console.error(`Error fetching sticky note with id ${id}:`, error);
    throw error;
  }
};

export const createStickyNote = (input: CreateStickyNoteInput): StickyNote => {
  try {
    if (input.title && input.title.trim().length > 255) {
      throw new Error('Sticky note title cannot exceed 255 characters');
    }

    if (!input.content || !input.content.trim()) {
      throw new Error('Sticky note content cannot be empty');
    }

    if (input.content.trim().length > 10000) {
      throw new Error('Sticky note content cannot exceed 10,000 characters');
    }

    const now = new Date().toISOString();
    const title = input.title?.trim() ?? 'Quick Note';
    const content = input.content.trim();
    const result = stmtCreateStickyNote.run(title, content, now, now);

    return {
      id: result.lastInsertRowid as number,
      title,
      content,
      created_at: now,
      modified_at: now,
    };
  } catch (error) {
    console.error('Error creating sticky note:', error);
    throw error;
  }
};

export const updateStickyNote = (
  id: number,
  input: UpdateStickyNoteInput
): StickyNote | undefined => {
  try {
    if (!id || id <= 0) throw new Error('Invalid sticky note id');

    if (input.title && input.title.trim().length > 255) {
      throw new Error('Sticky note title cannot exceed 255 characters');
    }

    if (input.content && input.content.trim().length > 10000) {
      throw new Error('Sticky note content cannot exceed 10,000 characters');
    }

    const existing = getStickyNoteById(id);
    if (!existing) return undefined;

    const now = new Date().toISOString();
    const title = input.title?.trim() ?? existing.title;
    const content = input.content != null ? input.content.trim() : existing.content;

    stmtUpdateStickyNote.run(title, content, now, id);

    return { ...existing, title, content, modified_at: now };
  } catch (error) {
    console.error(`Error updating sticky note with id ${id}:`, error);
    throw error;
  }
};

export const deleteStickyNote = (id: number): boolean => {
  try {
    if (!id || id <= 0) throw new Error('Invalid sticky note id');

    const result = stmtDeleteStickyNote.run(id);

    return result.changes > 0;
  } catch (error) {
    console.error(`Error deleting sticky note with id ${id}:`, error);
    throw error;
  }
};

export const searchStickyNotes = (query: string): StickyNote[] => {
  try {
    if (!query || !query.trim()) {
      throw new Error('Search query cannot be empty');
    }

    if (query.trim().length > 500) {
      throw new Error('Search query cannot exceed 500 characters');
    }

    try {
      const safe = `"${query.trim().replace(/"/g, '""')}"`;
      return stmtSearchStickyNotes.all(safe) as StickyNote[];
    } catch (ftsError) {
      if (ftsError instanceof Error && ftsError.message.startsWith('fts5:')) {
        return [];
      }
      throw ftsError;
    }
  } catch (error) {
    console.error(`Error searching sticky notes with query "${query}":`, error);
    throw error;
  }
};
