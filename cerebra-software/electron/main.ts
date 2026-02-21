/**
 * ELECTRON MAIN PROCESS — electron/main.ts
 *
 * This is the entry point for the Electron "main process".
 *
 * MENTAL MODEL — Two processes in Electron:
 *   Main Process  → Node.js environment, full OS access, controls windows
 *   Renderer      → Browser/Chromium environment, renders the React UI
 *
 * This file lives in the main process. It:
 *   1. Creates the BrowserWindow (the app window)
 *   2. Registers IPC (Inter-Process Communication) handlers
 *   3. Initializes the SQLite database on startup
 *
 * Data flow:
 *   React UI → preload.ts bridge → ipcRenderer.invoke('channel', args)
 *     → ipcMain.handle('channel', handler) here → database function
 */

import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { initializeDatabase } from '../backend/database/init';

// Import all database CRUD functions — organized by entity
import { getAllFolders, createFolder, updateFolder, deleteFolder, getFolderItemCounts } from '../backend/database/folders';
import { getNotesByFolder, createNote, updateNote, deleteNote, searchNotes } from '../backend/database/notes';
import { getAllStickyNotes, createStickyNote, updateStickyNote, deleteStickyNote } from '../backend/database/sticky-notes';
import { getSetting, setSetting, getAllSettings } from '../backend/database/settings';

/**
 * registerIpcHandlers()
 *
 * Registers all IPC (Inter-Process Communication) handlers.
 *
 * HOW IPC WORKS:
 *   - Renderer (React) calls: ipcRenderer.invoke('channel-name', arg1, arg2)
 *   - Main process receives it here: ipcMain.handle('channel-name', (event, arg1, arg2) => ...)
 *   - The return value is sent back as a resolved Promise in the renderer
 *
 * ipcMain.handle() vs ipcMain.on():
 *   - handle() = request/response pattern (like async function call) ← used here
 *   - on()     = fire-and-forget event listener (no response)
 *
 * Naming convention: 'entity:action' e.g. 'folders:create', 'notes:search'
 *
 * The `_event` parameter is the IpcMainInvokeEvent — we prefix with _ to signal
 * it's intentionally unused (we don't need info about the sender window here).
 */
function registerIpcHandlers(): void {
  // ─────────────────────────────────────────────────────────────────
  // FOLDER HANDLERS
  // ─────────────────────────────────────────────────────────────────

  // Get all folders (sorted by name A-Z)
  ipcMain.handle('folders:getAll', () => getAllFolders());

  // Create a new folder — input: { name, parent_id? }
  ipcMain.handle('folders:create', (_event, input) => createFolder(input));

  // Update an existing folder by id — input: { name?, parent_id? }
  ipcMain.handle('folders:update', (_event, id, input) => updateFolder(id, input));

  // Delete a folder by id — CASCADE deletes all child notes/subfolders via SQL FK
  ipcMain.handle('folders:delete', (_event, id) => deleteFolder(id));

  // Returns Record<folderId, itemCount> — counts direct notes + direct subfolders per folder
  ipcMain.handle('folders:getItemCounts', () => getFolderItemCounts());

  // ─────────────────────────────────────────────────────────────────
  // NOTE HANDLERS
  // ─────────────────────────────────────────────────────────────────

  // Get all notes within a specific folder (sorted by modified_at DESC)
  ipcMain.handle('notes:getByFolder', (_event, folderId) => getNotesByFolder(folderId));

  // Create a new note — input: { title, content?, folder_id }
  ipcMain.handle('notes:create', (_event, input) => createNote(input));

  // Update a note — input: { title?, content? } (partial update pattern)
  ipcMain.handle('notes:update', (_event, id, input) => updateNote(id, input));

  // Delete a note by id
  ipcMain.handle('notes:delete', (_event, id) => deleteNote(id));

  // Full-text search — searches title AND content via LIKE pattern
  ipcMain.handle('notes:search', (_event, query) => searchNotes(query));

  // ─────────────────────────────────────────────────────────────────
  // STICKY NOTE HANDLERS
  // ─────────────────────────────────────────────────────────────────

  // Get all sticky notes (sorted by modified_at DESC)
  ipcMain.handle('sticky-notes:getAll', () => getAllStickyNotes());

  // Create sticky note — input: { title?, content }  (title is optional)
  ipcMain.handle('sticky-notes:create', (_event, input) => createStickyNote(input));

  // Update sticky note — input: { title?, content? }
  ipcMain.handle('sticky-notes:update', (_event, id, input) => updateStickyNote(id, input));

  // Delete sticky note by id
  ipcMain.handle('sticky-notes:delete', (_event, id) => deleteStickyNote(id));

  // ─────────────────────────────────────────────────────────────────
  // SETTINGS HANDLERS
  // ─────────────────────────────────────────────────────────────────

  // Get a single setting value by key string — returns null if not found
  ipcMain.handle('settings:get', (_event, key) => getSetting(key));

  // Upsert a setting — inserts if new, updates if key already exists
  ipcMain.handle('settings:set', (_event, key, value) => setSetting(key, value));

  // Get all settings as a flat Record<string, string> object
  ipcMain.handle('settings:getAll', () => getAllSettings());
}

