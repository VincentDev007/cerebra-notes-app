/**
 * ELECTRON PRELOAD SCRIPT — electron/preload.ts
 *
 * PURPOSE:
 * This script runs in a privileged context BEFORE the renderer (React) loads.
 * It has access to both Node.js/Electron APIs AND the browser DOM.
 * It acts as the secure bridge between the main process and the renderer.
 *
 * THE SECURITY PROBLEM IT SOLVES:
 * With contextIsolation: true and nodeIntegration: false, the renderer (React)
 * cannot access ipcRenderer or any Node.js/Electron APIs directly.
 * The preload script safely exposes ONLY the specific functions we want
 * the renderer to be able to call — nothing else.
 *
 * HOW contextBridge WORKS:
 * contextBridge.exposeInMainWorld('electronAPI', { ... })
 *   → Makes `window.electronAPI` available in the renderer
 *   → The renderer can call these functions, but cannot access ipcRenderer itself
 *   → This prevents prototype pollution and other security exploits
 *
 * HOW ipcRenderer.invoke() WORKS:
 * ipcRenderer.invoke('channel', ...args) sends a message to the main process
 * and returns a Promise that resolves with the main process handler's return value.
 * This is the async request-response pattern used throughout this app.
 *
 * TYPE ANNOTATIONS:
 * The TypeScript types here define the "contract" for each IPC call.
 * The matching interface in frontend/src/types/electron.d.ts mirrors this
 * to give the React code full type safety when calling window.electronAPI.
 */

import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {

  // ─────────────────────────────────────────────────────────────────
  // FOLDERS API
  // Maps to IPC channels registered in main.ts under 'folders:*'
  // ─────────────────────────────────────────────────────────────────
  folders: {
    // Fetch all folders — returns Promise<Folder[]> sorted by name
    getAll: () => ipcRenderer.invoke('folders:getAll'),

    // Create a root folder (parent_id: null) or a subfolder (parent_id: number)
    create: (input: { name: string; parent_id?: number | null }) =>
      ipcRenderer.invoke('folders:create', input),

    // Rename or re-parent a folder — partial update, only provide fields you want to change
    update: (id: number, input: { name?: string; parent_id?: number | null }) =>
      ipcRenderer.invoke('folders:update', id, input),

    // Delete a folder — cascade deletes all child notes/subfolders via SQL FK ON DELETE CASCADE
    delete: (id: number) => ipcRenderer.invoke('folders:delete', id),

    // Returns { [folderId]: itemCount } — counts direct notes + direct subfolders
    // Used to display "3 ITEMS" badge on folder cards
    getItemCounts: () => ipcRenderer.invoke('folders:getItemCounts'),
  },

  // ─────────────────────────────────────────────────────────────────
  // NOTES API
  // Maps to IPC channels registered in main.ts under 'notes:*'
  // ─────────────────────────────────────────────────────────────────
  notes: {
    // Get all notes in a specific folder — returns Promise<Note[]> sorted by modified_at DESC
    getByFolder: (folderId: number) => ipcRenderer.invoke('notes:getByFolder', folderId),

    // Create a note in a folder — content is optional (defaults to '')
    create: (input: { title: string; content?: string; folder_id: number }) =>
      ipcRenderer.invoke('notes:create', input),

    // Partial update — only provide the fields you want to change
    update: (id: number, input: { title?: string; content?: string }) =>
      ipcRenderer.invoke('notes:update', id, input),

    // Delete a note by id
    delete: (id: number) => ipcRenderer.invoke('notes:delete', id),

    // Full-text search across title AND content using LIKE pattern (%query%)
    // Returns all matching notes across all folders
    search: (query: string) => ipcRenderer.invoke('notes:search', query),
  },

  // ─────────────────────────────────────────────────────────────────
  // STICKY NOTES API
  // Maps to IPC channels registered in main.ts under 'sticky-notes:*'
  // Sticky notes are NOT folder-scoped — they are global
  // ─────────────────────────────────────────────────────────────────
  stickyNotes: {
    // Get all sticky notes — returns Promise<StickyNote[]> sorted by modified_at DESC
    getAll: () => ipcRenderer.invoke('sticky-notes:getAll'),

    // Create a sticky note — title is optional (defaults to 'Quick Note')
    create: (input: { title?: string; content: string }) =>
      ipcRenderer.invoke('sticky-notes:create', input),

    // Partial update of a sticky note
    update: (id: number, input: { title?: string; content?: string }) =>
      ipcRenderer.invoke('sticky-notes:update', id, input),

    // Delete a sticky note by id
    delete: (id: number) => ipcRenderer.invoke('sticky-notes:delete', id),
  },

  // ─────────────────────────────────────────────────────────────────
  // SETTINGS API
  // Maps to IPC channels registered in main.ts under 'settings:*'
  // Stored as key-value pairs in the settings SQLite table
  // Known keys: 'appName', 'theme', 'fontSize', 'animations', 'confirmDelete'
  // ─────────────────────────────────────────────────────────────────
  settings: {
    // Get one setting by key — returns the string value or null if not found
    get: (key: string) => ipcRenderer.invoke('settings:get', key),

    // Upsert a setting — creates it if new, updates if exists
    // All values are stored as strings (even booleans like 'true'/'false')
    set: (key: string, value: string) => ipcRenderer.invoke('settings:set', key, value),

    // Get ALL settings at once as Record<string, string>
    // Used on app startup to load the full settings state into React
    getAll: () => ipcRenderer.invoke('settings:getAll'),
  },
});
