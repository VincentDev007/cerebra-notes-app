/**
 * ViewStickyNoteModal COMPONENT — frontend/src/components/ViewStickyNoteModal.tsx
 *
 * PURPOSE:
 * Read-only modal for viewing the full content of a sticky note.
 * Opened when a sticky note card is clicked (from the homepage grid or sidebar).
 *
 * READ-ONLY (no editing):
 * Unlike NoteEditor, this modal has no edit mode.
 * Sticky notes can only be edited via the "update" function — currently,
 * editing is not exposed in the UI (the modal is view-only).
 * The UI only supports creating, viewing, and deleting sticky notes.
 *
 * FORMAT DIFFERENCE FROM OTHER MODALS:
 * The formatDate() here includes HOUR and MINUTE (not just date):
 *   { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }
 * Result: "Jan 15, 2024, 10:30 AM" — more precise timestamp for quick notes.
 * Other components only show the date (not the time).
 *
 * whitespace-pre-wrap:
 * The content paragraph uses `whitespace-pre-wrap` CSS class (tailwind).
 * This preserves newlines and spaces in the sticky note content.
 * Without it, all text would collapse into one block (HTML ignores whitespace by default).
 *
 * NO STATE:
 * This component has no local state (no editing, no form fields).
 * The only useEffect is the keyboard listener for Escape.
 * It's the simplest modal in the app.
 *
 * FOOTER:
 * The footer shows the creation timestamp AND a Close button.
 * This is the only modal where the footer has items on BOTH sides (justify-between).
 * Other modals have buttons aligned right (justify-end).
 */

import { useEffect } from 'react';
import type { StickyNote } from '../types/electron';

interface Props {
    stickyNote: StickyNote;
    onClose: () => void;
}

/**
 * formatDate() — formats ISO 8601 date with TIME for sticky notes.
 * More precise than other formatDate functions — includes hour and minute.
 * Result: "Jan 15, 2024, 10:30 AM"
 */
function formatDate(isoDate: string): string {
    return new Date(isoDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',    // Adds hour (e.g. "10")
        minute: '2-digit',  // Adds minutes with leading zero (e.g. "05" not "5")
    });
}

export default function ViewStickyNoteModal({ stickyNote, onClose }: Props) {
    // Escape key → close the modal (same pattern as all other modals)
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [onClose]);

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
                    <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <span>📌</span> {stickyNote.title || 'Quick Note'}
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
                    <p
                        className="text-sm whitespace-pre-wrap"
                        style={{ color: 'var(--text-primary)', lineHeight: '1.8' }}
                    >
                        {stickyNote.content}
                    </p>
                </div>

                <div
                    className="flex items-center justify-between px-6 py-4 border-t"
                    style={{ borderColor: 'var(--border-color)' }}
                >
                    <span className="text-xs" style={{ color: 'var(--text-light)' }}>
                        Created {formatDate(stickyNote.created_at)}
                    </span>
                    <button
                        className="px-5 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-gray-100"
                        style={{ color: 'var(--text-secondary)' }}
                        onClick={onClose}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
