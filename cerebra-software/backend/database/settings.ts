import { db } from "./connection";
import { Setting } from "./types";

export const getSetting = (key: string): string | null => {
  const stmt = db.prepare('SELECT value FROM settings WHERE key = ?');
  const row = stmt.get(key) as { value: string } | undefined;
  return row ? row.value : null;
};

export const setSetting = (key: string, value: string): void => {
  const stmt = db.prepare(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
  );
  stmt.run(key, value);
};

export const getAllSettings = (): Record<string, string> => {
  const stmt = db.prepare('SELECT key, value FROM settings');
  const rows = stmt.all() as Setting[];
  const result: Record<string, string> = {};
  for (const row of rows) {
    result[row.key] = row.value;
  }
  return result;
};
