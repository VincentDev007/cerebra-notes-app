/**
 * NOTE SERVICE — frontend/src/services/noteService.ts
 *
 * PURPOSE:
 * A thin abstraction layer between React hooks/components and the Electron IPC API.
 * Each function is a typed wrapper around a window.electronAPI.notes.* call.
 *
 * WHY HAVE A SERVICE LAYER?
 * Services decouple the React code from the IPC implementation:
 *   - Hooks and components import from noteService.ts, NOT from window.electronAPI directly
 *   - If the IPC channel name changes, you only update it here (not in every hook/component)
 *   - Makes future testing easier — mock this module instead of window.electronAPI
 *   - Provides a single place to add logging, error handling, or caching later
 *
 * ALL FUNCTIONS ARE ASYNC:
 * Even though better-sqlite3 runs synchronously, IPC communication is always async.
 * ipcRenderer.invoke() returns a Promise that resolves when the main process responds.
 * These functions simply return those Promises directly (no extra awaiting needed).
 *
 * DATA FLOW (full round trip):
 *   Component/Hook
 *     → noteService.getNotesByFolder(folderId)
 *       → window.electronAPI.notes.getByFolder(folderId)   [preload.ts bridge]
 *         → ipcRenderer.invoke('notes:getByFolder', folderId)
 *           → ipcMain.handle('notes:getByFolder', ...) in main.ts
 *             → getNotesByFolder(folderId) in backend/database/notes.ts
 *               → SQLite query → returns Note[]
 *             ← Note[] returned to main process handler
 *           ← Promise<Note[]> resolved in renderer
 *         ← Note[] arrives back at the service
 *       ← Note[] returned from service function
 *     ← Note[] available in hook/component
 */

import type { Note } from '../types/electron';

/**
 * getNotesByFolder()
 * Fetches all notes in a specific folder, sorted by modified_at DESC.
 * Called by useNotes hook whenever the active folder changes.
 */
export async function getNotesByFolder(folderId: number): Promise<Note[]> {
  return window.electronAPI.notes.getByFolder(folderId);
}

/**
 * createNote()
 * Creates a new note in a folder. content is optional (defaults to '').
 * Returns the newly created Note (with its auto-assigned id and timestamps).
 */
export async function createNote(input: {
  title: string;
  content?: string;
  folder_id: number;
}): Promise<Note> {
  return window.electronAPI.notes.create(input);
}

/**
 * updateNote()
 * Partially updates a note — only include fields you want to change.
 * Returns the updated Note, or undefined if the id didn't exist.
 */
export async function updateNote(
  id: number,
  input: { title?: string; content?: string }
): Promise<Note | undefined> {
  return window.electronAPI.notes.update(id, input);
}

/**
 * deleteNote()
 * Deletes a note by id.
 * Returns true if deleted, false if the id wasn't found.
 */
export async function deleteNote(id: number): Promise<boolean> {
  return window.electronAPI.notes.delete(id);
}

/**
 * searchNotes()
 * Searches ALL notes (across all folders) for the query string.
 * Matches against both title and content using LIKE %query% pattern.
 * Results sorted by modified_at DESC (most recent first).
 *
 * Called directly from app.tsx (not via useNotes) because search
 * crosses folder boundaries — it's not scoped to the active folder.
 */
export async function searchNotes(query: string): Promise<Note[]> {
  return window.electronAPI.notes.search(query);
}
