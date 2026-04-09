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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFolders = useCallback(async () => {
    try {
      setLoading(true);
      const [data, counts] = await Promise.all([getFolders(), getFolderItemCounts()]);
      setFolders(data);
      setItemCounts(counts);
      setError(null);
    } catch {
      setError('Failed to load folders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  const create = async (name: string, parent_id?: number | null) => {
    const newFolder = await createFolder(name, parent_id);
    if (newFolder) {
      setFolders((prev) => [...prev, newFolder].sort((a, b) => a.name.localeCompare(b.name)));
      if (parent_id)
        setItemCounts((prev) => ({ ...prev, [parent_id]: (prev[parent_id] ?? 0) + 1 }));
    }
  };

  const update = async (id: number, input: { name?: string; parent_id?: number | null }) => {
    const oldFolder = folders.find((f) => f.id === id);
    const updatedFolder = await updateFolder(id, input);
    if (updatedFolder) {
      const nameChanged = updatedFolder.name !== oldFolder?.name;
      setFolders((prev) => {
        const next = prev.map((f) => (f.id === id ? updatedFolder : f));
        return nameChanged ? next.sort((a, b) => a.name.localeCompare(b.name)) : next;
      });
      if (input.parent_id !== undefined && input.parent_id !== oldFolder?.parent_id) {
        setItemCounts((prev) => {
          const next = { ...prev };
          if (oldFolder?.parent_id)
            next[oldFolder.parent_id] = Math.max(0, (next[oldFolder.parent_id] ?? 1) - 1);
          if (input.parent_id) next[input.parent_id] = (next[input.parent_id] ?? 0) + 1;
          return next;
        });
      }
    }
  };

  const remove = async (id: number) => {
    const folder = folders.find((f) => f.id === id);
    await deleteFolder(id);

    const collectDescendants = (parentId: number): number[] => {
      const children = folders.filter((f) => f.parent_id === parentId);
      return [parentId, ...children.flatMap((c) => collectDescendants(c.id))];
    };
    const toRemove = new Set(collectDescendants(id));
    setFolders((prev) => prev.filter((f) => !toRemove.has(f.id)));

    if (folder?.parent_id) {
      setItemCounts((prev) => ({
        ...prev,
        [folder.parent_id!]: Math.max(0, (prev[folder.parent_id!] ?? 1) - 1),
      }));
    }
  };

  return { folders, itemCounts, loading, error, create, update, remove };
}
