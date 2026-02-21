/**
 * useNotes HOOK — frontend/src/hooks/useNotes.ts
 *
 * PURPOSE:
 * Manages the notes state for a specific folder. Provides:
 *   - notes[]  → the current notes in the active folder
 *   - loading  → true while fetching from IPC
 *   - error    → string if the fetch failed, null otherwise
 *   - create / update / remove / search → mutate functions
 *
 * ACCEPTS: folderId — can be null (homepage, no folder selected)
 * When folderId is null, notes is set to [] and no fetch is performed.
 *
 * REACT HOOKS USED:
 *   useState   → manages notes[], loading, error state
 *   useEffect  → triggers fetchNotes() when folderId changes
 *   useCallback → memoizes fetchNotes so it's stable across renders
 *                 (prevents the useEffect from re-running on every render)
 *
 * THE "FETCH THEN REFETCH" PATTERN:
 * After every mutation (create, update, remove), we call fetchNotes() again.
 * This ensures the UI always shows the latest data from the database.
 * Simpler than optimistic updates — the tradeoff is a small extra IPC round-trip.
 *
 * WHY useCallback FOR fetchNotes?
 * Without useCallback, fetchNotes would be a new function reference on every render.
 * useEffect's dependency array includes fetchNotes — a new reference would trigger
 * the effect on every render, causing an infinite loop of fetches.
 * useCallback with [folderId] means: only create a new fetchNotes when folderId changes.
 */

import { useState, useEffect, useCallback } from 'react';
import type { Note } from '../types/electron';
import {
  getNotesByFolder,
  createNote,
  updateNote,
  deleteNote,
  searchNotes,
} from '../services/noteService';

export function useNotes(folderId: number | null) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);  // starts false (no folder selected yet)
  const [error, setError] = useState<string | null>(null);

  /**
   * fetchNotes — the core async data fetcher.
   *
   * Wrapped in useCallback with [folderId] dependency:
   * - Creates a new function only when folderId changes
   * - Stable reference prevents unnecessary re-renders and effect loops
   *
   * Guard: if folderId is null (homepage), clear notes and skip the IPC call.
   * try/catch/finally pattern:
   *   try     → attempt the async operation
   *   catch   → set error state if it fails
   *   finally → always set loading=false, even on error
   */
  const fetchNotes = useCallback(async () => {
    if (folderId === null) {
      setNotes([]);  // No folder selected → show empty list
      return;
    }
    try {
      setLoading(true);
      const data = await getNotesByFolder(folderId);
      setNotes(data);
      setError(null);  // Clear any previous error on success
    } catch (err) {
      setError('Failed to load notes');
    } finally {
      setLoading(false);  // Always runs, success or failure
    }
  }, [folderId]);  // Recreate fetchNotes only when folderId changes

  /**
   * useEffect runs fetchNotes whenever fetchNotes changes (i.e., when folderId changes).
   * This is the standard pattern: useCallback + useEffect for async data fetching.
   * - On mount: fetches notes for the initial folderId
   * - When folderId changes: fetches notes for the new folder
   */
  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  /**
   * create — creates a new note in the current folder, then re-fetches.
   * Guard: does nothing if folderId is null (shouldn't happen in practice —
   * the "Add Note" button is only shown when a folder is selected).
   */
  const create = async (title: string, content?: string) => {
    if (folderId === null) return;
    await createNote({ title, content, folder_id: folderId });
    await fetchNotes();  // Refresh the list to show the new note
  };

  /**
   * update — saves changes to a note's title and/or content, then re-fetches.
   * The re-fetch ensures the displayed note data (including modified_at) is fresh.
   * Called from NoteEditor on Save.
   */
  const update = async (id: number, input: { title?: string; content?: string }) => {
    await updateNote(id, input);
    await fetchNotes();  // Re-fetch so modified_at and card previews update
  };

  /**
   * remove — deletes a note by id, then re-fetches.
   * The removed note disappears from the list after the re-fetch.
   */
  const remove = async (id: number) => {
    await deleteNote(id);
    await fetchNotes();  // Remove the deleted note from the displayed list
  };

  /**
   * search — delegates to the service's searchNotes function.
   * NOTE: This searches ALL notes (not just the current folder).
   * In app.tsx, search is actually called directly from searchNotes service,
   * not through this hook method, but it's included here for completeness.
   * Returns a Promise so the caller can await the results.
   */
  const search = async (query: string): Promise<Note[]> => {
    return searchNotes(query);  // Cross-folder search, not scoped to folderId
  };

  // Return the state and action functions for use in components
  return { notes, loading, error, create, update, remove, search };
}
