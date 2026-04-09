import type { Folder } from '../types/electron';

export async function getFolders(): Promise<Folder[]> {
  const { data, error } = await window.electronAPI.folders.getAll();
  if (error) throw new Error(error);
  return data;
}

export async function createFolder(
  name: string,
  parent_id?: number | null
): Promise<Folder> {
  const { data, error } = await window.electronAPI.folders.create({ name, parent_id });
  if (error) throw new Error(error);
  return data;
}

export async function updateFolder(
  id: number,
  input: { name?: string; parent_id?: number | null }
): Promise<Folder | undefined> {
  const { data, error } = await window.electronAPI.folders.update(id, input);
  if (error) throw new Error(error);
  return data;
}

export async function deleteFolder(id: number): Promise<boolean> {
  const { data, error } = await window.electronAPI.folders.delete(id);
  if (error) throw new Error(error);
  return data;
}

export async function getFolderItemCounts(): Promise<Record<number, number>> {
  const { data, error } = await window.electronAPI.folders.getItemCounts();
  if (error) throw new Error(error);
  return data;
}
