export async function getAllSettings(): Promise<Record<string, string>> {
  const { data, error } = await window.electronAPI.settings.getAll();
  if (error) throw new Error(error);
  return data;
}

export async function getSetting(key: string): Promise<string | null> {
  const { data, error } = await window.electronAPI.settings.get(key);
  if (error) throw new Error(error);
  return data;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const { data, error } = await window.electronAPI.settings.set(key, value);
  if (error) throw new Error(error);
  return data;
}
