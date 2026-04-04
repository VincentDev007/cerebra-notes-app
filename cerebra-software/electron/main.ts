import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { initializeDatabase } from '../backend/database/init';
import { closeDatabase } from '../backend/database/connection';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js')
    }
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

app.whenReady().then(() => {
  try {
    initializeDatabase();
  } catch (error) {
    console.error('Failed to initialize database:', error);
    app.quit();
    return;
  }

  const { getAllFolders, createFolder, updateFolder, deleteFolder, getFolderItemCounts } = require('../backend/database/repositories/folders');
  const { getNotesByFolder, createNote, updateNote, deleteNote, searchNotes } = require('../backend/database/repositories/notes');
  const { getAllStickyNotes, createStickyNote, updateStickyNote, deleteStickyNote, searchStickyNotes } = require('../backend/database/repositories/sticky-notes');
  const { getSetting, setSetting, getAllSettings } = require('../backend/database/repositories/settings');

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
  handle('folders:create', (input: any) => createFolder(input));
  handle('folders:update', (id: number, input: any) => updateFolder(id, input));
  handle('folders:delete', (id: number) => deleteFolder(id));
  handle('folders:getItemCounts', () => getFolderItemCounts());

  handle('notes:getByFolder', (folderId: number) => getNotesByFolder(folderId));
  handle('notes:create', (input: any) => createNote(input));
  handle('notes:update', (id: number, input: any) => updateNote(id, input));
  handle('notes:delete', (id: number) => deleteNote(id));
  handle('notes:search', (query: string) => searchNotes(query));

  handle('sticky-notes:getAll', () => getAllStickyNotes());
  handle('sticky-notes:create', (input: any) => createStickyNote(input));
  handle('sticky-notes:update', (id: number, input: any) => updateStickyNote(id, input));
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
