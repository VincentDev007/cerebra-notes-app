export async function getAllSettings(): Promise<Record<string, string>> {
  return window.electronAPI.settings.getAll();
}

export async function getSetting(key: string): Promise<string | null> {
  return window.electronAPI.settings.get(key);
}

export async function setSetting(key: string, value: string): Promise<void> {
  return window.electronAPI.settings.set(key, value);
}
