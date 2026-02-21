/**
 * useSettings HOOK — frontend/src/hooks/useSettings.ts
 *
 * PURPOSE:
 * Loads and manages app settings. Provides:
 *   - settings    → Record<string, string> of all settings (e.g., { theme: 'dark', fontSize: 'medium' })
 *   - loading     → true until initial settings load completes
 *   - updateSetting → function to update a single setting
 *
 * DIFFERENCES FROM OTHER HOOKS:
 * 1. No useCallback — the fetch function is defined inline in useEffect
 *    because it only runs once (empty dependency array []).
 *    useCallback would add complexity without benefit here.
 *
 * 2. No error state — settings are non-critical. If loading fails,
 *    the app falls back to in-code defaults (e.g., settings.theme ?? 'light').
 *
 * 3. OPTIMISTIC UPDATE in updateSetting():
 *    After writing to DB via setSetting(), we immediately update local state:
 *      setSettings(prev => ({ ...prev, [key]: value }))
 *    This means the UI responds instantly WITHOUT waiting for a re-fetch.
 *    This is "optimistic" — we assume the write succeeded. If it failed,
 *    the local state would be out of sync (acceptable for a desktop app).
 *
 * OPTIMISTIC UPDATE PATTERN:
 *   prev  → the current settings object
 *   { ...prev, [key]: value } → spread all existing settings, then override just one key
 *   [key] → computed property name — key is a variable, so we use [] to make it dynamic
 *   Result: all existing settings preserved, only the changed one updated
 *
 * USAGE IN app.tsx:
 *   const { settings, updateSetting } = useSettings();
 *   const theme = settings.theme === 'dark' ? 'dark' : 'light';
 *   const confirmDelete = settings.confirmDelete !== 'false';
 */

import { useState, useEffect } from 'react';
import { getAllSettings, setSetting } from '../services/settingService';

export function useSettings() {
  const [settings, setSettings] = useState<Record<string, string>>({});  // starts empty
  const [loading, setLoading] = useState(true);

  /**
   * Fetch all settings once on mount.
   * Defined inline (not useCallback) because it runs only once.
   * Uses try/finally (no catch) — loading is cleared regardless of success/failure.
   * If getAllSettings() fails, settings stays {} and the app uses fallback defaults.
   */
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await getAllSettings();  // { theme: 'dark', fontSize: 'medium', ... }
        setSettings(data);
      } finally {
        setLoading(false);  // Always clear loading, even if fetch fails
      }
    };
    fetchSettings();
  }, []);  // Empty deps: runs once on mount, never again

  /**
   * updateSetting — writes a setting to DB and optimistically updates local state.
   *
   * OPTIMISTIC UPDATE PATTERN:
   *   await setSetting(key, value)  → persists to SQLite via IPC
   *   setSettings(prev => ...)     → immediately reflects the change in React state
   *
   * The spread operator creates a new object (React requires new references to trigger re-renders):
   *   { ...prev }     → copy all existing key-value pairs
   *   [key]: value    → add/overwrite just this one key
   *
   * No re-fetch needed — the local state update is sufficient for immediate feedback.
   * The DB and local state stay in sync as long as writes don't fail.
   */
  const updateSetting = async (key: string, value: string) => {
    await setSetting(key, value);  // Write to SQLite first
    setSettings(prev => ({ ...prev, [key]: value }));  // Then update local React state
  };

  return { settings, loading, updateSetting };
}
