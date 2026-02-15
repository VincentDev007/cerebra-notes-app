import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { initializeDatabase } from '../backend/database/init';
import { getAllFolders, createFolder, updateFolder, deleteFolder, getFolderItemCounts } from '../backend/database/folders';
import { getNotesByFolder, createNote, updateNote, deleteNote, searchNotes } from '../backend/database/notes';
import { getAllStickyNotes, createStickyNote, updateStickyNote, deleteStickyNote } from '../backend/database/sticky-notes';
import { getSetting, setSetting, getAllSettings } from '../backend/database/settings';

function registerIpcHandlers(): void {
  // Folders
  ipcMain.handle('folders:getAll', () => getAllFolders());
  ipcMain.handle('folders:create', (_event, input) => createFolder(input));
  ipcMain.handle('folders:update', (_event, id, input) => updateFolder(id, input));
  ipcMain.handle('folders:delete', (_event, id) => deleteFolder(id));
  ipcMain.handle('folders:getItemCounts', () => getFolderItemCounts());

  // Notes
  ipcMain.handle('notes:getByFolder', (_event, folderId) => getNotesByFolder(folderId));
  ipcMain.handle('notes:create', (_event, input) => createNote(input));
  ipcMain.handle('notes:update', (_event, id, input) => updateNote(id, input));
  ipcMain.handle('notes:delete', (_event, id) => deleteNote(id));
  ipcMain.handle('notes:search', (_event, query) => searchNotes(query));

  // Sticky Notes
  ipcMain.handle('sticky-notes:getAll', () => getAllStickyNotes());
  ipcMain.handle('sticky-notes:create', (_event, input) => createStickyNote(input));
  ipcMain.handle('sticky-notes:update', (_event, id, input) => updateStickyNote(id, input));
  ipcMain.handle('sticky-notes:delete', (_event, id) => deleteStickyNote(id));

  // Settings
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
      // ✅ SECURITY: Context isolation enabled
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Development: load Vite dev server
  if (process.env.NODE_ENV !== 'production') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // Production: load built files
    mainWindow.loadFile(path.join(__dirname, '../dist/frontend/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Initialize database on app startup
  initializeDatabase();

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