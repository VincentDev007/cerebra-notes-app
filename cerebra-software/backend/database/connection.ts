import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';
import fs from 'fs';

const ensureDbDirectory = (dbPath: string): void => {
  try {
    const dbDir = path.dirname(dbPath);

    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
  } catch (error) {
    console.error('Error ensuring database directory exists:', error);
    throw error;
  }
};

const getDbPath = (): string => path.join(app.getPath('userData'), 'cerebra.db');

const connectDatabase = (dbPath: string): Database.Database => {
  try {
    ensureDbDirectory(dbPath);

    const db = new Database(dbPath, {
      verbose: process.env.NODE_ENV === 'development' ? console.log : undefined,
    });

    db.pragma('foreign_keys = ON');
    db.pragma('journal_mode = WAL');

    console.log(`Database initialized at: ${dbPath}`);

    return db;
  } catch (error) {
    console.error('Failed to connect to database:', error);
    throw error;
  }
};

export const closeDatabase = (): void => {
  if (db.open) {
    db.close();
    console.log('Database connection closed.');
  }
};

export const dbPath = getDbPath();

export const db = connectDatabase(dbPath);
