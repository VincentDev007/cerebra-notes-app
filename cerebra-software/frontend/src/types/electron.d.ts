/**
 * ELECTRON API TYPE DEFINITIONS — frontend/src/types/electron.d.ts
 *
 * PURPOSE:
 * This file gives TypeScript full type safety when calling `window.electronAPI`
 * from anywhere in the React frontend.
 *
 * HOW THIS WORKS:
 * The `declare global { interface Window { electronAPI: ElectronAPI } }` block
 * augments the built-in Window interface to include our custom `electronAPI` property.
 * TypeScript merges this with the existing Window type, so `window.electronAPI.notes.getByFolder`
 * is fully typed everywhere in the codebase.
 *
 * WHERE DOES window.electronAPI COME FROM?
 * It's injected by electron/preload.ts via `contextBridge.exposeInMainWorld('electronAPI', {...})`.
 * The actual implementation lives there. This file is purely for TypeScript's benefit.
 *
 * WHY ARE RETURN TYPES Promise<...>?
 * Because ipcRenderer.invoke() is always async — it sends a message to the main process
 * and waits for the response. Even though the main process runs synchronous SQLite queries,
 * the IPC communication itself is asynchronous.
 *
 * RELATIONSHIP TO BACKEND types.ts:
 * These interfaces mirror backend/database/types.ts intentionally.
 * They are kept separate to avoid coupling the frontend bundle to backend code.
 * In a larger app you'd share types via a shared package, but for this desktop app
 * the small duplication is acceptable.
 */

// ─────────────────────────────────────────────────────────────────
// ENTITY TYPES — describe database rows returned via IPC
// ─────────────────────────────────────────────────────────────────

/**
 * Folder — a row from the folders table.
 * parent_id: null = root folder, number = subfolder of that parent.
 * Timestamps are ISO 8601 strings (SQLite stores dates as TEXT).
 */
export interface Folder {
  id: number;
  name: string;
  parent_id: number | null;  // null = root; number = subfolder parent
  created_at: string;         // ISO 8601, e.g. "2024-01-15T10:30:00.000Z"
  modified_at: string;
}

/**
 * Note — a row from the notes table.
 * Always belongs to a folder (folder_id is required).
 * content is always a string (may be empty string '').
 */
export interface Note {
  id: number;
  title: string;
  content: string;    // Empty string '' if no content (never null)
  folder_id: number;  // Which folder this note belongs to
  created_at: string;
  modified_at: string;
}

/**
 * StickyNote — a row from the sticky_notes table.
 * NOT folder-scoped — global quick-capture notes.
 * title defaults to 'Quick Note' if not specified at creation.
 */
export interface StickyNote {
  id: number;
  title: string;   // Default: 'Quick Note'
  content: string; // Required (NOT NULL in schema)
  created_at: string;
  modified_at: string;
}

// ─────────────────────────────────────────────────────────────────
// ELECTRON API INTERFACE — describes window.electronAPI
// Must match the object shape exposed in electron/preload.ts exactly
// ─────────────────────────────────────────────────────────────────

export interface IpcResponse<T> {
  data: T;
  error: string | null;
}

export interface ElectronAPI {
  folders: {
    getAll: () => Promise<IpcResponse<Folder[]>>;
    create: (input: { name: string; parent_id?: number | null }) => Promise<IpcResponse<Folder>>;
    update: (id: number, input: { name?: string; parent_id?: number | null }) => Promise<IpcResponse<Folder | undefined>>;
    delete: (id: number) => Promise<IpcResponse<boolean>>;
    getItemCounts: () => Promise<IpcResponse<Record<number, number>>>;
  };

  notes: {
    getByFolder: (folderId: number) => Promise<IpcResponse<Note[]>>;
    create: (input: { title: string; content?: string; folder_id: number }) => Promise<IpcResponse<Note>>;
    update: (id: number, input: { title?: string; content?: string }) => Promise<IpcResponse<Note | undefined>>;
    delete: (id: number) => Promise<IpcResponse<boolean>>;
    search: (query: string) => Promise<IpcResponse<Note[]>>;
  };

  stickyNotes: {
    getAll: () => Promise<IpcResponse<StickyNote[]>>;
    create: (input: { title?: string; content: string }) => Promise<IpcResponse<StickyNote>>;
    update: (id: number, input: { title?: string; content?: string }) => Promise<IpcResponse<StickyNote | undefined>>;
    delete: (id: number) => Promise<IpcResponse<boolean>>;
  };

  settings: {
    get: (key: string) => Promise<IpcResponse<string | null>>;
    set: (key: string, value: string) => Promise<IpcResponse<void>>;
    getAll: () => Promise<IpcResponse<Record<string, string>>>;
  };
}

// ─────────────────────────────────────────────────────────────────
// GLOBAL TYPE AUGMENTATION
// Adds electronAPI to the browser's Window interface
// This is what makes window.electronAPI fully typed everywhere in React
// ─────────────────────────────────────────────────────────────────

declare global {
  interface Window {
    // Injected by electron/preload.ts via contextBridge.exposeInMainWorld
    electronAPI: ElectronAPI;
  }
}

// This export {} makes TypeScript treat this as a module (not a global script)
// Required when using "declare global" in a .d.ts file with imports
export {};
