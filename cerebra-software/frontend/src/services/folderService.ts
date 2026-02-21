/**
 * FOLDER SERVICE — frontend/src/services/folderService.ts
 *
 * PURPOSE:
 * Typed wrappers around window.electronAPI.folders.* IPC calls.
 * Used by useFolders hook to communicate with the main process.
 *
 * See noteService.ts for a full explanation of the service layer pattern and data flow.
 *
 * FOLDER HIERARCHY:
 * Folders support nesting via parent_id.
 * The getFolders() call always returns ALL folders (root + nested).
 * The React frontend filters them client-side:
 *   - root folders: parent_id === null → shown on homepage
 *   - subfolders:   parent_id === selectedFolderId → shown inside a folder view
 */

import type { Folder } from '../types/electron';

/**
 * getFolders()
 * Returns ALL folders sorted alphabetically.
 * Includes root folders AND all subfolders at every depth level.
 * Called by useFolders hook on mount and after any mutation.
 */
export async function getFolders(): Promise<Folder[]> {
  return window.electronAPI.folders.getAll();
}

/**
 * createFolder()
 * Creates a new folder.
 *   parent_id = null/undefined → root-level folder
 *   parent_id = number         → subfolder of that parent
 *
 * Note: this function has a different signature than createNote() —
 * createFolder takes individual args (name, parent_id) and packs them
 * into the object shape { name, parent_id } that the IPC expects.
 */
export async function createFolder(
  name: string,
  parent_id?: number | null
): Promise<Folder> {
  return window.electronAPI.folders.create({ name, parent_id });
}

/**
 * updateFolder()
 * Partially updates a folder — send only the fields you want to change.
 * To rename: { name: 'New Name' }
 * To re-parent (move to a different parent): { parent_id: 5 }
 * To move to root: { parent_id: null }
 * Returns undefined if the folder id doesn't exist.
 */
export async function updateFolder(
  id: number,
  input: { name?: string; parent_id?: number | null }
): Promise<Folder | undefined> {
  return window.electronAPI.folders.update(id, input);
}

/**
 * deleteFolder()
 * Deletes a folder by id.
 * ON DELETE CASCADE auto-deletes all child notes and subfolders (via SQLite FK).
 * Returns true if deleted, false if not found.
 */
export async function deleteFolder(id: number): Promise<boolean> {
  return window.electronAPI.folders.delete(id);
}

/**
 * getFolderItemCounts()
 * Returns a map of { folderId → itemCount } for all folders.
 * itemCount = direct notes + direct subfolders (not recursive).
 * Used to display "3 ITEMS" on folder cards.
 * Fetched alongside getFolders() in a Promise.all() for efficiency.
 */
export async function getFolderItemCounts(): Promise<Record<number, number>> {
  return window.electronAPI.folders.getItemCounts();
}
