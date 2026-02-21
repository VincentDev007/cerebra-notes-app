/**
 * STICKY NOTE SERVICE — frontend/src/services/stickyNoteService.ts
 *
 * PURPOSE:
 * Typed wrappers around window.electronAPI.stickyNotes.* IPC calls.
 * Used by useStickyNotes hook to communicate with the main process.
 *
 * See noteService.ts for a full explanation of the service layer pattern.
 *
 * KEY DIFFERENCE FROM noteService:
 * Sticky notes are NOT folder-scoped — getStickyNotes() returns ALL of them.
 * There is no getByFolder() equivalent. All sticky notes are global.
 * They are displayed both on the homepage grid and in the sidebar list.
 */

import type { StickyNote } from '../types/electron';

/**
 * getStickyNotes()
 * Returns ALL sticky notes, sorted by modified_at DESC.
 * Called by useStickyNotes hook on mount and after any mutation.
 */
export async function getStickyNotes(): Promise<StickyNote[]> {
  return window.electronAPI.stickyNotes.getAll();
}

/**
 * createStickyNote()
 * Creates a sticky note. title is optional — defaults to 'Quick Note' in the DB.
 * content is required.
 * Returns the newly created StickyNote with its auto-assigned id and timestamps.
 */
export async function createStickyNote(input: {
  title?: string;
  content: string;
}): Promise<StickyNote> {
  return window.electronAPI.stickyNotes.create(input);
}

/**
 * updateStickyNote()
 * Partially updates a sticky note — only provide fields you want to change.
 * Returns undefined if the id doesn't exist.
 */
export async function updateStickyNote(
  id: number,
  input: { title?: string; content?: string }
): Promise<StickyNote | undefined> {
  return window.electronAPI.stickyNotes.update(id, input);
}

/**
 * deleteStickyNote()
 * Deletes a sticky note by id.
 * Returns true if deleted, false if not found.
 */
export async function deleteStickyNote(id: number): Promise<boolean> {
  return window.electronAPI.stickyNotes.delete(id);
}
