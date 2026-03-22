import { db } from "../connection";
import { StickyNote, CreateStickyNoteInput, UpdateStickyNoteInput } from "../types";

export const getAllStickyNotes = (): StickyNote[] => {
  try {
    const stmt = db.prepare('SELECT * FROM sticky_notes ORDER BY modified_at DESC');
    return stmt.all() as StickyNote[];
  } catch (error) {
    console.error('Error fetching sticky notes:', error);
    throw error;
  }
};

export const getStickyNoteById = (id: number): StickyNote | undefined => {
  try {
    const stmt = db.prepare('SELECT * FROM sticky_notes WHERE id = ?');
    return stmt.get(id) as StickyNote | undefined;
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
    const stmt = db.prepare(
      'INSERT INTO sticky_notes (title, content, created_at, modified_at) VALUES (?, ?, ?, ?)'
    );

    const result = stmt.run(input.title?.trim() ?? 'Quick Note', input.content.trim(), now, now);
    return getStickyNoteById(result.lastInsertRowid as number) as StickyNote;
  } catch (error) {
    console.error('Error creating sticky note:', error);
    throw error;
  }
};

export const updateStickyNote = (id: number, input: UpdateStickyNoteInput): StickyNote | undefined => {
  try {
    if (input.title && input.title.trim().length > 255) {
      throw new Error('Sticky note title cannot exceed 255 characters');
    }

    if (input.content && input.content.trim().length > 10000) {
      throw new Error('Sticky note content cannot exceed 10,000 characters');
    }

    const existing = getStickyNoteById(id);
    if (!existing) return undefined;
    
    const now = new Date().toISOString();
    const title = input.title?.trim() ?? existing.title.trim();
    const content = input.content?.trim() ?? existing.content.trim();
    
    const stmt = db.prepare(
      'UPDATE sticky_notes SET title = ?, content = ?, modified_at = ? WHERE id = ?'
    );
    stmt.run(title, content, now, id);
    return getStickyNoteById(id);
  } catch (error) {
    console.error(`Error updating sticky note with id ${id}:`, error);
    throw error;
  }
};

export const deleteStickyNote = (id: number): boolean => {
  try {
    const stmt = db.prepare('DELETE FROM sticky_notes WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  } catch (error) {
    console.error(`Error deleting sticky note with id ${id}:`, error);
    throw error;
  }
};
