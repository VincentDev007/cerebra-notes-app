import { db } from './connection';
import fs from 'fs';
import path from 'path';

const readSchema = (): string => {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    return fs.readFileSync(schemaPath, 'utf-8');
  } catch (error) {
    console.error('Error reading database schema:', error);
    throw error;
  }  
};

const createTables = (): void => {
  console.log('Creating database tables...');

  const schema = readSchema();
  db.exec(schema);
  console.log('✓ Tables and indexes created successfully');
};

const initializeDefaultSettings = (): void => {
  try {
    console.log('Initializing default settings...');

    const defaultSettings = {
      appName: 'CEREBRA',
      confirmDelete: 'true',
      fontSize: 'medium',
      animations: 'true',
      theme: 'light',
    };

    const insertSetting = db.prepare(`
      INSERT OR IGNORE INTO settings (key, value)
      VALUES (?, ?)
    `);

    const insertMany = db.transaction(() => {
      for (const [key, value] of Object.entries(defaultSettings)) {
        insertSetting.run(key, value);
      }
    });

    insertMany();

    console.log('✓ Default settings initialized');
  } catch (error) {
    console.error('Error initializing default settings:', error);
    throw error;
  }
};

const isDatabaseInitialized = (): boolean => {
  try {
    const result = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='folders'").get();
    return result !== undefined;
  } catch (error) {
    return false;
  }
};

export const initializeDatabase = (): void => {
  try {
    console.log('Checking database initialization...');

    if (isDatabaseInitialized()) {
      console.log('✓ Database already initialized');
      return;
    }

    console.log('First run detected - initializing database...');

    createTables();

    initializeDefaultSettings();

    console.log('✓ Database initialization complete!');
  } catch (error) {
    console.error('Error during database initialization:', error);
    throw error;
  }
};















