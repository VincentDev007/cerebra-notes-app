import type { StickyNote } from '../types/electron';

export async function getStickyNotes(): Promise<StickyNote[]> {
  const { data, error } = await window.electronAPI.stickyNotes.getAll();
  if (error) throw new Error(error);
  return data;
}

export async function createStickyNote(input: {
  title?: string;
  content: string;
}): Promise<StickyNote> {
  const { data, error } = await window.electronAPI.stickyNotes.create(input);
  if (error) throw new Error(error);
  return data;
}

export async function updateStickyNote(
  id: number,
  input: { title?: string; content?: string }
): Promise<StickyNote | undefined> {
  const { data, error } = await window.electronAPI.stickyNotes.update(id, input);
  if (error) throw new Error(error);
  return data;
}

export async function deleteStickyNote(id: number): Promise<boolean> {
  const { data, error } = await window.electronAPI.stickyNotes.delete(id);
  if (error) throw new Error(error);
  return data;
}
