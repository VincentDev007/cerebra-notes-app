import { useState, useEffect, useCallback } from 'react';
import type { Folder } from '../types/electron';
import {
  getFolders,
  createFolder,
  updateFolder,
  deleteFolder,
} from '../services/folderService';

export function useFolders() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFolders = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getFolders();
      setFolders(data);
      setError(null);
    } catch (err) {
      setError('Failed to load folders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  const create = async (name: string, parent_id?: number | null) => {
    await createFolder(name, parent_id);
    await fetchFolders();
  };

  const update = async (id: number, input: { name?: string; parent_id?: number | null }) => {
    await updateFolder(id, input);
    await fetchFolders();
  };

  const remove = async (id: number) => {
    await deleteFolder(id);
    await fetchFolders();
  };

  return { folders, loading, error, create, update, remove };
}
