/**
 * DATABASE INITIALIZATION MODULE — backend/database/init.ts
 *
 * PURPOSE:
 * Called once on app startup (from electron/main.ts).
 * Reads schema.sql and creates the database tables + indexes on first run.
 * Inserts default settings so the app has sane defaults immediately.
 *
 * IDEMPOTENT DESIGN:
 * This module is safe to call every time the app starts because:
 *   - isDatabaseInitialized() checks if tables already exist before doing anything
 *   - The schema uses `CREATE TABLE IF NOT EXISTS` — safe to re-run
 *   - Settings use `INSERT OR IGNORE` — only inserts if the key doesn't already exist
 *
 * The exported `initializeDatabase` function (from this file) is different from
 * the one in connection.ts — that one opens the DB connection; this one sets up the schema.
 */

import { db } from './connection';
import fs from 'fs';
import path from 'path';

/**
 * readSchema()
 *
 * Reads the schema.sql file from disk.
 * `__dirname` resolves to the directory of the compiled JS file (dist/backend/database/).
 * The schema.sql file is copied to that same directory during the build step
 * (see package.json build:electron script).
 */
const readSchema = (): string => {
  const schemaPath = path.join(__dirname, 'schema.sql');
  return fs.readFileSync(schemaPath, 'utf-8');
};

/**
 * createTables()
 *
 * Executes the full schema.sql file against the database.
 *
 * db.exec() vs db.prepare():
 *   - db.exec()    → runs multiple SQL statements at once (separated by semicolons)
 *   - db.prepare() → prepares a single parameterized statement for safe execution
 *
 * We use db.exec() here because schema.sql contains multiple CREATE TABLE and
 * CREATE INDEX statements that we want to run all at once.
 */
const createTables = (): void => {
  console.log('Creating database tables...');

  const schema = readSchema();

  // Execute the entire schema file in one call
  // better-sqlite3 handles multi-statement execution correctly
  db.exec(schema);

  console.log('✓ Tables and indexes created successfully');
};

/**
 * initializeDefaultSettings()
 *
 * Inserts the default settings into the settings table.
 * Uses `INSERT OR IGNORE` — if the key already exists (from a previous run),
 * the insert is silently skipped. User-changed settings are preserved.
 *
 * Default settings (matching v1.0 behavior):
 *   appName:       'CEREBRA'  — the name shown in the sidebar header
 *   confirmDelete: 'true'     — show confirmation dialogs before deleting
 *   fontSize:      'medium'   — body font size (small/medium/large)
 *   animations:    'true'     — enable CSS transition animations
 *   theme:         'light'    — light or dark mode
 *
 * NOTE: All settings values are strings, even booleans.
 * In React, parse them back: settings.confirmDelete !== 'false'
 */
const initializeDefaultSettings = (): void => {
  console.log('Initializing default settings...');

  const defaultSettings = {
    appName: 'CEREBRA',
    confirmDelete: 'true',
    fontSize: 'medium',
    animations: 'true',
    theme: 'light',
  };

  // Prepare a reusable parameterized statement
  // ? placeholders prevent SQL injection (though settings are internal, it's good practice)
  const insertSetting = db.prepare(`
    INSERT OR IGNORE INTO settings (key, value)
    VALUES (?, ?)
  `);

  // Loop and insert each default — OR IGNORE means existing keys are untouched
  for (const [key, value] of Object.entries(defaultSettings)) {
    insertSetting.run(key, value);
  }

  console.log('✓ Default settings initialized');
};

/**
 * isDatabaseInitialized()
 *
 * Checks whether the database has already been set up by querying sqlite_master.
 * sqlite_master is a built-in SQLite system table that lists all tables/indexes.
 *
 * If the `folders` table exists, we assume the full schema was already applied.
 * Returns false on any error (e.g., corrupt DB) — triggers re-initialization.
 */
const isDatabaseInitialized = (): boolean => {
  try {
    // Query the SQLite system table to check if 'folders' table exists
    const result = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='folders'").get();
    return result !== undefined;
  } catch (error) {
    return false;
  }
};

/**
 * initializeDatabase() — EXPORTED MAIN FUNCTION
 *
 * Called from electron/main.ts on app startup.
 *
 * Logic:
 *   1. Check if the DB is already set up (tables exist)
 *   2. If yes → skip (already initialized, user's data is safe)
 *   3. If no  → first run: create tables from schema.sql, insert default settings
 *
 * This function is idempotent — safe to call every startup.
 */
export const initializeDatabase = (): void => {
  console.log('Checking database initialization...');

  if (isDatabaseInitialized()) {
    console.log('✓ Database already initialized');
    return;
  }

  console.log('First run detected - initializing database...');

  // Step 1: Run schema.sql to create all tables and indexes
  createTables();

  // Step 2: Populate default settings
  initializeDefaultSettings();

  console.log('✓ Database initialization complete!');
};
