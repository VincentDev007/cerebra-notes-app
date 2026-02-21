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

export interface ElectronAPI {
  folders: {
    // Fetch all folders (sorted A-Z by name) — includes root AND subfolders
    getAll: () => Promise<Folder[]>;

    // Create a root folder (no parent_id) or subfolder (with parent_id)
    create: (input: { name: string; parent_id?: number | null }) => Promise<Folder>;

    // Partial update: only provide the fields you want to change
    update: (id: number, input: { name?: string; parent_id?: number | null }) => Promise<Folder | undefined>;

    // Delete a folder — cascades to all child notes and subfolders
    delete: (id: number) => Promise<boolean>;

    // Returns { [folderId]: itemCount } — for the "X ITEMS" badge on folder cards
    getItemCounts: () => Promise<Record<number, number>>;
  };

  notes: {
    // Fetch notes in a folder, sorted by modified_at DESC
    getByFolder: (folderId: number) => Promise<Note[]>;

    // Create a note — content is optional (defaults to empty string)
    create: (input: { title: string; content?: string; folder_id: number }) => Promise<Note>;

    // Partial update — only send fields you want to change
    update: (id: number, input: { title?: string; content?: string }) => Promise<Note | undefined>;

    // Delete a note by id
    delete: (id: number) => Promise<boolean>;

    // Full-text search across ALL notes (title + content) using LIKE %query%
    search: (query: string) => Promise<Note[]>;
  };

  stickyNotes: {
    // Fetch all sticky notes, sorted by modified_at DESC
    getAll: () => Promise<StickyNote[]>;

    // Create a sticky note — title is optional (defaults to 'Quick Note')
    create: (input: { title?: string; content: string }) => Promise<StickyNote>;

    // Partial update of a sticky note
    update: (id: number, input: { title?: string; content?: string }) => Promise<StickyNote | undefined>;

    // Delete a sticky note
    delete: (id: number) => Promise<boolean>;
  };

  settings: {
    // Get a single setting value — returns null if key not found
    get: (key: string) => Promise<string | null>;

    // Upsert a setting — creates if new, updates if exists
    // All values are stored and passed as strings
    set: (key: string, value: string) => Promise<void>;

    // Get ALL settings as a flat object { theme: 'dark', fontSize: 'medium', ... }
    getAll: () => Promise<Record<string, string>>;
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
