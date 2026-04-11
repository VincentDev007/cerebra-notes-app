import { useState, useEffect } from 'react';
import { Settings, X, Brain } from 'lucide-react';

interface Props {
  settings: Record<string, string>;
  onUpdate: (key: string, value: string) => void;
  onClose: () => void;
}

type Tab = 'appearance' | 'about';

const tabs: { id: Tab; label: string }[] = [
  { id: 'appearance', label: 'Appearance' },
  { id: 'about', label: 'About' },
];

export default function SettingsPanel({ settings, onUpdate, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('appearance');

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const appName = settings.appName || 'CEREBRA';
  const fontSize = settings.fontSize || 'medium';
  const animations = settings.animations !== 'false';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'var(--modal-overlay)' }}
      onClick={onClose}
    >
      <div
        className="rounded-xl shadow-2xl w-full flex flex-col transition-colors duration-300"
        style={{ background: 'var(--bg-secondary)', maxWidth: '700px', maxHeight: '85vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: 'var(--border-color)' }}
        >
          <h2
            className="text-lg font-bold flex items-center gap-2"
            style={{ color: 'var(--text-primary)' }}
          >
            <Settings size={18} /> Settings
          </h2>
          <button
            className="w-8 h-8 rounded-md flex items-center justify-center transition-colors hover:bg-gray-100"
            style={{ color: 'var(--text-secondary)' }}
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>

        <div
          className="flex border-b"
          style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className="flex-1 py-3 px-5 text-sm font-semibold relative transition-colors"
              style={{
                color: activeTab === tab.id ? 'var(--accent-blue)' : 'var(--text-secondary)',
                background: activeTab === tab.id ? 'var(--bg-secondary)' : 'transparent',
              }}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div
                  className="absolute bottom-0 left-0 right-0"
                  style={{ height: '3px', background: 'var(--accent-blue)' }}
                />
              )}
            </button>
          ))}
        </div>

        <div className="p-8 overflow-y-auto" style={{ maxHeight: '500px' }}>
          {activeTab === 'appearance' && (
            <div>
              <h3
                className="text-xl font-semibold mb-6 pb-4 border-b-2"
                style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
              >
                Appearance Settings
              </h3>

              <div className="mb-6">
                <label
                  className="block text-sm font-semibold mb-2"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Font Size:
                </label>
                <select
                  className="w-full px-3 py-2.5 rounded-md border-2 text-sm outline-none transition-colors focus:border-blue-400"
                  style={{
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)',
                    background: 'var(--input-bg)',
                  }}
                  value={fontSize}
                  onChange={(e) => onUpdate('fontSize', e.target.value)}
                >
                  <option value="small">Small (12px)</option>
                  <option value="medium">Medium (14px)</option>
                  <option value="large">Large (16px)</option>
                </select>
                <p className="text-xs italic mt-1.5" style={{ color: 'var(--text-light)' }}>
                  Adjust text size throughout the app
                </p>
              </div>

              <div className="mb-6">
                <label
                  className="flex items-center gap-2.5 text-sm font-medium cursor-pointer"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <input
                    type="checkbox"
                    className="cursor-pointer"
                    style={{ accentColor: 'var(--accent-blue)', width: '18px', height: '18px' }}
                    checked={animations}
                    onChange={(e) => onUpdate('animations', String(e.target.checked))}
                  />
                  Enable animations
                </label>
                <p className="text-xs italic mt-1.5 ml-7" style={{ color: 'var(--text-light)' }}>
                  Show smooth transitions and hover effects
                </p>
              </div>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="text-center py-5">
              <div className="flex justify-center mb-4">
                <Brain size={56} style={{ color: 'var(--accent-blue)' }} />
              </div>
              <h2
                className="text-3xl font-bold mb-2.5 tracking-wide"
                style={{ color: 'var(--text-primary)' }}
              >
                {appName || 'CEREBRA'}
              </h2>
              <span
                className="inline-block text-white text-xs font-semibold px-4 py-1.5 rounded-full mb-5"
                style={{ background: 'var(--accent-blue)' }}
              >
                Version 0.5.1
              </span>

              <p
                className="text-sm"
                style={{ color: 'var(--text-secondary)', lineHeight: '1.8' }}
              >
                A desktop note-taking app for organizing your thoughts, ideas, and projects.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
