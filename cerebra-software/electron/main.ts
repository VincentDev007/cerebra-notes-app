import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { initializeDatabase } from '../backend/database/init';
import { closeDatabase } from '../backend/database/connection';
import type {
  CreateFolderInput,
  UpdateFolderInput,
  CreateNoteInput,
  UpdateNoteInput,
  CreateStickyNoteInput,
  UpdateStickyNoteInput,
} from '../backend/database/types';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (process.env.NODE_ENV !== 'production') {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/frontend/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Imported after DB init — module-level db.prepare() calls require an open connection.
app.whenReady().then(async () => {
  try {
    initializeDatabase();
  } catch (error) {
    console.error('Failed to initialize database:', error);
    app.quit();
    return;
  }

  const { getAllFolders, createFolder, updateFolder, deleteFolder, getFolderItemCounts } =
    await import('../backend/database/repositories/folders.js');
  const { getNotesByFolder, createNote, updateNote, deleteNote, searchNotes } =
    await import('../backend/database/repositories/notes.js');
  const {
    getAllStickyNotes,
    createStickyNote,
    updateStickyNote,
    deleteStickyNote,
    searchStickyNotes,
  } = await import('../backend/database/repositories/sticky-notes.js');
  const { getSetting, setSetting, getAllSettings } =
    await import('../backend/database/repositories/settings.js');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handle = (channel: string, fn: (...args: any[]) => any) => {
    ipcMain.handle(channel, async (_event, ...args) => {
      try {
        return { data: await fn(...args), error: null };
      } catch (error) {
        console.error(`IPC error on channel "${channel}":`, error);
        return { data: null, error: (error as Error).message };
      }
    });
  };

  handle('folders:getAll', () => getAllFolders());
  handle('folders:create', (input: CreateFolderInput) => createFolder(input));
  handle('folders:update', (id: number, input: UpdateFolderInput) => updateFolder(id, input));
  handle('folders:delete', (id: number) => deleteFolder(id));
  handle('folders:getItemCounts', () => getFolderItemCounts());

  handle('notes:getByFolder', (folderId: number) => getNotesByFolder(folderId));
  handle('notes:create', (input: CreateNoteInput) => createNote(input));
  handle('notes:update', (id: number, input: UpdateNoteInput) => updateNote(id, input));
  handle('notes:delete', (id: number) => deleteNote(id));
  handle('notes:search', (query: string) => searchNotes(query));

  handle('sticky-notes:getAll', () => getAllStickyNotes());
  handle('sticky-notes:create', (input: CreateStickyNoteInput) => createStickyNote(input));
  handle('sticky-notes:update', (id: number, input: UpdateStickyNoteInput) =>
    updateStickyNote(id, input)
  );
  handle('sticky-notes:delete', (id: number) => deleteStickyNote(id));
  handle('sticky-notes:search', (query: string) => searchStickyNotes(query));

  handle('settings:get', (key: string) => getSetting(key));
  handle('settings:set', (key: string, value: string) => setSetting(key, value));
  handle('settings:getAll', () => getAllSettings());

  createWindow();
});

app.on('before-quit', () => {
  closeDatabase();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
