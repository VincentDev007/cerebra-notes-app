/**
 * Database Connection Module
 * 
 * Handles SQLite database connection using better-sqlite3
 * Uses platform-specific userData path (Mac-compatible)
 */

import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';
import fs from 'fs';

/**
 * Get platform-specific database path
 * 
 * Mac: ~/Library/Application Support/Cerebra/
 * Windows: C:\Users\<user>\AppData\Roaming\Cerebra\
 * Linux: ~/.config/Cerebra/
 */
const getUserDataPath = (): string => {
  return app.getPath('userData');
};

/**
 * Ensure database directory exists
 */
const ensureDbDirectory = (dbPath: string): void => {
  const dbDir = path.dirname(dbPath);
  
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
};

/**
 * Get full database file path
 */
const getDatabasePath = (): string => {
  const userDataPath = getUserDataPath();
  return path.join(userDataPath, 'cerebra.db');
};

/**
 * Initialize database connection
 */
const initializeDatabase = (): Database.Database => {
  const dbPath = getDatabasePath();
  
  // Ensure directory exists before creating database
  ensureDbDirectory(dbPath);
  
  // Create/open database connection
  const db = new Database(dbPath, {
    verbose: console.log, // Log all SQL queries (helpful for debugging)
  });
  
  // Enable foreign key constraints (required for CASCADE delete)
  db.pragma('foreign_keys = ON');
  
  console.log(`Database initialized at: ${dbPath}`);
  
  return db;
};

/**
 * Export database instance
 * This single instance is used throughout the app
 */
export const db = initializeDatabase();

/**
 * Export database path for debugging/migration purposes
 */
export const dbPath = getDatabasePath();