/** Reference to the main window — kept in module scope so event handlers can access it */
let mainWindow: BrowserWindow | null = null;

/**
 * createWindow()
 *
 * Creates the main application window and loads the UI.
 *
 * BrowserWindow options:
 *   - width/height: initial window size in pixels
 *   - contextIsolation: true → renderer cannot access Node.js APIs directly (security)
 *   - nodeIntegration: false → also a security measure, prevents renderer from using require()
 *   - preload: path to the preload script that bridges renderer ↔ main safely
 *
 * Loading strategy:
 *   - Dev: loads from Vite dev server (hot module reload works)
 *   - Prod: loads the built static HTML file from dist/
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      // SECURITY: Context isolation creates a separate JS context for the preload script
      // This prevents the renderer from accessing Electron/Node APIs via prototype pollution
      contextIsolation: true,

      // SECURITY: Disabling nodeIntegration prevents renderer from using Node.js require()
      // Without this, a malicious web page could access the filesystem, spawn processes, etc.
      nodeIntegration: false,

      // The preload script runs before the renderer page loads, in a privileged context
      // It can access both Node.js APIs AND the renderer DOM — used to expose safe APIs
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Development: load Vite dev server (supports hot reload)
  // If we are not in production... 
  if (process.env.NODE_ENV !== 'production') {
    mainWindow.loadURL('http://localhost:5173');
    // Open DevTools automatically in dev mode for debugging
    //mainWindow.webContents.openDevTools();
  } else {
    // If we are in production..
    // Production: load the compiled React build
    // path.join(__dirname, ...) resolves relative to this compiled file's location
    mainWindow.loadFile(path.join(__dirname, '../dist/frontend/index.html'));
  }

  // Cleanup: null out the reference when window is closed
  // This is important on macOS where the app stays running after all windows close
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * app.whenReady()
 *
 * Electron's lifecycle event — fires when Electron has finished initializing.
 * This is the right place to create windows and do startup tasks.
 *
 * Order matters:
 *   1. initializeDatabase() — must happen first, before any IPC handler is called
 *   2. registerIpcHandlers() — register handlers before the window loads
 *   3. createWindow() — last, so the UI can immediately invoke handlers
 */
app.whenReady().then(() => {
  // Initialize SQLite database (creates tables on first run, skips if already exists)
  initializeDatabase();

  // Register all IPC channels so the renderer can call them
  registerIpcHandlers();

  // Create and display the main window
  createWindow();
});

/**
 * window-all-closed
 *
 * Standard Electron pattern for cross-platform behavior:
 * - On macOS (darwin): apps stay running in the dock even with all windows closed
 *   (e.g., Spotify stays in menu bar). Don't call app.quit() on Mac.
 * - On Windows/Linux: closing all windows should quit the app entirely.
 */
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

/**
 * activate
 *
 * macOS-specific: fired when the user clicks the dock icon.
 * If all windows were closed (mainWindow === null), we recreate the window.
 * This is the standard macOS UX pattern (app stays running, re-opens on dock click).
 */
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
