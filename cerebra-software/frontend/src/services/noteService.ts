import type { Note } from '../types/electron';

export async function getNotesByFolder(folderId: number): Promise<Note[]> {
  return window.electronAPI.notes.getByFolder(folderId);
}

export async function createNote(input: {
  title: string;
  content?: string;
  folder_id: number;
}): Promise<Note> {
  return window.electronAPI.notes.create(input);
}

export async function updateNote(
  id: number,
  input: { title?: string; content?: string }
): Promise<Note | undefined> {
  return window.electronAPI.notes.update(id, input);
}

export async function deleteNote(id: number): Promise<boolean> {
  return window.electronAPI.notes.delete(id);
}

export async function searchNotes(query: string): Promise<Note[]> {
  return window.electronAPI.notes.search(query);
}
