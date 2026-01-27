/**
 * Database Initialization Module
 * 
 * Reads schema.sql and creates tables on first run
 * Initializes default settings (matching v1 defaults)
 */

import { db } from './connection';
import fs from 'fs';
import path from 'path';

/**
 * Read schema.sql file
 */
const readSchema = (): string => {
  const schemaPath = path.join(__dirname, 'schema.sql');
  return fs.readFileSync(schemaPath, 'utf-8');
};

/**
 * Execute schema SQL to create tables and indexes
 */
const createTables = (): void => {
  console.log('Creating database tables...');
  
  const schema = readSchema();
  
  // Execute the entire schema file
  // better-sqlite3 can handle multiple statements separated by semicolons
  db.exec(schema);
  
  console.log('✓ Tables and indexes created successfully');
};

/**
 * Initialize default settings (matching v1 defaults)
 */
const initializeDefaultSettings = (): void => {
  console.log('Initializing default settings...');
  
  // Default settings from v1
  const defaultSettings = {
    appName: 'CEREBRA',
    confirmDelete: 'true',
    fontSize: 'medium',
    animations: 'true',
    theme: 'light',
  };
  
  // Prepare insert statement
  const insertSetting = db.prepare(`
    INSERT OR IGNORE INTO settings (key, value)
    VALUES (?, ?)
  `);
  
  // Insert each default setting
  // INSERT OR IGNORE = only insert if key doesn't exist yet
  for (const [key, value] of Object.entries(defaultSettings)) {
    insertSetting.run(key, value);
  }
  
  console.log('✓ Default settings initialized');
};

/**
 * Check if database is already initialized
 */
const isDatabaseInitialized = (): boolean => {
  try {
    // Try to query folders table
    const result = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='folders'").get();
    return result !== undefined;
  } catch (error) {
    return false;
  }
};

/**
 * Main initialization function
 * Called when app starts
 */
export const initializeDatabase = (): void => {
  console.log('Checking database initialization...');
  
  if (isDatabaseInitialized()) {
    console.log('✓ Database already initialized');
    return;
  }
  
  console.log('First run detected - initializing database...');
  
  // Create tables from schema.sql
  createTables();
  
  // Insert default settings
  initializeDefaultSettings();
  
  console.log('✓ Database initialization complete!');
};
