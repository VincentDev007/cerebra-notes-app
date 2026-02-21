/**
 * CreateNoteModal COMPONENT — frontend/src/components/CreateNoteModal.tsx
 *
 * PURPOSE:
 * A modal dialog for creating a new note (just the title — no content at creation time).
 * Content is added later in NoteEditor.
 *
 * MODAL PATTERN (shared by all modals in this app):
 * - Overlay: fixed fullscreen div with semi-transparent background (var(--modal-overlay))
 * - Clicking the overlay (outside the dialog box) → onClose()
 * - Clicking inside the dialog → e.stopPropagation() prevents the click reaching the overlay
 * - Escape key → onClose() (via useEffect keydown listener)
 * - Enter key → handleSubmit() (via input's onKeyDown)
 *
 * AUTO-FOCUS PATTERN:
 * useRef<HTMLInputElement>(null) + useEffect(() => { inputRef.current?.focus() }, [])
 * Auto-focuses the title input on mount so the user can start typing immediately.
 * The optional chaining (?.) safely handles the case where ref isn't attached yet.
 *
 * CONTROLLED INPUT:
 * title state drives the input's value prop.
 * Every keystroke updates state via onChange → React re-renders.
 * This is the "controlled input" pattern — React is the single source of truth.
 *
 * DISABLE PATTERN:
 * The Create button is visually disabled (gray background) and functionally disabled
 * when title.trim() is empty.
 *   style={{ background: title.trim() ? 'var(--accent-blue)' : 'var(--disabled-bg)' }}
 *   disabled={!title.trim()}
 * Both are needed: style for visual feedback, disabled for functional prevention.
 *
 * ESCAPE KEY CLEANUP:
 * useEffect returns () => removeEventListener(...) — React runs this cleanup when:
 *   - The component unmounts (modal closes)
 *   - onClose reference changes (the [onClose] dependency)
 * Without cleanup, the listener would persist even after the modal closes,
 * causing "ghost" listeners that could interfere with other keyboard interactions.
 */

import { useState, useEffect, useRef } from 'react';

interface Props {
    onClose: () => void;                // Close without creating
    onCreate: (title: string) => void;  // Create note with this title
}

export default function CreateNoteModal({ onClose, onCreate }: Props) {
    const [title, setTitle] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);  // For auto-focus on mount

    // Auto-focus the input when the modal appears
    useEffect(() => {
        inputRef.current?.focus();  // Optional chaining: safe if ref not yet attached
    }, []);  // Empty deps: runs once on mount

    // Escape key closes the modal
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);  // Cleanup on unmount
    }, [onClose]);

    /**
     * handleSubmit — validates and submits the form.
     * Guard: trim() and check empty — prevents creating a note with a blank title.
     * Passes the trimmed title to onCreate (whitespace-stripped).
     */
    const handleSubmit = () => {
        const trimmed = title.trim();
        if (!trimmed) return;  // Don't submit empty title
        onCreate(trimmed);
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'var(--modal-overlay)' }}
            onClick={onClose}
        >
            <div
                className="rounded-xl shadow-2xl w-full max-w-md transition-colors duration-300"
                style={{ background: 'var(--bg-secondary)' }}
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    className="flex items-center justify-between px-6 py-4 border-b"
                    style={{ borderColor: 'var(--border-color)' }}
                >
                    <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                        Create New Note
                    </h2>
                    <button
                        className="w-8 h-8 rounded-md flex items-center justify-center text-lg transition-colors hover:bg-gray-100"
                        style={{ color: 'var(--text-secondary)' }}
                        onClick={onClose}
                    >
                        &times;
                    </button>
                </div>

                <div className="px-6 py-5">
                    <label
                        className="block text-sm font-medium mb-2"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        Note Title
                    </label>
                    <input
                        ref={inputRef}
                        className="w-full px-4 py-2 rounded-lg border text-sm outline-none transition-colors focus:border-blue-400"
                        style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)', background: 'var(--input-bg)' }}
                        placeholder="Enter note title..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSubmit();
                        }}
                    />
                </div>

                <div
                    className="flex justify-end gap-3 px-6 py-4 border-t"
                    style={{ borderColor: 'var(--border-color)' }}
                >
                    <button
                        className="px-5 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-gray-100"
                        style={{ color: 'var(--text-secondary)' }}
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        className="px-5 py-2 rounded-lg text-sm font-medium text-white transition-colors hover:opacity-90"
                        style={{ background: title.trim() ? 'var(--accent-blue)' : 'var(--disabled-bg)' }}
                        onClick={handleSubmit}
                        disabled={!title.trim()}
                    >
                        Create
                    </button>
                </div>
            </div>
        </div>
    );
}
