import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { initializeDatabase } from '../backend/database/init';

import { getAllFolders, createFolder, updateFolder, deleteFolder, getFolderItemCounts } from '../backend/database/repositories/folders';
import { getNotesByFolder, createNote, updateNote, deleteNote, searchNotes } from '../backend/database/repositories/notes';
import { getAllStickyNotes, createStickyNote, updateStickyNote, deleteStickyNote } from '../backend/database/repositories/sticky-notes';
import { getSetting, setSetting, getAllSettings } from '../backend/database/repositories/settings';

function registerIpcHandlers(): void {
  ipcMain.handle('folders:getAll', () => getAllFolders());
  ipcMain.handle('folders:create', (_event, input) => createFolder(input));
  ipcMain.handle('folders:update', (_event, id, input) => updateFolder(id, input));
  ipcMain.handle('folders:delete', (_event, id) => deleteFolder(id));
  ipcMain.handle('folders:getItemCounts', () => getFolderItemCounts());

  ipcMain.handle('notes:getByFolder', (_event, folderId) => getNotesByFolder(folderId));
  ipcMain.handle('notes:create', (_event, input) => createNote(input));
  ipcMain.handle('notes:update', (_event, id, input) => updateNote(id, input));
  ipcMain.handle('notes:delete', (_event, id) => deleteNote(id));
  ipcMain.handle('notes:search', (_event, query) => searchNotes(query));

  ipcMain.handle('sticky-notes:getAll', () => getAllStickyNotes());
  ipcMain.handle('sticky-notes:create', (_event, input) => createStickyNote(input));
  ipcMain.handle('sticky-notes:update', (_event, id, input) => updateStickyNote(id, input));
  ipcMain.handle('sticky-notes:delete', (_event, id) => deleteStickyNote(id));

  ipcMain.handle('settings:get', (_event, key) => getSetting(key));
  ipcMain.handle('settings:set', (_event, key, value) => setSetting(key, value));
  ipcMain.handle('settings:getAll', () => getAllSettings());
}

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

  registerIpcHandlers();
  createWindow();
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
