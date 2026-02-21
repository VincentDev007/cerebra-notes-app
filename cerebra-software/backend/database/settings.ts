/**
 * SETTINGS CRUD OPERATIONS — backend/database/settings.ts
 *
 * PURPOSE:
 * Read and write operations for the `settings` table (a key-value store).
 * Settings persist user preferences across app restarts.
 *
 * KEY-VALUE STORE DESIGN:
 * The settings table is intentionally simple: TEXT key (PRIMARY KEY) + TEXT value.
 * All values are strings — booleans are 'true'/'false', enums are plain strings.
 * This makes adding new settings easy without schema migrations.
 *
 * KNOWN SETTINGS KEYS:
 *   'appName'       → string, shown in sidebar (default: 'CEREBRA')
 *   'theme'         → 'light' | 'dark'
 *   'fontSize'      → 'small' | 'medium' | 'large'
 *   'animations'    → 'true' | 'false'
 *   'confirmDelete' → 'true' | 'false'
 *
 * UPSERT PATTERN in setSetting():
 * "INSERT ... ON CONFLICT DO UPDATE" = upsert.
 * If the key doesn't exist: INSERT a new row.
 * If the key already exists: UPDATE the value in place.
 * This is the modern SQL upsert syntax (supported in SQLite 3.24+).
 */

import { db } from "./connection";
import { Setting } from "./types";

/**
 * getSetting()
 *
 * Reads a single setting value by key.
 * Returns null if the key doesn't exist in the table.
 *
 * We SELECT only `value` (not *) because key is already known.
 * The row is typed as `{ value: string } | undefined` — undefined means no row found.
 * Ternary: if row exists return its value, else return null.
 */
export const getSetting = (key: string): string | null => {
  const stmt = db.prepare('SELECT value FROM settings WHERE key = ?');
  const row = stmt.get(key) as { value: string } | undefined;
  return row ? row.value : null;
};

/**
 * setSetting()
 *
 * Upserts a setting — inserts if new, updates if key already exists.
 *
 * SQL UPSERT BREAKDOWN:
 *   INSERT INTO settings (key, value) VALUES (?, ?)
 *     → Try to insert a new row
 *   ON CONFLICT(key)
 *     → If the key column (PRIMARY KEY) already has this value, handle the conflict
 *   DO UPDATE SET value = excluded.value
 *     → Instead of failing, update the existing row's value
 *     → `excluded` refers to the values that were in the failed INSERT
 *
 * This is equivalent to: "create if new, replace if exists" — a classic upsert.
 * No return value needed — React optimistically updates its local state.
 */
export const setSetting = (key: string, value: string): void => {
  const stmt = db.prepare(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
  );
  stmt.run(key, value);
};

/**
 * getAllSettings()
 *
 * Reads ALL settings and returns them as a flat Record<string, string>.
 * Called on app startup by useSettings hook to load the full settings state.
 *
 * Converts the array of { key, value } rows into a plain object:
 *   [{ key: 'theme', value: 'dark' }, { key: 'fontSize', value: 'large' }]
 *   → { theme: 'dark', fontSize: 'large' }
 *
 * This lets React use: settings.theme, settings.fontSize, etc. for O(1) access.
 */
export const getAllSettings = (): Record<string, string> => {
  const stmt = db.prepare('SELECT key, value FROM settings');
  const rows = stmt.all() as Setting[];

  // Convert array of rows into a lookup object
  const result: Record<string, string> = {};
  for (const row of rows) {
    result[row.key] = row.value;
  }
  return result;
};
