/**
 * useFolders HOOK — frontend/src/hooks/useFolders.ts
 *
 * PURPOSE:
 * Manages the global folders state and item counts. Provides:
 *   - folders[]   → ALL folders (root + subfolders at every level)
 *   - itemCounts  → { [folderId]: itemCount } for "X ITEMS" badges
 *   - loading     → true while fetching
 *   - error       → string if fetch failed
 *   - create / update / remove → mutate functions
 *
 * GLOBAL SCOPE:
 * Unlike useNotes (which is scoped to a folder), useFolders manages ALL folders.
 * It's called once in app.tsx and its state is passed down as props.
 * The React frontend filters folders client-side for different views.
 *
 * PARALLEL FETCHING with Promise.all():
 * getFolders() and getFolderItemCounts() are independent IPC calls.
 * Promise.all([...]) runs them in parallel instead of sequentially.
 * This roughly halves the loading time compared to doing them one by one.
 * Array destructuring: const [data, counts] = await Promise.all([...])
 * captures both results simultaneously.
 *
 * STABLE fetchFolders with useCallback([]):
 * Empty dependency array [] means fetchFolders is created ONCE and never changes.
 * This is correct because fetchFolders doesn't close over any changing variables —
 * it always fetches from the DB regardless of current state.
 *
 * FETCH AFTER MUTATION PATTERN:
 * All mutations (create, update, remove) call fetchFolders() after the operation.
 * This ensures the UI reflects the latest DB state (including new itemCounts).
 */

import { useState, useEffect, useCallback } from 'react';
import type { Folder } from '../types/electron';
import {
  getFolders,
  createFolder,
  updateFolder,
  deleteFolder,
  getFolderItemCounts,
} from '../services/folderService';

export function useFolders() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [itemCounts, setItemCounts] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);  // starts true — immediately loading on mount
  const [error, setError] = useState<string | null>(null);

  /**
   * fetchFolders — fetches all folders and item counts in parallel.
   *
   * Promise.all([p1, p2]) runs both IPC calls concurrently:
   *   - getFolders()         → all Folder rows from DB
   *   - getFolderItemCounts() → { folderId: count } map
   * Both resolve before we update state, avoiding partial renders.
   *
   * useCallback with [] means: create this function once, never recreate it.
   * It's safe because the function has no external dependencies — it always
   * fetches fresh data from the database.
   */
  const fetchFolders = useCallback(async () => {
    try {
      setLoading(true);
      // Parallel IPC calls — faster than sequential await
      const [data, counts] = await Promise.all([getFolders(), getFolderItemCounts()]);
      setFolders(data);
      setItemCounts(counts);
      setError(null);  // Clear previous errors on success
    } catch (err) {
      setError('Failed to load folders');
    } finally {
      setLoading(false);
    }
  }, []);  // Empty deps: fetchFolders is stable across all renders

  /**
   * useEffect runs fetchFolders once on mount.
   * Because fetchFolders is stable (useCallback with []), this effect
   * only runs once — on component mount.
   */
  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  /**
   * create — creates a new folder (root or subfolder), then re-fetches.
   * parent_id = null/undefined → root folder
   * parent_id = number → subfolder
   * Re-fetching updates both the folders list AND itemCounts (new parent gets +1).
   */
  const create = async (name: string, parent_id?: number | null) => {
    await createFolder(name, parent_id);
    await fetchFolders();  // Refresh to include the new folder and updated counts
  };

  /**
   * update — renames or re-parents a folder, then re-fetches.
   * Partial input: only send the fields you want to change.
   */
  const update = async (id: number, input: { name?: string; parent_id?: number | null }) => {
    await updateFolder(id, input);
    await fetchFolders();  // Refresh to show renamed folder and any changed parent counts
  };

  /**
   * remove — deletes a folder by id, then re-fetches.
   * CASCADE DELETE auto-removes child notes and subfolders in SQLite.
   * Re-fetching cleans up those folders/items from the UI.
   */
  const remove = async (id: number) => {
    await deleteFolder(id);
    await fetchFolders();  // Remove the deleted folder and update itemCounts
  };

  return { folders, itemCounts, loading, error, create, update, remove };
}
