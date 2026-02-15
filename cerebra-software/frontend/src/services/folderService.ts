import type { Folder } from '../types/electron';

export async function getFolders(): Promise<Folder[]> {
  return window.electronAPI.folders.getAll();
}

export async function createFolder(
  name: string,
  parent_id?: number | null
): Promise<Folder> {
  return window.electronAPI.folders.create({ name, parent_id });
}

export async function updateFolder(
  id: number,
  input: { name?: string; parent_id?: number | null }
): Promise<Folder | undefined> {
  return window.electronAPI.folders.update(id, input);
}

export async function deleteFolder(id: number): Promise<boolean> {
  return window.electronAPI.folders.delete(id);
}

export async function getFolderItemCounts(): Promise<Record<number, number>> {
  return window.electronAPI.folders.getItemCounts();
}
