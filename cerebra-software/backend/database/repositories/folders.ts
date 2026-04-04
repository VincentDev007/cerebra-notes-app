import { db } from '../connection';
import { Folder, CreateFolderInput, UpdateFolderInput } from '../types';

const stmtGetAllFolders = db.prepare('SELECT id, name, parent_id, created_at, modified_at FROM folders ORDER BY name ASC');
const stmtGetFolderById = db.prepare('SELECT id, name, parent_id, created_at, modified_at FROM folders WHERE id = ?');
const stmtCreateFolder = db.prepare('INSERT INTO folders (name, parent_id, created_at, modified_at) VALUES (?, ?, ?, ?)');
const stmtUpdateFolder = db.prepare('UPDATE folders SET name = ?, parent_id = ?, modified_at = ? WHERE id = ?');
const stmtDeleteFolder = db.prepare('DELETE FROM folders WHERE id = ?');
const stmtGetFolderItemCounts = db.prepare(`
  SELECT f.id,
    COALESCE(nc.note_count, 0) + COALESCE(fc.folder_count, 0) AS item_count
  FROM folders f
  LEFT JOIN (SELECT folder_id, COUNT(*) AS note_count FROM notes GROUP BY folder_id) nc ON f.id = nc.folder_id
  LEFT JOIN (SELECT parent_id, COUNT(*) AS folder_count FROM folders GROUP BY parent_id) fc ON f.id = fc.parent_id
`);


export const getAllFolders = (): Folder[] => {
  try {
    return stmtGetAllFolders.all() as Folder[];
  } catch (error) {
    console.error('Error fetching folders:', error);
    throw error;
  }
};

export const getFolderById = (id: number): Folder | undefined => {
  try {
    if (!id || id <= 0) throw new Error('Invalid folder id');

    return stmtGetFolderById.get(id) as Folder | undefined;
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
    const name = input.name.trim();
    const parent_id = input.parent_id ?? null;
    const result = stmtCreateFolder.run(name, parent_id, now, now);

    return { id: result.lastInsertRowid as number, name, parent_id, created_at: now, modified_at: now };
  } catch (error) {
    console.error('Error creating folder:', error);
    throw error;
  }
};

export const updateFolder = (id: number, input: UpdateFolderInput): Folder | undefined => {
  try {
    if (!id || id <= 0) throw new Error('Invalid folder id');

    if (input.name && input.name.trim().length > 255) {
      throw new Error('Folder name cannot exceed 255 characters');
    }

    const existing = getFolderById(id);
    if (!existing) return undefined;

    const now = new Date().toISOString();
    const parent_id = input.parent_id !== undefined ? input.parent_id : existing.parent_id;
    const name = input.name ? input.name.trim() : existing.name;

    stmtUpdateFolder.run(name, parent_id, now, id);

    return { ...existing, name, parent_id, modified_at: now };
  } catch (error) {
    console.error(`Error updating folder with id ${id}:`, error);
    throw error;
  }
};

export const deleteFolder = (id: number): boolean => {
  try {
    if (!id || id <= 0) throw new Error('Invalid folder id');

    const result = stmtDeleteFolder.run(id);

    return result.changes > 0;
  } catch (error) {
    console.error(`Error deleting folder with id ${id}:`, error);
    throw error;
  }
};

export const getFolderItemCounts = (): Record<number, number> => {
  try {
    const rows = stmtGetFolderItemCounts.all() as { id: number; item_count: number }[];

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