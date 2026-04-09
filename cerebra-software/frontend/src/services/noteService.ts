import type { Note } from '../types/electron';

export async function getNotesByFolder(folderId: number): Promise<Note[]> {
  const { data, error } = await window.electronAPI.notes.getByFolder(folderId);
  if (error) throw new Error(error);
  return data;
}

export async function createNote(input: {
  title: string;
  content?: string;
  folder_id: number;
}): Promise<Note> {
  const { data, error } = await window.electronAPI.notes.create(input);
  if (error) throw new Error(error);
  return data;
}

export async function updateNote(
  id: number,
  input: { title?: string; content?: string }
): Promise<Note | undefined> {
  const { data, error } = await window.electronAPI.notes.update(id, input);
  if (error) throw new Error(error);
  return data;
}

export async function deleteNote(id: number): Promise<boolean> {
  const { data, error } = await window.electronAPI.notes.delete(id);
  if (error) throw new Error(error);
  return data;
}

export async function searchNotes(query: string): Promise<Note[]> {
  const { data, error } = await window.electronAPI.notes.search(query);
  if (error) throw new Error(error);
  return data;
}
