/**
 * DATABASE CONNECTION MODULE — backend/database/connection.ts
 *
 * PURPOSE:
 * Initializes the SQLite database connection using better-sqlite3.
 * Exports a single shared `db` instance used by all database modules.
 *
 * WHY BETTER-SQLITE3 (not the async sqlite3 package)?
 * - better-sqlite3 is SYNCHRONOUS — queries block until done
 * - This is fine for a desktop Electron app (no server, no concurrent requests)
 * - Simpler code — no async/await needed in query functions
 * - Faster than the async driver for small datasets
 *
 * DATABASE FILE LOCATION:
 * SQLite stores everything in a single .db file on disk.
 * We use Electron's `app.getPath('userData')` to get the OS-specific
 * user data directory — the recommended location for app data:
 *   Mac:     ~/Library/Application Support/Cerebra/
 *   Windows: C:\Users\<user>\AppData\Roaming\Cerebra\
 *   Linux:   ~/.config/Cerebra/
 *
 * SINGLETON PATTERN:
 * We export `db` as a module-level constant. When Node.js imports this module,
 * it runs `initializeDatabase()` once and caches the result. Every other module
 * that imports `db` gets the exact same instance (Node module cache).
 */

import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';
import fs from 'fs';

/**
 * getUserDataPath()
 *
 * Returns the OS-specific user data directory for this app.
 * Electron's `app.getPath('userData')` automatically uses the app name
 * from package.json to create a named subdirectory.
 *
 * Example on Mac: /Users/vincent/Library/Application Support/Cerebra
 */
const getUserDataPath = () => app.getPath('userData');

/**
 * ensureDbDirectory()
 *
 * Creates the database directory if it doesn't exist yet.
 * Uses `recursive: true` so it creates intermediate directories too
 * (like `mkdir -p` in bash).
 *
 * This is necessary on first launch — the directory doesn't exist yet.
 */
const ensureDbDirectory = (dbPath: string): void => {
  const dbDir = path.dirname(dbPath);

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
};

/**
 * getDatabasePath()
 *
 * Builds the full path to the SQLite database file.
 * Result: <userData>/cerebra.db
 */
const getDatabasePath = (): string => {
  try {
    const userDataPath = getUserDataPath();
    return path.join(userDataPath, 'cerebra.db');
  } catch (error) {
    console.error('Failed to get database path:', error);
    throw error;
  }
};

/**
 * initializeDatabase()
 *
 * Opens (or creates) the SQLite database file.
 * Returns a Database instance from better-sqlite3.
 *
 * Options:
 *   verbose: console.log  — logs every SQL query to the console during development.
 *                           Remove or disable in production for cleaner output.
 *
 * PRAGMA foreign_keys = ON:
 *   SQLite does NOT enforce foreign key constraints by default.
 *   This pragma enables them for the current connection.
 *   Without this, `ON DELETE CASCADE` in the schema would be silently ignored!
 *   This means deleting a folder would NOT auto-delete its notes/subfolders.
 */
const connectDatabase = (dbPath: string): Database.Database => {
  try {
    ensureDbDirectory(dbPath);

    const db = new Database(dbPath, {
      verbose: console.log,
    });

    db.pragma('foreign_keys = ON');

    console.log(`Database initialized at: ${dbPath}`);

    return db;
  } catch (error) {
    console.error('Failed to connect to database:', error);
    throw error;
  }
};


/**
 * Exported database path.
 * Useful for debugging or future migration tooling.
 */
export const dbPath = getDatabasePath();

/**
 * Exported singleton database instance.
 *
 * All database modules (folders.ts, notes.ts, etc.) import this `db` object.
 * Because Node.js caches module exports, all imports share the same connection.
 *
 * Usage in other modules:
 *   import { db } from './connection';
 *   const stmt = db.prepare('SELECT * FROM folders');
 */
export const db = connectDatabase(dbPath);


