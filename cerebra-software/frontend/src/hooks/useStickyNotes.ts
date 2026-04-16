import { useState, useEffect, useCallback } from 'react';
import type { StickyNote } from '../types/electron';
import {
  getStickyNotes,
  createStickyNote,
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
    } catch {
      setError('Failed to load sticky notes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStickyNotes();
  }, [fetchStickyNotes]);

  const create = async (content: string, title?: string) => {
    const newNote = await createStickyNote({ title, content });
    if (newNote) setStickyNotes((prev) => [newNote, ...prev]);
  };

  const remove = async (id: number) => {
    await deleteStickyNote(id);
    setStickyNotes((prev) => prev.filter((n) => n.id !== id));
  };

  return { stickyNotes, loading, error, create, remove };
}
