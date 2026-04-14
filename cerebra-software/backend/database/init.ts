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
  try {
    console.log('Creating database tables...');

    const schema = readSchema();
    db.exec(schema);

    console.log('✓ Tables and indexes created successfully');
  } catch (error) {
    console.error('Error creating database tables:', error);
    throw error;
  }
};

// Seeds FTS indexes from existing rows — no-op on first run when tables are empty
const populateFts = (): void => {
  try {
    db.exec(`
      INSERT INTO notes_fts(rowid, title, content)
      SELECT id, title, content FROM notes
      `);
  } catch (error) {
    console.error('Error populating FTS tables:', error);
    throw error;
  }
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
    const result = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='folders'")
      .get();
    return result !== undefined;
  } catch {
    return false;
  }
};

export const initializeDatabase = (): void => {
  try {
    console.log('Checking database initialization...');

    if (isDatabaseInitialized()) {
      console.log('✓ Database already initialized');
      // Recreate update triggers in case they exist with the old (broken) UPDATE syntax
      db.exec(`
        DROP TRIGGER IF EXISTS notes_fts_update;
        DROP TRIGGER IF EXISTS sticky_notes_fts_update;
        CREATE TRIGGER notes_fts_update AFTER UPDATE ON notes BEGIN
          INSERT INTO notes_fts(notes_fts, rowid, title, content) VALUES('delete', old.id, old.title, old.content);
          INSERT INTO notes_fts(rowid, title, content) VALUES(new.id, new.title, new.content);
        END;
        CREATE TRIGGER sticky_notes_fts_update AFTER UPDATE ON sticky_notes BEGIN
          INSERT INTO sticky_notes_fts(sticky_notes_fts, rowid, title, content) VALUES('delete', old.id, old.title, old.content);
          INSERT INTO sticky_notes_fts(rowid, title, content) VALUES(new.id, new.title, new.content);
        END;
      `);
      return;
    }

    console.log('First run detected - initializing database...');

    createTables();
    populateFts();
    initializeDefaultSettings();

    console.log('✓ Database initialization complete!');
  } catch (error) {
    console.error('Error during database initialization:', error);
    throw error;
  }
};
