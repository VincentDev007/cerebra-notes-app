/**
 * useStickyNotes HOOK — frontend/src/hooks/useStickyNotes.ts
 *
 * PURPOSE:
 * Manages the global sticky notes state. Provides:
 *   - stickyNotes[]  → ALL sticky notes (not folder-scoped)
 *   - loading        → true while fetching
 *   - error          → string if fetch failed
 *   - create / update / remove → mutate functions
 *
 * IDENTICAL STRUCTURE TO useFolders:
 * Same useCallback + useEffect fetch pattern.
 * Same "fetch after mutation" approach.
 * No dependency in useCallback because sticky notes are always global.
 *
 * ARGUMENT ORDER for create():
 * Note the argument order: (content, title?) — content first, title optional second.
 * This is slightly unusual but matches how CreateStickyNoteModal calls it:
 *   onCreate(content, title) where content is always required.
 * When passed to stickyNoteService.createStickyNote, they're repacked as { title, content }.
 */

import { useState, useEffect, useCallback } from 'react';
import type { StickyNote } from '../types/electron';
import {
  getStickyNotes,
  createStickyNote,
  updateStickyNote,
  deleteStickyNote,
} from '../services/stickyNoteService';

export function useStickyNotes() {
  const [stickyNotes, setStickyNotes] = useState<StickyNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * fetchStickyNotes — fetches all sticky notes from the DB via IPC.
   * useCallback with [] → stable reference, never recreated.
   * Runs on mount, and after every mutation.
   */
  const fetchStickyNotes = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getStickyNotes();  // Returns ALL sticky notes, sorted DESC
      setStickyNotes(data);
      setError(null);
    } catch (err) {
      setError('Failed to load sticky notes');
    } finally {
      setLoading(false);
    }
  }, []);  // Empty deps: this function is stable, fetch is always global

  useEffect(() => {
    fetchStickyNotes();
  }, [fetchStickyNotes]);

  /**
   * create — creates a sticky note and refreshes the list.
   * Argument order: (content, title?) — content is required, title optional.
   * Repacks them into the { title, content } shape the service expects.
   */
  const create = async (content: string, title?: string) => {
    const newNote = await createStickyNote({ title, content });
    if (newNote) setStickyNotes(prev => [newNote, ...prev]);
  };

  const update = async (id: number, input: { title?: string; content?: string }) => {
    const updatedNote = await updateStickyNote(id, input);
    if (updatedNote) setStickyNotes(prev => prev.map(n => n.id === id ? updatedNote : n));
  };

  const remove = async (id: number) => {
    await deleteStickyNote(id);
    setStickyNotes(prev => prev.filter(n => n.id !== id));
  };

  return { stickyNotes, loading, error, create, update, remove };
}
