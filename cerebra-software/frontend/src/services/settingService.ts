/**
 * SETTING SERVICE — frontend/src/services/settingService.ts
 *
 * PURPOSE:
 * Typed wrappers around window.electronAPI.settings.* IPC calls.
 * Used by useSettings hook to read/write persistent app configuration.
 *
 * See noteService.ts for a full explanation of the service layer pattern.
 *
 * SETTINGS ARE ALL STRINGS:
 * Every setting value is stored as a string in SQLite.
 * In React, parse them with explicit comparisons:
 *   settings.theme === 'dark'          → boolean
 *   settings.confirmDelete !== 'false' → boolean (note: default is 'true', so checking !== 'false')
 *   settings.fontSize                  → 'small' | 'medium' | 'large' union (cast as needed)
 *
 * KNOWN KEYS:
 *   'appName'       → sidebar header title (default: 'CEREBRA')
 *   'theme'         → 'light' | 'dark'
 *   'fontSize'      → 'small' | 'medium' | 'large'
 *   'animations'    → 'true' | 'false'
 *   'confirmDelete' → 'true' | 'false'
 */

/**
 * getAllSettings()
 * Returns ALL settings as a flat Record<string, string>.
 * Called once on app startup (in useSettings hook) to load all settings into React state.
 * More efficient than calling getSetting() multiple times.
 */
export async function getAllSettings(): Promise<Record<string, string>> {
  return window.electronAPI.settings.getAll();
}

/**
 * getSetting()
 * Reads a single setting value by key.
 * Returns null if the key doesn't exist in the DB.
 * Useful when you need just one setting without loading all of them.
 */
export async function getSetting(key: string): Promise<string | null> {
  return window.electronAPI.settings.get(key);
}

/**
 * setSetting()
 * Upserts a setting — creates it if new, updates it if the key already exists.
 * The useSettings hook calls this and also updates local React state optimistically
 * (no need to re-fetch all settings after a write).
 */
export async function setSetting(key: string, value: string): Promise<void> {
  return window.electronAPI.settings.set(key, value);
}
