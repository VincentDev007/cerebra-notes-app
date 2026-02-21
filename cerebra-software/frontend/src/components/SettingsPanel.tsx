/**
 * SettingsPanel COMPONENT — frontend/src/components/SettingsPanel.tsx
 *
 * PURPOSE:
 * Full-screen overlay (modal) that lets users configure persistent app settings.
 * It's a "settings panel" rather than a small dialog — 700px wide, up to 85vh tall.
 *
 * RECEIVES SETTINGS FROM PARENT (app.tsx):
 * Rather than loading settings itself, this component receives:
 *   settings: Record<string, string>  → the full settings map from useSettings hook
 *   onUpdate: (key, value) => void    → the updateSetting function, called on any change
 *   onClose: () => void               → closes the panel (app.tsx sets showSettings=false)
 * This is the "lift state up" pattern — settings live in app.tsx, panel just renders them.
 *
 * STRING → BOOLEAN PARSING (repeated pattern throughout):
 * SQLite stores everything as strings. Before rendering form controls:
 *   settings.confirmDelete !== 'false'  → true by default (empty string also truthy)
 *   settings.animations !== 'false'     → same default-true pattern
 *   settings.theme === 'dark'           → default-false (handled in app.tsx, not here)
 * Why !== 'false' instead of === 'true'? Because a missing key ('') should be treated as true.
 *
 * THREE-TAB LAYOUT:
 * Internal state manages which tab is active: 'general' | 'appearance' | 'about'
 * tabs[] array + .map() builds the tab buttons — adding a new tab is a one-line change.
 * Active tab indicator: a 3px blue bar at the bottom of the active tab button.
 *
 * IMMEDIATE PERSISTENCE:
 * onChange handlers call onUpdate() immediately on every change (no "Save" button needed).
 * onUpdate → useSettings.updateSetting → setSetting (IPC) + local state merge.
 * So checkbox toggles, select changes, and text edits all persist to SQLite in real time.
 *
 * MODAL PATTERNS (same as all modals):
 * - fixed inset-0 overlay with backdrop
 * - e.stopPropagation() prevents overlay click from firing inside the panel
 * - Escape key closes the panel via useEffect listener
 *
 * TAB CONTENTS:
 * General:    app name (text input, maxLength=20) + confirm delete (checkbox)
 * Appearance: font size (select: small/medium/large) + animations (checkbox)
 * About:      static app info card, uses appName from settings dynamically
 */

import { useState, useEffect } from 'react';

interface Props {
    settings: Record<string, string>;
    onUpdate: (key: string, value: string) => void;
    onClose: () => void;
}

type Tab = 'general' | 'appearance' | 'about';

/**
 * tabs[] — drives the tab bar buttons.
 * Declared outside the component so it's created once (not recreated on every render).
 * To add a new tab: push a new { id, label } entry here and add a matching
 * `{activeTab === 'newtab' && (...)}` block in the JSX below.
 */
const tabs: { id: Tab; label: string }[] = [
    { id: 'general', label: 'General' },
    { id: 'appearance', label: 'Appearance' },
    { id: 'about', label: 'About' },
];

export default function SettingsPanel({ settings, onUpdate, onClose }: Props) {
    // Which tab is currently visible: 'general' | 'appearance' | 'about'
    const [activeTab, setActiveTab] = useState<Tab>('general');

    // Escape key → close panel (same listener pattern as all modals)
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [onClose]);

    /**
     * Derive typed values from the flat string Record<string, string>.
     *
     * appName: string — || 'CEREBRA' provides the default when key is missing or empty.
     * confirmDelete: boolean — settings.confirmDelete !== 'false'
     *   A missing key ('') is !== 'false', so the default is true (confirm on).
     * fontSize: string — || 'medium' provides the default.
     * animations: boolean — same !== 'false' pattern as confirmDelete.
     */
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
