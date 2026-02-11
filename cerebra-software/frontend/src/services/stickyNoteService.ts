import type { StickyNote } from '../types/electron';

export async function getStickyNotes(): Promise<StickyNote[]> {
  return window.electronAPI.stickyNotes.getAll();
}

export async function createStickyNote(input: {
  title?: string;
  content: string;
}): Promise<StickyNote> {
  return window.electronAPI.stickyNotes.create(input);
}

export async function updateStickyNote(
  id: number,
  input: { title?: string; content?: string }
): Promise<StickyNote | undefined> {
  return window.electronAPI.stickyNotes.update(id, input);
}

export async function deleteStickyNote(id: number): Promise<boolean> {
  return window.electronAPI.stickyNotes.delete(id);
}
