import { useState, useEffect } from 'react';

interface Props {
    settings: Record<string, string>;
    onUpdate: (key: string, value: string) => void;
    onClose: () => void;
}

type Tab = 'general' | 'appearance' | 'about';

const tabs: { id: Tab; label: string }[] = [
    { id: 'general', label: 'General' },
    { id: 'appearance', label: 'Appearance' },
    { id: 'about', label: 'About' },
];

export default function SettingsPanel({ settings, onUpdate, onClose }: Props) {
    const [activeTab, setActiveTab] = useState<Tab>('general');

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [onClose]);

    const appName = settings.appName || 'CEREBRA';
    const confirmDelete = settings.confirmDelete !== 'false';
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
                    <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                        ⚙️ Settings
                    </h2>
                    <button
                        className="w-8 h-8 rounded-md flex items-center justify-center text-lg transition-colors hover:bg-gray-100"
                        style={{ color: 'var(--text-secondary)' }}
                        onClick={onClose}
                    >
                        &times;
                    </button>
                </div>

                <div className="flex border-b" style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}>
                    {tabs.map(tab => (
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

                    {activeTab === 'general' && (
                        <div>
                            <h3
                                className="text-xl font-semibold mb-6 pb-4 border-b-2"
                                style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                            >
                                General Settings
                            </h3>

                            <div className="mb-6">
                                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                                    Application Name:
                                </label>
                                <input
                                    className="w-full px-3 py-2.5 rounded-md border-2 text-sm outline-none transition-colors focus:border-blue-400"
                                    style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)', background: 'var(--input-bg)' }}
                                    value={appName}
                                    maxLength={20}
                                    onChange={(e) => onUpdate('appName', e.target.value)}
                                />
                                <p className="text-xs italic mt-1.5" style={{ color: 'var(--text-light)' }}>
                                    Customize the name displayed in the sidebar
                                </p>
                            </div>

                            <div className="mb-6">
                                <label
                                    className="flex items-center gap-2.5 text-sm font-medium cursor-pointer"
                                    style={{ color: 'var(--text-primary)' }}
                                >
                                    <input
                                        type="checkbox"
                                        className="w-4.5 h-4.5 cursor-pointer"
                                        style={{ accentColor: 'var(--accent-blue)', width: '18px', height: '18px' }}
                                        checked={confirmDelete}
                                        onChange={(e) => onUpdate('confirmDelete', String(e.target.checked))}
                                    />
                                    Confirm before deleting items
                                </label>
                                <p className="text-xs italic mt-1.5 ml-7" style={{ color: 'var(--text-light)' }}>
                                    Show confirmation dialog when deleting folders, notes, or sticky notes
                                </p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'appearance' && (
                        <div>
                            <h3
                                className="text-xl font-semibold mb-6 pb-4 border-b-2"
                                style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                            >
                                Appearance Settings
                            </h3>

                            <div className="mb-6">
                                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                                    Font Size:
                                </label>
                                <select
                                    className="w-full px-3 py-2.5 rounded-md border-2 text-sm outline-none transition-colors focus:border-blue-400"
                                    style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)', background: 'var(--input-bg)' }}
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
                            <div className="text-6xl mb-4">🧠</div>
                            <h2 className="text-3xl font-bold mb-2.5 tracking-wide" style={{ color: 'var(--text-primary)' }}>
                                {appName || 'CEREBRA'}
                            </h2>
                            <span
                                className="inline-block text-white text-xs font-semibold px-4 py-1.5 rounded-full mb-5"
                                style={{ background: 'var(--accent-blue)' }}
                            >
                                Version 2.0.0
                            </span>

                            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                                A powerful desktop note-taking application built with Electron,
                                designed to help you organize your thoughts, ideas, and projects efficiently.
                            </p>

                            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                                <strong className="block mb-1" style={{ color: 'var(--text-primary)' }}>Features:</strong>
                                📁 Hierarchical folder organization<br />
                                📝 Rich note editing<br />
                                📌 Quick sticky notes<br />
                                🔍 Full-text search
                            </p>

                            <div
                                className="rounded-lg p-5 mt-6 border text-left"
                                style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}
                            >
                                <p className="text-sm my-2" style={{ color: 'var(--text-primary)' }}>
                                    <strong style={{ color: 'var(--accent-blue)' }}>Project:</strong> CEREBRA Notes App
                                </p>
                                <p className="text-sm my-2" style={{ color: 'var(--text-primary)' }}>
                                    <strong style={{ color: 'var(--accent-blue)' }}>Built with:</strong> Electron, React, TypeScript, SQLite
                                </p>
                                <p className="text-sm my-2" style={{ color: 'var(--text-primary)' }}>
                                    <strong style={{ color: 'var(--accent-blue)' }}>Version:</strong> 2.0.0 (Modernized)
                                </p>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
