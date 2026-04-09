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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotes = useCallback(async () => {
    if (folderId === null) {
      setNotes([]);
      return;
    }
    try {
      setLoading(true);
      const data = await getNotesByFolder(folderId);
      setNotes(data);
      setError(null);
    } catch (err) {
      setError('Failed to load notes');
    } finally {
      setLoading(false);
    }
  }, [folderId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const create = async (title: string, content?: string) => {
    if (folderId === null) return;
    const newNote = await createNote({ title, content, folder_id: folderId });
    if (newNote) setNotes(prev => [newNote, ...prev]);
  };

  const update = async (id: number, input: { title?: string; content?: string }) => {
    const updatedNote = await updateNote(id, input);
    if (updatedNote) setNotes(prev => prev.map(n => n.id === id ? updatedNote : n));
  };

  const remove = async (id: number) => {
    await deleteNote(id);
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const search = async (query: string): Promise<Note[]> => {
    return searchNotes(query);
  };

  return { notes, loading, error, create, update, remove, search };
}
