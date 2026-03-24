import { db } from "../connection";
import { Setting } from "../types";

const stmtGetSetting = db.prepare('SELECT value FROM settings WHERE key = ?');
const stmtSetSetting = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value');
const stmtGetAllSettings = db.prepare('SELECT key, value FROM settings');

const VALID_SETTINGS_KEYS_VALUES: Record<string, string[]> = {
  appName: [],
  confirmDelete: ['true', 'false'],
  fontSize: ['small', 'medium', 'large'],
  animations: ['true', 'false'],
  theme: ['light', 'dark'],
};


export const getSetting = (key: string): string | null => {
  try {
    if (!key || !key.trim()) {
      throw new Error('Setting key cannot be empty');
    }

    if (!VALID_SETTINGS_KEYS_VALUES[key.trim()]) {
      throw new Error(`Invalid setting key: ${key}`);
    }

    const row = stmtGetSetting.get(key.trim()) as { value: string } | undefined;

    return row ? row.value : null;
  } catch (error) {
    console.error(`Error fetching setting with key ${key}:`, error);
    throw error;
  }
};

export const setSetting = (key: string, value: string): void => {
  try {
    if (!key || !key.trim()) {
      throw new Error('Setting key cannot be empty');
    }

    if (!value || !value.trim()) {
      throw new Error('Setting value cannot be empty');
    }

    const allowed = VALID_SETTINGS_KEYS_VALUES[key.trim()];

    if (!allowed) {
      throw new Error(`Invalid setting key: ${key}`);
    }

    if (allowed.length > 0 && !allowed.includes(value.trim())) {
      throw new Error(`Invalid value for setting "${key}": ${value}`);
    }

    stmtSetSetting.run(key.trim(), value.trim());
  } catch (error) {
    console.error(`Error setting value for key ${key}:`, error);
    throw error;
  }
};

export const getAllSettings = (): Record<string, string> => {
  try {
    const rows = stmtGetAllSettings.all() as Setting[];

    const result: Record<string, string> = {};
    for (const row of rows) {
      result[row.key] = row.value;
    }

    return result;
  } catch (error) {
    console.error('Error fetching all settings:', error);
    throw error;
  }
};