import { useState, useEffect } from 'react';
import { getAllSettings, setSetting } from '../services/settingService';

export function useSettings() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await getAllSettings();
        setSettings(data);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const updateSetting = async (key: string, value: string) => {
    await setSetting(key, value);
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return { settings, loading, updateSetting };
}
