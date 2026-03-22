import { db } from '../connection';
import { Folder, CreateFolderInput, UpdateFolderInput } from '../types';

export const getAllFolders = (): Folder[] => {
  try {
    const stmt = db.prepare('SELECT * FROM folders ORDER BY name ASC');
    return stmt.all() as Folder[];
  } catch (error) {
    console.error('Error fetching folders:', error);
    throw error;
  }
}

export const getFolderById = (id: number): Folder | undefined => {
  try {
    const stmt = db.prepare('SELECT * FROM folders WHERE id = ?');
    return stmt.get(id) as Folder | undefined;
  } catch (error) {
    console.error(`Error fetching folder with id ${id}:`, error);
    throw error;
  }
};

export const createFolder = (input: CreateFolderInput): Folder => {
  try {
    if (!input.name || !input.name.trim()) {
     throw new Error('Folder name cannot be empty');
    }

    if (input.name.trim().length > 255) {
      throw new Error('Folder name cannot exceed 255 characters');
    }
    
    const now = new Date().toISOString();
    
    const stmt = db.prepare(
      'INSERT INTO folders (name, parent_id, created_at, modified_at) VALUES (?, ?, ?, ?)'
    );
    
    const result = stmt.run(input.name.trim(), input.parent_id ?? null, now, now);
    
    return getFolderById(result.lastInsertRowid as number) as Folder;
  } catch (error) {
    console.error('Error creating folder:', error);
    throw error;
  }
};

export const updateFolder = (id: number, input: UpdateFolderInput): Folder | undefined => {
  try {
    if (input.name && input.name.trim().length > 255) {
      throw new Error('Folder name cannot exceed 255 characters');
    }

    const existing = getFolderById(id);
    if (!existing) return undefined;

    const now = new Date().toISOString();
    const parent_id = input.parent_id !== undefined ? input.parent_id : existing.parent_id;
    const name = input.name ? input.name.trim() : existing.name;

    const stmt = db.prepare(
      'UPDATE folders SET name = ?, parent_id = ?, modified_at = ? WHERE id = ?'
    );

    stmt.run(name, parent_id, now, id);

    return getFolderById(id);
  } catch (error) {
    console.error(`Error updating folder with id ${id}:`, error);
    throw error;
  }
};

export const deleteFolder = (id: number): boolean => {
  try {
    const stmt = db.prepare('DELETE FROM folders WHERE id = ?');

    const result = stmt.run(id);

    return result.changes > 0;
  } catch (error) {
    console.error(`Error deleting folder with id ${id}:`, error);
    throw error;
  }
};

export const getFolderItemCounts = (): Record<number, number> => {
  try {
    const stmt = db.prepare(`
      SELECT f.id,
      (SELECT COUNT(*) FROM notes WHERE folder_id = f.id) +
      (SELECT COUNT(*) FROM folders WHERE parent_id = f.id) AS item_count
      FROM folders f
      `);
      
      const rows = stmt.all() as { id: number; item_count: number }[];
      
      const counts: Record<number, number> = {};
      for (const row of rows) {
        counts[row.id] = row.item_count;
      }
return counts;
  } catch (error) {
    console.error('Error fetching folder item counts:', error);
    throw error;
  }
};




