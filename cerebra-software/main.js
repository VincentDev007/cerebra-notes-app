const { app, BrowserWindow } = require('electron');
const path = require('path');

// Database is loaded asynchronously with sql.js
let db;
require('./backend/db.js').then(database => {
    db = database;
    console.log('✅ Database ready in main.js');
}).catch(error => {
    console.error('❌ Failed to load database in main.js:', error);
});

// creates the window for UI
function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // loads the file "index.html"
  win.loadFile('frontend/index.html');
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});