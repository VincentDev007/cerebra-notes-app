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

  const fetchStickyNotes = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getStickyNotes();
      setStickyNotes(data);
      setError(null);
    } catch (err) {
      setError('Failed to load sticky notes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStickyNotes();
  }, [fetchStickyNotes]);

  const create = async (content: string, title?: string) => {
    await createStickyNote({ title, content });
    await fetchStickyNotes();
  };

  const update = async (id: number, input: { title?: string; content?: string }) => {
    await updateStickyNote(id, input);
    await fetchStickyNotes();
  };

  const remove = async (id: number) => {
    await deleteStickyNote(id);
    await fetchStickyNotes();
  };

  return { stickyNotes, loading, error, create, update, remove };
}
