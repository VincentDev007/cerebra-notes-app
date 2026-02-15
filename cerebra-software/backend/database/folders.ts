import { db } from './connection';
import { Folder, CreateFolderInput, UpdateFolderInput } from './types';

export const getAllFolders = (): Folder[] => {
    const stmt = db.prepare('SELECT * FROM folders ORDER BY name ASC');
    return stmt.all() as Folder[];
}

export const getFolderById = (id: number): Folder | undefined => {
  const stmt = db.prepare('SELECT * FROM folders WHERE id = ?');
  return stmt.get(id) as Folder | undefined;
};

export const createFolder = (input: CreateFolderInput): Folder => {
  const now = new Date().toISOString();
  const stmt = db.prepare(
    'INSERT INTO folders (name, parent_id, created_at, modified_at) VALUES (?, ?, ?, ?)'
  );
  const result = stmt.run(input.name, input.parent_id ?? null, now, now);
  return getFolderById(result.lastInsertRowid as number) as Folder;
};

export const updateFolder = (id: number, input: UpdateFolderInput): Folder | undefined => {
  const existing = getFolderById(id);
  if (!existing) return undefined;

  const now = new Date().toISOString();
  const name = input.name ?? existing.name;
  const parent_id = input.parent_id !== undefined ? input.parent_id : existing.parent_id;

  const stmt = db.prepare(
    'UPDATE folders SET name = ?, parent_id = ?, modified_at = ? WHERE id = ?'
  );
  stmt.run(name, parent_id, now, id);
  return getFolderById(id);
};

export const deleteFolder = (id: number): boolean => {
  const stmt = db.prepare('DELETE FROM folders WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
};

export const getFolderItemCounts = (): Record<number, number> => {
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
};




